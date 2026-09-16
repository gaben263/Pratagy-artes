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
    // Título "DO DIA" até y 371; "INFO-313-REV.00" em x 37–56; balão azul-claro
    // a partir de x 942; na largura toda (169–911) o fundo é limpo até y 1201
    // (balão dourado à direita). Largura espelhada no centro (540) com 30 px;
    // altura com 40 px de respiro do título e do balão — é o limite físico.
    areaCards: { x0: 169, y0: 411, x1: 911, y1: 1161 },
    safeAreaMm: safeAreaMmDePx({ ...BASE, x0: 169, y0: 411, x1: 911, y1: 1161 }),
  },
];

export const EDITORES_COM_CARDS = new Set(['talento', 'aniversariantes']);
// Tudo que o compositor do RH renderiza (os cards e o texto do Atenção).
export const EDITORES_RH = new Set(['atencao', 'talento', 'aniversariantes']);

/** O modo de edição/render de um formato (RH) ou do setor (demais). */
export function modoDeEdicao(setor, formato) {
  return formato?.editor || setor?.tipoTexto;
}
