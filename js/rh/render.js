// Compositor das peças do RH: desenha o template e, por cima, o texto de
// comunicado (Atenção e Encontro Geral), a data do Encontro Geral ou os cards
// de colaborador (Talento e Aniversariantes).
//
// Devolve o mesmo contrato do motor (`fits` + motivo) para que a prévia, o
// Continuar, a Prévia e o Download bloqueiem pelo mecanismo que já existe.

import { CORES } from './templates.js';
import { computeSafeAreaPx, fitFontSize, drawTextBlock } from '../canvas/engine.js';
import { medirCard, desenharCard, desenharFoto, ajustarFaixa, alturaDaFaixa, desenharFaixa } from './cardRenderer.js';
import { colunasPara, medidasPorLinhas, distribuir, ESCALAS_FOTO } from './gridLayout.js';

// Fibra One SemiBold — o mesmo peso do comunicado do Acqua Park.
const WEIGHT_TEXTO = 600;

/**
 * Bloco de texto de comunicado: a tipografia e os limites do renderizador
 * `comunicado` do motor (SemiBold, corpo entre 2,1 % e 5,8 % da largura,
 * entrelinha 1,38, quebra só por espaço, piso de 60 % para palavra longa) —
 * mas centralizado na vertical. Um comunicado curto fica no meio da área em
 * vez de colado no topo.
 *
 * Usado pelo Atenção e pelo Encontro Geral, cada um com a sua própria área
 * segura; o texto vazio não bloqueia nada.
 */
function desenharComunicado(ctx, formato, texto) {
  const safeAreaPx = computeSafeAreaPx(formato);
  const { largura } = formato;
  const textoFinal = (texto || '').trim();
  if (!textoFinal) return { fits: true, palavraLonga: null };

  const bloco = fitFontSize(ctx, textoFinal, safeAreaPx, {
    minSize: Math.round(largura * 0.021),
    maxSize: Math.round(largura * 0.058),
    weight: WEIGHT_TEXTO,
    lineHeightRatio: 1.38,
  });
  drawTextBlock(ctx, {
    ...bloco,
    weight: WEIGHT_TEXTO,
    color: formato.corCorpo || '#004F9F',
    align: 'center',
    safeAreaPx,
    verticalAlign: 'middle',
    canvasWidth: largura,
  });
  return { fits: bloco.fits, palavraLonga: bloco.palavraLonga };
}

function renderAtencao(ctx, formato, texto) {
  return { ...desenharComunicado(ctx, formato, texto), aviso: null };
}

/**
 * Encontro Geral: o mesmo bloco de comunicado + a data ao lado do ícone de
 * calendário impresso na arte.
 *
 * A data é o motor puro: `fitFontSize` dá o auto-shrink e a quebra só por
 * espaço, e `drawTextBlock` já sabe alinhar à esquerda (`align: 'left'` usa
 * `safeAreaPx.x` como origem) e centralizar na vertical. O teto de duas linhas
 * não é código: a caixa tem 56 px e três linhas no piso de 18 px medem 62,1 px,
 * então não existe terceira linha que caiba (ver o comentário em templates.js).
 *
 * `fits` é derivado do render, como no resto do sistema — não dá para forjar.
 */
function renderEncontro(ctx, formato, texto, data) {
  const comunicado = desenharComunicado(ctx, formato, texto);

  const cfg = formato.data;
  const dataFinal = (data || '').trim();
  if (!dataFinal) return { ...comunicado, aviso: null };

  const caixa = { x: cfg.x, y: cfg.y, width: cfg.largura, height: cfg.altura };
  const bloco = fitFontSize(ctx, dataFinal, caixa, {
    minSize: cfg.piso,
    maxSize: cfg.corpo,
    weight: cfg.peso,
    lineHeightRatio: cfg.entrelinha,
  });
  drawTextBlock(ctx, {
    ...bloco,
    weight: cfg.peso,
    color: cfg.cor,
    align: 'left',
    safeAreaPx: caixa,
    verticalAlign: 'middle',
    canvasWidth: formato.largura,
  });

  // O comunicado reporta a palavra longa dele pelo caminho de sempre; a data
  // precisa dizer que o problema é a data, senão o aviso manda "reduzir o
  // texto" quando o texto está impecável.
  if (!bloco.fits) {
    return {
      fits: false,
      palavraLonga: null,
      aviso: bloco.palavraLonga
        ? `A data “${bloco.palavraLonga}” tem uma palavra larga demais para o espaço ao lado do calendário.`
        : 'A data não cabe ao lado do calendário, nem reduzida em duas linhas.',
    };
  }
  return { ...comunicado, aviso: null };
}

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
  const raio = formato.raioFaixa;
  let topo = altura / 2 + moldura.base - GAP_POLAROID;
  if (faixaSetor) {
    topo -= alturaDaFaixa(faixaSetor);
    desenharFaixa(ctx, faixaSetor, { topo, cores: CORES.faixaSetor, raio });
    topo -= GAP_POLAROID;
  }
  if (faixaNome) {
    topo -= alturaDaFaixa(faixaNome);
    desenharFaixa(ctx, faixaNome, { topo, cores: CORES.faixaNome, raio });
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

  // Fotos no tamanho do caso comum; se nomes em duas linhas estourarem a área,
  // reduz só as fotos, passo a passo, até caber (os nomes ficam legíveis).
  let medidas, medidos, grade;
  for (const escala of ESCALAS_FOTO) {
    medidas = medidasPorLinhas(linhas, area.x1 - area.x0, colunas, escala);
    medidos = colaboradores.map((c) => medirCard(ctx, c, medidas));
    grade = distribuir(n, medidos.map((m) => m.altura), area, medidas);
    if (grade.cabe) break;
  }

  colaboradores.forEach((c, i) => desenharCard(ctx, c, medidas, medidos[i], grade.posicoes[i]));

  const primeiroErro = medidos.find((m) => !m.fits);
  let aviso = primeiroErro ? primeiroErro.aviso : null;
  if (!aviso && !grade.cabe) {
    aviso = `Os ${n} cards não cabem na área da arte com esses nomes. Abrevie os nomes ou reduza a quantidade de pessoas.`;
  }
  return { fits: !aviso, aviso, fotoDiametro: medidas.fotoDiametro };
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{ image: HTMLImageElement, formato: object, texto?: string, data?: string, colaboradores: object[] }} opts
 * @returns {{ fits: boolean, aviso: string|null, palavraLonga?: string|null }}
 */
export function renderRH(canvas, { image, formato, texto, data, colaboradores }) {
  const { largura, altura } = formato;
  canvas.width = largura;
  canvas.height = altura;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, largura, altura);
  ctx.drawImage(image, 0, 0, largura, altura);

  if (formato.editor === 'atencao') return renderAtencao(ctx, formato, texto);
  if (formato.editor === 'encontro') return renderEncontro(ctx, formato, texto, data);

  const lista = (colaboradores || []).filter(Boolean);
  if (formato.editor === 'talento') {
    return renderTalento(ctx, formato, lista[0] || { nome: '', setor: '', foto: null });
  }
  return renderAniversariantes(ctx, formato, lista);
}
