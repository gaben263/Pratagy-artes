// Motor de renderização do Canvas: desenha o modelo oficial + texto do usuário
// dentro da área segura, com quebra de linha inteligente e, para textos
// longos (Governança), redução automática de fonte até caber.

import { toTitleCase } from '../utils.js';

const FONT_FAMILY = "'Fibra One', sans-serif";
const FONT_FAMILY_MANUSCRITA = "'Satisfy', cursive";

// Pesos realmente usados no Canvas (precisam bater com os @font-face em fonts.css).
const WEIGHT_PRINCIPAL = 800; // Fibra One Heavy
const WEIGHT_SECUNDARIO = 600; // Fibra One SemiBold
const WEIGHT_CORPO = 400; // Fibra One Regular / Satisfy

let fontsReadyPromise = null;

/**
 * Garante que as fontes estejam de fato carregadas na memória do navegador
 * antes de qualquer desenho no Canvas.
 *
 * `document.fonts.ready` sozinho não basta: ele só espera as fontes que já
 * foram requisitadas, e uma fonte usada apenas via ctx.font pode nunca ter sido
 * solicitada — o Canvas então desenharia silenciosamente com a fonte fallback.
 * Por isso pedimos explicitamente cada peso antes de aguardar o ready.
 *
 * A Satisfy vem embutida em Base64 (css/satisfy-embedded.css), então não há
 * requisição de rede envolvida: a exportação nunca sai com a fonte errada.
 */
export function ensureFontsReady() {
  if (!fontsReadyPromise) {
    fontsReadyPromise = Promise.all([
      document.fonts.load(`${WEIGHT_CORPO} 24px ${FONT_FAMILY}`),
      document.fonts.load(`${WEIGHT_SECUNDARIO} 24px ${FONT_FAMILY}`),
      document.fonts.load(`${WEIGHT_PRINCIPAL} 24px ${FONT_FAMILY}`),
      document.fonts.load(`${WEIGHT_CORPO} 24px ${FONT_FAMILY_MANUSCRITA}`),
    ])
      .then(() => document.fonts.ready)
      .catch(() => document.fonts.ready);
  }
  return fontsReadyPromise;
}

/** Resolução de saída das artes. Todas as imagens-base estão nessa densidade. */
export const DPI = 300;
const PX_POR_MM = DPI / 25.4; // 11.8110…

export const mmParaPx = (valorMm) => Math.round(valorMm * PX_POR_MM);

/**
 * Converte a área segura (margens em MILÍMETROS a partir de cada borda da arte)
 * em pixels reais da imagem base.
 *
 * A medida é física, não percentual: como as imagens-base estão em 300 DPI,
 * "6 mm de respiro da onda azul" continua valendo 6 mm no PNG e no PDF
 * exportados, sem sofrer distorção com o tamanho do formato.
 */
export function computeSafeAreaPx(formato) {
  const { largura, altura, safeAreaMm } = formato;
  const x = mmParaPx(safeAreaMm.left);
  const y = mmParaPx(safeAreaMm.top);
  return {
    x,
    y,
    width: largura - x - mmParaPx(safeAreaMm.right),
    height: altura - y - mmParaPx(safeAreaMm.bottom),
  };
}

/**
 * Fatia uma palavra que não cabe inteira na largura disponível.
 *
 * Sem isso, uma sequência longa sem espaço (um endereço colado, um nome de
 * arquivo, alguém digitando sem separar palavras) nunca quebraria: o
 * `fitFontSize` iria reduzindo o corpo até o mínimo e a linha continuaria
 * estourando a área segura na horizontal, virando um fiapo ilegível.
 *
 * A iteração é `for…of` para não partir pares substitutos (emoji, por exemplo)
 * no meio de um caractere.
 */
function quebrarPalavraLonga(ctx, palavra, maxWidth) {
  const pedacos = [];
  let atual = '';
  for (const caractere of palavra) {
    const candidato = atual + caractere;
    // `atual &&` evita laço infinito quando um único caractere já não cabe.
    if (atual && ctx.measureText(candidato).width > maxWidth) {
      pedacos.push(atual);
      atual = caractere;
    } else {
      atual = candidato;
    }
  }
  if (atual) pedacos.push(atual);
  return pedacos;
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

    let current = '';
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;

      if (ctx.measureText(candidate).width <= maxWidth) {
        current = candidate;
        continue;
      }

      // A palavra não cabe no resto da linha: fecha a linha atual.
      if (current) lines.push(current);

      if (ctx.measureText(word).width <= maxWidth) {
        current = word;
      } else {
        // A palavra sozinha é mais larga que a linha inteira: fatia por
        // caractere e leva só o último pedaço para a próxima iteração.
        const pedacos = quebrarPalavraLonga(ctx, word, maxWidth);
        lines.push(...pedacos.slice(0, -1));
        current = pedacos[pedacos.length - 1] || '';
      }
    }

    if (current) lines.push(current);
  }

  return lines;
}

