// Botton da Black Friday 2026: foto do colaborador dentro da moldura de
// lâmpadas da campanha + o nome numa pílula dourada, como as pílulas dos cards.
//
// TAMANHO: o botton tem 65 mm de diâmetro no papel, dos quais 5 mm em volta são
// a margem que dobra para trás na prensa. A face visível — o aro de lâmpadas —
// tem 55 mm. O arquivo é um disco de 1536 px (65 mm a 600 DPI) com os cantos
// transparentes: o próprio contorno escuro é a linha de corte.
//
// MOLDURA: assets/images/blackfriday/botton-moldura.png (a "Black Friday
// Moldura.png" da pasta Bottons-black), 580×580 px. Medidas no 580, pelo alfa:
// - borda externa do aro: raio 260 em volta de (290,5; 286,25) — 258,5 embaixo,
//   262 em cima, 259–260,5 dos lados;
// - furo transparente: raio 198, concêntrico com o aro (diferença < 1 px).
// Para o aro dar 55 mm (650 px), a moldura entra ampliada 2,5× (1450 px) e
// deslocada para o centro do aro cair no centro do disco. Fora do aro só há o
// brilho e o fundo escuro da margem — escuro, não transparente, senão a lateral
// do botton sairia branca.
//
// PÍLULA: atravessa a parte de baixo do furo e encosta nas laterais do aro,
// como a faixa dos cards passa por cima do círculo. Fica toda dentro da face
// visível (canto mais distante a 618 px do centro, aro em 650).
//
// NOME: Intro Black, em maiúsculas, #820d02 (o vinho do texto sobre o dourado
// nos cards). Uma linha, reduzindo até `piso`; se não couber, quebra em duas
// linhas menores; se nem assim, a exportação bloqueia com o aviso.

import { FONTE_BF, ALTURA_MAIUSCULA } from './templates.js';

export const MM_BOTTON = 65;
export const MM_FACE = 55;
const LADO = 1536; // 65 mm a 600 DPI
const C = LADO / 2; // centro do disco = centro do aro
const E = 2.5; // escala sobre a moldura original: raio 260 → 650 px = 27,5 mm

export const BOTTON = {
  lado: LADO,
  moldura: { x: C - 290.5 * E, y: C - 286.25 * E, lado: 580 * E },
  furo: { cx: C, cy: C, r: 198 * E },
  face: { cx: C, cy: C, r: 260 * E },
  pilula: { cx: C, cy: C + 148 * E, w: 370 * E, h: 80 * E },
  umaLinha: { corpo: 48 * E, piso: 32 * E },
  duasLinhas: { corpo: 31 * E, piso: 25 * E, entrelinha: 1.08 },
  respiroLateral: 28 * E,
};

const COR_TEXTO = '#820d02';
const fonte = (px) => `${px}px ${FONTE_BF}`;

// ------------------------------------------------------------ Desenho

/** Disco escuro de 65 mm: a margem que dobra na prensa. Cantos transparentes. */
function fundo(ctx) {
  const { face } = BOTTON;
  const g = ctx.createRadialGradient(C, C, face.r * 0.4, C, C, C);
  g.addColorStop(0, '#2a1119');
  g.addColorStop(1, '#11121b');
  ctx.beginPath();
  ctx.arc(C, C, C, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();
}

function foto(ctx, fotoObj, janelaDaFoto) {
  const { cx, cy, r } = BOTTON.furo;
  // 8 px a mais que o furo: a borda interna da moldura tem sombra
  // semitransparente, e a foto precisa continuar por baixo dela.
  const raio = r + 8 * E;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, raio, 0, Math.PI * 2);
  ctx.clip();
  if (fotoObj?.img) {
    const j = janelaDaFoto(fotoObj, 1);
    ctx.drawImage(fotoObj.img, j.x, j.y, j.w, j.h, cx - raio, cy - raio, raio * 2, raio * 2);
  } else {
    const g = ctx.createRadialGradient(cx, cy - r * 0.3, 0, cx, cy, raio);
    g.addColorStop(0, '#3a2a35');
    g.addColorStop(1, '#16141d');
    ctx.fillStyle = g;
    ctx.fillRect(cx - raio, cy - raio, raio * 2, raio * 2);
  }
  ctx.restore();
}

