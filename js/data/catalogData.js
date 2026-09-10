// Banco de dados do catálogo de artes prontas.
//
// Cada item aponta para um PNG estático já aprovado pelo Marketing — não há
// renderização em Canvas aqui, o usuário só busca, confere e baixa.
//
// ORIGEM DOS DADOS
// Os arquivos vieram das pastas de trabalho `Institucional/` e `Hospitalidade/`.
// Como aqueles nomes têm acentos, espaços duplos e um caractere de acento agudo
// solto ("d´água") — que quebram URL em host estático —, as cópias publicadas em
// assets/catalogo/ usam slug ASCII. `arquivoOriginal` guarda o nome de origem
// para rastreabilidade, e o download entrega um nome amigável derivado do título.
//
// TÍTULOS
// Os títulos foram corrigidos em relação ao nome do arquivo: acentos que faltavam
// ("Nauticas" -> "Náuticas", "Retornaveis" -> "Retornáveis", "Picole" -> "Picolé",
// "Agencias" -> "Agências", "Habitue" -> "Habitué", "Maquinas" -> "Máquinas") e um
// erro de digitação real ("descaga" -> "descarga"). O arquivo em disco não foi
// renomeado além do slug: a correção vive aqui, na camada de exibição.
//
// MATERIAL DE IMPRESSÃO
// `printMaterial` e `bestFormat` são PADRÕES SUGERIDOS, não especificação
// confirmada pelo Marketing. Por isso todo item carrega `materialConfirmado: false`
// e a interface mostra a informação como sugestão a validar. Ao confirmar um
// item com o time, basta trocar o material e marcar `materialConfirmado: true`.

import { normalizeSearch } from '../utils.js';

/** Todas as artes do catálogo foram exportadas em 300 DPI. */
export const CATALOGO_DPI = 300;

export const MATERIAL_PADRAO = 'PVC Adesivado';
export const FORMATO_PADRAO = 'PDF';

export const CATEGORIAS = {
  institucional: { id: 'institucional', nome: 'Institucional', cor: '#E95029' },
  hospitalidade: { id: 'hospitalidade', nome: 'Hospitalidade', cor: '#8FB82A' },
};

