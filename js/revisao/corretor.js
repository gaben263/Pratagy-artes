// Corretor ortográfico em duas camadas, gratuito e sem servidor próprio.
//
// 1. VOCABULÁRIO DA CASA (no navegador, instantâneo, nada sai da máquina)
//    Palavras que sabemos estar certas: as da biblioteca de pratos e uma lista
//    de termos do resort. Pega o que nenhum corretor comum pega — "Tortilede"
//    → Tortilete, "cheff" → chef, "feijao" → feijão — e impede que macaxeira,
//    mungunzá ou Paripueira sejam marcadas como erro.
// 2. LANGUAGETOOL (api.languagetool.org, gratuito, sem chave)
//    Português geral: acentos e palavras comuns que a casa não conhece. Limite
//    do serviço gratuito: 20 consultas por minuto por endereço, de sobra aqui.
//    O texto enviado sai da máquina: quem chama decide o que mandar (o RH não
//    manda nomes de colaboradores).
//
// Se o LanguageTool estiver fora do ar, a camada da casa continua valendo e o
// resultado volta com `indisponivel: true` — quem chama avisa, mas não trava.

const LANGUAGETOOL_URL = 'https://api.languagetool.org/v2/check';
const TEMPO_LIMITE_MS = 6000;

// Termos do resort e de uso comum nas artes que não estão na biblioteca de
// pratos. Os setores podem somar os seus em `vocabularioExtra`.
const TERMOS_DA_CASA = [
  'pratagy', 'pratagynho', 'acqua', 'park', 'paripueira', 'maceió', 'alagoas', 'resort', 'buffet',
  'canavial', 'barcaça', 'chef', 'show', 'cooking', 'drink', 'drinks', 'kids', 'all', 'inclusive',
];

const semAcento = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
const minuscula = (s) => s.toLocaleLowerCase('pt-BR');

/** Palavras de uma lista de frases ("Filé de peixe" → filé, peixe). */
export function palavrasDe(frases) {
  const saida = new Set();
  for (const frase of frases) {
    for (const p of (frase || '').match(/[\p{L}]+(?:-[\p{L}]+)*/gu) || []) {
      for (const parte of [p, ...p.split('-')]) if (parte.length > 1) saida.add(minuscula(parte));
    }
  }
  return saida;
}

/** Distância de edição com transposição (Damerau-Levenshtein restrita). */
function distancia(a, b, teto) {
  if (Math.abs(a.length - b.length) > teto) return teto + 1;
  const linhas = [];
  for (let i = 0; i <= a.length; i++) linhas.push([i]);
  for (let j = 1; j <= b.length; j++) linhas[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    let menor = Infinity;
    for (let j = 1; j <= b.length; j++) {
      const custo = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(linhas[i - 1][j] + 1, linhas[i][j - 1] + 1, linhas[i - 1][j - 1] + custo);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, linhas[i - 2][j - 2] + 1);
      linhas[i][j] = v;
      menor = Math.min(menor, v);
    }
    if (menor > teto) return teto + 1;
  }
  return linhas[a.length][b.length];
}

/** Mantém a caixa da palavra original: "Cheff" → "Chef", "CHEFF" → "CHEF". */
function naMesmaCaixa(original, sugestao) {
  if (original === original.toLocaleUpperCase('pt-BR') && original.length > 1) return sugestao.toLocaleUpperCase('pt-BR');
  if (original[0] === original[0].toLocaleUpperCase('pt-BR')) {
    return sugestao.charAt(0).toLocaleUpperCase('pt-BR') + sugestao.slice(1);
  }
  return sugestao;
}

/**
 * Monta o corretor com o vocabulário que se sabe estar certo.
 * @param {Iterable<string>} vocabulario - palavras certas (com acento).
 */
