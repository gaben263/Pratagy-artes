// Retrato da Black Friday 2026: a foto do colaborador na moldura de retratos
// da campanha (selo, polaroid da praia, lâmpadas de %) + o nome numa pílula
// dourada, a mesma do botton (pilula.js).
//
// TAMANHO: A4 retrato, 2480×3508 px = 210×297 mm a 300 DPI — o tamanho da
// própria moldura (VISUALIZAÇÃO/moldura-retratos.png da pasta de trabalho,
// copiada para assets/images/blackfriday/retrato-moldura.png).
//
// FURO: a moldura é um PNG com a janela da foto transparente. Medido pelo alfa:
// retângulo x 325–2206 · y 541–3120 (1882×2580 px, aspecto 0,729). O selo
// "Black Friday" e a polaroid ficam por cima do canto de cima, e o brilho do
// selo é semitransparente — a foto entra por trás da moldura, então os dois
// aparecem sobre ela, como na arte.
//
// PÍLULA: centrada no furo, atravessando a borda de baixo da foto (como a
// faixa dos cards passa por cima do círculo). Fica entre o pé da foto e o
// filete laranja da moldura (y ≈ 3307), sem encostar no brilho do canto.

import { pilulaDourada, nomeNaPilula, nomeDaArte } from './pilula.js';

const LARGURA = 2480;
const ALTURA = 3508;
const FURO = { x: 325, y: 541, w: 1882, h: 2580 };
const ALTURA_PILULA = 250;
const E = ALTURA_PILULA / 80; // escala dos traços sobre a pílula do botton

export const ASPECTO_RETRATO = FURO.w / FURO.h;

export const RETRATO = {
  largura: LARGURA,
  altura: ALTURA,
  furo: FURO,
  pilula: { cx: FURO.x + FURO.w / 2, cy: FURO.y + FURO.h, w: 1500, h: ALTURA_PILULA },
  umaLinha: { corpo: 150, piso: 100 },
  duasLinhas: { corpo: 96, piso: 76, entrelinha: 1.08 },
  respiroLateral: 90,
};

// A foto passa um pouco da borda do furo: a borda do PNG é anti-aliased, e
// sem isso sobraria um fio do fundo em volta da foto.
const SANGRIA = 4;

function foto(ctx, fotoObj, janelaDaFoto) {
  const { x, y, w, h } = FURO;
  const dx = x - SANGRIA;
  const dy = y - SANGRIA;
  const dw = w + 2 * SANGRIA;
  const dh = h + 2 * SANGRIA;
  if (fotoObj?.img) {
    // Mesmo aspecto do editor de foto: o enquadramento da tela é o da arte.
    const j = janelaDaFoto(fotoObj, ASPECTO_RETRATO);
    ctx.drawImage(fotoObj.img, j.x, j.y, j.w, j.h, dx, dy, dw, dh);
    return;
  }
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, '#3a2a35');
  g.addColorStop(1, '#16141d');
  ctx.fillStyle = g;
  ctx.fillRect(dx, dy, dw, dh);
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{ image: HTMLImageElement, pessoa: object|undefined, janelaDaFoto: Function }} opts
 * @returns {{ fits: boolean, aviso: string|null }}
 */
export function renderRetrato(canvas, { image, pessoa, janelaDaFoto }) {
  canvas.width = LARGURA;
  canvas.height = ALTURA;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.fillStyle = '#11121b';
  ctx.fillRect(0, 0, LARGURA, ALTURA);

  foto(ctx, pessoa?.foto, janelaDaFoto);
  ctx.drawImage(image, 0, 0, LARGURA, ALTURA);

  // A pílula vazia já aparece na prévia: mostra onde o nome vai entrar.
  pilulaDourada(ctx, RETRATO.pilula, E);
  const texto = nomeDaArte(pessoa);
  if (!texto) return { fits: true, aviso: null };
  const cabe = nomeNaPilula(ctx, texto, RETRATO.pilula, RETRATO);
  return {
    fits: cabe,
    aviso: cabe ? null : `O nome “${texto}” não cabe na pílula do retrato, nem em duas linhas. Abrevie o sobrenome.`,
  };
}
