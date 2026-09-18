// Templates do RH: as três artes do primeiro ciclo, com tudo o que foi medido
// pixel a pixel nas imagens (HISTORICO 3.17). Todas em 1080×1440 px.
//
// O motor de Canvas lê a área segura em milímetros (`safeAreaMm`, a 300 DPI).
// As medições aqui são em pixels, então `safeAreaMmDePx` faz a conversão — o
// motor não muda nada para servir ao RH.
//
// `editor` decide a tela de edição e o renderizador:
//   'atencao'         → textarea existente + bloco de texto do motor
//                       (`fitFontSize`/`drawTextBlock`, SemiBold, auto-shrink)
//                       centralizado na vertical pelo compositor do RH.
//   'texto'           → o mesmo bloco de texto do 'atencao', para as peças de
//                       comunicado puro que só mudam de arte e de área útil.
//   'encontro'        → o mesmo bloco de texto do 'atencao' + um campo de data
//                       ao lado do ícone de calendário já impresso na arte.
//   'talento'         → 1 colaborador (foto no polaroid + faixas giradas).
//   'aniversariantes' → N colaboradores em grade (foto circular + faixas).
//                       O nome vem da primeira peça que o usou; é o editor de
//                       "grade de cards circulares" — Destaque e Bem Vindos
//                       também são ele, só com outra arte, área e máximo.
//   'plantao'         → 1 gestor: foto no círculo impresso, nome e setor na
//                       faixa impressa, data e tipo de plantão ao lado dos
//                       ícones (o tipo é um select de três opções fixas).
//
// Por que 'texto' e não 'comunicado': `modoDeEdicao` cai no `tipoTexto` do
// setor quando o formato não declara `editor`, e 'comunicado' já é o
// `tipoTexto` do Acqua Park. Pôr 'comunicado' em `EDITORES_RH` faria o Acqua
// Park ser desenhado pelo compositor do RH.

import { DPI } from '../canvas/engine.js';

const PX_POR_MM = DPI / 25.4;
const pxParaMm = (px) => px / PX_POR_MM;

/** Área segura em mm a partir de um retângulo em px da própria imagem. */
export function safeAreaMmDePx({ largura, altura, x0, y0, x1, y1 }) {
  return {
    top: pxParaMm(y0),
    bottom: pxParaMm(altura - y1),
    left: pxParaMm(x0),
    right: pxParaMm(largura - x1),
  };
}

// Cores das faixas e do placeholder de foto — aprovadas na 3.17. O amarelo é o
// do "do Mês" da própria arte (e o `status.yellow` do Tailwind); o azul é o do
// título "Talento" (`brand.deep`).
export const CORES = {
  faixaNome: { fundo: '#FDD945', texto: '#004F9F' },
  faixaSetor: { fundo: '#004F9F', texto: '#FFFFFF' },
  placeholderFoto: { fundo: '#004F9F', texto: '#C0E5FB' },
};

// Regra de crescimento das faixas (igual nas duas artes):
// cresce em largura até 90 % do card → fonte reduz até 20 % → só o nome quebra
// em 2 linhas → se ainda não couber, bloqueia a exportação nomeando quem não coube.
export const FAIXA = {
  larguraMaxDoCard: 0.9,
  reducaoMinima: 0.8,
  passoReducao: 0.05,
};

const BASE = { largura: 1080, altura: 1440, mmLargura: 91.4, mmAltura: 121.9, digital: true };

/**
 * Peça de comunicado puro: muda a arte, a área útil e o limite de texto —
 * nada mais. Todas usam o mesmo renderizador do Atenção (`editor: 'texto'`).
 *
 * `maxCaracteres` é o limite do campo de texto, não o limite físico: o
 * Poka-Yoke continua derivando do render. Ver COMUNICADOS_PUROS para como cada
 * número foi obtido.
 */
