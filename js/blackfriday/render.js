// Compositor dos cards da Black Friday: arte "Sem Texto" + fotos mascaradas +
// textos. Devolve o contrato do motor (`fits` + `aviso`) para a prévia, o
// Continuar e o Download bloquearem pelo mecanismo que já existe.

import { janelaDaFoto } from '../rh/cardRenderer.js';
import { FONTE_BF, ALTURA_MAIUSCULA, CONQUISTAS } from './templates.js';
import { renderBotton } from './botton.js';

const fonte = (px) => `${px}px ${FONTE_BF}`;

// A foto é desenhada um pouco maior que o círculo medido: quem recorta é a
// máscara, e a sangria garante que não sobre branco na borda anti-aliased.
const SANGRIA = 6;

// Canvas de trabalho reaproveitado entre renders (a prévia repinta a cada
// arraste da foto).
let rascunho = null;
function canvasDeTrabalho(largura, altura) {
  if (!rascunho) rascunho = document.createElement('canvas');
  rascunho.width = largura;
  rascunho.height = altura;
  return rascunho;
}

/**
 * Foto no círculo, mascarada pelo branco da arte. A foto é recortada pela
 * mesma `janelaDaFoto` do editor (aspecto 1), então o enquadramento da tela é
 * o da arte.
 */
function desenharFotoMascarada(ctx, cfg, foto, mascara) {
  if (!foto?.img || !mascara) return;
  const { width: mw, height: mh } = mascara;
  const tmp = canvasDeTrabalho(mw, mh);
  const t = tmp.getContext('2d');
  t.clearRect(0, 0, mw, mh);

  const lado = cfg.d + 2 * SANGRIA;
  const j = janelaDaFoto(foto, 1);
  t.globalCompositeOperation = 'source-over';
  t.drawImage(foto.img, j.x, j.y, j.w, j.h, cfg.cx - lado / 2 - cfg.x, cfg.cy - lado / 2 - cfg.y, lado, lado);
  t.globalCompositeOperation = 'destination-in';
  t.drawImage(mascara, 0, 0);
  t.globalCompositeOperation = 'source-over';

  ctx.drawImage(tmp, cfg.x, cfg.y);
}

/**
 * Uma linha de texto centrada em (cx, cy) — `cy` é o centro da maiúscula,
 * como foi medido nas referências. Reduz de `corpo` até `piso` para caber em
 * `larguraMax`; devolve false se nem no piso couber (e desenha no piso, para a
 * prévia mostrar o estouro).
 */
function linha(ctx, texto, { cx, cy, corpo, piso = corpo, larguraMax = Infinity, cor }) {
  let px = corpo;
  ctx.font = fonte(px);
  while (ctx.measureText(texto).width > larguraMax && px > piso) {
    px -= 1;
    ctx.font = fonte(px);
  }
  const cabe = ctx.measureText(texto).width <= larguraMax;
  ctx.fillStyle = cor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(texto, cx, cy + (px * ALTURA_MAIUSCULA) / 2);
  return cabe;
}

const maiusculas = (t) => (t || '').trim().toLocaleUpperCase('pt-BR');

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{ image: HTMLImageElement, formato: object, bf: object, mascaras: Map<string, HTMLImageElement> }} opts
 * @returns {{ fits: boolean, aviso: string|null }}
 */
export function renderBF(canvas, { image, formato, bf, mascaras }) {
  if (formato.botton) {
    return renderBotton(canvas, { image, pessoa: bf?.pessoas?.[formato.slots[0]], janelaDaFoto });
  }
  const { largura, altura } = formato;
  canvas.width = largura;
  canvas.height = altura;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, largura, altura);
  ctx.drawImage(image, 0, 0, largura, altura);

  const pessoas = bf?.pessoas || {};
  for (const cfg of formato.fotos) {
    desenharFotoMascarada(ctx, cfg, pessoas[cfg.slot]?.foto, mascaras.get(cfg.mascara));
  }

  // A conquista só vale se for uma das da lista: o select não deixa digitar
  // outra coisa, e o compositor confere de novo.
  const conquista = CONQUISTAS.some((c) => c.valor === bf?.conquista) ? bf.conquista : '';
  const problemas = [];
  for (const t of formato.textos) {
    if (t.fixo) {
      linha(ctx, t.fixo, t);
      continue;
    }
    const texto = t.fonte === 'conquista' ? conquista : maiusculas(pessoas[t.slot]?.nome);
    if (!texto) continue;
    if (!linha(ctx, texto, t)) {
      problemas.push(
        t.fonte === 'conquista'
          ? `A conquista “${texto}” não cabe na pílula dourada.`
          : `O nome “${texto}” não cabe na faixa, mesmo reduzido. Use só o primeiro nome ou abrevie.`
      );
    }
  }
  return { fits: !problemas.length, aviso: problemas[0] || null };
}
