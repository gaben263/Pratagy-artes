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
//   'encontro'        → o mesmo bloco de texto do 'atencao' + um campo de data
//                       ao lado do ícone de calendário já impresso na arte.
//   'talento'         → 1 colaborador (foto no polaroid + faixas giradas).
//   'aniversariantes' → N colaboradores em grade (foto circular + faixas).

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
];

export const EDITORES_COM_CARDS = new Set(['talento', 'aniversariantes']);
// Tudo que o compositor do RH renderiza (os cards e os textos de comunicado).
export const EDITORES_RH = new Set(['atencao', 'encontro', 'talento', 'aniversariantes']);

/** O modo de edição/render de um formato (RH) ou do setor (demais). */
export function modoDeEdicao(setor, formato) {
  return formato?.editor || setor?.tipoTexto;
}