const comunicadoPuro = ({ id, nome, descricao, area, maxCaracteres }) => ({
  ...BASE,
  id,
  nome,
  descricao,
  imagem: `assets/images/rh/${id}.png`,
  editor: 'texto',
  corCorpo: '#004F9F',
  alinhamento: 'center',
  maxCaracteres,
  safeAreaMm: safeAreaMmDePx({ ...BASE, ...area }),
});

// As 6 peças de comunicado puro (3.19), medidas pixel a pixel em cada PNG.
//
// LARGURA: 730 px (x 175–905) nas seis — a mesma do Atenção. Não é conveniência:
// larguras de 601 a 881 foram testadas em cada arte e 730 cabe em todas. Só o
// vão vertical varia de peça para peça.
//
// ALTURA: o vão de fundo limpo medido em cada arte, menos 24 px de respiro em
// cima e embaixo (o mesmo respiro do Atenção e do Encontro Geral). O comentário
// de cada peça diz o que fecha cada ponta.
//
// ALINHAMENTO: centralizado nas seis. As artes vêm vazias, então não há
// evidência direta de alinhamento nelas; o que há é a assimetria natural do
// vão, que em nenhuma peça passa de 19,5 px (menos de 2 % da largura). Nenhuma
// arte pede alinhamento à esquerda. `alinhamento` fica por template para que
// mudar qualquer uma seja uma palavra.
//
// COR: #004F9F nas seis. O cartão de fundo é quase branco em todas — inclusive
// no Comunicado Importante, onde o vermelho é só o badge e o megafone, não o
// fundo do texto. Contraste medido: 7,36:1 a 7,62:1.
//
// maxCaracteres: derivado de UMA regra — o corpo não cai abaixo de 32 px no
// arranjo mais caro (3 parágrafos; cada quebra custa uma linha inteira) —
// arredondado para baixo no múltiplo de 50. A régua se confere sozinha: o
// Atenção, com os 600 caracteres já aprovados, renderiza a 33 px.
const COMUNICADOS_PUROS = [
  comunicadoPuro({
    id: 'comunicado',
    nome: 'Comunicado',
    descricao: 'Comunicado geral no cartão branco',
    // Fecha em cima o megafone superior direito (y 276); embaixo, a sombra do
    // megafone inferior direito, que entra na faixa em y 1197.
    area: { x0: 175, y0: 301, x1: 905, y1: 1172 },
    maxCaracteres: 700,
  }),
  comunicadoPuro({
    id: 'comunicado-importante',
    nome: 'Comunicado Importante',
    descricao: 'Aviso urgente, com selo vermelho',
    // A peça mais apertada das seis: o megafone vermelho sobe até y 951 e a
    // sombra do selo desce até y 399. Sobram 502 px de altura.
    area: { x0: 175, y0: 424, x1: 905, y1: 926 },
    maxCaracteres: 350,
  }),
  comunicadoPuro({
    id: 'dica-prataginho',
    nome: 'Dica do Pratagynho',
    descricao: 'Dica do mascote, em tom leve',
    // O nome na arte é "Dica do Pratagynho" (com Y); o arquivo de origem veio
    // como "Dica Prataginho" e o id segue a grafia ASCII pedida.
    // Fecha em cima o rabo do balão amarelo (y 421); embaixo, o halo do balão
    // de interrogação inferior direito (y 1254). O logo só começa em 1265.
    area: { x0: 175, y0: 446, x1: 905, y1: 1229 },
    maxCaracteres: 600,
  }),
  comunicadoPuro({
    id: 'fique-por-dentro',
    nome: 'Fique por Dentro',
    descricao: 'Novidades e avisos do dia a dia',
    // Fecha em cima o título com o velocímetro (y 279); embaixo, a prancheta
    // azul que invade o cartão pela esquerda a partir de y 1002.
    area: { x0: 175, y0: 304, x1: 905, y1: 977 },
    maxCaracteres: 550,
  }),
  comunicadoPuro({
    id: 'seus-beneficios',
    nome: 'Seus Benefícios',
    descricao: 'Benefícios e vantagens do colaborador',
    // Fecha em cima o badge verde (y 342); embaixo, o halo do coração inferior
    // esquerdo, que alcança x 176 em y 1095.
    area: { x0: 175, y0: 367, x1: 905, y1: 1070 },
    maxCaracteres: 550,
  }),
  comunicadoPuro({
    id: 'voce-sabia',
    nome: 'Você Sabia',
    descricao: 'Curiosidade ou informação útil',
    // Em cima quem fecha não é o balão do título e sim o canto arredondado do
    // próprio cartão, que na largura de 730 ainda é fundo azul em y 389.
    // Embaixo, o balão de interrogação amarelo inferior direito (y 1032).
    area: { x0: 175, y0: 414, x1: 905, y1: 1007 },
    maxCaracteres: 450,
  }),
];

