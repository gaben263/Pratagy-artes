// Tradutor PT → ES dos nomes de pratos, montado a partir da própria biblioteca.
//
// POR QUE NÃO UM TRADUTOR AUTOMÁTICO
// Os tradutores gratuitos testados em nov/2026 devolveram vazio para nomes de
// pratos, e um tradutor genérico não conhece o padrão da casa (espanhol
// rio-platense, "con salsa de", "a la parrilla", "Tartaleta" para Tortilete).
// A biblioteca tem mais de mil pares revisados; quase todo prato novo é uma
// combinação de pedaços que já estão nela. O tradutor junta esses pedaços.
//
// COMO FUNCIONA
// 1. Trechos fixos (ligações e preparos): "ao molho de" → "con salsa de".
// 2. Pratos inteiros da biblioteca, do trecho mais longo para o mais curto:
//    "Filé de peixe" → "Filete de pescado".
// 3. Palavra solta aprendida por coocorrência nos pares da biblioteca
//    (coeficiente de Dice): "maracujá" aparece sempre junto de "maracuyá".
// Palavra que nenhuma das três etapas conhece NÃO é inventada: fica como está
// e volta em `lacunas`, para a pessoa completar o espanhol à mão.

const semAcento = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
const chave = (s) =>
  semAcento(s).toLowerCase().replace(/[(),.;:]/g, ' ').replace(/\s+/g, ' ').trim();

// Ligações e preparos no padrão do documento. Ordem não importa: a busca tenta
// sempre o trecho mais longo primeiro.
const FIXOS = {
  'ao molho de': 'con salsa de',
  'com molho de': 'con salsa de',
  'com calda de': 'con salsa de',
  'ao molho': 'en salsa',
  'no molho': 'en salsa',
  'molho de': 'salsa de',
  molho: 'salsa',
  'calda de': 'salsa de',
  de: 'de',
  do: 'del',
  da: 'de la',
  dos: 'de los',
  das: 'de las',
  com: 'con',
  e: 'y',
  sem: 'sin',
  ao: 'al',
  a: 'a la',
  na: 'en la',
  no: 'en el',
  em: 'en',
  'na chapa': 'a la plancha',
  'na brasa': 'a la brasa',
  'ao vapor': 'al vapor',
  'a milanesa': 'a la milanesa',
  'ao alho e oleo': 'al ajo y aceite',
  'alho e oleo': 'al ajo y aceite',
  'ao forno': 'al horno',
  'de forno': 'horneado',
  grelhado: 'a la parrilla',
  grelhada: 'a la parrilla',
  grelhados: 'a la parrilla',
  grelhadas: 'a la parrilla',
  assado: 'asado',
  assada: 'asada',
  assados: 'asados',
  assadas: 'asadas',
  frito: 'frito',
  frita: 'frita',
  fritos: 'fritos',
  fritas: 'fritas',
  recheado: 'relleno',
  recheada: 'rellena',
  recheados: 'rellenos',
  recheadas: 'rellenas',
  empanado: 'rebozado',
  empanada: 'rebozada',
  empanados: 'rebozados',
  gratinado: 'gratinado',
  gratinada: 'gratinada',
  cozido: 'cocido',
  cozida: 'cocida',
  cozidos: 'cocidos',
  desfiado: 'deshilachado',
  desfiada: 'deshilachada',
  acebolado: 'con cebolla',
  acebolada: 'con cebolla',
  crocante: 'crujiente',
  crocantes: 'crujientes',
  caseiro: 'casero',
  caseira: 'casera',
  caseiros: 'caseros',
  caseiras: 'caseras',
  temperado: 'sazonado',
  temperada: 'sazonada',
  refogado: 'salteado',
  refogada: 'salteada',
  salteado: 'salteado',
  salteada: 'salteada',
  defumado: 'ahumado',
  defumada: 'ahumada',
  suino: 'de cerdo',
  suina: 'de cerdo',
  bovino: 'de res',
  bovina: 'de res',
  inteiro: 'entero',
  inteira: 'entera',
  variados: 'variados',
  variadas: 'variadas',
  misto: 'mixto',
  mista: 'mixta',
  especial: 'especial',
  tradicional: 'tradicional',
};