/**
 * Calcula o maior tamanho de fonte (dentro de [minSize, maxSize]) cujas
 * linhas resultantes cabem inteiramente em safeAreaPx.
 */
function fitFontSize(
  ctx,
  text,
  safeAreaPx,
  { minSize, maxSize, weight, lineHeightRatio, fontFamily = FONT_FAMILY }
) {
  for (let size = maxSize; size >= minSize; size -= 1) {
    ctx.font = `${weight} ${size}px ${fontFamily}`;
    const lines = wrapLines(ctx, text, safeAreaPx.width);
    const lineHeight = size * lineHeightRatio;
    const totalHeight = lines.length * lineHeight;
    const widestLine = Math.max(...lines.map((l) => ctx.measureText(l).width), 0);
    if (totalHeight <= safeAreaPx.height && widestLine <= safeAreaPx.width) {
      return { size, lines, lineHeight, fits: true };
    }
  }
  // Não coube nem no tamanho mínimo: usa o mínimo mesmo assim e reporta overflow.
  ctx.font = `${weight} ${minSize}px ${fontFamily}`;
  const lines = wrapLines(ctx, text, safeAreaPx.width);
  const lineHeight = minSize * lineHeightRatio;
  return { size: minSize, lines, lineHeight, fits: false };
}

function drawTextBlock(
  ctx,
  {
    lines,
    lineHeight,
    size,
    weight,
    color,
    align,
    safeAreaPx,
    verticalAlign,
    canvasWidth,
    fontFamily = FONT_FAMILY,
  }
) {
  ctx.font = `${weight} ${size}px ${fontFamily}`;
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

  // Texto centralizado usa o eixo central da ARTE, não o da área segura, para
  // que o resultado fique opticamente centrado mesmo se a área segura precisar
  // ser assimétrica no futuro.
  const x = align === 'center' ? canvasWidth / 2 : safeAreaPx.x;

  lines.forEach((line, i) => {
    ctx.fillText(line, x, startY + i * lineHeight);
  });
}

/**
 * Renderiza a arte completa no canvas informado.
 *
 * Chame `await ensureFontsReady()` antes, senão o Canvas pode desenhar com a
 * fonte fallback do sistema.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {Object} opts
 * @param {HTMLImageElement} opts.image - imagem do modelo oficial, já carregada.
 * @param {Object} opts.formato - config do formato (com largura/altura/safeAreaMm).
 * @param {string} opts.texto - texto principal (nome do prato, texto livre ou comunicado).
 * @param {string} [opts.textoEs] - tradução em espanhol (apenas setor A&B).
 * @param {'ab'|'manutencao'|'governanca'|'comunicado'} opts.tipo
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
  } else if (tipo === 'comunicado') {
    // Acqua Park: a arte-base já traz "COMUNICADO" impresso no topo, então o
    // que entra aqui é só o corpo do texto, em Fibra One SemiBold.
    //
    // O bloco começa no topo da caixa, e não centralizado nela: o "COMUNICADO"
    // impresso é o título, e o texto é a continuação dele. Centralizar faria um
    // comunicado curto flutuar no meio do cartão, longe do título a que pertence.
    const result = fitFontSize(ctx, textoFinal, safeAreaPx, {
      minSize: Math.round(largura * 0.021),
      maxSize: Math.round(largura * 0.058),
      weight: WEIGHT_SECUNDARIO,
      lineHeightRatio: 1.38,
    });
    drawTextBlock(ctx, {
      ...result,
      weight: WEIGHT_SECUNDARIO,
      color: formato.corCorpo || '#FFFFFF',
      align: 'center',
      safeAreaPx,
      verticalAlign: 'top',
      canvasWidth: largura,
    });
    fits = result.fits;
  } else if (tipo === 'governanca') {
    // Carta de boas-vindas: tipografia manuscrita (Satisfy), centralizada,
    // com redução automática de corpo até caber na caixa.
    // A entrelinha é maior que a das outras artes porque a Satisfy tem
    // ascendentes e descendentes longos — 1.4 faria as linhas se tocarem.
    const result = fitFontSize(ctx, textoFinal, safeAreaPx, {
      minSize: Math.max(14, Math.round(largura * 0.016)),
      maxSize: Math.round(largura * 0.048),
      weight: WEIGHT_CORPO,
      lineHeightRatio: 1.55,
      fontFamily: FONT_FAMILY_MANUSCRITA,
    });
    drawTextBlock(ctx, {
      ...result,
      weight: WEIGHT_CORPO,
      color: '#004F9F',
      align: 'center',
      safeAreaPx,
      // A carta começa no topo da caixa e cresce para baixo (como uma carta
      // escrita à mão), mas cada linha continua centralizada na horizontal.
      verticalAlign: 'top',
      canvasWidth: largura,
      fontFamily: FONT_FAMILY_MANUSCRITA,
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