// Cores das faixas nas artes da rodada 2A (Destaque ADM, Destaque Operacional
// e Bem Vindos). As três usam exatamente o mesmo par — #f7a600 no "DESTAQUE"
// e no "Vindos", #004F9F no badge e no script —, e o amarelo é visivelmente
// mais quente que o #FDD945 do Talento/Aniversariantes. A pílula segue a arte
// em que está (contraste do azul sobre #f7a600: 4,0:1, acima do mínimo para
// texto grande em negrito). Quem não declara `cores` continua em CORES.
const CORES_2A = {
  faixaNome: { fundo: '#f7a600', texto: '#004F9F' },
  faixaSetor: { fundo: '#004F9F', texto: '#FFFFFF' },
};

// Bem Vindos (3.21): a pílula do nome é VERDE FIXO em todas as pessoas — não
// existe mapa setor → cor nem sobrescrita por pessoa. O verde é o da onda da
// própria arte: moda de 31 amostras ao longo da crista (y 1244–1271), #8dc139
// (mediana #91c43f; o token `status.green` do Tailwind, #8FB82A, é
// indistinguível a olho). A referência do RH usa texto branco, mas branco
// sobre #8dc139 dá 2,1:1 — reprova no mínimo de 3:1 para texto grande —,
// então o texto fica no azul das outras pílulas de nome (3,8:1). A pílula do
// setor não muda.
const CORES_BEM_VINDOS = {
  faixaNome: { fundo: '#8dc139', texto: '#004F9F' },
  faixaSetor: CORES_2A.faixaSetor,
};

// Destaque ADM e Destaque Operacional são a MESMA arte com outro título (diff
// pixel a pixel: só x 178–902 · y 180–421 muda). A área é uma só, a partir do
// título mais baixo (Operacional, y 421) com 24 px de respiro. A arte é foto
// de fundo inteiro, sem obstáculo lateral: 140–940, como o Aniversariantes.
//
// EMBAIXO (3.21): o "parabéns" manuscrito branco (y 1005–1230) é decorativo e
// pode ficar sob os cards — o limite real são as ondas verdes, que não podem
// ser cruzadas. A crista mais alta, medida coluna a coluna em x 250–800, está
// em y 1219 (as palmeiras são verde-oliva e não entram na medição); 24 px de
// respiro → 1195. Vão de 750 px, contra 536 da rodada 2A.
// Máximo 8, no modo de duas linhas da grade (ver gridLayout.js).
const AREA_DESTAQUE = { x0: 140, y0: 445, x1: 940, y1: 1195 };
const destaque = ({ id, nome, descricao }) => ({
  ...BASE,
  id,
  nome,
  descricao,
  imagem: `assets/images/rh/${id}.png`,
  editor: 'aniversariantes',
  maxColaboradores: 8,
  grade: 'duasLinhas',
  cores: CORES_2A,
  areaCards: AREA_DESTAQUE,
  safeAreaMm: safeAreaMmDePx({ ...BASE, ...AREA_DESTAQUE }),
});

