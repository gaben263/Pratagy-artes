// Distribuição de N cards na área útil do Aniversariantes do Dia.
//
// Regra aprovada na 3.17: 1 pessoa centralizada; 2 lado a lado; 3–6 em duas
// colunas; 7–9 em três. Linhas incompletas ficam centralizadas. O bloco inteiro
// é centralizado na área — a arte tem o título e o logo no eixo, e um bloco
// encostado no topo pareceria solto.
//
// As medidas por quantidade de linhas são para o caso comum — nomes em uma
// linha. Quando um nome quebra em duas e o bloco estoura a área (742×750 px),
// o compositor reduz só as fotos em passos (`escala` 0,92 → 0,7) até caber;
// os nomes continuam legíveis. Se nem a 0,7 couber, `fits: false`.

export function colunasPara(n) {
  if (n <= 1) return 1;
  if (n <= 6) return 2;
  return 3;
}

export const ESCALAS_FOTO = [1, 0.92, 0.85, 0.78, 0.7];

/** Medidas de cada card em função do número de linhas da grade. */
export function medidasPorLinhas(linhas, larguraArea, colunas, escala = 1) {
  const larguraCelula = larguraArea / colunas;
  const base =
    linhas <= 1
      ? { fotoDiametro: 320, fonteNome: 40, fonteSetor: 30, gapFoto: 12, gapFaixas: 10, gapLinhas: 0 }
      : linhas === 2
      ? { fotoDiametro: 240, fonteNome: 32, fonteSetor: 24, gapFoto: 10, gapFaixas: 8, gapLinhas: 24 }
      : { fotoDiametro: 145, fonteNome: 26, fonteSetor: 20, gapFoto: 8, gapFaixas: 6, gapLinhas: 16 };
  // Um card sozinho não precisa da largura toda: 420 px mantém a faixa
  // proporcional à foto.
  const larguraCard = Math.min(Math.round(larguraCelula) - 16, 420);
  return { ...base, fotoDiametro: Math.round(base.fotoDiametro * escala), larguraCelula, larguraCard };
}

/**
 * Posições (centro x, topo y) de cada card, já centralizadas no bloco.
 *
 * @param {number} n - quantidade de cards
 * @param {number[]} alturas - altura medida de cada card (índice = card)
 * @param {{x0,y0,x1,y1}} area
 * @returns {{ posicoes: {x:number,y:number}[], alturaBloco: number, colunas: number, linhas: number, medidas: object }}
 */
export function distribuir(n, alturas, area, medidas) {
  const colunas = colunasPara(n);
  const linhas = Math.ceil(n / colunas);
  const larguraArea = area.x1 - area.x0;

  // Altura de cada linha = card mais alto dela.
  const alturaLinha = [];
  for (let l = 0; l < linhas; l += 1) {
    const doLinha = alturas.slice(l * colunas, (l + 1) * colunas);
    alturaLinha.push(Math.max(0, ...doLinha));
  }
  const alturaBloco = alturaLinha.reduce((s, h) => s + h, 0) + medidas.gapLinhas * (linhas - 1);
  const alturaArea = area.y1 - area.y0;
  let y = area.y0 + Math.max(0, (alturaArea - alturaBloco) / 2);

  const posicoes = [];
  for (let l = 0; l < linhas; l += 1) {
    const inicio = l * colunas;
    const nestaLinha = Math.min(colunas, n - inicio);
    // Linha incompleta: centraliza os cards que sobraram.
    const larguraLinha = nestaLinha * medidas.larguraCelula;
    const x0 = area.x0 + (larguraArea - larguraLinha) / 2;
    for (let c = 0; c < nestaLinha; c += 1) {
      posicoes.push({ x: Math.round(x0 + (c + 0.5) * medidas.larguraCelula), y: Math.round(y) });
    }
    y += alturaLinha[l] + medidas.gapLinhas;
  }

  return { posicoes, alturaBloco, colunas, linhas, medidas, cabe: alturaBloco <= alturaArea };
}
