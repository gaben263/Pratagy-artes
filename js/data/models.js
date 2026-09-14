// Configuração estática dos setores, formatos e modelos oficiais.
//
// IDs INTERNOS x NOMES DE INTERFACE
// `governanca` continua sendo um ID histórico: ele indexa
// assets/images/governanca/ e o `tipo` do motor de Canvas, e renomeá-lo quebraria
// esses caminhos sem ganho nenhum. O usuário lê "Hospitalidade".
//
// A chave `manutencao` FOI renomeada para `operacional` — o que só ficou seguro
// depois que os modelos editáveis A3/A4 saíram e a pasta assets/images/manutencao/
// deixou de existir. Com isso o ID não indexa mais nenhum caminho de asset.
// Atenção: o `tipo: 'manutencao'` do motor de Canvas é OUTRO namespace (o
// renderizador de texto livre) e segue com o nome antigo de propósito.
//
// FLUXO
// `fluxo: 'gerador'` segue o passo a passo de Canvas (formato → modelo → texto →
// prévia → download). `fluxo: 'catalogo'` abre a busca de artes prontas da
// categoria indicada em `categoriaCatalogo`. `fluxo: 'misto'` abre antes uma tela
// de escolha entre os dois caminhos.
//
// Um setor de catálogo só oferece o gerador se declarar `acaoGerador` E tiver
// formatos: é o caso da Hospitalidade, onde o catálogo é o prato principal e a
// carta é acessória. No A&B é o inverso — criar identificação de prato é a tarefa
// diária e as artes prontas são consulta ocasional —, por isso ele usa `misto`,
// que dá o mesmo peso aos dois caminhos em vez de enterrar um deles.
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
    // Setor misto: cria arte do zero (biblioteca .docx) ou baixa uma arte pronta.
    fluxo: 'misto',
    categoriaCatalogo: 'ab',
    tituloCatalogo: 'Artes prontas de A&B',
    modos: {
      gerador: {
        icone: 'edit',
        titulo: 'Criar uma nova arte',
        descricao: 'Escolha o tamanho e busque o prato na biblioteca oficial',
      },
      catalogo: {
        icone: 'layers',
        titulo: 'Usar uma arte pronta',
        descricao: 'Baixe uma das artes já aprovadas pelo Marketing',
      },
    },
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

  // Era "Manutenção", depois "Institucionais Gerais", hoje "Operacional".
  //
  // Não tem gerador: os modelos editáveis A3/A4 foram removidos junto com as
  // imagens-base. O setor é consulta e download de artes já aprovadas.
  operacional: {
    id: 'operacional',
    nome: 'Operacional',
    sigla: 'OPER',
    corDestaque: '#E95029',
    icone: 'operacional',
    fluxo: 'catalogo',
    categoriaCatalogo: 'operacional',
    tituloCatalogo: 'Catálogo de artes operacionais',
    permiteTraducao: false,
    titleCase: false,
    formatos: [],
  },

  // ID interno mantido: era "Governança", hoje aparece como "Hospitalidade".
  //
  // Setor híbrido: lista as artes prontas de hospitalidade (cartões de hóspede,
  // carta de check-out, QR Code do web check-in) e ainda oferece o gerador da
  // carta de boas-vindas, declarado em `acaoGerador`.
  governanca: {
    id: 'governanca',
    nome: 'Hospitalidade',
    sigla: 'HOSP',
    corDestaque: '#8FB82A',
    icone: 'hospitalidade',
    fluxo: 'catalogo',
    categoriaCatalogo: 'hospitalidade',
    tituloCatalogo: 'Artes de Hospitalidade',
    acaoGerador: {
      titulo: 'Escrever uma carta de boas-vindas',
      descricao: 'Sua própria mensagem na arte oficial A4, com letra manuscrita',
    },
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