const CARDS_2A = [
  destaque({ id: 'destaque-adm', nome: 'Destaque Administrativo', descricao: 'Até 8 destaques da área administrativa' }),
  // O arquivo de origem chama-se "Destaque do Mês", mas a arte diz
  // "Colaborador Destaque Operacional" — o nome e o id seguem a arte.
  destaque({ id: 'destaque-operacional', nome: 'Destaque Operacional', descricao: 'Até 8 destaques da área operacional' }),
  {
    ...BASE,
    id: 'bem-vindos',
    nome: 'Sejam Bem Vindos',
    descricao: 'Boas-vindas a até 8 novos colaboradores',
    imagem: 'assets/images/rh/bem-vindos.png',
    editor: 'aniversariantes',
    // O vão entre os dois textos impressos (o de boas-vindas termina em y 486,
    // "Mais uma vez, seja bem-vindo(a)!" começa em 1133) tem 646 px — contra
    // 763 do Aniversariantes; com respiro de 16, 613. Três linhas de cards não
    // cabem aí (precisariam de 623 mesmo com fotos de 105 px), por isso a peça
    // usa o modo de duas linhas da grade: até 8 em 4 colunas × 2 linhas, como
    // na referência do RH (3.21). Os dois textos impressos são o limite — não
    // há como estender a área.
    // Largura: 160–920 (760); a partir de 800 px o confete vermelho da
    // esquerda (x ≈ 140, y 540–640) entra na área e empurra o topo para 644.
    maxColaboradores: 8,
    grade: 'duasLinhas',
    cores: CORES_BEM_VINDOS,
    areaCards: { x0: 160, y0: 503, x1: 920, y1: 1116 },
    safeAreaMm: safeAreaMmDePx({ ...BASE, x0: 160, y0: 503, x1: 920, y1: 1116 }),
  },
];

// Tipos de plantão: as três únicas strings que o campo aceita. O select do
// formulário só oferece estas; o compositor confere de novo e não desenha
// (nem libera a exportação) se o valor não for uma delas.
export const TIPOS_PLANTAO = ['Noturno', 'Fim de Semana', 'Noturno e Fim de Semana'];

// G&G — Gestores de Plantão. Tudo medido no PNG e calibrado no exemplo
// preenchido do RH (Mario Cesar / Alimentos & Bebidas / 05/09 e 06/09 / Fim de
// Semana): a largura do "Alimentos & Bebidas" impresso bate com Regular 32 e
// a do "05/09 e 06/09" com Heavy 32.
//
// 3.21: a arte foi corrigida pelo RH — o diff contra a anterior tem 3.889 px,
// todos em x 334–414 · y 1023–1146: os dois ícones andaram 40 px para a
// esquerda. Círculo, anel, faixa, palmeiras e onda são idênticos. Na mesma
// rodada a faixa foi re-medida (começa em 790, não 800) e o nome desceu.
const PLANTAO_GESTORES = {
  ...BASE,
  id: 'plantao-gestores',
  nome: 'Gestores de Plantão',
  descricao: 'Gestor de plantão noturno e/ou de fim de semana',
  imagem: 'assets/images/rh/plantao-gestores.png',
  editor: 'plantao',
  maxColaboradores: 1,
  // Círculo branco impresso: x 348–731 · y 425–808 → centro (540, 617),
  // diâmetro 384. O anel em volta (raio 192 → 207) tem a cor da faixa, então
  // os dois são uma forma só. A foto leva 4 px de sangria para cobrir a borda
  // anti-aliased do branco.
  foto: { cx: 540, cy: 617, diametro: 388 },
  // Faixa azul-clara impressa: x 248–830 · y 790–919 (130 px), #4cc2f1. Não
  // é desenhada — o texto entra nela. Nome e setor centrados no eixo (540),
  // cada um na sua caixa de UMA linha, alinhada ao meio.
  //
  // POSIÇÃO (3.21): a rodada 2A deixou o bloco alto na faixa — as maiúsculas
  // do nome a 28 px do topo e o setor a 14 da base. No exemplo do RH, as
  // maiúsculas do "Mario Cesar" começam ~41 px abaixo do topo e o vão
  // nome→setor é ~12. Casando com o exemplo: nome 46 px Heavy na caixa
  // 826–878 (maiúsculas em ~831) e setor 32 Regular em 878–915 (base da linha
  // ~905, descendentes em ~912, 7 px da base da faixa). Nada é cortado. As
  // caixas continuam menores que duas linhas no piso (nome: 2×34×1,15 = 78 >
  // 52; setor: 2×24×1,15 = 55 > 37), então `fitFontSize` bloqueia sozinho.
  faixa: {
    x0: 278, x1: 800, // 583 de faixa menos 30 de padding de cada lado
    cor: '#004F9F',
    nome: { y0: 826, altura: 52, corpo: 46, piso: 34, peso: 800 },
    setor: { y0: 878, altura: 37, corpo: 32, piso: 24, peso: 400 },
  },
  // Ícones brancos impressos (arte corrigida, 3.21): calendário x 335–373
  // (centro y 1044), relógio x 336–373 (centro y 1127). O texto começa em
  // x 401 (373 + 28, o gap ícone→texto do exemplo). Limite direito 861: a
  // palmeira da direita invade a linha do relógio a partir de x 877; as duas
  // linhas usam a mesma caixa para ficarem alinhadas. Altura 40: uma linha
  // de 32 (36,8) cabe, duas no piso de 24 (55) não. "Noturno e Fim de
  // Semana", a opção mais longa, mede 410 px a 32 — cabe nos 460 com 50 de
  // folga (eram 10), então o tipo é sempre do mesmo tamanho.
  linhas: {
    x0: 401, largura: 460, cor: '#FFFFFF', corpo: 32, piso: 24, peso: 800, entrelinha: 1.15,
    data: { y0: 1024, altura: 40 },
    tipo: { y0: 1107, altura: 40 },
  },
  opcoesTipo: TIPOS_PLANTAO,
  // Guia da área segura na prévia: a caixa envolvente da foto e da faixa.
  safeAreaMm: safeAreaMmDePx({ ...BASE, x0: 248, y0: 410, x1: 830, y1: 919 }),
};

