// Estado central da aplicação (padrão pub-sub simples, sem framework).

import { getSetor } from './data/models.js';

// O caminho não é mais único: setores de catálogo abrem a busca de artes
// prontas em vez do gerador de Canvas, e de lá ainda podem entrar no gerador
// para criar um aviso personalizado. Por isso a ordem dos passos é calculada a
// partir do estado, e não uma constante global.
const FLUXO_GERADOR = ['setor', 'formato', 'modelo', 'edicao', 'previa', 'download'];
const FLUXO_CATALOGO = ['setor', 'catalogo'];
const FLUXO_CATALOGO_GERADOR = ['setor', 'catalogo', 'formato', 'modelo', 'edicao', 'previa', 'download'];

export const STEP_LABELS = {
  setor: 'Setor',
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
    // Corpo do comunicado (Acqua Park); `texto` guarda o assunto.
    corpo: '',
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
  if (!setor || setor.fluxo !== 'catalogo') return FLUXO_GERADOR;
  return s.modo === 'gerador' ? FLUXO_CATALOGO_GERADOR : FLUXO_CATALOGO;
}

export function hasUnsavedWork() {
  return Boolean(
    state.texto.trim() ||
      state.textoEs.trim() ||
      state.corpo.trim() ||
      state.setorId ||
      state.formatoId
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
 * passo 'formato' ainda não pertence à ordem vigente.
 */
export function entrarNoGerador() {
  setState({
    modo: 'gerador',
    step: 'formato',
    maxStepIndex: Math.max(state.maxStepIndex, FLUXO_CATALOGO_GERADOR.indexOf('formato')),
  });
}
