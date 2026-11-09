// Impressão em lote: várias placas do A&B (ou bottons da Black Friday) numa
// folha A4, para a equipe imprimir na impressora do resort e cortar.
//
// Não é arquivo de gráfica: sem marcas de corte, sem sangria. A folha é A4 de
// verdade (210×297 mm) e cada placa é colocada no seu tamanho físico exato,
// então o PDF imprime 1:1 em qualquer impressora — desde que o driver não
// esteja em "ajustar à página".
//
// A imagem de cada placa é o mesmo pixel do PNG individual: vem do canvas da
// prévia, já renderizado. Nada é desenhado de novo aqui.

import { slugify } from '../utils.js';

export const A4_MM = { largura: 210, altura: 297 };

// 10 mm é a margem que qualquer impressora doméstica ou de escritório respeita
// sem cortar nada — a maioria não imprime nos 4–5 mm da borda.
export const MARGEM_MM = 10;

// Encostadas, duas placas viram uma faixa azul contínua em cima/embaixo e duas
// laterais brancas sem fronteira: quem corta não vê onde uma termina. 3 mm de
// calha branca marcam o corte sem marca de corte e toleram 1–2 mm de tremida
// da tesoura sem comer a faixa da vizinha.
export const GAP_MM = 3;

/** Como chamar as peças da folha: placas no A&B, bottons na Black Friday. */
export function unidadeDe(formato) {
  return formato?.unidade || { um: 'placa', varios: 'placas', muitos: 'Várias', quantos: 'Quantas' };
}

function contar(medidaUtil, medidaPeca) {
  // Quantas peças cabem numa dimensão: n peças + (n − 1) calhas ≤ útil.
  return Math.max(0, Math.floor((medidaUtil + GAP_MM) / (medidaPeca + GAP_MM)));
}

/**
 * Grade ótima de um formato numa folha A4.
 *
 * Testa as duas orientações de folha com a placa sempre em pé e fica com a que
 * rende mais peças (empate → retrato, que é o padrão da bandeja). Não há tabela
 * por formato: um formato novo ganha a grade sozinho. Foi assim que o 10×15
 * apareceu: em retrato só cabe 1 (2 × 150 = 300 mm > 297), em paisagem cabem 2.
 *
 * @returns {{ orientacao: 'portrait'|'landscape', paginaMm: {largura:number, altura:number},
 *             colunas: number, linhas: number, max: number }}
 */
export function calcularGrade(formato) {
  const { mmLargura, mmAltura } = formato;

  const candidatos = [
    { orientacao: 'portrait', paginaMm: { largura: A4_MM.largura, altura: A4_MM.altura } },
    { orientacao: 'landscape', paginaMm: { largura: A4_MM.altura, altura: A4_MM.largura } },
  ].map((c) => {
    const colunas = contar(c.paginaMm.largura - 2 * MARGEM_MM, mmLargura);
    const linhas = contar(c.paginaMm.altura - 2 * MARGEM_MM, mmAltura);
    return { ...c, colunas, linhas, max: colunas * linhas };
  });

  const [retrato, paisagem] = candidatos;
  return paisagem.max > retrato.max ? paisagem : retrato;
}

/**
 * Posição (canto superior esquerdo, em mm) de cada uma das `quantidade` placas,
 * preenchendo linha por linha a partir do canto superior esquerdo da folha.
 */
export function posicoes(formato, quantidade) {
  const grade = calcularGrade(formato);
  const n = Math.min(Math.max(0, quantidade), grade.max);
  const lista = [];
  for (let i = 0; i < n; i += 1) {
    const coluna = i % grade.colunas;
    const linha = Math.floor(i / grade.colunas);
    lista.push({
      x: MARGEM_MM + coluna * (formato.mmLargura + GAP_MM),
      y: MARGEM_MM + linha * (formato.mmAltura + GAP_MM),
    });
  }
  return lista;
}

/**
 * Gera e baixa o PDF da folha.
 *
 * O canvas vira PNG uma única vez, e todas as placas apontam para essa mesma
 * imagem (mesmo `alias` no jsPDF): o arquivo embute a arte uma vez, e uma
 * folha com 10 placas pesa o mesmo que uma com 1.
 */
export async function exportLotePDF(canvas, formato, quantidade, nomeArquivo) {
  const { jsPDF } = window.jspdf;
  const grade = calcularGrade(formato);

  const pdf = new jsPDF({ orientation: grade.orientacao, unit: 'mm', format: 'a4' });
  const dataUrl = canvas.toDataURL('image/png', 1.0);

  for (const { x, y } of posicoes(formato, quantidade)) {
    pdf.addImage(dataUrl, 'PNG', x, y, formato.mmLargura, formato.mmAltura, 'placa', 'FAST');
  }

  pdf.save(`${slugify(nomeArquivo)}.pdf`);
}

// ---------------------------------------------------------------------------
// Folha montada: peças diferentes na mesma A4
//
// A grade acima só serve quando todas as peças têm o mesmo tamanho. Com 8×5,
// 8×10 e 10×15 juntas, linhas fixas desperdiçam papel: um 8×5 ao lado de um
// 8×10 deixaria um buraco que cabe outro 8×5. Por isso aqui as peças são
// encaixadas nos espaços livres, sempre no mais alto e mais à esquerda que
// couber, e as maiores entram primeiro.
//
// A calha é tratada somando GAP_MM à peça e à área útil: assim duas peças nunca
// ficam a menos de 3 mm, e a última não precisa de calha até a margem.
// ---------------------------------------------------------------------------