export const FORMATOS_RH = [
  {
    ...BASE,
    id: 'atencao',
    nome: 'Atenção',
    descricao: 'Comunicado interno só com texto',
    imagem: 'assets/images/rh/atencao.png',
    editor: 'atencao',
    // Texto em azul da marca sobre o cartão branco.
    corCorpo: '#004F9F',
    // Largura: megafones invadem o cartão (x 97–983) em x ≤ 150 e x ≥ 754 →
    // livre 151–984, espelhado no centro (540) com 24 px de respiro = 175–905.
    // Altura: simétrica entre o fim da barra "ATENÇÃO" (269) e o topo da onda
    // verde (1243), com o teto de baixo dado pelo megafone inferior direito, que
    // entra na faixa de texto em y 1165 → 1145; espelhando os 98 px, 367.
    // O bloco é centralizado na vertical dentro desta área (ver render.js).
    safeAreaMm: safeAreaMmDePx({ ...BASE, x0: 175, y0: 367, x1: 905, y1: 1145 }),
  },
  {
    ...BASE,
    id: 'encontro',
    nome: 'Encontro Geral',
    descricao: 'Convocação do encontro, com a data do dia',
    imagem: 'assets/images/rh/encontro.png',
    editor: 'encontro',
    corCorpo: '#004F9F',
    // O vão entre a ilustração e a fileira de ícones está 100 % limpo de
    // y 492 a 853, na largura inteira da arte. A largura vem da própria peça:
    // a fileira de ícones (x 189–890) e a frase impressa de baixo (x 190–891)
    // têm exatamente 702 px, simétricas no centro (540) — essa é a coluna de
    // conteúdo do layout. Vertical: 24 px de respiro da engrenagem mais baixa
    // do desenho (491) e da fileira de ícones (854); o centro do bloco fica em
    // 672,5, o centro exato do vão.
    safeAreaMm: safeAreaMmDePx({ ...BASE, x0: 189, y0: 516, x1: 891, y1: 829 }),
    // Campo de data: entra à esquerda, colado no ícone de calendário impresso
    // (x 189–225), e não pode encostar no relógio (x 482).
    //   x 239 = 225 + os mesmos 14 px de gap ícone→texto dos outros dois grupos
    //   largura 204 = até 443, deixando 40 px de respiro do relógio
    //   y 853 + altura 56 → centro em 881, o mesmo dos três ícones e dos dois
    //   textos já impressos (880,5 / 881 / 881)
    //
    // O limite de DUAS linhas não é uma regra à parte: sai da geometria. Com
    // entrelinha 1,15 e piso de 18 px, três linhas medem 62,1 px e não cabem
    // nos 56 px da caixa — então `fitFontSize` nunca devolve três linhas que
    // "cabem", e acima disso bloqueia. Corpo 24 px Heavy é o mesmo tamanho
    // medido no "15hOO" e no "No Teatro do / Pratagy Resort" impressos.
    data: {
      x: 239,
      y: 853,
      largura: 204,
      altura: 56,
      corpo: 24,
      piso: 18,
      entrelinha: 1.15,
      peso: 800,
      cor: '#004F9F',
    },
  },
  {
    ...BASE,
    id: 'talento',
    nome: 'Talento do Mês',
    descricao: 'Um colaborador em destaque no polaroid',
    imagem: 'assets/images/rh/talento.png',
    editor: 'talento',
    // Quadrado amarelo do polaroid: cantos TL (290,429) TR (730,368) BR (790,843)
    // BL (346,895) → 445×474 px girado −7,89°, centro (540, 631,5). Moldura
    // branca: 45 px no topo, 38–40 nas laterais, 76 na base.
    polaroid: {
      centro: { x: 540, y: 631.5 },
      largura: 445,
      altura: 474,
      anguloGraus: -7.89,
      moldura: { topo: 45, lados: 39, base: 76 },
    },
    // Faixas com cantos suavemente arredondados (retângulo), não pílula: é o
    // desenho da referência do Talento. Aniversariantes segue em pílula.
    raioFaixa: 8,
    // A guia de "área segura" da prévia mostra a caixa envolvente do polaroid.
    safeAreaMm: safeAreaMmDePx({ ...BASE, x0: 251, y0: 323, x1: 829, y1: 971 }),
  },
  {
    ...BASE,
    id: 'aniversariantes',
    nome: 'Aniversariantes do Dia',
    descricao: 'De 1 a 9 colaboradores, distribuídos automaticamente',
    imagem: 'assets/images/rh/aniversariantes.png',
    editor: 'aniversariantes',
    maxColaboradores: 9,
    // LARGURA (3.17.2): o balão azul-claro da direita começa em x 942 e desce de
    // y 792 até ~1200, então x 940 é o limite físico; espelhado no centro (540),
    // dá 140–940 (800 px). Era 169–911 (742) — a faixa de setor mais larga é o
    // que faz "Departamento Pessoal" caber no layout de 9.
    // ALTURA: topo mantido em 411 (título "DO DIA" termina em 371). Nessa
    // largura o fundo é limpo até y 1194 (balão dourado à direita); 20 px de
    // respiro → 1174. O logo só começa em 1326.
    areaCards: { x0: 140, y0: 411, x1: 940, y1: 1174 },
    safeAreaMm: safeAreaMmDePx({ ...BASE, x0: 140, y0: 411, x1: 940, y1: 1174 }),
  },
  ...COMUNICADOS_PUROS,
  ...CARDS_2A,
  PLANTAO_GESTORES,
];

// Editores cuja tela é a de colaboradores (nome, setor, foto) — o Plantão
// também é um deles, com data e tipo a mais.
export const EDITORES_COM_CARDS = new Set(['talento', 'aniversariantes', 'plantao']);
// Tudo que o compositor do RH renderiza (os cards e os textos de comunicado).
export const EDITORES_RH = new Set(['atencao', 'texto', 'encontro', 'talento', 'aniversariantes', 'plantao']);

/** O modo de edição/render de um formato (RH) ou do setor (demais). */
export function modoDeEdicao(setor, formato) {
  return formato?.editor || setor?.tipoTexto;
}
