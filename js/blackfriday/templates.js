// Templates da Black Friday 2026: os quatro cards de comemoração de vendedor,
// 1080×1440 px, sobre as artes "Sem Texto" da pasta VISUALIZAÇÃO. Tudo o que
// está aqui foi medido pixel a pixel contra as versões "Com texto" aprovadas
// (diff entre as duas: o que muda é o texto, e só ele).
//
// TIPOGRAFIA: Intro Black. A largura e a altura de maiúscula do texto das
// referências batem com ela em todos os casos (altura de maiúscula = 0,705 do
// corpo: "ITALO" 186 px de largura a 61, "META BATIDA!" 579 a 82). O "JÁ VENDI"
// da referência é de outra família, mais larga (maiúscula de 31 px em 227 de
// largura); aqui ele sai em Intro Black com a mesma altura de maiúscula (44 px).
//
// CORES (medianas da tinta na referência): #820d02 no dourado, #ffffff no
// vermelho, #16151c na tira branca do "JÁ VENDI".
//
// POSIÇÃO: cada texto tem o centro horizontal e o centro da maiúscula medidos
// na referência (`cx`, `cy`) — não o centro da faixa: o designer posicionou à
// mão e os dois diferem em até 7 px. A linha é única; se não couber em
// `larguraMax`, o corpo reduz até `piso` e, abaixo disso, a exportação bloqueia.
//
// FOTOS: os círculos brancos ficam parcialmente atrás das faixas, e o PNG é
// achatado — desenhar a foto por cima cobriria a faixa. Cada círculo tem uma
// máscara (assets/images/blackfriday/<id>-mascara-N.png) feita do próprio
// branco da arte: a região clara conectada ao centro do círculo, com alfa pelo
// "quão branco" é o pixel (menor canal de 170 → 248). A foto entra só onde a
// arte era branca, então fica atrás das faixas, dos selos 1-2-3 e funde no
// brilho dourado da borda. No Top 3 o círculo do 1º está na frente: as
// máscaras do 2º e do 3º descontam o disco dele.
//
// O círculo (cx, cy, d) foi ajustado pelas bordas visíveis do branco; `x`/`y`
// é o canto da máscara recortada na arte.

const BASE = { largura: 1080, altura: 1440, mmLargura: 91.4, mmAltura: 121.9, digital: true, editor: 'blackfriday' };
const PASTA = 'assets/images/blackfriday';

export const FONTE_BF = "'Intro Black', 'Fibra One', sans-serif";
export const ALTURA_MAIUSCULA = 0.705;

const COR = { dourado: '#820d02', vermelho: '#FFFFFF', tira: '#16151c' };

// Conquistas, em milhares de reais: de 50K a 95K nos degraus combinados com a
// campanha e, de 100K a 2MI, de cinquenta em cinquenta mil. O `valor` é o texto
// da arte ("1,05MI" com vírgula, como se fala); o `rotulo` é o que o select mostra.
const faixa = (de, ate, passo) =>
  Array.from({ length: (ate - de) / passo + 1 }, (_, i) => de + i * passo);

const MILHARES = [50, 60, 70, 75, 80, 85, 90, 95, ...faixa(100, 2000, 50)];

export const CONQUISTAS = MILHARES.map((m) => {
  if (m < 1000) return { valor: `${m}K`, rotulo: `${m}K · R$ ${m} mil` };
  const mi = String(m / 1000).replace('.', ',');
  return { valor: `${mi}MI`, rotulo: `${mi}MI · R$ ${mi} ${m === 1000 ? 'milhão' : 'milhões'}` };
});

const foto = (slot, n, { x, y, cx, cy, d }) => ({ slot, mascara: `${PASTA}/${n}`, x, y, cx, cy, d });

