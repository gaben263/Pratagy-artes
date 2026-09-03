// Estado central da aplicação (padrão pub-sub simples, sem framework).

export const STEP_ORDER = ['setor', 'formato', 'modelo', 'edicao', 'previa', 'download'];

export const STEP_LABELS = {
  setor: 'Setor',
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

export function hasUnsavedWork() {
  return Boolean(
    state.texto.trim() ||
      state.textoEs.trim() ||
      state.setorId ||
      state.formatoId
  );
}

export function resetApp() {
  state = initialState();
  notify();
}

export function goToStep(stepId) {
  const idx = STEP_ORDER.indexOf(stepId);
  if (idx === -1) return;
  setState({ step: stepId, maxStepIndex: Math.max(state.maxStepIndex, idx) });
}

export function goNext() {
  const idx = STEP_ORDER.indexOf(state.step);
  if (idx < STEP_ORDER.length - 1) goToStep(STEP_ORDER[idx + 1]);
}

export function goBack() {
  const idx = STEP_ORDER.indexOf(state.step);
  if (idx > 0) goToStep(STEP_ORDER[idx - 1]);
}

export function canReachStep(stepId) {
  return STEP_ORDER.indexOf(stepId) <= state.maxStepIndex;
}