const ORIENTACOES = {
  portrait: { largura: A4_MM.largura, altura: A4_MM.altura },
  landscape: { largura: A4_MM.altura, altura: A4_MM.largura },
};

const cruza = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const contem = (a, b) => a.x <= b.x && a.y <= b.y && a.x + a.w >= b.x + b.w && a.y + a.h >= b.y + b.h;

/** Tira de um espaço livre a área ocupada; sobram até 4 faixas (podem se sobrepor). */
function recortar(livre, ocupado) {
  return [
    { x: livre.x, y: livre.y, w: ocupado.x - livre.x, h: livre.h },
    { x: ocupado.x + ocupado.w, y: livre.y, w: livre.x + livre.w - ocupado.x - ocupado.w, h: livre.h },
    { x: livre.x, y: livre.y, w: livre.w, h: ocupado.y - livre.y },
    { x: livre.x, y: ocupado.y + ocupado.h, w: livre.w, h: livre.y + livre.h - ocupado.y - ocupado.h },
  ].filter((r) => r.w > 0 && r.h > 0);
}

function encaixar(itens, paginaMm) {
  let livres = [
    {
      x: 0,
      y: 0,
      w: paginaMm.largura - 2 * MARGEM_MM + GAP_MM,
      h: paginaMm.altura - 2 * MARGEM_MM + GAP_MM,
    },
  ];
  const colocadas = [];
  const sobra = [];

  for (const item of itens) {
    const w = item.mmLargura + GAP_MM;
    const h = item.mmAltura + GAP_MM;
    const espaco = livres
      .filter((r) => r.w >= w && r.h >= h)
      .sort((a, b) => a.y - b.y || a.x - b.x)[0];

    if (!espaco) {
      sobra.push(item);
      continue;
    }

    const ocupado = { x: espaco.x, y: espaco.y, w, h };
    colocadas.push({ ...item, x: MARGEM_MM + ocupado.x, y: MARGEM_MM + ocupado.y });
    const novos = livres.flatMap((r) => (cruza(r, ocupado) ? recortar(r, ocupado) : [r]));
    livres = novos.filter((r, i) => !novos.some((o, j) => i !== j && contem(o, r) && (!contem(r, o) || j < i)));
  }

  return { colocadas, sobra };
}

const areaDe = (lista) => lista.reduce((soma, p) => soma + p.mmLargura * p.mmAltura, 0);

/**
 * Distribui as peças em quantas folhas A4 forem precisas.
 *
 * Cada folha escolhe sozinha entre em pé e deitada: fica com a que aproveita
 * mais papel (empate → em pé, como na grade). Três 10×15, por exemplo, abrem
 * uma folha deitada com duas, e a terceira segue para a próxima.
 *
 * @param {Array<{mmLargura:number, mmAltura:number}>} itens - uma entrada por
 *   placa física; os demais campos são preservados em cada colocação.
 * @returns {Array<{orientacao:'portrait'|'landscape', paginaMm:{largura:number, altura:number},
 *                  pecas:Array<{x:number, y:number, mmLargura:number, mmAltura:number}>}>}
 */
export function montarFolhas(itens) {
  // O sort é estável: placas iguais continuam vizinhas na folha.
  let pendentes = [...itens].sort(
    (a, b) => b.mmLargura * b.mmAltura - a.mmLargura * a.mmAltura
  );
  const folhas = [];

  while (pendentes.length) {
    const retrato = encaixar(pendentes, ORIENTACOES.portrait);
    const paisagem = encaixar(pendentes, ORIENTACOES.landscape);
    const deitada = areaDe(paisagem.colocadas) > areaDe(retrato.colocadas);
    const { colocadas, sobra } = deitada ? paisagem : retrato;

    if (!colocadas.length) throw new Error('Peça maior que a área útil da folha A4.');

    const orientacao = deitada ? 'landscape' : 'portrait';
    folhas.push({ orientacao, paginaMm: ORIENTACOES[orientacao], pecas: colocadas });
    pendentes = sobra;
  }

  return folhas;
}

/**
 * PDF das folhas montadas: uma página A4 por folha, em tamanho físico exato.
 *
 * `imagens` guarda uma imagem por arte (chave → data URL), não por placa: como
 * no lote, repetir a mesma arte aponta para a imagem já embutida, inclusive
 * entre páginas.
 */
export function exportFolhasPDF(folhas, imagens, nomeArquivo, tipoImagem = 'PNG') {
  const { jsPDF } = window.jspdf;
  const aliases = new Map([...imagens.keys()].map((chave, i) => [chave, `arte-${i}`]));

  const pdf = new jsPDF({ orientation: folhas[0].orientacao, unit: 'mm', format: 'a4' });
  folhas.forEach((folha, i) => {
    if (i > 0) pdf.addPage('a4', folha.orientacao);
    for (const { chave, x, y, mmLargura, mmAltura } of folha.pecas) {
      pdf.addImage(imagens.get(chave), tipoImagem, x, y, mmLargura, mmAltura, aliases.get(chave), 'FAST');
    }
  });

  pdf.save(`${slugify(nomeArquivo)}.pdf`);
}