// Lista bruta: só os campos que variam de item para item. Os padrões de
// material/formato são aplicados logo abaixo, para não repetir 35 vezes.
const ITENS = [
  // ---------------------------------------------------------------- Institucional
  {
    id: 'acesso-restrito',
    categoria: 'institucional',
    titulo: 'Acesso Restrito',
    size: 'A4 Horizontal',
    largura: 3508,
    altura: 2480,
    arquivoOriginal: 'Pratagy - Placa Acesso Restrito - A4 Horizontal.png',
    tags: ['acesso restrito', 'proibido', 'entrada', 'somente autorizados', 'área restrita', 'segurança', 'porta'],
  },
  {
    id: 'adm-manutencao',
    categoria: 'institucional',
    titulo: 'ADM Manutenção',
    size: 'A4 Horizontal',
    largura: 3508,
    altura: 2480,
    arquivoOriginal: 'Pratagy - ADM Manutenção - A4 Horizontal.png',
    tags: ['adm', 'administração', 'manutenção', 'setor', 'identificação', 'porta', 'sala'],
  },
  {
    id: 'atividades-nauticas',
    categoria: 'institucional',
    titulo: 'Atividades Náuticas',
    size: '59×84 cm',
    largura: 1269,
    altura: 1845,
    arquivoOriginal: 'Pratagy - Placa Atividades Nauticas -  59x84cm.png',
    tags: ['atividades náuticas', 'náutica', 'esportes', 'lazer', 'praia', 'mar', 'caiaque', 'stand up'],
  },
  {
    id: 'cardapio-tapioca',
    categoria: 'institucional',
    titulo: 'Cardápio de Tapioca',
    size: 'A4 Vertical',
    largura: 2480,
    altura: 3508,
    arquivoOriginal: 'Cardápio Tapioca - A4.png',
    tags: ['cardápio', 'menu', 'tapioca', 'alimentos e bebidas', 'a&b', 'buffet', 'café da manhã'],
  },
  {
    id: 'copos-retornaveis',
    categoria: 'institucional',
    titulo: 'Copos Retornáveis',
    size: 'A4 Vertical',
    largura: 2480,
    altura: 3508,
    arquivoOriginal: 'Pratagy - Tela Copos Retornaveis - A4.png',
    tags: ['copos retornáveis', 'copo', 'sustentabilidade', 'reciclagem', 'meio ambiente', 'bar', 'a&b'],
  },
  {
    id: 'disjuntores-risco-de-descarga-eletrica',
    categoria: 'institucional',
    titulo: 'Disjuntores — Risco de Descarga Elétrica',
    size: 'A4 Horizontal',
    largura: 3508,
    altura: 2480,
    arquivoOriginal: 'Pratagy - Placa Disjuntores risco de descaga elétrica.png',
    tags: ['disjuntor', 'descarga elétrica', 'choque', 'elétrica', 'energia', 'quadro elétrico', 'risco', 'perigo'],
  },
  {
    id: 'estamos-em-manutencao',
    categoria: 'institucional',
    titulo: 'Estamos em Manutenção',
    size: '29,7×21 cm',
    largura: 3508,
    altura: 2480,
    arquivoOriginal: 'Pratagy - Placa Estamos em Manutenção - 29,7x21cm.png',
    tags: ['manutenção', 'interditado', 'fora de serviço', 'reparo', 'aviso', 'temporário'],
  },
  {
    id: 'expressamente-proibido-fumar',
    categoria: 'institucional',
    titulo: 'Expressamente Proibido Fumar',
    size: 'A4 Horizontal',
    largura: 3508,
    altura: 2480,
    arquivoOriginal: 'Pratagy - Expressamente Proibido Fumar - A4 Horizontal.png',
    tags: ['proibido fumar', 'fumo', 'cigarro', 'tabaco', 'lei antifumo', 'não fume'],
  },
  {
    id: 'giro-rapido-manutencao',
    categoria: 'institucional',
    titulo: 'Giro Rápido — Manutenção',
    size: 'A4 Horizontal',
    largura: 3508,
    altura: 2480,
    arquivoOriginal: 'Pratagy - Giro Rápido Manutenção.png',
    tags: ['giro rápido', 'manutenção', 'processo', 'aviso', 'operação'],
  },
  {
    id: 'luvas-descartaveis',
    categoria: 'institucional',
    titulo: 'Luvas Descartáveis',
    size: 'A4 Vertical',
    largura: 2563,
    altura: 3586,
    arquivoOriginal: 'Placa Luvas Descartáveis - A4.png',
    tags: ['luvas descartáveis', 'luva', 'epi', 'higiene', 'proteção', 'segurança', 'manipulação', 'alimentos'],
  },
  {
    id: 'manter-o-portao-fechado',
    categoria: 'institucional',
    titulo: 'Por Favor, Manter o Portão Fechado',
    size: 'A3 Horizontal',
    largura: 4961,
    altura: 3508,
    arquivoOriginal: 'Pratagy - Por Favor Manter o Portão Fechado.png',
    tags: ['portão fechado', 'portão', 'porta', 'acesso', 'segurança', 'aviso'],
  },
  {
    id: 'nao-alimente-os-animais',
    categoria: 'institucional',
    titulo: 'Não Alimente os Animais',
    size: 'A4 Vertical',
    largura: 2480,
    altura: 3508,
    arquivoOriginal: 'Pratagy - Placa Não Alimente os Animais - A4.png',
    tags: ['não alimente', 'animais', 'fauna', 'natureza', 'meio ambiente', 'preservação', 'macaco', 'pássaros'],
  },
  {
    id: 'proibido-caixas-de-som',
    categoria: 'institucional',
    titulo: 'Proibido Caixas de Som',
    size: 'A4 Horizontal',
    largura: 3508,
    altura: 2480,
    arquivoOriginal: 'Placa Proibido Caixas de Som - Horizontal - A4.png',
    tags: ['caixa de som', 'som', 'ruído', 'silêncio', 'proibido', 'música', 'regras', 'piscina'],
  },
  {
    id: 'proibido-entrada-casa-de-maquinas-ete',
    categoria: 'institucional',
    titulo: 'Proibido Entrada — Casa de Máquinas ETE',
    size: 'A4 Vertical',
    largura: 2480,
    altura: 3508,
    arquivoOriginal: 'Pratagy - Placa Proibido Entrada Casa de Maquinas ETE - A4.png',
    tags: ['casa de máquinas', 'ete', 'esgoto', 'tratamento', 'proibido', 'entrada', 'área restrita', 'segurança'],
  },
  {
    id: 'proibido-entrada-casa-de-maquinas-piscina',
    categoria: 'institucional',
    titulo: 'Proibido Entrada — Casa de Máquinas da Piscina',
    size: 'A4 Vertical',
    largura: 2480,
    altura: 3508,
    arquivoOriginal: 'Pratagy - Placa Proibido Entrada Casa de Maquinas Piscina - A4.png',
    tags: ['casa de máquinas', 'piscina', 'proibido', 'entrada', 'área restrita', 'segurança', 'bomba'],
  },
  {
    id: 'proibido-entrada-poco-01',
    categoria: 'institucional',
    titulo: 'Proibido Entrada — Poço 01',
    size: 'A4 Vertical',
    largura: 2480,
    altura: 3508,
    arquivoOriginal: 'Pratagy - Placa Proibido Entrada Poço 01 - A4.png',
    tags: ['poço', 'poço 01', 'água', 'proibido', 'entrada', 'área restrita', 'segurança'],
  },
  {
    id: 'proibido-entrada-poco-02',
    categoria: 'institucional',
    titulo: 'Proibido Entrada — Poço 02',
    size: 'A4 Vertical',
    largura: 2480,
    altura: 3508,
    arquivoOriginal: 'Pratagy - Placa Proibido Entrada Poço 02 - A4.png',
    tags: ['poço', 'poço 02', 'água', 'proibido', 'entrada', 'área restrita', 'segurança'],
  },
  {
    id: 'quadro-bomba-ete',
    categoria: 'institucional',
    titulo: 'Quadro Bomba ETE',
    size: 'A4 Horizontal',
    largura: 3508,
    altura: 2480,
    arquivoOriginal: 'Pratagy - Placa Quadro Bomba Ete.png',
    tags: ['quadro', 'bomba', 'ete', 'esgoto', 'elétrica', 'identificação', 'painel'],
  },
  {
    id: 'regulamento-academia',
    categoria: 'institucional',
    titulo: 'Regulamento da Academia',
    size: '60×120 cm',
    largura: 7087,
    altura: 14173,
    arquivoOriginal: 'Pratagy - Placa Regulamento Academia_60x120cm.png',
    tags: ['academia', 'regulamento', 'regras', 'normas', 'fitness', 'musculação', 'ginástica'],
  },
  {
    id: 'reservatorio-caixa-dagua-ete',
    categoria: 'institucional',
    titulo: "Reservatório — Caixa d'Água ETE",
    size: 'A4 Horizontal',
    largura: 3508,
    altura: 2480,
    arquivoOriginal: 'Pratagy - Placa Reservatório caixa  d´água ete.png',
    tags: ['reservatório', "caixa d'água", 'água', 'ete', 'identificação', 'hidráulica'],
  },
  {
    id: 'reservatorio-de-cloro',
    categoria: 'institucional',
    titulo: 'Reservatório de Cloro',
    size: 'A4 Horizontal',
    largura: 3508,
    altura: 2480,
    arquivoOriginal: 'Pratagy - Placa Reservatório de Cloro.png',
    tags: ['reservatório', 'cloro', 'químico', 'piscina', 'identificação', 'segurança', 'produto químico'],
  },
  {
    id: 'reservatorio-de-lodo',
    categoria: 'institucional',
    titulo: 'Reservatório de Lodo',
    size: 'A4 Horizontal',
    largura: 3508,
    altura: 2480,
    arquivoOriginal: 'Pratagy - Placa Reservatório de Lodo.png',
    tags: ['reservatório', 'lodo', 'ete', 'esgoto', 'identificação', 'tratamento'],
  },
  {
    id: 'sorvete-e-picole-teatro',
    categoria: 'institucional',
    titulo: 'Sorvete e Picolé — Teatro',
    size: 'A4 Vertical',
    largura: 2480,
    altura: 3508,
    arquivoOriginal: 'Pratagy - Placa Sorvete e Picole - Teatro - A4.png',
    tags: ['sorvete', 'picolé', 'teatro', 'a&b', 'lazer', 'sobremesa', 'gelado'],
  },
  {
    id: 'tinta-fresca',
    categoria: 'institucional',
    titulo: 'Tinta Fresca',
    size: '29,7×21 cm',
    largura: 3508,
    altura: 2480,
    arquivoOriginal: 'Pratagy - Placa Tinta Fresca - 29,7x21cm.png',
    tags: ['tinta fresca', 'tinta', 'pintura', 'manutenção', 'cuidado', 'aviso', 'não encoste'],
  },

  // --------------------------------------------------------------- Hospitalidade
  {
    id: 'alimentos-sem-gluten-e-zero-lactose',
    categoria: 'institucional',
    titulo: 'Alimentos Sem Glúten e Zero Lactose',
    size: '21×29 cm',
    largura: 2480,
    altura: 3508,
    arquivoOriginal: 'Pratagy - Alimentos Sem Glúten e 0 Lactose - 21x29cm.png',
    tags: ['sem glúten', 'zero lactose', 'restrição alimentar', 'intolerância', 'celíaco', 'alergia', 'a&b', 'buffet'],
  },
  {
    id: 'carta-checkout',
    categoria: 'hospitalidade',
    titulo: 'Carta de Check-out',
    size: '15×21 cm',
    largura: 1772,
    altura: 2480,
    arquivoOriginal: 'Pratagy - Carta Checkout - 15x21cm.png',
    tags: ['check-out', 'checkout', 'carta', 'hóspede', 'saída', 'recepção', 'apartamento'],
  },
  {
    id: 'carta-de-boas-vindas-a6',
    categoria: 'hospitalidade',
    titulo: 'Carta de Boas-Vindas (A6)',
    size: '10,5×14,85 cm',
    largura: 1240,
    altura: 1754,
    arquivoOriginal: 'Pratagy - Carta de Boas Vindas - 10,5x14,85cm.png',
    tags: ['boas-vindas', 'welcome', 'carta', 'hóspede', 'apartamento', 'recepção', 'chegada'],
  },
  {
    id: 'cartao-hospede-agencias',
    categoria: 'hospitalidade',
    titulo: 'Cartão Hóspede — Agências',
    size: '12×7 cm',
    largura: 1471,
    altura: 829,
    arquivoOriginal: 'Pratagy - Carta Hóspedes Agencias - 12x7cm.png',
    tags: ['cartão hóspede', 'agência', 'parceiro', 'operadora', 'boas-vindas', 'amenidade'],
  },
  {
    id: 'cartao-hospede-aniversariante',
    categoria: 'hospitalidade',
    titulo: 'Cartão Hóspede — Aniversariante',
    size: '12×7 cm',
    largura: 1471,
    altura: 829,
    arquivoOriginal: 'Pratagy - Carta Hóspedes Aniversariante - 12x7cm.png',
    tags: ['cartão hóspede', 'aniversário', 'aniversariante', 'parabéns', 'comemoração', 'boas-vindas', 'amenidade'],
  },
  {
    id: 'cartao-hospede-habitue',
    categoria: 'hospitalidade',
    titulo: 'Cartão Hóspede — Habitué',
    size: '12×7 cm',
    largura: 1471,
    altura: 829,
    arquivoOriginal: 'Pratagy - Carta Hóspedes Habitue - 12x7cm.png',
    tags: ['cartão hóspede', 'habitué', 'fidelidade', 'recorrente', 'cliente fiel', 'boas-vindas', 'amenidade'],
  },
  {
    id: 'cartao-hospede-lua-de-mel',
    categoria: 'hospitalidade',
    titulo: 'Cartão Hóspede — Lua de Mel',
    size: '12×7 cm',
    largura: 1471,
    altura: 829,
    arquivoOriginal: 'Pratagy - Carta Hóspedes Lua de Mel - 12x7cm.png',
    tags: ['cartão hóspede', 'lua de mel', 'casal', 'casamento', 'romance', 'boas-vindas', 'amenidade'],
  },
  {
    id: 'cartao-hospede-vip',
    categoria: 'hospitalidade',
    titulo: 'Cartão Hóspede — VIP',
    size: '12×7 cm',
    largura: 1471,
    altura: 829,
    arquivoOriginal: 'Pratagy - Carta Hóspedes VIP - 12x7cm.png',
    tags: ['cartão hóspede', 'vip', 'especial', 'cortesia', 'boas-vindas', 'amenidade'],
  },
  {
    id: 'prato-vegano',
    categoria: 'institucional',
    titulo: 'Prato Vegano',
    size: '21×29 cm',
    largura: 2480,
    altura: 3508,
    arquivoOriginal: 'Pratagy - Prato Vegano - 21x29cm.png',
    tags: ['vegano', 'vegetariano', 'plant based', 'restrição alimentar', 'a&b', 'buffet', 'sem carne'],
  },
  {
    id: 'proibido-fumar-florestal',
    categoria: 'institucional',
    titulo: 'Proibido Fumar — Florestal',
    size: '21×29 cm',
    largura: 2532,
    altura: 3581,
    arquivoOriginal: 'Placa - Proibido Fumar Florestal - 21x29cm.png',
    tags: ['proibido fumar', 'florestal', 'cigarro', 'fumo', 'apartamento', 'quarto', 'ala'],
  },
  {
    id: 'qr-code-web-check-in',
    categoria: 'hospitalidade',
    titulo: 'QR Code — Web Check-in',
    size: '15×21 cm',
    largura: 1893,
    altura: 2605,
    arquivoOriginal: 'Pratagy - Placa QR Code  webcheckin -15x21cm.png',
    tags: ['qr code', 'web check-in', 'webcheckin', 'checkin', 'recepção', 'digital', 'autoatendimento'],
  },
];

