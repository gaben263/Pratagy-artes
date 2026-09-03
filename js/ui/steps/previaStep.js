import { getSetor, getFormato } from '../../data/models.js';
import { getState, goToStep } from '../../state.js';
import { icon } from '../icons.js';
import { escapeHtml, toTitleCase } from '../../utils.js';

function linha(label, valor, { destaque = false } = {}) {
  return `
    <div class="flex justify-between gap-4 py-2.5">
      <dt class="shrink-0 text-sm text-slate-500">${label}</dt>
      <dd class="max-w-[60%] whitespace-pre-wrap text-right text-sm ${
        destaque ? 'font-bold text-brand-deep' : 'text-slate-600'
      }">${escapeHtml(valor)}</dd>
    </div>
  `;
}

export function renderPreviaStep(container) {
  const state = getState();
  const setor = getSetor(state.setorId);
  const formato = getFormato(state.setorId, state.formatoId);

  if (!setor || !formato) {
    goToStep(!setor ? 'setor' : 'formato');
    return;
  }

  // Mostra o texto exatamente como ele sai na placa.
  const aplicar = (t) => (setor.titleCase ? toTitleCase(t) : t);

  container.innerHTML = `
    <div>
      <button type="button" data-back
        class="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 transition-colors hover:text-brand-blue">
        ${icon('arrowLeft', { size: 16 })} Voltar e editar texto
      </button>

      <h1 class="font-fibra text-2xl font-extrabold text-brand-deep">Confira a prévia final</h1>
      <p class="mt-1 mb-5 text-slate-500">Revise o texto e o enquadramento antes de gerar o arquivo de impressão.</p>

      <dl class="mb-5 divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white px-5 py-1 shadow-sm">
        ${linha('Setor', setor.nome)}
        ${linha('Formato', `${formato.nome} · ${formato.mmLargura}×${formato.mmAltura} mm`)}
        ${linha('Texto principal', aplicar(state.texto), { destaque: true })}
        ${state.textoEs.trim() ? linha('Tradução (ES)', aplicar(state.textoEs)) : ''}
      </dl>

      ${
        !state.fits
          ? `<div class="mb-5 flex items-start gap-2.5 rounded-xl border border-brand-coral/30 bg-brand-coral/10 px-4 py-3 text-sm text-brand-coral">
              ${icon('alertTriangle', { size: 17, className: 'mt-0.5' })}
              <p>O texto ainda não cabe na área segura. Volte e reduza o conteúdo antes de continuar.</p>
            </div>`
          : ''
      }

      <button type="button" data-continue ${state.fits ? '' : 'disabled'}
        class="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-blue px-6 py-3 font-fibra font-extrabold text-white shadow-sm transition-colors hover:bg-brand-deep ${
          state.fits ? '' : 'cursor-not-allowed opacity-40'
        }">
        Ir para download ${icon('arrowRight', { size: 18 })}
      </button>
    </div>
  `;

  container.querySelector('[data-back]').addEventListener('click', () => goToStep('edicao'));
  const continueBtn = container.querySelector('[data-continue]');
  continueBtn.addEventListener('click', () => {
    if (!continueBtn.disabled) goToStep('download');
  });
}
