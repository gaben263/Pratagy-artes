// Impressão em lote: várias placas do A&B numa folha A4, para a equipe imprimir
// na impressora do resort e cortar com tesoura.
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
