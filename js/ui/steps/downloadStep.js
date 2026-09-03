import { getSetor, getFormato } from '../../data/models.js';
import { getState, setState, goToStep, resetApp } from '../../state.js';
import { icon } from '../icons.js';
import { exportPNG, exportPDF } from '../../canvas/export.js';
import { showToast, confirmModal } from '../common.js';

async function handleExport(kind, canvas, formato, nomeArquivo, btn) {
  const original = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner inline-flex text-brand-blue">${icon('spinner', {
    size: 18,
  })}</span> <span class="font-fibra font-extrabold text-brand-deep">Gerando…</span>`;
  try {
    if (kind === 'png') await exportPNG(canvas, nomeArquivo);
    else await exportPDF(canvas, formato, nomeArquivo);
    setState({ exported: true });
    showToast(`Arquivo ${kind.toUpperCase()} exportado com sucesso.`, { type: 'success' });
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
    title: 'Iniciar uma nova placa?',
    message:
      'Isso vai limpar o setor, formato e texto atuais. Se ainda não baixou o arquivo desta placa, faça isso antes de continuar.',
    confirmLabel: 'Iniciar nova placa',
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

  const nomeArquivo = `placa-${setor.sigla}-${formato.nome}-${state.texto}`.slice(0, 80);

  container.innerHTML = `
    <div>
      <button type="button" data-back
        class="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 transition-colors hover:text-brand-blue">
        ${icon('arrowLeft', { size: 16 })} Voltar
      </button>

      <h1 class="font-fibra text-2xl font-extrabold text-brand-deep">Baixe a sua placa</h1>
      <p class="mt-1 mb-5 text-slate-500">Escolha o formato do arquivo.</p>

      ${
        !state.fits
          ? `<div class="mb-5 flex items-start gap-2.5 rounded-xl border border-brand-coral/30 bg-brand-coral/10 px-4 py-3 text-sm text-brand-coral">
              ${icon('alertTriangle', { size: 17, className: 'mt-0.5' })}
              <p><strong class="font-extrabold">Exportação bloqueada.</strong> O texto ultrapassa a área segura. Volte e ajuste antes de baixar.</p>
            </div>`
          : ''
      }

      <div class="mb-6 grid gap-3 sm:grid-cols-2">
        ${cardExport({
          kind: 'png',
          iconName: 'image',
          titulo: 'Baixar PNG',
          descricao: 'Telas, TVs e redes sociais',
          habilitado: state.fits,
        })}
        ${cardExport({
          kind: 'pdf',
          iconName: 'printer',
          titulo: 'Baixar PDF',
          descricao: `Impressão em ${formato.mmLargura}×${formato.mmAltura} mm`,
          habilitado: state.fits,
        })}
      </div>

      <button type="button" data-nova
        class="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-bold text-slate-500 transition-colors hover:border-brand-coral hover:text-brand-coral">
        ${icon('refresh', { size: 15 })} Iniciar uma nova placa
      </button>
    </div>
  `;

  container.querySelector('[data-back]').addEventListener('click', () => goToStep('previa'));
  container.querySelector('[data-nova]').addEventListener('click', handleNovaPlaca);

  container.querySelectorAll('[data-export]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      const canvas = document.querySelector('#preview-canvas-wrap [data-canvas-main]');
      if (!canvas) return;
      handleExport(btn.dataset.export, canvas, formato, nomeArquivo, btn);
    });
  });
}
