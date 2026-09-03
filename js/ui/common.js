import { icon } from './icons.js';

let toastTimer = null;

export function showToast(message, { type = 'info', duration = 3200 } = {}) {
  const root = document.getElementById('toast-root');
  if (!root) return;

  const colors = {
    info: 'bg-brand-deep text-white',
    success: 'bg-status-green text-white',
    error: 'bg-brand-coral text-white',
  };
  const iconName = { info: 'sparkles', success: 'checkCircle', error: 'alertTriangle' }[type];

  root.innerHTML = `
    <div class="toast-enter flex max-w-sm items-center gap-3 rounded-xl px-4 py-3 shadow-lg ${colors[type]}">
      ${icon(iconName, { size: 18 })}
      <p class="text-sm font-semibold leading-snug">${message}</p>
    </div>
  `;
  root.classList.remove('hidden');

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    root.classList.add('hidden');
    root.innerHTML = '';
  }, duration);
}

/**
 * Modal de confirmação genérico. Retorna uma Promise<boolean>.
 */
export function confirmModal({ title, message, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', tone = 'default' }) {
  return new Promise((resolve) => {
    const root = document.getElementById('modal-root');
    const confirmClasses =
      tone === 'danger'
        ? 'bg-brand-coral hover:brightness-90 text-white'
        : 'bg-brand-blue hover:bg-brand-deep text-white';

    root.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
        <div class="modal-pop w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
          <h3 class="mb-2 font-fibra text-lg font-extrabold text-brand-deep">${title}</h3>
          <p class="mb-6 text-sm leading-relaxed text-slate-600">${message}</p>
          <div class="flex justify-end gap-3">
            <button type="button" data-action="cancel" class="rounded-lg px-4 py-2 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100">${cancelLabel}</button>
            <button type="button" data-action="confirm" class="rounded-lg px-4 py-2 text-sm font-bold transition-all ${confirmClasses}">${confirmLabel}</button>
          </div>
        </div>
      </div>
    `;
    root.classList.remove('hidden');

    const close = (result) => {
      root.classList.add('hidden');
      root.innerHTML = '';
      resolve(result);
    };

    root.querySelector('[data-action="cancel"]').addEventListener('click', () => close(false));
    root.querySelector('[data-action="confirm"]').addEventListener('click', () => close(true));
    root.addEventListener(
      'click',
      (e) => {
        if (e.target === e.currentTarget.firstElementChild) close(false);
      },
      { once: true }
    );
  });
}

export function emptyState({ iconName = 'image', title, description }) {
  return `
    <div class="flex flex-col items-center justify-center px-6 py-16 text-center text-slate-400">
      <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-300">
        ${icon(iconName, { size: 28 })}
      </div>
      <p class="mb-1 font-bold text-slate-500">${title}</p>
      <p class="max-w-xs text-sm">${description}</p>
    </div>
  `;
}
