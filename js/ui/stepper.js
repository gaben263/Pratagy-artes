import { STEP_ORDER, STEP_LABELS, getState, goToStep, canReachStep } from '../state.js';
import { icon } from './icons.js';

export function renderStepper(container) {
  const state = getState();
  const currentIdx = STEP_ORDER.indexOf(state.step);

  // --- Desktop: trilha horizontal com conectores que preenchem ao avançar ---
  const desktopItems = STEP_ORDER.map((id, idx) => {
    const label = STEP_LABELS[id];
    const reachable = canReachStep(id);
    const isCurrent = id === state.step;
    const isDone = idx < currentIdx;

    const circle = isCurrent
      ? 'bg-brand-blue text-white ring-4 ring-brand-light shadow-sm'
      : isDone
      ? 'bg-status-green text-white'
      : reachable
      ? 'bg-white text-brand-blue border-2 border-brand-vivid'
      : 'bg-slate-50 text-slate-300 border-2 border-slate-200';

    const text = isCurrent
      ? 'text-brand-deep font-extrabold'
      : isDone
      ? 'text-slate-600 font-semibold'
      : reachable
      ? 'text-slate-500 font-medium'
      : 'text-slate-300 font-medium';

    const connector =
      idx === 0
        ? ''
        : `<span class="h-0.5 flex-1 min-w-[10px] rounded-full ${
            idx <= currentIdx ? 'bg-status-green' : 'bg-slate-200'
          }"></span>`;

    return `
      ${connector}
      <button type="button" data-step="${id}" ${reachable ? '' : 'disabled'}
        class="group flex shrink-0 items-center gap-2 rounded-lg px-1.5 py-1 transition-colors ${
          reachable ? 'cursor-pointer hover:bg-slate-50' : 'cursor-not-allowed'
        }">
        <span class="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-extrabold transition-all ${circle}">
          ${isDone ? icon('check', { size: 14, strokeWidth: 3 }) : idx + 1}
        </span>
        <span class="whitespace-nowrap text-xs ${text}">${label}</span>
      </button>
    `;
  }).join('');

  // --- Mobile: rótulo do passo atual + barra de progresso ---
  const progressPct = ((currentIdx + 1) / STEP_ORDER.length) * 100;

  container.innerHTML = `
    <div class="mx-auto max-w-6xl px-4">
      <div class="hidden items-center py-2.5 md:flex">${desktopItems}</div>
      <div class="py-2.5 md:hidden">
        <div class="mb-1.5 flex items-baseline justify-between">
          <span class="text-xs font-extrabold text-brand-deep">${STEP_LABELS[state.step]}</span>
          <span class="text-[11px] text-slate-400">Passo ${currentIdx + 1} de ${STEP_ORDER.length}</span>
        </div>
        <div class="h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div class="h-full rounded-full bg-brand-blue transition-all duration-300" style="width:${progressPct}%"></div>
        </div>
      </div>
    </div>
  `;

  container.querySelectorAll('[data-step]').forEach((btn) => {
    btn.addEventListener('click', () => goToStep(btn.dataset.step));
  });
}