/**
 * Catálogo pronto para uso: aplica os caminhos dos arquivos e os padrões de
 * impressão, e pré-calcula o índice de busca (título + tags sem acento).
 */
export const CATALOGO = ITENS.map((item) => ({
  ...item,
  arquivo: `assets/catalogo/${item.categoria}/${item.id}.png`,
  thumb: `assets/catalogo/thumbs/${item.categoria}/${item.id}.jpg`,
  printMaterial: item.printMaterial || MATERIAL_PADRAO,
  bestFormat: item.bestFormat || FORMATO_PADRAO,
  // Nenhum material foi confirmado com o Marketing ainda — a interface mostra o
  // valor como sugestão enquanto esta flag for falsa.
  materialConfirmado: item.materialConfirmado === true,
  indiceBusca: montarIndice(item),
})).sort((a, b) => a.titulo.localeCompare(b.titulo, 'pt-BR'));

/**
 * Índice de busca: a versão normalizada (sem acento, minúscula) mais uma cópia
 * sem pontuação nenhuma.
 *
 * A segunda cópia existe porque ninguém digita apóstrofo nem hífen na busca:
 * quem procura "caixa dagua" precisa achar "caixa d'água", e quem digita
 * "checkout" precisa achar "check-out". Como as duas versões ficam no mesmo
 * texto, os dois jeitos de escrever funcionam.
 */
