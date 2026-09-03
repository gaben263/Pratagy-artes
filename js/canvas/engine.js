// Motor de renderização do Canvas: desenha o modelo oficial + texto do usuário
// dentro da área segura, com quebra de linha inteligente e, para textos
// longos (Governança), redução automática de fonte até caber.

import { toTitleCase } from '../utils.js';

const FONT_FAMILY = "'Fibra One', sans-serif";

// Pesos realmente usados no Canvas (precisam bater com os @font-face em fonts.css).
const WEIGHT_PRINCIPAL = 800; // Fibra One Heavy
const WEIGHT_SECUNDARIO = 600; // Fibra One SemiBold
const WEIGHT_CORPO = 400; // Fibra One Regular

let fontsReadyPromise = null;

/**
 * Garante que a Fibra One esteja de fato carregada na memória do navegador
 * antes de qualquer desenho no Canvas.
 *
 * `document.fonts.ready` sozinho não basta: ele só espera as fontes que já
 * foram requisitadas, e uma fonte usada apenas via ctx.font pode nunca ter sido
 * solicitada — o Canvas então desenharia silenciosamente com a fonte fallback.
 * Por isso pedimos explicitamente cada peso antes de aguardar o ready.
 */
export function ensureFontsReady() {
  if (!fontsReadyPromise) {
    fontsReadyPromise = Promise.all([
      document.fonts.load(`${WEIGHT_CORPO} 24px ${FONT_FAMILY}`),
      document.fonts.load(`${WEIGHT_SECUNDARIO} 24px ${FONT_FAMILY}`),
      document.fonts.load(`${WEIGHT_PRINCIPAL} 24px ${FONT_FAMILY}`),
    ])
      .then(() => document.fonts.ready)
      .catch(() => document.fonts.ready);
  }
  return fontsReadyPromise;
}

/**
 * Converte a safeArea percentual do formato em pixels reais da imagem base.
 */
export function computeSafeAreaPx(formato) {
  const { largura, altura, safeArea } = formato;
  return {
    x: Math.round((safeArea.left / 100) * largura),
    y: Math.round((safeArea.top / 100) * altura),
    width: Math.round(((safeArea.right - safeArea.left) / 100) * largura),
    height: Math.round(((safeArea.bottom - safeArea.top) / 100) * altura),
  };
}

function wrapLines(ctx, text, maxWidth) {
  const paragraphs = text.split('\n');
  const lines = [];
  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push('');
      continue;
    }
    let current = words[0];
    for (let i = 1; i < words.length; i++) {
      const candidate = `${current} ${words[i]}`;
      if (ctx.measureText(candidate).width <= maxWidth) {
        current = candidate;
      } else {
        lines.push(current);
        current = words[i];
      }
    }
    lines.push(current);
  }
  return lines;
}

/**
 * Calcula o maior tamanho de fonte (dentro de [minSize, maxSize]) cujas
 * linhas resultantes cabem inteiramente em safeAreaPx.
 */
function fitFontSize(ctx, text, safeAreaPx, { minSize, maxSize, weight, lineHeightRatio }) {
  for (let size = maxSize; size >= minSize; size -= 1) {
    ctx.font = `${weight} ${size}px ${FONT_FAMILY}`;
    const lines = wrapLines(ctx, text, safeAreaPx.width);
    const lineHeight = size * lineHeightRatio;
    const totalHeight = lines.length * lineHeight;
    const widestLine = Math.max(...lines.map((l) => ctx.measureText(l).width), 0);
    if (totalHeight <= safeAreaPx.height && widestLine <= safeAreaPx.width) {
      return { size, lines, lineHeight, fits: true };
    }
  }
  // Não coube nem no tamanho mínimo: usa o mínimo mesmo assim e reporta overflow.
  ctx.font = `${weight} ${minSize}px ${FONT_FAMILY}`;
  const lines = wrapLines(ctx, text, safeAreaPx.width);
  const lineHeight = minSize * lineHeightRatio;
  return { size: minSize, lines, lineHeight, fits: false };
}

function drawTextBlock(
  ctx,
  { lines, lineHeight, size, weight, color, align, safeAreaPx, verticalAlign, canvasWidth }
) {
  ctx.font = `${weight} ${size}px ${FONT_FAMILY}`;
  ctx.fillStyle = color;
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = align;

  const totalHeight = lines.length * lineHeight;
  let startY;
  if (verticalAlign === 'top') {
    startY = safeAreaPx.y + size * 0.85;
  } else if (verticalAlign === 'bottom') {
    startY = safeAreaPx.y + safeAreaPx.height - totalHeight + size * 0.85;
  } else {
    startY = safeAreaPx.y + (safeAreaPx.height - totalHeight) / 2 + size * 0.85;
  }

  // Texto centralizado usa o eixo central da PLACA, não o da área segura, para
  // que o resultado fique opticamente centrado mesmo se a área segura precisar
  // ser assimétrica no futuro.
  const x = align === 'center' ? canvasWidth / 2 : safeAreaPx.x;

  lines.forEach((line, i) => {
    ctx.fillText(line, x, startY + i * lineHeight);
  });
}

