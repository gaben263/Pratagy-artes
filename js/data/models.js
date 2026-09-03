// Configuração estática dos setores, formatos e modelos oficiais.
//
// safeArea é expresso em porcentagem da imagem (0-100), medido a partir da
// análise de pixels dos modelos oficiais (área branca/clara sem sobrepor
// ondas, palmeiras, sol e demais ilustrações de fundo).
//
// IMPORTANTE: as margens horizontais são sempre SIMÉTRICAS (left = 100 - right).
// A medição bruta de espaço livre costuma ser assimétrica — o sol no canto
// superior direito restringe mais que o lado esquerdo, por exemplo — mas usar
// esses valores brutos como caixa de texto joga o texto para fora do centro da
// placa. Por isso espelhamos sempre a margem mais restritiva dos dois lados.

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
        descricao: 'Placa pequena de balcão',
        imagem: 'assets/images/ab/8x5cm.png',
        largura: 945,
        altura: 591,
        mmLargura: 80,
        mmAltura: 50,
        safeArea: { top: 9, bottom: 72, left: 16, right: 84 },
      },
      {
        id: '8x10',
        nome: '8x10 cm',
        descricao: 'Placa média de buffet',
        imagem: 'assets/images/ab/8x10cm.png',
        largura: 945,
        altura: 1181,
        mmLargura: 80,
        mmAltura: 100,
        safeArea: { top: 14, bottom: 70, left: 17, right: 83 },
      },
      {
        id: '10x15',
        nome: '10x15 cm',
        descricao: 'Placa grande de estação',
        imagem: 'assets/images/ab/10x15cm.png',
        largura: 1181,
        altura: 1772,
        mmLargura: 100,
        mmAltura: 150,
        safeArea: { top: 22, bottom: 74, left: 18, right: 82 },
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
        safeArea: { top: 10, bottom: 74, left: 14, right: 86 },
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
        safeArea: { top: 14, bottom: 70, left: 16, right: 84 },
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
        safeArea: { top: 18, bottom: 72, left: 15, right: 85 },
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
        safeArea: { top: 14, bottom: 68, left: 13, right: 87 },
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
        safeArea: { top: 14, bottom: 75, left: 10, right: 90 },
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