function montarIndice(item) {
  const base = normalizeSearch([item.titulo, item.size, ...item.tags].join(' '));
  return `${base} ${base.replace(/[^a-z0-9 ]+/g, '')}`;
}

/** Tamanho físico em milímetros, a partir dos pixels reais em 300 DPI. */
export function tamanhoMm(item) {
  const fator = 25.4 / CATALOGO_DPI;
  return {
    mmLargura: Number((item.largura * fator).toFixed(1)),
    mmAltura: Number((item.altura * fator).toFixed(1)),
  };
}

export function getItemCatalogo(id) {
  return CATALOGO.find((item) => item.id === id) || null;
}

/**
 * Filtra o catálogo por termo (título + tags, ignorando acento e caixa) e por
 * categoria. Termos separados por espaço funcionam como AND: "proibido poco"
 * encontra as placas de poço, mas não as demais placas de proibição.
 */
export function buscarCatalogo(termo, categoria = 'todos') {
  const porCategoria =
    categoria === 'todos' ? CATALOGO : CATALOGO.filter((item) => item.categoria === categoria);

  const termos = normalizeSearch(termo).split(' ').filter(Boolean);
  if (!termos.length) return porCategoria;

  return porCategoria.filter((item) => termos.every((t) => item.indiceBusca.includes(t)));
}