/**
 * Renderiza a placa completa no canvas informado.
 *
 * Chame `await ensureFontsReady()` antes, senão o Canvas pode desenhar com a
 * fonte fallback do sistema.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {Object} opts
 * @param {HTMLImageElement} opts.image - imagem do modelo oficial, já carregada.
 * @param {Object} opts.formato - config do formato (com largura/altura/safeArea).
 * @param {string} opts.texto - texto principal (nome do prato ou texto livre).
 * @param {string} [opts.textoEs] - tradução em espanhol (apenas setor A&B).
 * @param {'ab'|'manutencao'|'governanca'} opts.tipo
 * @param {boolean} [opts.titleCase] - aplica Title Case editorial ao texto.
 * @returns {{ fits: boolean, safeAreaPx: Object }}
 */
export function renderCanvas(canvas, { image, formato, texto, textoEs, tipo, titleCase = false }) {
  const { largura, altura } = formato;
  canvas.width = largura;
  canvas.height = altura;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, largura, altura);
  ctx.drawImage(image, 0, 0, largura, altura);

  const safeAreaPx = computeSafeAreaPx(formato);
  const raw = (texto || '').trim();
  const textoFinal = titleCase ? toTitleCase(raw) : raw;

  if (!textoFinal) {
    return { fits: true, safeAreaPx };
  }

  let fits = true;

  if (tipo === 'ab') {
    // Nome do prato em destaque + tradução em espanhol abaixo, menor.
    const esRaw = (textoEs || '').trim();
    const esFinal = titleCase ? toTitleCase(esRaw) : esRaw;
    const hasEs = esFinal.length > 0;

    const ptAreaHeight = hasEs ? safeAreaPx.height * 0.62 : safeAreaPx.height;
    const ptArea = { ...safeAreaPx, height: ptAreaHeight };
    const ptResult = fitFontSize(ctx, textoFinal, ptArea, {
      minSize: Math.max(16, Math.round(largura * 0.02)),
      maxSize: Math.round(largura * 0.11),
      weight: WEIGHT_PRINCIPAL,
      lineHeightRatio: 1.15,
    });
    drawTextBlock(ctx, {
      ...ptResult,
      weight: WEIGHT_PRINCIPAL,
      color: '#004F9F',
      align: 'center',
      safeAreaPx: ptArea,
      verticalAlign: hasEs ? 'bottom' : 'middle',
      canvasWidth: largura,
    });
    fits = fits && ptResult.fits;

    if (hasEs) {
      const esArea = {
        ...safeAreaPx,
        y: safeAreaPx.y + ptAreaHeight,
        height: safeAreaPx.height - ptAreaHeight,
      };
      const esResult = fitFontSize(ctx, esFinal, esArea, {
        minSize: Math.max(12, Math.round(largura * 0.014)),
        maxSize: Math.round(largura * 0.06),
        weight: WEIGHT_SECUNDARIO,
        lineHeightRatio: 1.15,
      });
      drawTextBlock(ctx, {
        ...esResult,
        weight: WEIGHT_SECUNDARIO,
        color: '#008BCE',
        align: 'center',
        safeAreaPx: esArea,
        verticalAlign: 'top',
        canvasWidth: largura,
      });
      fits = fits && esResult.fits;
    }
  } else if (tipo === 'governanca') {
    // Carta longa: fonte reduz automaticamente até caber, alinhada à esquerda.
    // Corpo de texto permanece em Regular — Heavy prejudicaria a leitura.
    const result = fitFontSize(ctx, textoFinal, safeAreaPx, {
      minSize: Math.max(14, Math.round(largura * 0.014)),
      maxSize: Math.round(largura * 0.032),
      weight: WEIGHT_CORPO,
      lineHeightRatio: 1.4,
    });
    drawTextBlock(ctx, {
      ...result,
      weight: WEIGHT_CORPO,
      color: '#004F9F',
      align: 'left',
      safeAreaPx,
      verticalAlign: 'top',
      canvasWidth: largura,
    });
    fits = result.fits;
  } else {
    // Manutenção: texto livre, centralizado, destaque forte.
    const result = fitFontSize(ctx, textoFinal, safeAreaPx, {
      minSize: Math.max(18, Math.round(largura * 0.02)),
      maxSize: Math.round(largura * 0.09),
      weight: WEIGHT_PRINCIPAL,
      lineHeightRatio: 1.2,
    });
    drawTextBlock(ctx, {
      ...result,
      weight: WEIGHT_PRINCIPAL,
      color: '#004F9F',
      align: 'center',
      safeAreaPx,
      verticalAlign: 'middle',
      canvasWidth: largura,
    });
    fits = result.fits;
  }

  return { fits, safeAreaPx };
}

/**
 * Desenha um retângulo pontilhado mostrando a área segura (usado no toggle
 * "Ver área segura", sempre em um canvas overlay separado do exportado).
 */
export function drawSafeAreaGuide(canvas, formato) {
  const ctx = canvas.getContext('2d');
  const area = computeSafeAreaPx(formato);
  ctx.save();
  ctx.strokeStyle = 'rgba(233, 80, 41, 0.6)';
  ctx.lineWidth = Math.max(2, formato.largura * 0.002);
  ctx.setLineDash([12, 8]);
  ctx.strokeRect(area.x, area.y, area.width, area.height);
  ctx.restore();
}

export async function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