export const FORMATOS_BF = [
  {
    ...BASE,
    id: 'ja-vendi',
    nome: 'Já Vendi',
    descricao: 'Vendedor + valor já vendido (50K a 2MI)',
    imagem: `${PASTA}/ja-vendi.png`,
    slots: ['vendedor'],
    comConquista: true,
    fotos: [foto('vendedor', 'ja-vendi-mascara-1.png', { x: 282, y: 314, cx: 541.5, cy: 571, d: 514 })],
    textos: [
      // Faixa vermelha x 265–832 · y 797–902.
      { fonte: 'nome', slot: 'vendedor', cx: 547, cy: 849, corpo: 61, piso: 40, larguraMax: 500, cor: COR.vermelho },
      // Tira branca x 322–741 · y 957–1034.
      { fixo: 'JÁ VENDI', cx: 531.5, cy: 993.5, corpo: 44, cor: COR.tira },
      // Pílula dourada x 180–904 · y 1016–1179. "2MI" e "1,5MI" cabem a 108.
      { fonte: 'conquista', cx: 538, cy: 1100, corpo: 108, piso: 80, larguraMax: 600, cor: COR.dourado },
    ],
  },
  {
    ...BASE,
    id: 'meta-batida',
    nome: 'Meta Batida',
    descricao: 'Vendedor que bateu a meta',
    imagem: `${PASTA}/meta-batida.png`,
    slots: ['vendedor'],
    fotos: [foto('vendedor', 'meta-batida-mascara-1.png', { x: 257, y: 314, cx: 541.5, cy: 596, d: 564 })],
    textos: [
      { fixo: 'META BATIDA!', cx: 557.5, cy: 940.5, corpo: 82, cor: COR.dourado },
      // Faixa vermelha x 321–788 · y 1016–1102.
      { fonte: 'nome', slot: 'vendedor', cx: 555.5, cy: 1056, corpo: 61, piso: 38, larguraMax: 420, cor: COR.vermelho },
    ],
  },
  {
    ...BASE,
    id: 'meta-com-ajuda',
    nome: 'Meta com Ajuda',
    descricao: 'Vendedor + o colega que ajudou a bater a meta',
    imagem: `${PASTA}/meta-com-ajuda.png`,
    slots: ['vendedor', 'ajudante'],
    fotos: [
      foto('vendedor', 'meta-com-ajuda-mascara-1.png', { x: 309, y: 267, cx: 545, cy: 501.5, d: 469 }),
      foto('ajudante', 'meta-com-ajuda-mascara-2.png', { x: 209, y: 970, cx: 341.5, cy: 1099.5, d: 260 }),
    ],
    textos: [
      { fixo: 'META BATIDA!', cx: 557, cy: 791.5, corpo: 61, cor: COR.dourado },
      // Faixa vermelha x 362–750 · y 852–923; a referência usa corpo 33.
      { fonte: 'nome', slot: 'vendedor', cx: 557, cy: 885.5, corpo: 33, piso: 26, larguraMax: 350, cor: COR.vermelho },
      { fixo: 'BATI A META COM AJUDA DE', cx: 663.5, cy: 1018, corpo: 27, cor: COR.vermelho },
      // Na referência a pílula de baixo repete "META BATIDA!"; aqui entra o
      // nome de quem ajudou. Visível de x 471 (borda do círculo) a ~918.
      { fonte: 'nome', slot: 'ajudante', cx: 680, cy: 1103.5, corpo: 53, piso: 34, larguraMax: 380, cor: COR.dourado },
    ],
  },
  {
    ...BASE,
    id: 'top-3',
    nome: 'Top 3 Vendedores',
    descricao: 'Os três maiores vendedores, no pódio',
    imagem: `${PASTA}/top-3.png`,
    slots: ['top1', 'top2', 'top3'],
    fotos: [
      foto('top1', 'top-3-mascara-1.png', { x: 365, y: 760, cx: 546.5, cy: 940, d: 358 }),
      foto('top2', 'top-3-mascara-2.png', { x: 673, y: 877, cx: 802.5, cy: 1025, d: 297 }),
      foto('top3', 'top-3-mascara-3.png', { x: 184, y: 903, cx: 308.5, cy: 1025, d: 245 }),
    ],
    textos: [
      { fixo: 'TOP3', cx: 549, cy: 551, corpo: 120, cor: COR.dourado },
      { fixo: 'VENDEDORES BLACK', cx: 560.5, cy: 666, corpo: 34, cor: COR.vermelho },
    ],
  },
].map((f) => ({
  ...f,
  // Guia da área segura na prévia: a caixa envolvente das fotos.
  safeAreaMm: caixaDasFotos(f),
}));