// Palavras de ligação que nunca são aprendidas como "palavra solta": senão
// "de" viraria "de" por coocorrência e esconderia a ordem real dos pedaços.
const LIGACOES = new Set(['de', 'do', 'da', 'dos', 'das', 'com', 'e', 'ao', 'a', 'na', 'no', 'em', 'sem', 'o', 'os', 'as']);

const MAIOR_TRECHO = 6;

// Preparos que concordam com o prato ("Papas fritas", "Verduras rebozadas").
// Os trechos fixos de várias palavras ("a la parrilla") não flexionam.
const ADJETIVOS = new Set(
  Object.entries(FIXOS)
    .filter(([pt, es]) => !pt.includes(' ') && !es.includes(' ') && /(o|a|os|as|e|es)$/.test(es) && !LIGACOES.has(pt))
    .map(([pt]) => pt)
);

/** Gênero e número pelo fim da última palavra do pedaço anterior. */
function flexaoDo(pedaco) {
  const ultima = semAcento(pedaco.split(' ').pop() || '').toLowerCase();
  if (/as$/.test(ultima)) return { genero: 'a', plural: true };
  if (/os$/.test(ultima)) return { genero: 'o', plural: true };
  if (/[^s]s$|es$/.test(ultima)) return { genero: null, plural: true };
  if (/a$/.test(ultima)) return { genero: 'a', plural: false };
  if (/o$/.test(ultima)) return { genero: 'o', plural: false };
  return { genero: null, plural: false };
}

function concordar(adjetivo, { genero, plural }) {
  const m = adjetivo.match(/^(.*?)(o|a|e)(s?)$/);
  if (!m) return adjetivo;
  const [, radical, vogal] = m;
  const final = vogal === 'e' ? 'e' : genero || vogal;
  return radical + final + (plural ? 's' : '');
}

/** Plural em espanhol: vogal ganha "s"; consoante, "es". */
const pluralEs = (palavra) => (/[aeiouáéíóú]$/i.test(palavra) ? `${palavra}s` : `${palavra}es`);

/**
 * Monta o tradutor a partir das entradas da biblioteca ({pt, es}).
 * É barato (alguns milissegundos para mil entradas), então pode ser refeito
 * quando a biblioteca muda.
 */
