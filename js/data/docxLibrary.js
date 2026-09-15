// Carrega a biblioteca de pratos (PT/ES) do arquivo .docx local usando mammoth,
// com cache em IndexedDB (via idb) para evitar reprocessar o arquivo a cada visita.
//
// FORMATO DO .DOCX (versão de setembro/2026)
// O documento é um glossário por seções: cada categoria é um parágrafo comum
// ("1. Carnes, aves, peixes e frutos do mar" — sem estilo de título, então o
// mammoth emite <p>, não <h1>) seguido de uma tabela de três colunas
// (# | Nome em Português | Tradução em Espanhol). Antes delas há uma tabela de
// resumo (# | Categoria | Total) que não contém pratos e é ignorada pelo
// cabeçalho. A versão anterior era uma tabela única com a categoria repetida
// em cada linha e uma coluna de origem (original/sugestão) que não existe mais.
//
// Sempre que o arquivo mudar, DOCX_VERSION_TAG precisa mudar junto: é ela que
// invalida o cache no navegador de cada pessoa da equipe.

import { normalizeSearch } from '../utils.js';

const DOCX_PATH = 'assets/docx/biblioteca_ab.docx';
const DOCX_VERSION_TAG = 'biblioteca_ab-v2';

// Itens que vinham dos cardápios oficiais e saíram na revisão de setembro/2026.
// Mesclados de volta com a tradução anterior, marcados como `legado` para que
// seja possível encontrá-los e removê-los de uma vez quando a cozinha confirmar.
const LEGADOS = [
  { categoria: 'Carnes, aves, peixes e frutos do mar', pt: 'Filé de peixe', es: 'Filete de pescado' },
  { categoria: 'Petiscos, lanches e ações rápidas', pt: 'Coxinha frita', es: 'Croqueta de pollo frita' },
  { categoria: 'Petiscos, lanches e ações rápidas', pt: 'Costelinha ao barbecue', es: 'Costillitas de cerdo a la barbacoa' },
];
const DB_NAME = 'pratagy-placas';
const DB_VERSION = 1;
const STORE_ITEMS = 'biblioteca_ab';
const STORE_META = 'meta';

let dbPromise = null;
let memoryCache = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = window.idb.openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_ITEMS)) {
          db.createObjectStore(STORE_ITEMS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_META)) {
          db.createObjectStore(STORE_META);
        }
      },
    });
  }
  return dbPromise;
}

async function loadFromCache() {
  try {
    const db = await getDb();
    const version = await db.get(STORE_META, 'docxVersion');
    if (version !== DOCX_VERSION_TAG) return null;
    const all = await db.getAll(STORE_ITEMS);
    return all.length ? all : null;
  } catch (err) {
    console.warn('Falha ao ler cache da biblioteca A&B:', err);
    return null;
  }
}

async function saveToCache(entries) {
  try {
    const db = await getDb();
    const tx = db.transaction([STORE_ITEMS, STORE_META], 'readwrite');
    await tx.objectStore(STORE_ITEMS).clear();
    for (const entry of entries) {
      tx.objectStore(STORE_ITEMS).put(entry);
    }
    tx.objectStore(STORE_META).put(DOCX_VERSION_TAG, 'docxVersion');
    await tx.done;
  } catch (err) {
    console.warn('Falha ao salvar cache da biblioteca A&B:', err);
  }
}

const texto = (el) => el.textContent.replace(/\s+/g, ' ').trim();

// "3. Ações e estações gastronômicas" -> "Ações e estações gastronômicas"
const TITULO_CATEGORIA = /^\d+\.\s+(.+)$/;

function montarEntrada({ categoria, pt, es, origem }, indice) {
  return {
    id: `ab-${indice}`,
    categoria,
    pt,
    es,
    origem,
    searchKey: normalizeSearch(`${pt} ${es}`),
  };
}