export function criarCorretor(vocabulario) {
  const certas = new Set([...TERMOS_DA_CASA, ...vocabulario].map(minuscula));
  const porSemAcento = new Map();
  for (const p of certas) {
    const k = semAcento(p);
    if (!porSemAcento.has(k)) porSemAcento.set(k, p);
  }
  const lista = [...certas];

  /** Sugestão da casa para uma palavra desconhecida, ou null. */
  function sugestaoDaCasa(palavra) {
    const p = minuscula(palavra);
    // Mesmo sem acento: "feijao" → "feijão". É o erro mais comum e o mais seguro.
    const acentuada = porSemAcento.get(semAcento(p));
    if (acentuada && acentuada !== p) return { palavra: acentuada, segura: true };
    // Palavra curta tolera 1 erro; a partir de 6 letras, 2.
    const teto = p.length >= 6 ? 2 : 1;
    let melhor = null;
    let melhorDist = teto + 1;
    let empate = false;
    for (const c of lista) {
      if (Math.abs(c.length - p.length) > teto) continue;
      const d = distancia(semAcento(p), semAcento(c), teto);
      if (d < melhorDist) {
        melhor = c;
        melhorDist = d;
        empate = false;
      } else if (d === melhorDist && c !== melhor) {
        empate = true;
      }
    }
    // Dois candidatos igualmente perto: melhor não chutar.
    if (!melhor || (empate && melhorDist > 1)) return null;
    return { palavra: melhor, segura: melhorDist === 1 && p.length >= 5 };
  }

  /**
   * Revisa um texto.
   * @param {string} texto
   * @param {object} [opcoes]
   * @param {boolean} [opcoes.usarLanguageTool=true]
   * @param {Iterable<string>} [opcoes.vocabularioExtra] - nomes próprios etc.
   * @param {boolean} [opcoes.soOrtografia=false] - ignora regras de gramática
   *   e estilo (nomes de pratos não são frases).
   * @returns {Promise<{achados: Array, indisponivel: boolean}>}
   *   achados: {inicio, fim, original, sugestao|null, fonte, motivo}
   */
  async function revisar(texto, { usarLanguageTool = true, vocabularioExtra = [], soOrtografia = false } = {}) {
    const extra = new Set([...vocabularioExtra].map(minuscula));
    const existe = (p) => certas.has(p) || extra.has(p);
    // Plural de palavra conhecida também vale: "bolos", "pães" (pão), "limões".
    const conhecida = (bruta) => {
      const p = minuscula(bruta);
      return (
        existe(p) ||
        (p.endsWith('s') && existe(p.slice(0, -1))) ||
        (p.endsWith('es') && existe(p.slice(0, -2))) ||
        (/(ões|ães)$/.test(p) && existe(p.slice(0, -3) + 'ão'))
      );
    };
    const daCasa = [];

    for (const m of texto.matchAll(/[\p{L}]+(?:-[\p{L}]+)*/gu)) {
      const palavra = m[0];
      if (palavra.length < 3 || conhecida(palavra)) continue;
      // Palavra com hífen: vale se todas as partes forem conhecidas.
      if (palavra.includes('-') && palavra.split('-').every((x) => x.length < 2 || conhecida(x))) continue;
      const sugestao = sugestaoDaCasa(palavra);
      if (sugestao) {
        daCasa.push({
          inicio: m.index,
          fim: m.index + palavra.length,
          original: palavra,
          sugestao: naMesmaCaixa(palavra, sugestao.palavra),
          segura: sugestao.segura,
          fonte: 'casa',
          motivo: 'Grafia diferente da usada nas artes do resort.',
        });
      }
    }

    // A casa só tem as palavras dos pratos: "goiaba" não está lá, "goiabada"
    // está, e a distância entre elas é pequena. Por isso a sugestão da casa só
    // vale quando o LanguageTool também acha a palavra errada. Sem ele, ficam
    // só as seguras (acento ou uma letra trocada em palavra de 5+ letras).
    const daLanguageTool = [];
    let indisponivel = false;
    if (usarLanguageTool && texto.trim()) {
      try {
        const corpo = new URLSearchParams({ text: texto, language: 'pt-BR' });
        if (soOrtografia) corpo.set('disabledRules', 'UPPERCASE_SENTENCE_START,WHITESPACE_RULE,PUNCTUATION_PARAGRAPH_END');
        const controle = new AbortController();
        const timer = setTimeout(() => controle.abort(), TEMPO_LIMITE_MS);
        const resposta = await fetch(LANGUAGETOOL_URL, { method: 'POST', body: corpo, signal: controle.signal });
        clearTimeout(timer);
        if (!resposta.ok) throw new Error(`LanguageTool ${resposta.status}`);
        const { matches = [] } = await resposta.json();
        for (const m of matches) {
          const inicio = m.offset;
          const fim = m.offset + m.length;
          const original = texto.slice(inicio, fim);
          const ortografia = m.rule?.issueType === 'misspelling' || /MORFOLOGIK|SPELL/i.test(m.rule?.id || '');
          if (soOrtografia && !ortografia) continue;
          // A casa já sabe que está certa.
          if (ortografia && conhecida(original)) continue;
          const sugestao = m.replacements?.[0]?.value ?? null;
          daLanguageTool.push({
            ortografia,
            inicio,
            fim,
            original,
            sugestao: sugestao && sugestao !== original ? sugestao : null,
            fonte: 'languagetool',
            motivo: ortografia ? 'Palavra não reconhecida no português.' : m.message || 'Possível erro.',
          });
        }
      } catch (err) {
        console.warn('Revisão do LanguageTool indisponível:', err);
        indisponivel = true;
      }
    }

    const sobrepoe = (a, b) => a.inicio < b.fim && b.inicio < a.fim;
    const consultouLT = usarLanguageTool && !indisponivel;
    const achados = [];
    for (const c of daCasa) {
      const confirmada = consultouLT
        ? daLanguageTool.some((l) => l.ortografia && sobrepoe(l, c))
        : c.segura;
      if (confirmada) achados.push(c);
    }
    // O LanguageTool fica com o que a casa não cobriu. Nas palavras de cozinha
    // que ele não conhece, a sugestão dele costuma ser ruim ("Tortilede" →
    // "Tortueje"); por isso a da casa, quando existe, sempre vence.
    const aceitasDaCasa = [...achados];
    for (const l of daLanguageTool) {
      if (aceitasDaCasa.some((c) => sobrepoe(c, l))) continue;
      const { ortografia, ...achado } = l;
      achados.push(achado);
    }
    achados.sort((a, b) => a.inicio - b.inicio);
    return { achados, indisponivel };
  }

  return { revisar, conhece: (p) => certas.has(minuscula(p)) };
}

/**
 * Aplica as decisões ao texto, do fim para o começo (os índices continuam
 * valendo). `decisoes[i]` é o texto final daquele trecho.
 */
export function aplicarDecisoes(texto, achados, decisoes) {
  let saida = texto;
  for (let i = achados.length - 1; i >= 0; i--) {
    const { inicio, fim } = achados[i];
    saida = saida.slice(0, inicio) + decisoes[i] + saida.slice(fim);
  }
  return saida;
}