// Botton: peça de impressão, não card. Um colaborador por botton, escolhido da
// pasta de fotos ou enviado do computador, e o nome digitado livremente.
// O desenho está em botton.js; `imagem` é a moldura (o que a prévia carrega).
// 65 mm de diâmetro (55 mm de face + 5 mm de margem em volta) em 1536 px =
// 600 DPI. Os números repetem os de botton.js, que importa este arquivo.
const LADO_BOTTON = 1536;
const MM_BOTTON = 65;
const RAIO_FACE = 650; // 27,5 mm
// O guia da área segura (engine.js) converte mm em px a 300 DPI, para todas as
// peças; aqui a margem é dada nessa mesma convenção, não no mm físico do botton.
const PX_POR_MM_GUIA = 300 / 25.4;
const margemGuia = (LADO_BOTTON / 2 - RAIO_FACE) / PX_POR_MM_GUIA;
FORMATOS_BF.push({
  id: 'botton',
  nome: 'Botton',
  descricao: 'Foto do colaborador na moldura de lâmpadas, com o nome',
  editor: 'blackfriday',
  botton: true,
  imagem: `${PASTA}/botton-moldura.png`,
  largura: LADO_BOTTON,
  altura: LADO_BOTTON,
  mmLargura: MM_BOTTON,
  mmAltura: MM_BOTTON,
  slots: ['botton'],
  fotos: [],
  textos: [{ fonte: 'nome', slot: 'botton' }],
  mmFace: 55,
  // A folha A4 com o mesmo botton repetido (js/canvas/lote.js) vale para esta
  // peça, não para o setor inteiro: os cards são digitais. A folha com bottons
  // de pessoas diferentes é o passo `folhaBotton` (js/ui/steps/folhaBottonStep.js).
  permiteLote: true,
  folhaBottons: true,
  unidade: { um: 'botton', varios: 'bottons', muitos: 'Vários', quantos: 'Quantos' },
  dicaModelo:
    'A foto entra no círculo, por trás da moldura de lâmpadas, e o nome vai na pílula dourada, na fonte da campanha. O botton sai com 6,5 cm: 5,5 cm de face e 0,5 cm de margem escura em volta, que dobra na prensa.',
  // Guia: a face visível do botton (o aro de 55 mm).
  safeAreaMm: { top: margemGuia, bottom: margemGuia, left: margemGuia, right: margemGuia },
});

// Retrato: peça de impressão A4, a foto do colaborador na moldura de retratos
// da campanha e o nome na pílula dourada. O desenho está em retrato.js; os
// números (furo, pílula) são medidos lá, sobre a moldura de 2480×3508 px
// (210×297 mm a 300 DPI). Mesmas pessoas do botton, com a foto grande.
FORMATOS_BF.push({
  id: 'retrato',
  nome: 'Retrato',
  descricao: 'Foto do colaborador na moldura A4 da campanha, com o nome',
  editor: 'blackfriday',
  retrato: true,
  imagem: `${PASTA}/retrato-moldura.png`,
  largura: 2480,
  altura: 3508,
  mmLargura: 210,
  mmAltura: 297,
  slots: ['retrato'],
  fotos: [],
  textos: [{ fonte: 'nome', slot: 'retrato' }],
  dicaModelo:
    'A foto entra na janela da moldura, por trás do selo e da polaroid, e o nome vai na pílula dourada no pé da foto, na fonte da campanha. Sai em A4 (21×29,7 cm), pronto para imprimir.',
  // Guia: o furo da foto (x 325–2206 · y 541–3120). O guia converte mm em px
  // a 300 DPI, que aqui é a resolução real da peça.
  safeAreaMm: { top: 541 / (300 / 25.4), bottom: (3508 - 3121) / (300 / 25.4), left: 325 / (300 / 25.4), right: (2480 - 2207) / (300 / 25.4) },
});

function caixaDasFotos(f) {
  const PX_POR_MM = 300 / 25.4;
  const x0 = Math.min(...f.fotos.map((p) => p.cx - p.d / 2));
  const y0 = Math.min(...f.fotos.map((p) => p.cy - p.d / 2));
  const x1 = Math.max(...f.fotos.map((p) => p.cx + p.d / 2));
  const y1 = Math.max(...f.fotos.map((p) => p.cy + p.d / 2));
  return {
    top: y0 / PX_POR_MM,
    bottom: (f.altura - y1) / PX_POR_MM,
    left: x0 / PX_POR_MM,
    right: (f.largura - x1) / PX_POR_MM,
  };
}

// Rótulos de cada pessoa na tela, por slot.
export const ROTULOS_SLOT = {
  vendedor: { titulo: 'Vendedor', ajuda: 'Quem bateu a meta.' },
  ajudante: { titulo: 'Com a ajuda de', ajuda: 'O colega que ajudou. Entra no círculo menor e na pílula dourada de baixo.' },
  top1: { titulo: '1º lugar', ajuda: 'Círculo maior, no centro.' },
  top2: { titulo: '2º lugar', ajuda: 'Círculo da direita.' },
  top3: { titulo: '3º lugar', ajuda: 'Círculo da esquerda.' },
  botton: { titulo: 'Colaborador', ajuda: 'Escolha da pasta de fotos ou envie uma do computador.' },
  retrato: { titulo: 'Colaborador', ajuda: 'Escolha da pasta de fotos ou envie uma do computador.' },
};

/** Estado inicial do setor: nada escolhido. Fotos ficam só em memória. */
export function estadoBFInicial() {
  return { pessoas: {}, conquista: '' };
}
