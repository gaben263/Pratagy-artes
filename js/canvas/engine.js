// Motor de renderização do Canvas: desenha o modelo oficial + texto do usuário
// dentro da área segura, com quebra de linha por espaço e redução automática
// de fonte até caber.
//
// REGRA DE QUEBRA
// Uma palavra nunca é partida — nem por caractere, nem por sílaba, nem com
// hífen. Numa placa impressa, "Strogo-/noff" ou "Strog/onoff" lê como erro de
// gráfica, e a equipe do resort não tem como revisar cada arte. A palavra que
// não cabe no resto da linha pula inteira para a próxima; se nem sozinha ela
// cabe na largura, o bloco encolhe até um piso e, se ainda assim não couber, a
// exportação é bloqueada nomeando a palavra (ver `fitFontSize`).

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
 * Quebra o texto em linhas, só em espaços.
 *
 * Uma palavra mais larga que `maxWidth` fica sozinha na sua linha, estourando
 * a largura — de propósito. Isso dá uma garantia que `fitFontSize` explora:
 * qualquer linha mais larga que a área é, por construção, UMA única palavra,
 * e é ela que a mensagem de erro vai nomear.
 */
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

      // A palavra não cabe no resto da linha: fecha a linha atual e começa a
      // próxima com a palavra inteira, caiba ela ou não.
      if (current) lines.push(current);
      current = word;
    }

    if (current) lines.push(current);
  }

  return lines;
}

// Quanto o bloco pode encolher, além do tamanho natural, para acomodar uma
// palavra que não cabe na largura. Abaixo disso a placa vira um fiapo e o
// problema deixa de ser tipográfico: é o texto que precisa mudar.
const PISO_PALAVRA_LONGA = 0.6;

/**
 * Calcula o maior tamanho de fonte (dentro de [minSize, maxSize]) cujas
 * linhas resultantes cabem inteiramente em safeAreaPx.
 *
 * Há dois motivos para encolher, com regras diferentes:
 *
 * 1. ALTURA — o texto é longo e as linhas não cabem empilhadas. O corpo desce
 *    livremente até `minSize`, como sempre foi (a carta da Hospitalidade
 *    depende disso).
 *
 * 2. PALAVRA LONGA — o texto caberia em altura, mas uma palavra sozinha é mais
 *    larga que a área. O corpo desce só até 60% do tamanho que o bloco teria
 *    sem essa palavra (`sizeBase`, o primeiro corpo em que a altura cabe). Se
 *    nem assim couber, devolve `fits: false` com a palavra em `palavraLonga`,
 *    para a interface nomeá-la.
 *
 * O piso é relativo ao tamanho natural, e não a `maxSize`, de propósito: um
 * texto que já cai a 50% por altura e cabe nesse 50% não tem por que ser
 * bloqueado por um piso calculado sobre um corpo que ele nunca usaria.
 *
 * @returns {{ size:number, lines:string[], lineHeight:number, fits:boolean, palavraLonga:string|null }}
 */
export function fitFontSize(
  ctx,
  text,
  safeAreaPx,
  { minSize, maxSize, weight, lineHeightRatio, fontFamily = FONT_FAMILY }
) {
  let sizeBase = null;
  let ultimo = null;

  for (let size = maxSize; size >= minSize; size -= 1) {
    ctx.font = `${weight} ${size}px ${fontFamily}`;
    const lines = wrapLines(ctx, text, safeAreaPx.width);
    const lineHeight = size * lineHeightRatio;
    const alturaOk = lines.length * lineHeight <= safeAreaPx.height;
    const linhaMaisLarga = lines.reduce(
      (pior, l) => (ctx.measureText(l).width > ctx.measureText(pior).width ? l : pior),
      ''
    );
    const larguraOk = ctx.measureText(linhaMaisLarga).width <= safeAreaPx.width;

    if (alturaOk && larguraOk) {
      return { size, lines, lineHeight, fits: true, palavraLonga: null };
    }

    if (alturaOk) {
      // Só a largura estoura — e a linha que estoura é uma palavra só (ver
      // `wrapLines`). Marca o tamanho natural na primeira vez e guarda o
      // resultado para reportar caso o piso seja atingido.
      if (sizeBase === null) sizeBase = size;
      ultimo = { size, lines, lineHeight, fits: false, palavraLonga: linhaMaisLarga };
      if (size - 1 < Math.max(minSize, sizeBase * PISO_PALAVRA_LONGA)) return ultimo;
    }
  }

  // Chegou a `minSize` sem caber. Se o motivo foi uma palavra longa, `ultimo`
  // já a identifica; senão, é overflow de altura: usa o mínimo e reporta.
  if (ultimo) return ultimo;
  ctx.font = `${weight} ${minSize}px ${fontFamily}`;
  const lines = wrapLines(ctx, text, safeAreaPx.width);
  const lineHeight = minSize * lineHeightRatio;
  return { size: minSize, lines, lineHeight, fits: false, palavraLonga: null };
}

// Exportado (3.17) para o compositor do RH desenhar o texto do Atenção
// centralizado na vertical com a mesma tipografia do comunicado. Os ramos de
// `renderCanvas` abaixo não mudaram: cada um segue definindo o próprio
// `verticalAlign`.
export function drawTextBlock(
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
 * @returns {{ fits: boolean, palavraLonga: string|null, safeAreaPx: Object }}
 *   `palavraLonga` é a primeira palavra que impediu o encaixe (ou null quando
 *   coube, ou quando o estouro é de altura e o remédio é encurtar o texto).
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
    return { fits: true, palavraLonga: null, safeAreaPx };
  }

  let fits = true;
  let palavraLonga = null;

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
    palavraLonga = palavraLonga || ptResult.palavraLonga;

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
      palavraLonga = palavraLonga || esResult.palavraLonga;
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
    palavraLonga = result.palavraLonga;
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
    palavraLonga = result.palavraLonga;
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
    palavraLonga = result.palavraLonga;
  }

  return { fits, palavraLonga, safeAreaPx };
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
