import { SETORES, getSetor } from '../../data/models.js';
import { CATALOGO } from '../../data/catalogData.js';
import { getState, setState, goToStep, primeiroPasso } from '../../state.js';
import { icon } from '../icons.js';
import { confirmModal } from '../common.js';

const DESCRICOES = {
  ab: 'Identificação de pratos do buffet e artes prontas de alimentos e bebidas.',
  manutencao: 'Avisos e sinalizações do resort, já aprovados e prontos para imprimir.',
  governanca: 'Cartões de hóspede, check-out e a carta de boas-vindas personalizável.',
  acquapark: 'Comunicados do parque aquático para WhatsApp e murais.',
};

/** Rodapé do cartão: o setor de catálogo conta artes prontas, os demais, formatos. */
function resumoDoSetor(setor) {
  const artes = CATALOGO.filter((item) => item.categoria === setor.categoriaCatalogo).length;

  const formatos = setor.formatos.length;

  if (setor.fluxo === 'catalogo') {
    // Catálogo com vários formatos no gerador (A&B) anuncia as duas modalidades.
    // Com um formato só (a carta da Hospitalidade) o gerador é acessório e o
    // rodapé fala apenas das artes prontas.
    return formatos > 1
      ? { iconName: 'layers', texto: `${formatos} formatos + ${artes} prontas` }
      : { iconName: 'layers', texto: `${artes} artes prontas` };
  }
  return { iconName: 'layers', texto: `${formatos} ${formatos === 1 ? 'modelo' : 'formatos'}` };
}

async function handleSelect(setorId) {
  const state = getState();
  const trocandoComTextoPendente =
    state.setorId && state.setorId !== setorId && state.texto.trim();

  if (trocandoComTextoPendente) {
    const ok = await confirmModal({
      title: 'Trocar de setor?',
      message: 'Ao trocar de setor, o texto já digitado nesta arte será descartado. Deseja continuar?',
      confirmLabel: 'Trocar setor',
      tone: 'danger',
    });
    if (!ok) return;
  }

  setState({
    setorId,
    formatoId: null,
    modo: null,
    texto: '',
    textoEs: '',
    libraryEntryId: null,
    fits: true,
    palavraLonga: null,
    exported: false,
  });

  goToStep(primeiroPasso(getSetor(setorId)));
}

export function renderSetorStep(container) {
  const state = getState();

  container.innerHTML = `
    <div>
      <h1 class="font-fibra text-2xl font-extrabold text-brand-deep">Qual é o setor da arte?</h1>
      <p class="mt-1 mb-5 text-slate-500">Cada setor tem seus próprios modelos oficiais já aprovados.</p>

      <!-- 2 colunas mesmo em telas largas: os breakpoints do Tailwind olham a
           janela, não o container, e aqui a coluna da prévia já consome 400px.
           Com 4 colunas os nomes dos setores quebravam em duas linhas. -->
      <div class="grid gap-3 sm:grid-cols-2">
        ${Object.values(SETORES)
          .map((setor) => {
            const selected = state.setorId === setor.id;
            const resumo = resumoDoSetor(setor);
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
                  ${icon(resumo.iconName, { size: 13 })}
                  ${resumo.texto}
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
