import { SETORES } from '../../data/models.js';
import { getState, setState, goToStep } from '../../state.js';
import { icon } from '../icons.js';
import { confirmModal } from '../common.js';

const DESCRICOES = {
  ab: 'Identificação de pratos e bebidas do buffet, com tradução em espanhol.',
  manutencao: 'Avisos e sinalizações técnicas das áreas do resort.',
  governanca: 'Carta de boas-vindas para os apartamentos.',
};

async function handleSelect(setorId) {
  const state = getState();
  const trocandoComTextoPendente = state.setorId && state.setorId !== setorId && state.texto.trim();

  if (trocandoComTextoPendente) {
    const ok = await confirmModal({
      title: 'Trocar de setor?',
      message: 'Ao trocar de setor, o texto já digitado nesta placa será descartado. Deseja continuar?',
      confirmLabel: 'Trocar setor',
      tone: 'danger',
    });
    if (!ok) return;
  }

  setState({
    setorId,
    formatoId: null,
    texto: '',
    textoEs: '',
    libraryEntryId: null,
    fits: true,
    exported: false,
  });
  goToStep('formato');
}

export function renderSetorStep(container) {
  const state = getState();

  container.innerHTML = `
    <div>
      <h1 class="font-fibra text-2xl font-extrabold text-brand-deep">Qual é o setor da placa?</h1>
      <p class="mt-1 mb-5 text-slate-500">Cada setor tem seus próprios modelos oficiais já aprovados.</p>

      <div class="grid gap-3 sm:grid-cols-3">
        ${Object.values(SETORES)
          .map((setor) => {
            const selected = state.setorId === setor.id;
            return `
              <button type="button" data-setor="${setor.id}"
                class="group relative flex flex-col rounded-2xl border-2 bg-white p-5 text-left shadow-sm transition-all duration-150
                  hover:-translate-y-0.5 hover:border-brand-vivid hover:shadow-md
                  focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue
                  ${selected ? 'border-brand-blue bg-brand-light/30 shadow-md' : 'border-slate-200'}">
                ${
                  selected
                    ? `<span class="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-brand-blue text-white">
                        ${icon('check', { size: 12, strokeWidth: 3 })}
                      </span>`
                    : ''
                }
                <span class="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-sm"
                  style="background:${setor.corDestaque}">
                  ${icon(setor.icone, { size: 21 })}
                </span>
                <span class="mb-1.5 inline-flex w-fit rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  ${setor.sigla}
                </span>
                <span class="font-fibra font-extrabold text-brand-deep">${setor.nome}</span>
                <span class="mt-1 text-sm leading-snug text-slate-500">${DESCRICOES[setor.id]}</span>
                <span class="mt-3 flex items-center gap-1.5 border-t border-slate-100 pt-3 text-xs font-semibold text-slate-400">
                  ${icon('layers', { size: 13 })}
                  ${setor.formatos.length} ${setor.formatos.length === 1 ? 'modelo' : 'formatos'}
                </span>
              </button>
            `;
          })
          .join('')}
      </div>

      <div class="mt-5 flex items-start gap-2.5 rounded-xl border border-brand-vivid/30 bg-brand-light/25 px-4 py-3 text-sm text-brand-deep">
        ${icon('info', { size: 17, className: 'mt-0.5' })}
        <p>Você vai escolher o formato, preencher o texto e baixar o arquivo pronto para impressão. O layout e as cores seguem o padrão oficial automaticamente.</p>
      </div>
    </div>
  `;

  container.querySelectorAll('[data-setor]').forEach((btn) => {
    btn.addEventListener('click', () => handleSelect(btn.dataset.setor));
  });
}
