// Configuração estática dos setores, formatos e modelos oficiais.
//
// safeAreaMm expressa as margens em MILÍMETROS a partir de cada borda da arte.
// A medida é física, não percentual: as imagens-base estão todas em 300 DPI
// (945px = 80,01mm; 2480px = 209,97mm), então "6 mm de respiro" continua
// valendo 6 mm no PNG e no PDF exportados, em qualquer formato.
//
// Duas regras valem para esses valores:
//
// 1. As margens laterais são SIMÉTRICAS (left = right). A medição bruta de
//    espaço livre costuma ser assimétrica — o sol no canto superior direito
//    restringe mais que o lado esquerdo, por exemplo — mas usar esses valores
//    brutos como caixa de texto joga o texto para fora do centro da arte.
//    Por isso espelhamos sempre a margem mais restritiva dos dois lados.
//
// 2. A faixa vertical evita as ilustrações, em vez de cobrir toda a altura.
//    O sol e as palmeiras ficam concentrados no topo e na base: incluí-los
//    estrangula a caixa inteira e força quebras de linha desnecessárias no
//    miolo, que está livre.

export const SETORES = {
  ab: {
    id: 'ab',
    nome: 'Alimentos & Bebidas',
    sigla: 'A&B',
    corDestaque: '#008BCE',
    icone: 'ab',
    permiteTraducao: true,
    tipoTexto: 'busca', // busca na biblioteca do docx
    // Nomes de pratos são rótulos: recebem Title Case editorial na renderização.
    // Manutenção e Governança escrevem frases/parágrafos, onde Title Case
    // atrapalharia a leitura — por isso a regra é por setor, não global.
    titleCase: true,
    formatos: [
      {
        id: '8x5',
        nome: '8x5 cm',
        descricao: 'Arte pequena de balcão',
        imagem: 'assets/images/ab/8x5cm.png',
        largura: 945,
        altura: 591,
        mmLargura: 80,
        mmAltura: 50,
        // Onda azul superior termina a 3,4mm do topo e a inferior a 12,1mm da
        // base: +6mm de respiro em cada uma. Laterais a 10,8mm por causa das
        // palmeiras e do sol, que restringem mais que a moldura azul.
        safeAreaMm: { top: 9.4, bottom: 18.1, left: 10.8, right: 10.8 },
      },
      {
        id: '8x10',
        nome: '8x10 cm',
        descricao: 'Arte média de buffet',
        imagem: 'assets/images/ab/8x10cm.png',
        largura: 945,
        altura: 1181,
        mmLargura: 80,
        mmAltura: 100,
        // Onda superior a 11,9mm do topo e inferior a 16,3mm da base, +6mm de
        // respiro. Laterais a 15,6mm (palmeiras, sol e as ondinhas decorativas).
        safeAreaMm: { top: 17.9, bottom: 22.3, left: 15.6, right: 15.6 },
      },
      {
        id: '10x15',
        nome: '10x15 cm',
        descricao: 'Arte grande de estação',
        imagem: 'assets/images/ab/10x15cm.png',
        largura: 1181,
        altura: 1772,
        mmLargura: 100,
        mmAltura: 150,
        safeAreaMm: { top: 33, bottom: 39, left: 18, right: 18 },
      },
    ],
  },
  manutencao: {
    id: 'manutencao',
    nome: 'Manutenção',
    sigla: 'MNT',
    corDestaque: '#E95029',
    icone: 'manutencao',
    permiteTraducao: false,
    tipoTexto: 'livre',
    titleCase: false,
    formatos: [
      {
        id: 'a3-horizontal',
        nome: 'A3 Horizontal',
        descricao: 'Aviso grande, paisagem',
        imagem: 'assets/images/manutencao/a3-horizontal.png',
        largura: 4961,
        altura: 3508,
        mmLargura: 420,
        mmAltura: 297,
        safeAreaMm: { top: 29.7, bottom: 77.2, left: 58.8, right: 58.8 },
      },
      {
        id: 'a3-vertical',
        nome: 'A3 Vertical',
        descricao: 'Aviso grande, retrato',
        imagem: 'assets/images/manutencao/a3-vertical.png',
        largura: 3508,
        altura: 4961,
        mmLargura: 297,
        mmAltura: 420,
        safeAreaMm: { top: 58.8, bottom: 126, left: 47.5, right: 47.5 },
      },
      {
        id: 'a4-horizontal',
        nome: 'A4 Horizontal',
        descricao: 'Aviso padrão, paisagem',
        imagem: 'assets/images/manutencao/a4-horizontal.png',
        largura: 3508,
        altura: 2480,
        mmLargura: 297,
        mmAltura: 210,
        safeAreaMm: { top: 37.8, bottom: 58.8, left: 44.6, right: 44.6 },
      },
      {
        id: 'a4-vertical',
        nome: 'A4 Vertical',
        descricao: 'Aviso padrão, retrato',
        imagem: 'assets/images/manutencao/a4-vertical.png',
        largura: 2480,
        altura: 3508,
        mmLargura: 210,
        mmAltura: 297,
        safeAreaMm: { top: 41.6, bottom: 95, left: 27.3, right: 27.3 },
      },
    ],
  },
  governanca: {
    id: 'governanca',
    nome: 'Governança',
    sigla: 'GOV',
    corDestaque: '#8FB82A',
    icone: 'governanca',
    permiteTraducao: false,
    tipoTexto: 'carta', // textarea longo com auto-shrink
    titleCase: false,
    // Carta manuscrita: usa a Satisfy no Canvas, centralizada.
    fonteManuscrita: true,
    formatos: [
      {
        id: 'a4-vertical-boas-vindas',
        nome: 'Carta de Boas-Vindas',
        descricao: 'A4 Vertical',
        imagem: 'assets/images/governanca/a4-vertical-boas-vindas.png',
        largura: 2480,
        altura: 3508,
        mmLargura: 210,
        mmAltura: 297,
        // Caixa estreita e alta, centralizada. A base para a 65,3mm da borda
        // (78% da altura): a logo Pratagy Beach começa a 263mm do topo e o
        // quiosque desenhado no canto inferior direito ocupa a faixa logo
        // acima dela — a caixa termina antes dos dois.
        safeAreaMm: { top: 41.6, bottom: 65.3, left: 40, right: 40 },
      },
    ],
  },
};

export function getSetor(setorId) {
  return SETORES[setorId] || null;
}

export function getFormato(setorId, formatoId) {
  const setor = getSetor(setorId);
  if (!setor) return null;
  return setor.formatos.find((f) => f.id === formatoId) || null;
}
