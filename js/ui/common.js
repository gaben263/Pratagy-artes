import { icon } from './icons.js';
import { escapeHtml } from '../utils.js';

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

/**
 * Modal genérico de conteúdo (diferente do confirmModal, que só decide sim/não).
 *
 * Fecha no Esc, no clique fora e em qualquer elemento com [data-close].
 * Devolve a função de fechar, para quem abriu poder encerrar por conta própria.
 */
export function openModal(contentHtml, { onMount, maxWidth = 'max-w-3xl' } = {}) {
  const root = document.getElementById('modal-root');

  root.innerHTML = `
    <div data-overlay
      class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm sm:items-center"
      role="dialog" aria-modal="true">
      <div data-dialog class="modal-pop my-auto w-full ${maxWidth} overflow-hidden rounded-2xl bg-white shadow-2xl">
        ${contentHtml}
      </div>
    </div>
  `;
  root.classList.remove('hidden');

  const onKey = (e) => {
    if (e.key === 'Escape') close();
  };

  function close() {
    document.removeEventListener('keydown', onKey);
    root.classList.add('hidden');
    root.innerHTML = '';
  }

  document.addEventListener('keydown', onKey);
  root.querySelector('[data-overlay]').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) close();
  });
  root.querySelectorAll('[data-close]').forEach((btn) => btn.addEventListener('click', close));

  onMount?.(root.querySelector('[data-dialog]'), close);
  return close;
}

/**
 * Por que o texto não coube — a mesma explicação em todos os pontos que
 * bloqueiam o avanço (prévia, Texto, Prévia e Download), para que a pessoa
 * leia sempre a mesma coisa onde quer que esteja.
 *
 * Quando a culpa é de uma palavra específica, ela é nomeada: "reduza o texto"
 * sozinho mandaria a pessoa cortar frases inteiras quando o problema é um
 * termo só.
 *
 * @returns {{ titulo: string, acao: string }} HTML já escapado.
 */
export function motivoNaoCoube(state) {
  if (state.avisoEncaixe) {
    return { titulo: escapeHtml(state.avisoEncaixe), acao: 'Abrevie o texto ou reduza a quantidade de pessoas.' };
  }
  if (state.palavraLonga) {
    return {
      titulo: `A palavra “${escapeHtml(state.palavraLonga)}” é muito longa para este formato.`,
      acao: 'Reduza o texto ou escolha outro modelo.',
    };
  }
  return {
    titulo: 'O texto ultrapassa a área segura.',
    acao: 'Reduza o texto para liberar a exportação.',
  };
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
