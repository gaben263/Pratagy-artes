// Configuração estática dos setores, formatos e modelos oficiais.
//
// IDs INTERNOS x NOMES DE INTERFACE
// `governanca` continua sendo um ID histórico: ele indexa
// assets/images/governanca/ e o `tipo` do motor de Canvas, e renomeá-lo quebraria
// esses caminhos sem ganho nenhum. O usuário lê "Hospitalidade".
//
// `manutencao` é o ID do setor "Manutenção". O nome de interface mudou três
// vezes e o ID acompanhou a última (HISTORICO 3.7, 3.11 e 3.15). Nenhum cache é
// indexado por ID de setor (verificado na 3.11), então renomear é seguro. Atenção: o `tipo: 'manutencao'` do motor de Canvas é OUTRO
// namespace (o renderizador de texto livre, hoje sem uso) — a coincidência de
// nome é histórica, não uma dependência.
//
// FLUXO
// `fluxo: 'gerador'` segue o passo a passo de Canvas (formato → modelo → texto →
// prévia → download). `fluxo: 'catalogo'` abre a busca de artes prontas da
// categoria indicada em `categoriaCatalogo`.
//
// Um setor de catálogo só oferece o gerador se declarar `acaoGerador` E tiver
// formatos: o cartão de "criar" aparece no topo do catálogo, seguido do
// separador e da grade de artes prontas. Hospitalidade (carta de boas-vindas) e
// A&B (identificação de pratos) usam esse mesmo padrão; o A&B chegou a ter uma
// tela de escolha própria (`fluxo: 'misto'`), descartada por ser um passo a mais
// para chegar ao mesmo lugar.
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

import { FORMATOS_RH } from '../rh/templates.js';

export const SETORES = {
  ab: {
    id: 'ab',
    nome: 'Alimentos & Bebidas',
    sigla: 'A&B',
    corDestaque: '#008BCE',
    icone: 'ab',
    // Catálogo com gerador no topo: cria a identificação de um prato (biblioteca
    // .docx) ou baixa uma das artes prontas de A&B.
    fluxo: 'catalogo',
    categoriaCatalogo: 'ab',
    tituloCatalogo: 'Artes prontas de A&B',
    subtituloCatalogo: 'Crie a identificação de um prato ou baixe uma das artes já aprovadas.',
    acaoGerador: {
      titulo: 'Criar uma nova arte',
      descricao: 'Escolha o tamanho e busque o prato na biblioteca oficial',
    },
    permiteTraducao: true,
    // Placas de buffet saem às dezenas: o passo Download oferece a folha A4
    // com várias placas para imprimir na impressora do resort (js/canvas/lote.js).
    permiteLote: true,
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

  // Já teve outros dois nomes (HISTORICO 3.7 e 3.11) e voltou a "Manutenção":
  // é o nome que a equipe usa no dia a dia.
  //
  // Não tem gerador: os modelos editáveis A3/A4 foram removidos junto com as
  // imagens-base. O setor é consulta e download de artes já aprovadas.
  manutencao: {
    id: 'manutencao',
    nome: 'Manutenção',
    sigla: 'MANUT',
    corDestaque: '#E95029',
    icone: 'manutencao',
    fluxo: 'catalogo',
    categoriaCatalogo: 'manutencao',
    tituloCatalogo: 'Catálogo de artes de Manutenção',
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
    subtituloCatalogo: 'Escreva uma carta personalizada ou baixe uma das artes já aprovadas.',
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

  // RH: comunicados internos e peças com foto de colaborador. Cada template
  // declara o próprio `editor` (js/rh/templates.js); `tipoTexto: 'rh'` só
  // identifica o setor — o despacho real é por formato. Dados pessoais ficam
  // em memória e somem no reload (LGPD): nada é gravado em cache.
  rh: {
    id: 'rh',
    nome: 'RH',
    sigla: 'RH',
    corDestaque: '#F7A600',
    icone: 'rh',
    fluxo: 'gerador',
    permiteTraducao: false,
    tipoTexto: 'rh',
    titleCase: false,
    formatos: FORMATOS_RH,
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