function extractEntriesFromHtml(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const brutas = [];
  let categoria = 'Outros';

  // Anda o documento em ordem: o último título de seção visto antes de cada
  // tabela é a categoria dos pratos daquela tabela.
  for (const el of doc.body.children) {
    // Parágrafo comum hoje; título de verdade (h1–h6) se alguém formatar assim
    // numa próxima revisão do documento.
    if (/^(P|H[1-6])$/.test(el.tagName)) {
      const m = texto(el).match(TITULO_CATEGORIA);
      if (m) categoria = m[1];
      continue;
    }
    if (el.tagName !== 'TABLE') continue;

    const linhas = [...el.querySelectorAll('tr')];
    const cabecalho = linhas.length ? texto(linhas[0]) : '';
    // A tabela de resumo do início não tem essa coluna: só as de pratos têm.
    if (!/Nome em Portugu/i.test(cabecalho)) continue;

    for (const tr of linhas.slice(1)) {
      const [, pt, es] = [...tr.querySelectorAll('td')].map(texto);
      if (pt) brutas.push({ categoria, pt, es: es || '', origem: 'docx' });
    }
  }

  // O documento repete alguns pratos (ex.: "Cachorro-quente" em duas seções).
  // Dois resultados idênticos na busca só confundem; fica a primeira ocorrência.
  const vistos = new Set();
  const unicas = [];
  for (const entrada of [...brutas, ...LEGADOS.map((l) => ({ ...l, origem: 'legado' }))]) {
    const chave = normalizeSearch(entrada.pt);
    if (vistos.has(chave)) continue;
    vistos.add(chave);
    unicas.push(entrada);
  }

  return unicas.map(montarEntrada);
}

async function parseDocx() {
  const response = await fetch(DOCX_PATH);
  if (!response.ok) {
    throw new Error(`Não foi possível carregar o arquivo da biblioteca (${response.status}).`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const result = await window.mammoth.convertToHtml({ arrayBuffer });
  return extractEntriesFromHtml(result.value);
}

let loadPromise = null;

/**
 * Carrega a biblioteca completa (do cache do IndexedDB, ou processando o .docx).
 *
 * A leitura do .docx acontece no máximo UMA vez por sessão: chamadas
 * concorrentes compartilham a mesma promise e chamadas posteriores devolvem o
 * cache em memória imediatamente. Navegar entre etapas nunca redispara o
 * carregamento.
 *
 * @param {(stage: 'cache'|'parsing'|'done') => void} [onProgress]
 */
export function loadLibrary(onProgress) {
  if (memoryCache) {
    onProgress?.('done');
    return Promise.resolve(memoryCache);
  }

  if (!loadPromise) {
    loadPromise = (async () => {
      onProgress?.('cache');
      let entries = await loadFromCache();

      if (!entries) {
        onProgress?.('parsing');
        entries = await parseDocx();
        saveToCache(entries); // best-effort, não bloqueia a UI
      }

      memoryCache = entries;
      onProgress?.('done');
      return entries;
    })();

    // Um erro não pode deixar a promise "envenenada" para sempre: se falhar,
    // libera para uma nova tentativa na próxima interação do usuário.
    loadPromise.catch(() => {
      loadPromise = null;
    });
  }

  return loadPromise;
}

/**
 * Devolve a biblioteca já carregada em memória, ou null se ainda não estiver
 * pronta. Permite que a UI renderize o campo de busca já habilitado, sem
 * esperar por uma promise, quando o carregamento já ocorreu.
 */
export function getLoadedLibrary() {
  return memoryCache;
}

/**
 * Busca itens da biblioteca ignorando acentos/maiúsculas, priorizando
 * correspondências no início do nome.
 *
 * Cada palavra digitada precisa aparecer no item, em qualquer ordem — a mesma
 * regra do catálogo de artes prontas. "costelinha barbecue" encontra
 * "Costelinha ao barbecue"; uma busca por frase exata não encontraria.
 */
export function searchLibrary(entries, query, limit = 8) {
  const q = normalizeSearch(query);
  if (!q) return [];
  const termos = q.split(' ');
  const starts = [];
  const contains = [];
  for (const entry of entries) {
    if (!termos.every((t) => entry.searchKey.includes(t))) continue;
    if (entry.searchKey.startsWith(q)) starts.push(entry);
    else contains.push(entry);
  }
  return [...starts, ...contains].slice(0, limit);
}
