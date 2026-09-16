// Desenha um card de colaborador em Canvas: foto (círculo ou quadrado girado),
// faixa do nome e faixa do setor. Usado pelo Talento do Mês e pelo
// Aniversariantes do Dia — e pelo editor de foto, que reaproveita `janelaDaFoto`
// para o enquadramento na tela ser pixel a pixel o da arte.
//
// A regra de crescimento das faixas está em `ajustarFaixa` e é a aprovada na
// 3.17: cresce em largura até 90 % do card → fonte reduz até 20 % → só o nome
// quebra em 2 linhas → senão, não coube (a arte bloqueia a exportação).

import { CORES, FAIXA } from './templates.js';

const FONTE = (px) => `800 ${px}px 'Fibra One', sans-serif`; // Fibra One Heavy

// ---------------------------------------------------------------- Foto

/**
 * Janela de recorte da foto, em pixels da imagem original.
 *
 * O enquadramento é guardado de forma independente do tamanho da tela:
 * `zoom` (1 = a foto cobre a moldura inteira) e o centro `cx`/`cy` em frações
 * da imagem. Assim o mesmo objeto serve ao editor (200 px) e à arte (445 px).
 */
export function janelaDaFoto(foto, aspecto) {
  const { img, zoom = 1, cx = 0.5, cy = 0.5 } = foto;
  const largura = img.naturalWidth || img.width;
  const altura = img.naturalHeight || img.height;
  const aspectoImg = largura / altura;

  let w, h;
  if (aspectoImg >= aspecto) {
    h = altura / zoom;
    w = h * aspecto;
  } else {
    w = largura / zoom;
    h = w / aspecto;
  }
  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
  return {
    x: clamp(cx * largura - w / 2, 0, largura - w),
    y: clamp(cy * altura - h / 2, 0, altura - h),
    w,
    h,
  };
}

