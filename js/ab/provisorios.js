// Pratos provisórios do A&B: cadastrados pela equipe na hora, guardados numa
// planilha do Google e visíveis na busca de todos os computadores até o
// Marketing incluí-los na biblioteca oficial (.docx).
//
// A planilha recebe os dados por um Apps Script publicado como "App da Web"
// (tools/apps-script/provisorios.gs). Sem a URL dele, ou sem internet, o prato
// fica guardado neste navegador e o envio é tentado de novo a cada visita — a
// placa nunca deixa de sair por causa da planilha.
//
// Quando um provisório entra na biblioteca oficial, ele some daqui sozinho:
// docxLibrary.js descarta o provisório cujo nome já existe no .docx.

import { normalizeSearch } from '../utils.js';

// URL do App da Web do Apps Script (termina em /exec). Vazia = só local.
export const PROVISORIOS_URL =
  'https://script.google.com/macros/s/AKfycbw0zftOPZbyXp9Q1w-OYGt0UC2jxFISVqJYsmN5OKdOwLIOWHpURr-tGAOwTC4IxNjw/exec';

const CHAVE_PENDENTES = 'pratagy-ab-provisorios-pendentes';
const CHAVE_CACHE = 'pratagy-ab-provisorios-cache';
const TEMPO_LIMITE_MS = 10000;

let remotos = [];
let pendentes = lerLocal(CHAVE_PENDENTES);
let carregamento = null;
let carregadoEm = 0;
const RELER_APOS_MS = 60 * 1000;
const ouvintes = new Set();

function lerLocal(chave) {
  try {
    const bruto = localStorage.getItem(chave);
    const lista = bruto ? JSON.parse(bruto) : [];
    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

function gravarLocal(chave, lista) {
  try {
    localStorage.setItem(chave, JSON.stringify(lista));
  } catch {
    // Navegador sem armazenamento (aba anônima, bloqueio): segue só em memória.
  }
}

function avisar() {
  for (const fn of ouvintes) {
    try {
      fn();
    } catch (err) {
      console.error(err);
    }
  }
}

/** Ser avisado quando a lista muda (carregou da planilha, cadastro novo). */
export function aoMudarProvisorios(fn) {
  ouvintes.add(fn);
  return () => ouvintes.delete(fn);
}

function paraEntrada(p, { pendente = false } = {}) {
  return {
    id: `prov-${p.id}`,
    categoria: p.categoria || 'Provisório',
    pt: p.pt,
    es: p.es,
    origem: 'provisorio',
    provisorio: true,
    pendente,
    searchKey: normalizeSearch(`${p.pt} ${p.es}`),
  };
}

/** Provisórios conhecidos agora (planilha + os ainda não enviados daqui). */
export function getProvisorios() {
  const vistos = new Set();
  const saida = [];
  for (const [lista, pendente] of [[pendentes, true], [remotos, false]]) {
    for (const p of lista) {
      const chave = normalizeSearch(p.pt);
      if (!p.pt || vistos.has(chave)) continue;
      vistos.add(chave);
      saida.push(paraEntrada(p, { pendente }));
    }
  }
  return saida;
}

export const planilhaConfigurada = () => Boolean(PROVISORIOS_URL);

async function comTempoLimite(url, opcoes = {}) {
  const controle = new AbortController();
  const timer = setTimeout(() => controle.abort(), TEMPO_LIMITE_MS);
  try {
    return await fetch(url, { ...opcoes, signal: controle.signal, redirect: 'follow' });
  } finally {
    clearTimeout(timer);
  }
}

async function enviar(prato) {
  // text/plain evita a consulta prévia de CORS, que o Apps Script não responde.
  const resposta = await comTempoLimite(PROVISORIOS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(prato),
  });
  const dados = await resposta.json();
  if (!dados.ok) throw new Error(dados.erro || 'A planilha recusou o cadastro.');
}

/** Tenta mandar os que ficaram guardados aqui. Não lança erro. */
async function enviarPendentes() {
  if (!planilhaConfigurada() || !pendentes.length) return;
  for (const prato of [...pendentes]) {
    try {
      await enviar(prato);
      pendentes = pendentes.filter((p) => p.id !== prato.id);
      remotos = [...remotos.filter((p) => p.id !== prato.id), prato];
      gravarLocal(CHAVE_PENDENTES, pendentes);
    } catch (err) {
      console.warn('Prato provisório ainda não enviado à planilha:', err);
      break; // sem conexão: os próximos falhariam igual
    }
  }
  avisar();
}

/**
 * Carrega a lista da planilha (uma vez por sessão; `forcar` recarrega).
 * Sem conexão, usa a última lista recebida neste navegador.
 */
export function carregarProvisorios({ forcar = false } = {}) {
  if (carregamento && !forcar) return carregamento;
  carregamento = (async () => {
    if (!planilhaConfigurada()) {
      remotos = [];
      avisar();
      return getProvisorios();
    }
    try {
      const resposta = await comTempoLimite(`${PROVISORIOS_URL}?acao=listar&t=${Date.now()}`);
      const dados = await resposta.json();
      if (!dados.ok || !Array.isArray(dados.pratos)) throw new Error('Resposta inesperada da planilha.');
      remotos = dados.pratos;
      carregadoEm = Date.now();
      gravarLocal(CHAVE_CACHE, remotos);
    } catch (err) {
      console.warn('Planilha de provisórios indisponível, usando a última cópia:', err);
      remotos = lerLocal(CHAVE_CACHE);
    }
    avisar();
    await enviarPendentes();
    return getProvisorios();
  })();
  return carregamento;
}

/**
 * Relê a planilha se a última leitura tiver mais de 1 minuto. As telas de
 * busca do A&B chamam ao abrir: um computador com o sistema aberto desde
 * cedo passa a ver o prato que outro cadastrou depois.
 */
export function atualizarProvisoriosSeAntigos() {
  if (!planilhaConfigurada() || Date.now() - carregadoEm < RELER_APOS_MS) return;
  carregarProvisorios({ forcar: true });
}

/**
 * Cadastra um prato provisório. Sempre guarda aqui primeiro, depois tenta a
 * planilha: o prato já pode ir para a placa mesmo se o envio falhar.
 *
 * @returns {Promise<{entrada: object, enviado: boolean}>}
 */
export async function cadastrarProvisorio({ pt, es, categoria, revisao, tela }) {
  const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const prato = { id, pt, es, categoria, revisao, tela, data: new Date().toISOString() };
  pendentes = [...pendentes, prato];
  gravarLocal(CHAVE_PENDENTES, pendentes);
  avisar();

  let enviado = false;
  if (planilhaConfigurada()) {
    try {
      await enviar(prato);
      pendentes = pendentes.filter((p) => p.id !== id);
      remotos = [...remotos, prato];
      gravarLocal(CHAVE_PENDENTES, pendentes);
      gravarLocal(CHAVE_CACHE, remotos);
      enviado = true;
      avisar();
    } catch (err) {
      console.warn('Cadastro guardado neste computador; a planilha será tentada de novo:', err);
    }
  }
  return { entrada: paraEntrada(prato, { pendente: !enviado }), enviado };
}
