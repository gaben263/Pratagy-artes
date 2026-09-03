import { getState, subscribe, hasUnsavedWork, resetApp } from './state.js';
import { renderStepper } from './ui/stepper.js';
import { mountPreviewPanel, updatePreview } from './ui/previewPanel.js';
import { ensureFontsReady } from './canvas/engine.js';
import { loadLibrary } from './data/docxLibrary.js';
import { icon } from './ui/icons.js';
import { confirmModal } from './ui/common.js';
import { renderSetorStep } from './ui/steps/setorStep.js';
import { renderFormatoStep } from './ui/steps/formatoStep.js';
import { renderModeloStep } from './ui/steps/modeloStep.js';
import { renderEdicaoStep } from './ui/steps/edicaoStep.js';
import { renderPreviaStep } from './ui/steps/previaStep.js';
import { renderDownloadStep } from './ui/steps/downloadStep.js';

// Aquece a fonte e a biblioteca de pratos já na abertura da página, para que
// nenhuma etapa do fluxo precise esperar por elas depois. A leitura do .docx
// acontece uma única vez por sessão (depois vem do IndexedDB / memória).
ensureFontsReady();
loadLibrary().catch((err) => console.warn('Biblioteca A&B indisponível no momento:', err));

const STEP_RENDERERS = {
  setor: renderSetorStep,
  formato: renderFormatoStep,
  modelo: renderModeloStep,
  edicao: renderEdicaoStep,
  previa: renderPreviaStep,
  download: renderDownloadStep,
};

const stepperEl = document.getElementById('stepper-container');
const stepEl = document.getElementById('step-container');
const previewEl = document.getElementById('preview-container');
const novaPlacaBtn = document.getElementById('btn-nova-placa');

novaPlacaBtn.innerHTML = `${icon('refresh', { size: 14 })} Nova placa`;
novaPlacaBtn.addEventListener('click', async () => {
  const ok = await confirmModal({
    title: 'Iniciar uma nova placa?',
    message: 'O setor, formato e texto atuais serão limpos. Baixe o arquivo antes, se ainda não baixou.',
    confirmLabel: 'Iniciar nova placa',
    tone: 'danger',
  });
  if (ok) resetApp();
});

let lastStepForScroll = null;

function render() {
  const state = getState();
  renderStepper(stepperEl);
  STEP_RENDERERS[state.step]?.(stepEl);
  updatePreview();

  // O atalho "Nova placa" só faz sentido depois que algo foi escolhido.
  novaPlacaBtn.classList.toggle('hidden', !state.setorId);
  novaPlacaBtn.classList.toggle('flex', Boolean(state.setorId));

  if (state.step !== lastStepForScroll) {
    lastStepForScroll = state.step;
    stepEl.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  }
}

mountPreviewPanel(previewEl);
subscribe(render);
render();

window.addEventListener('beforeunload', (e) => {
  if (hasUnsavedWork() && !getState().exported) {
    e.preventDefault();
    e.returnValue = '';
  }
});