export function criarTradutor(entradas) {
  const pratos = new Map();
  for (const { pt, es } of entradas) {
    if (pt && es) pratos.set(chave(pt), es);
  }

  // Coocorrência palavra PT × palavra ES nos pares da biblioteca.
  const contaPt = new Map();
  const contaEs = new Map();
  const contaPar = new Map();
  const formaEs = new Map();
  for (const { pt, es } of entradas) {
    if (!pt || !es) continue;
    const palavrasPt = new Set(chave(pt).split(' ').filter((p) => !LIGACOES.has(p)));
    const palavrasEs = new Map();
    for (const bruta of es.replace(/[(),.;:]/g, ' ').split(/\s+/)) {
      if (!bruta) continue;
      const k = chave(bruta);
      palavrasEs.set(k, bruta.toLowerCase());
    }
    for (const p of palavrasPt) contaPt.set(p, (contaPt.get(p) || 0) + 1);
    for (const [k, forma] of palavrasEs) {
      contaEs.set(k, (contaEs.get(k) || 0) + 1);
      if (!formaEs.has(k)) formaEs.set(k, forma);
    }
    for (const p of palavrasPt) {
      for (const k of palavrasEs.keys()) {
        const par = `${p}|${k}`;
        contaPar.set(par, (contaPar.get(par) || 0) + 1);
      }
    }
  }
  const palavras = new Map();
  for (const [par, n] of contaPar) {
    const [p, k] = par.split('|');
    // Uma ocorrência só não basta: "pizzas" aparece apenas em "Estação de
    // pizzas…" e seria aprendida como "estación". A exceção é a palavra igual
    // nas duas línguas (cheddar, catupiry, quinoa): essa é segura.
    if (n < 2 && p !== k) continue;
    const dice = (2 * n) / (contaPt.get(p) + contaEs.get(k));
    if (dice < 0.5) continue;
    const atual = palavras.get(p);
    // Empate: fica a forma mais frequente, que é a mais segura.
    if (!atual || dice > atual.dice || (dice === atual.dice && n > atual.n)) {
      palavras.set(p, { es: formaEs.get(k), dice, n });
    }
  }

  return function traduzir(pt) {
    const original = (pt || '').trim().split(/\s+/).filter(Boolean);
    const tokens = original.map(chave);
    const pedacos = [];
    const lacunas = [];
    // Último pedaço que é o prato em si (não ligação nem preparo): é com ele
    // que o preparo concorda. Em "Costela suína assada", "de cerdo" fica no
    // meio e "asada" concorda com "Costilla".
    let nucleo = null;

    for (let i = 0; i < tokens.length; ) {
      let achou = false;
      for (let n = Math.min(MAIOR_TRECHO, tokens.length - i); n >= 1 && !achou; n--) {
        const trecho = tokens.slice(i, i + n).join(' ');
        let es = FIXOS[trecho] ?? pratos.get(trecho);
        if (es != null) {
          // Preparo logo depois do prato concorda com ele em espanhol.
          if (n === 1 && ADJETIVOS.has(trecho) && nucleo && !LIGACOES.has(tokens[i - 1])) {
            es = concordar(es, flexaoDo(nucleo));
          }
          if (!(trecho in FIXOS)) nucleo = es;
          else if (LIGACOES.has(trecho)) nucleo = null;
          pedacos.push(es);
          i += n;
          achou = true;
        }
      }
      if (achou) continue;
      const token = tokens[i];
      const aprendida = palavras.get(token);
      // Plural de uma palavra conhecida no singular: "pizzas" → "pizza" + s.
      const singular = token.length > 3 && token.endsWith('s') ? token.slice(0, -1) : null;
      const doSingular = singular && (pratos.get(singular) ?? palavras.get(singular)?.es);
      if (/^\d+$/.test(token)) {
        pedacos.push(token); // números passam iguais ("Molho 3 queijos")
      } else if (aprendida) {
        pedacos.push(aprendida.es);
        nucleo = aprendida.es;
      } else if (doSingular && !doSingular.includes(' ')) {
        // "Batata" já vira "Papas" (plural): não pluraliza de novo.
        const plural = /s$/i.test(doSingular) ? doSingular.toLowerCase() : pluralEs(doSingular.toLowerCase());
        pedacos.push(plural);
        nucleo = plural;
      } else {
        // Sem tradução conhecida: a palavra segue em português e é sinalizada.
        pedacos.push(original[i].toLowerCase());
        lacunas.push(original[i]);
      }
      i++;
    }

    // Cada pedaço vem com a caixa do seu par na biblioteca ("Pollo"); no meio
    // do nome vira minúscula, exceto siglas e nomes próprios em caixa alta
    // inteira não existem nos pratos. A primeira letra do resultado sobe.
    let es = pedacos
      .map((p, idx) => (idx === 0 ? p : p.charAt(0).toLowerCase() + p.slice(1)))
      .join(' ')
      .replace(/\bde el\b/g, 'del')
      .replace(/\ba el\b/g, 'al')
      .replace(/\bcon con\b/g, 'con')
      .replace(/\s+/g, ' ')
      .trim();
    es = es.charAt(0).toUpperCase() + es.slice(1);
    return { es, lacunas };
  };
}
