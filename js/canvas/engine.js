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
 * @param {string} opts.texto - texto principal (nome do prato, texto livre ou assunto).
 * @param {string} [opts.textoEs] - tradução em espanhol (apenas setor A&B).
 * @param {string} [opts.corpo] - corpo do comunicado (apenas Acqua Park).
 * @param {'ab'|'manutencao'|'governanca'|'comunicado'} opts.tipo
 * @param {boolean} [opts.titleCase] - aplica Title Case editorial ao texto.
 * @returns {{ fits: boolean, safeAreaPx: Object }}
 */
export function renderCanvas(
  canvas,
  { image, formato, texto, textoEs, corpo, tipo, titleCase = false }
) {
  const { largura, altura } = formato;
  canvas.width = largura;
  canvas.height = altura;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, largura, altura);
  ctx.drawImage(image, 0, 0, largura, altura);

  const safeAreaPx = computeSafeAreaPx(formato);
  const raw = (texto || '').trim();
  const textoFinal = titleCase ? toTitleCase(raw) : raw;
  const corpoFinal = (corpo || '').trim();

  // O comunicado do Acqua Park é o único formato em que só o corpo já produz
  // arte: nos demais, sem texto principal não há o que desenhar.
  if (!textoFinal && !(tipo === 'comunicado' && corpoFinal)) {
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
    // que entra aqui é o assunto + o corpo do texto, ambos em Fibra One
    // SemiBold — a hierarquia vem do tamanho e não do peso.
    const corTitulo = formato.corTitulo || '#FFFFFF';
    const corCorpo = formato.corCorpo || corTitulo;
    const temTitulo = textoFinal.length > 0;
    const temCorpo = corpoFinal.length > 0;

    // O assunto ocupa no máximo um terço da caixa quando há corpo, para o
    // comunicado não virar um título gigante com duas linhas de texto embaixo.
    let tituloResult = null;
    let alturaTitulo = 0;
    if (temTitulo) {
      tituloResult = fitFontSize(
        ctx,
        textoFinal,
        { ...safeAreaPx, height: temCorpo ? safeAreaPx.height * 0.34 : safeAreaPx.height },
        {
          minSize: Math.round(largura * 0.03),
          maxSize: Math.round(largura * 0.075),
          weight: WEIGHT_SECUNDARIO,
          lineHeightRatio: 1.18,
        }
      );
      alturaTitulo = tituloResult.lines.length * tituloResult.lineHeight;
    }

    const respiro = temTitulo && temCorpo ? tituloResult.size * 0.75 : 0;

    let corpoResult = null;
    let alturaCorpo = 0;
    if (temCorpo) {
      const areaCorpo = {
        ...safeAreaPx,
        height: Math.max(0, safeAreaPx.height - alturaTitulo - respiro),
      };
      corpoResult = fitFontSize(ctx, corpoFinal, areaCorpo, {
        minSize: Math.round(largura * 0.021),
        maxSize: Math.round(largura * 0.045),
        weight: WEIGHT_SECUNDARIO,
        lineHeightRatio: 1.4,
      });
      alturaCorpo = corpoResult.lines.length * corpoResult.lineHeight;
    }

    // Assunto e corpo são medidos separadamente, mas desenhados como um bloco
    // único — daí as caixas sintéticas abaixo.
    //
    // O bloco começa no topo da caixa, e não centralizado nela: o "COMUNICADO"
    // impresso na arte é o título, e o assunto é a continuação dele. Centralizar
    // faria um comunicado curto flutuar no meio do cartão, com um vão de mais de
    // 200px separando o assunto do título a que ele pertence.
    const alturaTotal = alturaTitulo + respiro + alturaCorpo;
    const inicioY = safeAreaPx.y;

    if (tituloResult) {
      drawTextBlock(ctx, {
        ...tituloResult,
        weight: WEIGHT_SECUNDARIO,
        color: corTitulo,
        align: 'center',
        safeAreaPx: { ...safeAreaPx, y: inicioY, height: alturaTitulo },
        verticalAlign: 'top',
        canvasWidth: largura,
      });
      fits = fits && tituloResult.fits;
    }

    if (corpoResult) {
      drawTextBlock(ctx, {
        ...corpoResult,
        weight: WEIGHT_SECUNDARIO,
        color: corCorpo,
        align: 'center',
        safeAreaPx: { ...safeAreaPx, y: inicioY + alturaTitulo + respiro, height: alturaCorpo },
        verticalAlign: 'top',
        canvasWidth: largura,
      });
      fits = fits && corpoResult.fits;
    }

    // Cada bloco coube na sua sub-área, mas o conjunto ainda pode estourar a
    // caixa — é esse total que trava a exportação.
    fits = fits && alturaTotal <= safeAreaPx.height;
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
