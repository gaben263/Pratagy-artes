// Estado central da aplicação (padrão pub-sub simples, sem framework).

import { getSetor } from './data/models.js';

// O caminho não é mais único: setores de catálogo abrem a busca de artes
// prontas em vez do gerador de Canvas, e de lá ainda podem entrar no gerador
// para criar um aviso personalizado. Por isso a ordem dos passos é calculada a
// partir do estado, e não uma constante global.
const GERADOR = ['formato', 'modelo', 'edicao', 'previa', 'download'];

const FLUXO_GERADOR = ['setor', ...GERADOR];
const FLUXO_CATALOGO = ['setor', 'catalogo'];
const FLUXO_CATALOGO_GERADOR = ['setor', 'catalogo', ...GERADOR];

// Setor misto (A&B): passa por uma tela de escolha antes de seguir por um dos
// dois caminhos.
const FLUXO_MISTO = ['setor', 'modo'];
const FLUXO_MISTO_GERADOR = ['setor', 'modo', ...GERADOR];
const FLUXO_MISTO_CATALOGO = ['setor', 'modo', 'catalogo'];

export const STEP_LABELS = {
  setor: 'Setor',
  modo: 'Opção',
  catalogo: 'Catálogo',
  formato: 'Formato',
  modelo: 'Modelo',
  edicao: 'Texto',
  previa: 'Prévia',
  download: 'Download',
};

function initialState() {
  return {
    step: 'setor',
    maxStepIndex: 0,
    setorId: null,
    formatoId: null,
    // 'gerador' quando o usuário sai do catálogo para criar uma arte do zero.
    modo: null,
    texto: '',
    textoEs: '',
    libraryEntryId: null,
    fits: true,
    exported: false,
  };
}

let state = initialState();
const listeners = new Set();

export function getState() {
  return state;
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify() {
  for (const fn of listeners) fn(state);
}

export function setState(patch) {
  state = { ...state, ...(typeof patch === 'function' ? patch(state) : patch) };
  notify();
}

/** Sequência de passos válida para o estado atual. */
export function getStepOrder(s = state) {
  const setor = getSetor(s.setorId);
  if (!setor) return FLUXO_GERADOR;

  if (setor.fluxo === 'misto') {
    if (s.modo === 'gerador') return FLUXO_MISTO_GERADOR;
    if (s.modo === 'catalogo') return FLUXO_MISTO_CATALOGO;
    return FLUXO_MISTO;
  }

  if (setor.fluxo === 'catalogo') {
    return s.modo === 'gerador' ? FLUXO_CATALOGO_GERADOR : FLUXO_CATALOGO;
  }

  return FLUXO_GERADOR;
}

/** Primeiro passo depois da escolha do setor. */
export function primeiroPasso(setor) {
  if (setor.fluxo === 'misto') return 'modo';
  if (setor.fluxo === 'catalogo') return 'catalogo';
  return 'formato';
}

export function hasUnsavedWork() {
  return Boolean(
    state.texto.trim() || state.textoEs.trim() || state.setorId || state.formatoId
  );
}

export function resetApp() {
  state = initialState();
  notify();
}

export function goToStep(stepId) {
  const ordem = getStepOrder();
  const idx = ordem.indexOf(stepId);
  if (idx === -1) return;
  setState({ step: stepId, maxStepIndex: Math.max(state.maxStepIndex, idx) });
}

export function goNext() {
  const ordem = getStepOrder();
  const idx = ordem.indexOf(state.step);
  if (idx < ordem.length - 1) goToStep(ordem[idx + 1]);
}

export function goBack() {
  const ordem = getStepOrder();
  const idx = ordem.indexOf(state.step);
  if (idx > 0) goToStep(ordem[idx - 1]);
}

export function canReachStep(stepId) {
  return getStepOrder().indexOf(stepId) <= state.maxStepIndex;
}

/**
 * Sai do catálogo para o gerador de arte personalizada.
 *
 * Troca de fluxo e navega numa única atualização de estado: fazer as duas
 * coisas em `setState` separados dispararia um render intermediário em que o
 * passo de destino ainda não pertence à ordem vigente.
 *
 * @param {string|null} formatoId - quando o setor tem um formato só, ele já vem
 *   escolhido e pulamos direto para a confirmação do modelo; a tela de formato
 *   com um cartão único não acrescenta nada.
 */
export function entrarNoGerador(formatoId = null) {
  const setor = getSetor(state.setorId);
  // A ordem que passará a valer depois de `modo: 'gerador'` — é nela que o
  // índice do destino precisa ser calculado, não na ordem vigente agora.
  const ordem = setor?.fluxo === 'misto' ? FLUXO_MISTO_GERADOR : FLUXO_CATALOGO_GERADOR;
  const destino = formatoId ? 'modelo' : 'formato';

  setState({
    modo: 'gerador',
    formatoId: formatoId || state.formatoId,
    step: destino,
    maxStepIndex: Math.max(state.maxStepIndex, ordem.indexOf(destino)),
  });
}

/** Entra no catálogo de artes prontas a partir da tela de escolha (setor misto). */
export function entrarNoCatalogo() {
  setState({
    modo: 'catalogo',
    step: 'catalogo',
    maxStepIndex: Math.max(state.maxStepIndex, FLUXO_MISTO_CATALOGO.indexOf('catalogo')),
  });
}
