// Configuração estática dos setores, formatos e modelos oficiais.
//
// IDs INTERNOS x NOMES DE INTERFACE
// As chaves `manutencao` e `governanca` são IDs históricos e permanecem como
// estão de propósito: elas indexam os caminhos dos assets
// (assets/images/manutencao/…, assets/images/governanca/…), o `tipo` do motor de
// Canvas e o cache já gravado no navegador dos usuários. Renomeá-las quebraria
// tudo isso sem nenhum ganho. O que o usuário lê — `nome` e `sigla` — foi
// atualizado: "Manutenção" virou "Institucionais Gerais" e "Governança" virou
// "Hospitalidade".
//
// FLUXO
// `fluxo: 'gerador'` segue o passo a passo de Canvas (formato → modelo → texto →
// prévia → download). `fluxo: 'catalogo'` abre a busca de artes prontas; de lá o
// usuário ainda pode entrar no gerador para criar um aviso personalizado.
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
    fluxo: 'gerador',
    permiteTraducao: true,
    tipoTexto: 'busca', // busca na biblioteca do docx
    // Nomes de pratos são rótulos: recebem Title Case editorial na renderização.
    // Os demais setores escrevem frases/parágrafos, onde Title Case atrapalharia
    // a leitura — por isso a regra é por setor, não global.
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

  // ID interno mantido: era "Manutenção", hoje aparece como "Institucionais Gerais".
  manutencao: {
    id: 'manutencao',
    nome: 'Institucionais Gerais',
    sigla: 'INST',
    corDestaque: '#E95029',
    icone: 'institucional',
    // Setor de catálogo: a tela principal é a busca de artes prontas. Os
    // formatos abaixo continuam servindo ao gerador de aviso personalizado,
    // acessível a partir do catálogo.
    fluxo: 'catalogo',
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

  // ID interno mantido: era "Governança", hoje aparece como "Hospitalidade".
  governanca: {
    id: 'governanca',
    nome: 'Hospitalidade',
    sigla: 'HOSP',
    corDestaque: '#8FB82A',
    icone: 'hospitalidade',
    fluxo: 'gerador',
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
        // Caixa alta e centralizada. A base para a 65,3mm da borda (78% da
        // altura): a logo Pratagy Beach começa a 263mm do topo e o quiosque
        // desenhado no canto inferior direito ocupa a faixa logo acima dela.
        //
        // A largura é o limite real do desenho: nessa faixa vertical, a maior
        // caixa simétrica livre tem 24mm de margem (o traço das palmeiras e da
        // cabana entra a partir daí, nos cantos de baixo). Usamos 26mm para
        // deixar ~2mm de respiro em vez de encostar exatamente no desenho.
        safeAreaMm: { top: 41.6, bottom: 65.3, left: 26, right: 26 },
      },
      {
        // Espaço já reservado no fluxo para os cartões de 12x7 cm entregues no
        // apartamento (Agências, Aniversariante, Habitué, Lua de Mel, VIP).
        // Diferente da carta, eles são personalizados com os dados de quem
        // assina — daí os campos declarados em `camposFuturos`, que o passo de
        // texto vai renderizar quando as artes-base chegarem.
        id: 'cartoes-boas-vindas',
        nome: 'Cartões de Boas-Vindas',
        descricao: '12×7 cm · personalizados',
        imagem: 'assets/catalogo/thumbs/hospitalidade/cartao-hospede-vip.jpg',
        emBreve: true,
        camposFuturos: [
          { id: 'vendedorNome', label: 'Nome do vendedor', icone: 'user', tipo: 'text' },
          { id: 'vendedorEmail', label: 'E-mail', icone: 'mail', tipo: 'email' },
          { id: 'vendedorTelefone', label: 'Telefone', icone: 'phone', tipo: 'tel' },
        ],
        largura: 1471,
        altura: 829,
        mmLargura: 124.5,
        mmAltura: 70.2,
        safeAreaMm: { top: 12, bottom: 12, left: 12, right: 12 },
      },
    ],
  },

  acquapark: {
    id: 'acquapark',
    nome: 'Acqua Park',
    sigla: 'AQUA',
    corDestaque: '#4CC2F1',
    icone: 'acquapark',
    fluxo: 'gerador',
    permiteTraducao: false,
    tipoTexto: 'comunicado', // assunto em destaque + corpo do texto
    titleCase: false,
    formatos: [
      {
        id: 'fundo-azul',
        nome: 'Fundo Azul',
        descricao: 'Cartão azul, texto branco',
        imagem: 'assets/images/acquapark/fundo-azul.png',
        largura: 1080,
        altura: 1440,
        // 1080 × 1440 px em 300 DPI. É uma peça digital (WhatsApp), mas o
        // tamanho físico está declarado para o PDF sair sem distorção.
        mmLargura: 91.4,
        mmAltura: 121.9,
        digital: true,
        // O título "COMUNICADO" já vem impresso na arte e termina em y=414px;
        // a fita laranja e a logo do parque voltam a entrar em y=1173px. A
        // caixa vai de 478px a 1133px: 64px de respiro sob o título impresso
        // (para o assunto não encostar nele nos comunicados longos) e 40px
        // acima da fita. As laterais ficam 30px dentro do cartão, que começa
        // em x=80px.
        safeAreaMm: { top: 40.5, bottom: 26, left: 9.3, right: 9.3 },
        corTitulo: '#FFFFFF',
        corCorpo: '#FFFFFF',
      },
      {
        id: 'fundo-branco',
        nome: 'Fundo Branco',
        descricao: 'Cartão branco, texto azul',
        imagem: 'assets/images/acquapark/fundo-branco.png',
        largura: 1080,
        altura: 1440,
        mmLargura: 91.4,
        mmAltura: 121.9,
        digital: true,
        safeAreaMm: { top: 40.5, bottom: 26, left: 9.3, right: 9.3 },
        corTitulo: '#004F9F',
        corCorpo: '#004F9F',
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

/** Formatos que o usuário já pode usar (exclui os marcados como "em breve"). */
export function getFormatosDisponiveis(setorId) {
  const setor = getSetor(setorId);
  if (!setor) return [];
  return setor.formatos.filter((f) => !f.emBreve);
}
