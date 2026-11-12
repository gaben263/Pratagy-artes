// Pílula dourada com o nome, comum ao botton (botton.js) e ao retrato
// (retrato.js): o mesmo ouro escovado das pílulas dos cards, com o nome em
// Intro Black, em maiúsculas, #820d02 (o vinho do texto sobre o dourado nos
// cards). Uma linha, reduzindo até `piso`; se não couber, quebra em duas
// linhas menores; se nem assim, `cabe: false` e a exportação bloqueia.
//
// As medidas vêm de quem chama, em px da peça; `E` é a escala dos traços
// (sombra, contorno, filete), medidos na pílula de 80 px de altura do botton.
//
// @typedef {{ cx:number, cy:number, w:number, h:number }} Caixa
// @typedef {{ umaLinha:{corpo:number,piso:number}, duasLinhas:{corpo:number,piso:number,entrelinha:number}, respiroLateral:number }} RegraNome

import { FONTE_BF, ALTURA_MAIUSCULA } from './templates.js';

const COR_TEXTO = '#820d02';
const fonte = (px) => `${px}px ${FONTE_BF}`;

export function caminhoPilula(ctx, x, y, w, h) {
  const r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arc(x + w - r, y + r, r, -Math.PI / 2, Math.PI / 2);
  ctx.lineTo(x + r, y + h);
  ctx.arc(x + r, y + r, r, Math.PI / 2, (Math.PI * 3) / 2);
  ctx.closePath();
}

/** Pílula dourada metálica. @param {Caixa} caixa */
export function pilulaDourada(ctx, { cx, cy, w, h }, E) {
  const x = cx - w / 2;
  const y = cy - h / 2;

  // Sombra projetada sobre o que está embaixo.
  ctx.save();
  ctx.shadowColor = 'rgba(10, 4, 6, 0.55)';
  ctx.shadowBlur = 22 * E;
  ctx.shadowOffsetY = 6 * E;
  caminhoPilula(ctx, x, y, w, h);
  ctx.fillStyle = '#b8860b';
  ctx.fill();
  ctx.restore();

  // Corpo: degradê vertical com a "dobra" escura no meio, como metal polido.
  const ouro = ctx.createLinearGradient(0, y, 0, y + h);
  ouro.addColorStop(0, '#fff3c4');
  ouro.addColorStop(0.2, '#f3d073');
  ouro.addColorStop(0.48, '#cf9a2a');
  ouro.addColorStop(0.52, '#b47d14');
  ouro.addColorStop(0.82, '#e8c158');
  ouro.addColorStop(1, '#fbe6a2');
  caminhoPilula(ctx, x, y, w, h);
  ctx.fillStyle = ouro;
  ctx.fill();

  // Brilho escovado: uma faixa clara no centro que some nas pontas.
  ctx.save();
  caminhoPilula(ctx, x, y, w, h);
  ctx.clip();
  const brilho = ctx.createLinearGradient(x, 0, x + w, 0);
  brilho.addColorStop(0, 'rgba(255,255,255,0)');
  brilho.addColorStop(0.5, 'rgba(255,250,225,0.38)');
  brilho.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = brilho;
  ctx.fillRect(x, y, w, h);
  ctx.restore();

  // Contorno escuro por fora, filete claro por dentro.
  caminhoPilula(ctx, x, y, w, h);
  ctx.lineWidth = 2.5 * E;
  ctx.strokeStyle = '#7a4a06';
  ctx.stroke();
  const i = 3.5 * E;
  caminhoPilula(ctx, x + i, y + i, w - 2 * i, h - 2 * i);
  ctx.lineWidth = 1 * E;
  ctx.strokeStyle = 'rgba(255, 246, 210, 0.75)';
  ctx.stroke();
}

// ------------------------------------------------------------ Nome

function medir(ctx, texto, px) {
  ctx.font = fonte(px);
  return ctx.measureText(texto).width;
}

/** Maior corpo, de `corpo` a `piso`, em que todas as linhas cabem; null se nenhum. */
function corpoQueCabe(ctx, linhas, { corpo, piso }, largura) {
  for (let px = corpo; px >= piso; px -= 1) {
    if (linhas.every((l) => medir(ctx, l, px) <= largura)) return px;
  }
  return null;
}

/** Quebra em duas linhas no espaço que deixa a linha mais larga mais curta. */
function emDuasLinhas(ctx, texto) {
  const palavras = texto.split(/\s+/);
  if (palavras.length < 2) return null;
  let melhor = null;
  for (let k = 1; k < palavras.length; k += 1) {
    const linhas = [palavras.slice(0, k).join(' '), palavras.slice(k).join(' ')];
    const maior = Math.max(...linhas.map((l) => medir(ctx, l, 100)));
    if (!melhor || maior < melhor.maior) melhor = { linhas, maior };
  }
  return melhor.linhas;
}

/**
 * Escolhe a composição do nome: uma linha, ou duas, ou a de uma linha no piso
 * (para a prévia mostrar o estouro). Devolve { linhas, px, cabe }.
 * @param {Caixa} caixa @param {RegraNome} regra
 */
export function comporNome(ctx, texto, caixa, regra) {
  const largura = caixa.w - 2 * regra.respiroLateral;
  const uma = corpoQueCabe(ctx, [texto], regra.umaLinha, largura);
  if (uma) return { linhas: [texto], px: uma, cabe: true };
  const duas = emDuasLinhas(ctx, texto);
  if (duas) {
    const px = corpoQueCabe(ctx, duas, regra.duasLinhas, largura);
    if (px) return { linhas: duas, px, cabe: true };
  }
  return { linhas: [texto], px: regra.umaLinha.piso, cabe: false };
}

/** Escreve o nome centrado na pílula; devolve se coube. */
export function nomeNaPilula(ctx, texto, caixa, regra) {
  const { linhas, px, cabe } = comporNome(ctx, texto, caixa, regra);
  const passo = px * regra.duasLinhas.entrelinha;
  const maiuscula = px * ALTURA_MAIUSCULA;
  // Centro óptico: o bloco de maiúsculas fica centrado na pílula.
  const topo = caixa.cy - (maiuscula + passo * (linhas.length - 1)) / 2;
  ctx.font = fonte(px);
  ctx.fillStyle = COR_TEXTO;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  linhas.forEach((l, i) => ctx.fillText(l, caixa.cx, topo + maiuscula + passo * i));
  return cabe;
}

/** O nome como sai na arte: sem espaços sobrando, em maiúsculas. */
export const nomeDaArte = (pessoa) => (pessoa?.nome || '').trim().replace(/\s+/g, ' ').toLocaleUpperCase('pt-BR');
