// Utilitários compartilhados.

const DIACRITICS_LOW = 0x0300;
const DIACRITICS_HIGH = 0x036f;

export function stripDiacritics(str) {
  let out = '';
  for (const ch of str) {
    const code = ch.codePointAt(0);
    if (code < DIACRITICS_LOW || code > DIACRITICS_HIGH) out += ch;
  }
  return out;
}

export function normalizeSearch(str) {
  return stripDiacritics((str || '').normalize('NFD'))
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

export function slugify(str) {
  const base = stripDiacritics((str || 'placa').normalize('NFD'))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60);
  return base || 'placa';
}

// Palavras que permanecem em minúsculo no meio do título (PT e ES).
const MINOR_WORDS = new Set([
  // Português
  'a', 'à', 'às', 'ao', 'aos', 'as', 'com', 'da', 'das', 'de', 'do', 'dos',
  'e', 'em', 'na', 'nas', 'no', 'nos', 'o', 'os', 'ou', 'para', 'pela',
  'pelas', 'pelo', 'pelos', 'por', 'sem', 'sob', 'sobre', 'um', 'uma',
  // Espanhol
  'al', 'con', 'del', 'el', 'en', 'la', 'las', 'los', 'sin', 'un', 'una', 'y',
]);

function capitalizeWord(word) {
  // Preserva siglas já em caixa alta (A&B, IPA) e trata hífens: "mal-passado".
  if (word.length > 1 && word === word.toUpperCase() && /[A-ZÀ-Ú]/.test(word)) {
    return word;
  }
  return word
    .split('-')
    .map((part) =>
      part ? part.charAt(0).toLocaleUpperCase('pt-BR') + part.slice(1).toLocaleLowerCase('pt-BR') : part
    )
    .join('-');
}

/**
 * Converte um nome para Title Case editorial: primeira letra de cada palavra em
 * caixa alta, mantendo preposições e artigos curtos em minúsculo — exceto na
 * primeira palavra ou logo após pontuação forte.
 *
 * "polvo grelhado ao molho de ervas" -> "Polvo Grelhado ao Molho de Ervas"
 */
export function toTitleCase(text) {
  if (!text) return '';

  // Entrada inteiramente em caixa alta (ex: CAPS LOCK ligado) é normalizada
  // antes, senão a preservação de siglas devolveria um resultado misturado.
  const source = text === text.toLocaleUpperCase('pt-BR') && /\p{L}/u.test(text)
    ? text.toLocaleLowerCase('pt-BR')
    : text;

  let startOfSentence = true;

  return source.replace(/[^\s]+/g, (token) => {
    // Isola pontuação de abertura/fechamento para avaliar só a palavra.
    const match = token.match(/^([^\p{L}\p{N}]*)(.*?)([^\p{L}\p{N}]*)$/u);
    const [, prefix, word, suffix] = match;

    if (!word) return token;

    const isMinor = MINOR_WORDS.has(word.toLocaleLowerCase('pt-BR'));
    const result = !startOfSentence && isMinor
      ? prefix + word.toLocaleLowerCase('pt-BR') + suffix
      : prefix + capitalizeWord(word) + suffix;

    // Depois de . ! ? : ; ou quebra de linha, a próxima palavra reinicia frase.
    startOfSentence = /[.!?:;]$/.test(suffix);

    return result;
  });
}

export function debounce(fn, delay) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}