function caminhoPilula(ctx, x, y, w, h) {
  const r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arc(x + w - r, y + r, r, -Math.PI / 2, Math.PI / 2);
  ctx.lineTo(x + r, y + h);
  ctx.arc(x + r, y + r, r, Math.PI / 2, (Math.PI * 3) / 2);
  ctx.closePath();
}

/** Pílula dourada metálica: o mesmo ouro escovado das pílulas dos cards. */
function pilula(ctx) {
  const { cx, cy, w, h } = BOTTON.pilula;
  const x = cx - w / 2;
  const y = cy - h / 2;

  // Sombra projetada sobre a foto e o aro.
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

const larguraUtil = () => BOTTON.pilula.w - 2 * BOTTON.respiroLateral;

function medir(ctx, texto, px) {
  ctx.font = fonte(px);
  return ctx.measureText(texto).width;
}

/** Maior corpo, de `corpo` a `piso`, em que todas as linhas cabem; null se nenhum. */
function corpoQueCabe(ctx, linhas, { corpo, piso }) {
  for (let px = corpo; px >= piso; px -= 1) {
    if (linhas.every((l) => medir(ctx, l, px) <= larguraUtil())) return px;
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
 */
export function comporNome(ctx, texto) {
  const uma = corpoQueCabe(ctx, [texto], BOTTON.umaLinha);
  if (uma) return { linhas: [texto], px: uma, cabe: true };
  const duas = emDuasLinhas(ctx, texto);
  if (duas) {
    const px = corpoQueCabe(ctx, duas, BOTTON.duasLinhas);
    if (px) return { linhas: duas, px, cabe: true };
  }
  return { linhas: [texto], px: BOTTON.umaLinha.piso, cabe: false };
}

function nome(ctx, texto) {
  const { linhas, px, cabe } = comporNome(ctx, texto);
  const { cx, cy } = BOTTON.pilula;
  const passo = px * BOTTON.duasLinhas.entrelinha;
  const maiuscula = px * ALTURA_MAIUSCULA;
  // Centro óptico: o bloco de maiúsculas fica centrado na pílula.
  const topo = cy - (maiuscula + passo * (linhas.length - 1)) / 2;
  ctx.font = fonte(px);
  ctx.fillStyle = COR_TEXTO;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  linhas.forEach((l, i) => ctx.fillText(l, cx, topo + maiuscula + passo * i));
  return cabe;
}

// ------------------------------------------------------------ Compositor

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{ image: HTMLImageElement, pessoa: object|undefined, janelaDaFoto: Function, cantosBrancos?: boolean }} opts
 *   `cantosBrancos`: pinta de branco fora do disco (a folha A4 vai em JPEG,
 *   que não tem transparência — no papel dá no mesmo).
 * @returns {{ fits: boolean, aviso: string|null }}
 */
export function renderBotton(canvas, { image, pessoa, janelaDaFoto, cantosBrancos = false }) {
  const { lado, moldura } = BOTTON;
  canvas.width = lado;
  canvas.height = lado;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, lado, lado);
  if (cantosBrancos) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, lado, lado);
  }
  ctx.imageSmoothingQuality = 'high';

  fundo(ctx);
  foto(ctx, pessoa?.foto, janelaDaFoto);
  // O brilho da moldura não pode vazar para fora do disco de corte.
  ctx.save();
  ctx.beginPath();
  ctx.arc(C, C, C, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(image, moldura.x, moldura.y, moldura.lado, moldura.lado);
  ctx.restore();

  // A pílula vazia já aparece na prévia: mostra onde o nome vai entrar.
  pilula(ctx);
  const texto = (pessoa?.nome || '').trim().replace(/\s+/g, ' ').toLocaleUpperCase('pt-BR');
  if (!texto) return { fits: true, aviso: null };
  const cabe = nome(ctx, texto);
  return {
    fits: cabe,
    aviso: cabe ? null : `O nome “${texto}” não cabe na pílula do botton, nem em duas linhas. Abrevie o sobrenome.`,
  };
}
