// Distribuição de N cards na área útil das peças em grade (Aniversariantes,
// Destaques, Bem Vindos).
//
// Regra aprovada na 3.17: 1 pessoa centralizada; 2 lado a lado; 3–6 em duas
// colunas; 7–9 em três. Linhas incompletas ficam centralizadas. O bloco inteiro
// é centralizado na área — a arte tem o título e o logo no eixo, e um bloco
// encostado no topo pareceria solto.
//
// As medidas por quantidade de linhas são para o caso comum — nomes em uma
// linha. Quando um nome quebra em duas e o bloco estoura a área (800×763 px),
// o compositor reduz só as fotos em passos (`escala` 0,92 → 0,7) até caber;
// os nomes continuam legíveis. Se nem a 0,7 couber, `fits: false`.
//
// MODO "DUAS LINHAS" (3.21): o Bem Vindos e os Destaques têm vãos mais baixos
// que o Aniversariantes (613 e 750 px), onde três linhas de cards não cabem —
// e a referência do RH para 8 pessoas resolve com 4 colunas × 2 linhas. Um
// template declara `grade: 'duasLinhas'` e a grade passa a crescer em colunas
// (colunas = ⌈n/2⌉), com a foto limitada pela largura da célula e fontes por
// número de colunas. Quem não declara (Aniversariantes) continua idêntico:
// nenhum caminho abaixo muda de resultado sem o flag.

export const GRADE_DUAS_LINHAS = 'duasLinhas';

export function colunasPara(n, grade) {
  if (n <= 1) return 1;
  if (grade === GRADE_DUAS_LINHAS) return n <= 2 ? 2 : Math.ceil(n / 2);
  if (n <= 6) return 2;
  return 3;
}

export const ESCALAS_FOTO = [1, 0.92, 0.85, 0.78, 0.7];

// Fontes e gaps de 3 e 4 colunas no modo de duas linhas. Vieram de simulação
// com as funções reais de medição, nos nomes e setores mais longos da
// referência ("Alexssandro Davis", "Luciciley de Souza", "Departamento
// Pessoal"): o maior par de fontes em que todos cabem na pílula da célula.
// 18/14 em 4 colunas é o tamanho das pílulas da referência de 8 pessoas.
const TIERS_POR_COLUNAS = {
  3: { fotoDiametro: 250, fonteNome: 26, fonteSetor: 20, gapFoto: 10, gapFaixas: 8, gapLinhas: 20 },
  4: { fotoDiametro: 250, fonteNome: 18, fonteSetor: 14, gapFoto: 8, gapFaixas: 6, gapLinhas: 16 },
};

/** Medidas de cada card em função do número de linhas da grade. */
export function medidasPorLinhas(linhas, larguraArea, colunas, escala = 1, grade) {
  const larguraCelula = larguraArea / colunas;
  const duasLinhas = grade === GRADE_DUAS_LINHAS;
  const base =
    duasLinhas && colunas >= 3
      ? TIERS_POR_COLUNAS[Math.min(colunas, 4)]
      : linhas <= 1
      // Uma linha só: a altura permitiria mais, mas com 2 pessoas a célula tem
      // 400 px e o card 384 — 320 já é quase o limite lateral. Fica 320.
      ? { fotoDiametro: 320, fonteNome: 40, fonteSetor: 30, gapFoto: 12, gapFaixas: 10, gapLinhas: 0 }
      // 2 linhas: 2×(D+113)+24 ≤ 763 → D ≤ 256.
      : linhas === 2
      ? { fotoDiametro: 250, fonteNome: 32, fonteSetor: 24, gapFoto: 10, gapFaixas: 8, gapLinhas: 24 }
      // 3 linhas: 3×(D+92)+32 ≤ 763 → D ≤ 151.
      : { fotoDiametro: 150, fonteNome: 26, fonteSetor: 20, gapFoto: 8, gapFaixas: 6, gapLinhas: 16 };
  // Um card sozinho não precisa da largura toda: 420 px mantém a faixa
  // proporcional à foto.
  const larguraCard = Math.min(Math.round(larguraCelula) - 16, 420);
  // No modo de duas linhas a célula é que limita a foto (4 colunas em 760 px
  // dão cards de 174): 14 px de folga lateral para a pílula ainda sobrar.
  const fotoTeto = duasLinhas ? Math.min(base.fotoDiametro, larguraCard - 14) : base.fotoDiametro;
  return { ...base, fotoDiametro: Math.round(fotoTeto * escala), larguraCelula, larguraCard, colunas };
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
  // As colunas vêm das medidas (é lá que o modo da grade foi decidido); o
  // fallback mantém quem chama com medidas montadas à mão.
  const colunas = medidas.colunas || colunasPara(n);
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
