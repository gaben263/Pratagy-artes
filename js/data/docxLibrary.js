// Carrega a biblioteca de pratos (PT/ES) do arquivo .docx local usando mammoth,
// com cache em IndexedDB (via idb) para evitar reprocessar o arquivo a cada visita.

import { normalizeSearch } from '../utils.js';

const DOCX_PATH = 'assets/docx/biblioteca_ab.docx';
const DOCX_VERSION_TAG = 'biblioteca_ab-v1';
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

function extractEntriesFromHtml(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const tables = [...doc.querySelectorAll('table')];
  // A tabela principal é a maior (406 pratos); a primeira é apenas um guia de campos.
  const mainTable = tables.sort((a, b) => b.rows.length - a.rows.length)[0];
  if (!mainTable) return [];

  const rows = [...mainTable.querySelectorAll('tr')].slice(1); // pula cabeçalho
  const entries = [];
  rows.forEach((tr, i) => {
    const cells = [...tr.querySelectorAll('td')].map((td) =>
      td.textContent.replace(/\s+/g, ' ').trim()
    );
    if (cells.length < 2) return;
    const [categoria, pt, es, origemRaw] = cells;
    if (!pt) return;
    const status = /SUGEST/i.test(origemRaw || '') ? 'SUGESTAO' : 'ORIGINAL';
    entries.push({
      id: `ab-${i}`,
      categoria: categoria || 'Outros',
      pt,
      es: es || '',
      status,
      searchKey: normalizeSearch(`${pt} ${es}`),
    });
  });
  return entries;
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
 */
export function searchLibrary(entries, query, limit = 8) {
  const q = normalizeSearch(query);
  if (!q) return [];
  const starts = [];
  const contains = [];
  for (const entry of entries) {
    if (entry.searchKey.startsWith(q)) {
      starts.push(entry);
    } else if (entry.searchKey.includes(q)) {
      contains.push(entry);
    }
  }
  return [...starts, ...contains].slice(0, limit);
}
