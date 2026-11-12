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
// linhas menores; se nem assim, a exportação bloqueia com o aviso. A pílula e
// o encaixe do nome são os de pilula.js, que o retrato A4 também usa.

import { pilulaDourada, nomeNaPilula, nomeDaArte } from './pilula.js';

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
  pilulaDourada(ctx, BOTTON.pilula, E);
  const texto = nomeDaArte(pessoa);
  if (!texto) return { fits: true, aviso: null };
  const cabe = nomeNaPilula(ctx, texto, BOTTON.pilula, BOTTON);
  return {
    fits: cabe,
    aviso: cabe ? null : `O nome “${texto}” não cabe na pílula do botton, nem em duas linhas. Abrevie o sobrenome.`,
  };
}