function iniciais(nome) {
  return (nome || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

/**
 * Desenha a foto (ou o placeholder com iniciais) numa caixa `largura × altura`
 * centrada na origem atual do contexto. `forma`: 'circulo' | 'quadrado'.
 */
export function desenharFoto(ctx, { foto, nome, largura, altura, forma }) {
  ctx.save();
  ctx.beginPath();
  if (forma === 'circulo') ctx.arc(0, 0, largura / 2, 0, Math.PI * 2);
  else ctx.rect(-largura / 2, -altura / 2, largura, altura);
  ctx.clip();

  if (foto?.img) {
    const j = janelaDaFoto(foto, largura / altura);
    ctx.drawImage(foto.img, j.x, j.y, j.w, j.h, -largura / 2, -altura / 2, largura, altura);
  } else {
    ctx.fillStyle = CORES.placeholderFoto.fundo;
    ctx.fillRect(-largura / 2, -altura / 2, largura, altura);
    const texto = iniciais(nome);
    if (texto) {
      ctx.fillStyle = CORES.placeholderFoto.texto;
      ctx.font = FONTE(Math.round(Math.min(largura, altura) * 0.38));
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(texto, 0, Math.min(largura, altura) * 0.03);
    }
  }
  ctx.restore();
}

// -------------------------------------------------------------- Faixas

function quebrarEmDuas(ctx, texto) {
  // Divide no espaço que deixa as duas metades mais equilibradas em largura.
  const palavras = texto.split(/\s+/).filter(Boolean);
  if (palavras.length < 2) return null;
  let melhor = null;
  for (let i = 1; i < palavras.length; i += 1) {
    const a = palavras.slice(0, i).join(' ');
    const b = palavras.slice(i).join(' ');
    const largura = Math.max(ctx.measureText(a).width, ctx.measureText(b).width);
    if (!melhor || largura < melhor.largura) melhor = { linhas: [a, b], largura };
  }
  return melhor;
}

/**
 * Decide corpo, linhas e largura de uma faixa para o texto caber em
 * `larguraMax`. Devolve `null` quando nem a última tentativa cabe.
 */
export function ajustarFaixa(ctx, texto, { fonteBase, larguraMax, permiteQuebra }) {
  const paddingX = (px) => Math.round(px * 0.9);
  const reducoes = [];
  for (let r = 1; r >= FAIXA.reducaoMinima - 1e-9; r -= FAIXA.passoReducao) reducoes.push(+r.toFixed(2));

  // 1 linha: cresce em largura, depois reduz a fonte.
  for (const r of reducoes) {
    const px = Math.round(fonteBase * r);
    ctx.font = FONTE(px);
    const largura = ctx.measureText(texto).width + 2 * paddingX(px);
    if (largura <= larguraMax) return { px, linhas: [texto], largura };
  }

  // 2 linhas (só o nome): de novo do corpo cheio até o reduzido.
  if (permiteQuebra) {
    for (const r of reducoes) {
      const px = Math.round(fonteBase * r);
      ctx.font = FONTE(px);
      const quebra = quebrarEmDuas(ctx, texto);
      if (!quebra) break;
      const largura = quebra.largura + 2 * paddingX(px);
      if (largura <= larguraMax) return { px, linhas: quebra.linhas, largura };
    }
  }
  return null;
}

/** Altura de uma faixa já ajustada. */
export function alturaDaFaixa(ajuste) {
  return Math.round(ajuste.px * (ajuste.linhas.length === 1 ? 1.7 : 1.15 * ajuste.linhas.length + 0.6));
}

// Retângulo de cantos redondos com `arcTo`: `ctx.roundRect` ainda falta em
// navegadores mais antigos e a pílula é o elemento central do card.
function pilula(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Desenha a pílula centrada em (0, topo + altura/2). */
export function desenharFaixa(ctx, ajuste, { topo, cores }) {
  const altura = alturaDaFaixa(ajuste);
  const raio = Math.min(altura / 2, ajuste.px * 0.85);
  const x = -ajuste.largura / 2;

  ctx.save();
  ctx.fillStyle = cores.fundo;
  pilula(ctx, x, topo, ajuste.largura, altura, raio);
  ctx.fill();

  ctx.fillStyle = cores.texto;
  ctx.font = FONTE(ajuste.px);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const entrelinha = ajuste.px * 1.15;
  const inicioY = topo + altura / 2 - ((ajuste.linhas.length - 1) * entrelinha) / 2;
  ajuste.linhas.forEach((linha, i) => ctx.fillText(linha, 0, inicioY + i * entrelinha + ajuste.px * 0.04));
  ctx.restore();
  return altura;
}

// ---------------------------------------------------------------- Card

/**
 * Mede um card (sem desenhar): ajustes das faixas e altura total. `fits` é
 * false quando nome ou setor não coube nem com todas as reduções; `aviso`
 * diz qual.
 */
export function medirCard(ctx, colaborador, medidas) {
  const { fotoDiametro, fonteNome, fonteSetor, larguraCard, gapFoto, gapFaixas } = medidas;
  const larguraMax = Math.round(larguraCard * FAIXA.larguraMaxDoCard);
  const nome = (colaborador.nome || '').trim();
  const setor = (colaborador.setor || '').trim();

  const faixaNome = nome ? ajustarFaixa(ctx, nome, { fonteBase: fonteNome, larguraMax, permiteQuebra: true }) : null;
  const faixaSetor = setor ? ajustarFaixa(ctx, setor, { fonteBase: fonteSetor, larguraMax, permiteQuebra: false }) : null;

  let aviso = null;
  if (nome && !faixaNome) aviso = `O nome “${nome}” não cabe no card, mesmo reduzido e em duas linhas.`;
  else if (setor && !faixaSetor) aviso = `O setor “${setor}” não cabe na faixa, mesmo reduzido.`;

  const altura =
    fotoDiametro +
    (faixaNome ? gapFoto + alturaDaFaixa(faixaNome) : 0) +
    (faixaSetor ? gapFaixas + alturaDaFaixa(faixaSetor) : 0);

  return { faixaNome, faixaSetor, altura, fits: !aviso, aviso };
}

/**
 * Desenha o card com o topo da foto em `y` e o eixo vertical em `x`
 * (foto circular + faixas empilhadas). Recebe a medição de `medirCard`.
 */
export function desenharCard(ctx, colaborador, medidas, medido, { x, y }) {
  const { fotoDiametro, gapFoto, gapFaixas } = medidas;
  ctx.save();
  ctx.translate(x, y + fotoDiametro / 2);
  desenharFoto(ctx, { foto: colaborador.foto, nome: colaborador.nome, largura: fotoDiametro, altura: fotoDiametro, forma: 'circulo' });

  let topo = fotoDiametro / 2 + gapFoto;
  if (medido.faixaNome) topo += desenharFaixa(ctx, medido.faixaNome, { topo, cores: CORES.faixaNome }) + gapFaixas;
  if (medido.faixaSetor) desenharFaixa(ctx, medido.faixaSetor, { topo, cores: CORES.faixaSetor });
  ctx.restore();
}
