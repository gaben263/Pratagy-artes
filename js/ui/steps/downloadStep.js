import { getSetor, getFormato } from '../../data/models.js';
import { getState, setState, goToStep, resetApp } from '../../state.js';
import { icon } from '../icons.js';
import { exportPNG, exportPDF } from '../../canvas/export.js';
import { ensureFontsReady } from '../../canvas/engine.js';
import { updatePreview } from '../previewPanel.js';
import { showToast, confirmModal, motivoNaoCoube } from '../common.js';
import { comemorar } from '../confetti.js';

async function handleExport(kind, formato, nomeArquivo, btn) {
  const original = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner inline-flex text-brand-blue">${icon('spinner', {
    size: 18,
  })}</span> <span class="font-fibra font-extrabold text-brand-deep">Gerando…</span>`;
  try {
    // Garante a fonte ANTES de transformar o canvas em arquivo: `fonts.ready`
    // sozinho só espera as fontes já requisitadas, e uma exportação disparada
    // logo após o carregamento sairia com a fonte de sistema. Depois de esperar,
    // repintamos a prévia para que o pixel exportado seja o pixel com a
    // Fibra One aplicada.
    await ensureFontsReady();
    await updatePreview();

    const canvas = document.querySelector('#preview-canvas-wrap [data-canvas-main]');
    if (!canvas) throw new Error('Canvas da prévia não encontrado.');

    if (kind === 'png') await exportPNG(canvas, nomeArquivo);
    else await exportPDF(canvas, formato, nomeArquivo);
    setState({ exported: true });
    showToast(`Arquivo ${kind.toUpperCase()} exportado com sucesso.`, { type: 'success' });
    comemorar();
  } catch (err) {
    console.error(err);
    showToast('Não foi possível exportar o arquivo. Tente novamente.', { type: 'error' });
  } finally {
    btn.disabled = false;
    btn.innerHTML = original;
  }
}

async function handleNovaPlaca() {
  const ok = await confirmModal({
    title: 'Iniciar uma nova arte?',
    message:
      'Isso vai limpar o setor, formato e texto atuais. Se ainda não baixou o arquivo desta arte, faça isso antes de continuar.',
    confirmLabel: 'Iniciar nova arte',
    tone: 'danger',
  });
  if (ok) resetApp();
}

function cardExport({ kind, iconName, titulo, descricao, habilitado }) {
  return `
    <button type="button" data-export="${kind}" ${habilitado ? '' : 'disabled'}
      class="group flex items-center gap-3.5 rounded-2xl border-2 border-slate-200 bg-white p-4 text-left shadow-sm transition-all duration-150 ${
        habilitado
          ? 'hover:-translate-y-0.5 hover:border-brand-blue hover:shadow-md'
          : 'cursor-not-allowed opacity-40'
      }">
      <span class="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-light text-brand-deep transition-colors ${
        habilitado ? 'group-hover:bg-brand-blue group-hover:text-white' : ''
      }">
        ${icon(iconName, { size: 21 })}
      </span>
      <span>
        <span class="block font-fibra font-extrabold text-brand-deep">${titulo}</span>
        <span class="block text-xs text-slate-500">${descricao}</span>
      </span>
    </button>
  `;
}

export function renderDownloadStep(container) {
  const state = getState();
  const setor = getSetor(state.setorId);
  const formato = getFormato(state.setorId, state.formatoId);

  if (!setor || !formato) {
    goToStep(!setor ? 'setor' : 'formato');
    return;
  }

  // Só o começo da primeira linha entra no nome: a carta de boas-vindas e o
  // comunicado do Acqua Park guardam parágrafos inteiros em `texto`, e o nome
  // do arquivo viraria um trecho truncado no meio de uma frase.
  // O corte em 40 caracteres cai no meio de uma palavra; o replace descarta
  // esse pedaço solto para o nome terminar sempre numa palavra inteira.
  const resumoTexto = state.texto
    .split(/\r?\n/)[0]
    .trim()
    .slice(0, 40)
    .replace(/\s+\S*$/, '');
  const nomeArquivo = `arte-${setor.sigla}-${formato.nome}-${resumoTexto}`;

  container.innerHTML = `
    <div>
      <button type="button" data-back
        class="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 transition-colors hover:text-brand-blue">
        ${icon('arrowLeft', { size: 16 })} Voltar
      </button>

      <h1 class="font-fibra text-2xl font-extrabold text-brand-deep">Baixe a sua arte</h1>
      <p class="mt-1 mb-5 text-slate-500">Escolha o formato do arquivo.</p>

      ${
        !state.fits
          ? `<div class="mb-5 flex items-start gap-2.5 rounded-xl border border-brand-coral/30 bg-brand-coral/10 px-4 py-3 text-sm text-brand-coral">
              ${icon('alertTriangle', { size: 17, className: 'mt-0.5' })}
              <p><strong class="font-extrabold">Exportação bloqueada.</strong> ${motivoNaoCoube(state).titulo} ${
                state.palavraLonga ? motivoNaoCoube(state).acao : 'Volte e ajuste antes de baixar.'
              }</p>
            </div>`
          : ''
      }

      <div class="mb-6 grid gap-3 sm:grid-cols-2">
        ${cardExport({
          kind: 'png',
          iconName: 'image',
          titulo: 'Baixar PNG',
          descricao: formato.digital ? 'WhatsApp, murais e redes sociais' : 'Telas, TVs e redes sociais',
          habilitado: state.fits,
        })}
        ${cardExport({
          kind: 'pdf',
          iconName: 'printer',
          titulo: 'Baixar PDF',
          descricao: formato.digital
            ? 'Versão para imprimir e afixar'
            : `Impressão em ${formato.mmLargura}×${formato.mmAltura} mm`,
          habilitado: state.fits,
        })}
      </div>

      <button type="button" data-nova
        class="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-bold text-slate-500 transition-colors hover:border-brand-coral hover:text-brand-coral">
        ${icon('refresh', { size: 15 })} Iniciar uma nova arte
      </button>
    </div>
  `;

  container.querySelector('[data-back]').addEventListener('click', () => goToStep('previa'));
  container.querySelector('[data-nova]').addEventListener('click', handleNovaPlaca);

  container.querySelectorAll('[data-export]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      handleExport(btn.dataset.export, formato, nomeArquivo, btn);
    });
  });
}
