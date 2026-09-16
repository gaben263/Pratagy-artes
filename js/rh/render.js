// Compositor das peças do RH com cards: desenha o template e, por cima, os
// colaboradores. O Atenção não passa por aqui — é o renderizador `comunicado`
// do motor, sem alteração.
//
// Devolve o mesmo contrato do motor (`fits` + motivo) para que a prévia, o
// Continuar, a Prévia e o Download bloqueiem pelo mecanismo que já existe.

import { CORES } from './templates.js';
import { medirCard, desenharCard, desenharFoto, ajustarFaixa, alturaDaFaixa, desenharFaixa } from './cardRenderer.js';
import { colunasPara, medidasPorLinhas, distribuir } from './gridLayout.js';

const GAP_POLAROID = 6;
// A foto é desenhada 6 px maior que o quadrado medido, para cobrir o
// anti-aliasing do amarelo do placeholder em todas as bordas. O excesso cai
// sobre a moldura branca e não aparece.
const SANGRIA = 6;

/** Talento do Mês: foto recortada no quadrado girado + faixas giradas junto. */
function renderTalento(ctx, formato, colaborador) {
  const { centro, largura, altura, anguloGraus, moldura } = formato.polaroid;
  const larguraCard = largura + 2 * moldura.lados; // a moldura inteira é o "card"

  ctx.save();
  ctx.translate(centro.x, centro.y);
  ctx.rotate((anguloGraus * Math.PI) / 180);

  desenharFoto(ctx, {
    foto: colaborador.foto,
    nome: colaborador.nome,
    largura: largura + 2 * SANGRIA,
    altura: altura + 2 * SANGRIA,
    forma: 'quadrado',
  });

  const larguraMax = Math.round(larguraCard * 0.9);
  const nome = (colaborador.nome || '').trim();
  const setor = (colaborador.setor || '').trim();
  const faixaNome = nome ? ajustarFaixa(ctx, nome, { fonteBase: 32, larguraMax, permiteQuebra: true }) : null;
  const faixaSetor = setor ? ajustarFaixa(ctx, setor, { fonteBase: 24, larguraMax, permiteQuebra: false }) : null;

  // As faixas empilham de baixo para cima a partir da borda inferior da
  // moldura: o setor fica na tira branca e o nome monta sobre a borda da foto,
  // como uma legenda escrita no polaroid. Um nome em duas linhas sobe mais
  // sobre a foto em vez de vazar para fora da moldura.
  let topo = altura / 2 + moldura.base - GAP_POLAROID;
  if (faixaSetor) {
    topo -= alturaDaFaixa(faixaSetor);
    desenharFaixa(ctx, faixaSetor, { topo, cores: CORES.faixaSetor });
    topo -= GAP_POLAROID;
  }
  if (faixaNome) {
    topo -= alturaDaFaixa(faixaNome);
    desenharFaixa(ctx, faixaNome, { topo, cores: CORES.faixaNome });
  }
  ctx.restore();

  let aviso = null;
  if (nome && !faixaNome) aviso = `O nome “${nome}” não cabe no polaroid, mesmo reduzido e em duas linhas.`;
  else if (setor && !faixaSetor) aviso = `O setor “${setor}” não cabe na faixa, mesmo reduzido.`;
  return { fits: !aviso, aviso };
}

/** Aniversariantes do Dia: N cards em grade na área útil. */
function renderAniversariantes(ctx, formato, colaboradores) {
  const area = formato.areaCards;
  const n = colaboradores.length;
  if (!n) return { fits: true, aviso: null };

  const colunas = colunasPara(n);
  const linhas = Math.ceil(n / colunas);
  const medidas = medidasPorLinhas(linhas, area.x1 - area.x0, colunas);
  const medidos = colaboradores.map((c) => medirCard(ctx, c, medidas));
  const grade = distribuir(n, medidos.map((m) => m.altura), area);

  colaboradores.forEach((c, i) => desenharCard(ctx, c, medidas, medidos[i], grade.posicoes[i]));

  const primeiroErro = medidos.find((m) => !m.fits);
  let aviso = primeiroErro ? primeiroErro.aviso : null;
  if (!aviso && !grade.cabe) aviso = `Os ${n} cards não cabem na área da arte com esses nomes.`;
  return { fits: !aviso, aviso };
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{ image: HTMLImageElement, formato: object, colaboradores: object[] }} opts
 * @returns {{ fits: boolean, aviso: string|null }}
 */
export function renderRH(canvas, { image, formato, colaboradores }) {
  const { largura, altura } = formato;
  canvas.width = largura;
  canvas.height = altura;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, largura, altura);
  ctx.drawImage(image, 0, 0, largura, altura);

  const lista = (colaboradores || []).filter(Boolean);
  if (formato.editor === 'talento') {
    return renderTalento(ctx, formato, lista[0] || { nome: '', setor: '', foto: null });
  }
  return renderAniversariantes(ctx, formato, lista);
}
