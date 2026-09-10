import { getSetor } from '../../data/models.js';
import { getState, setState, goToStep, goBack } from '../../state.js';
import { icon } from '../icons.js';
import { confirmModal } from '../common.js';
import { preloadSetorImages } from '../previewPanel.js';

async function handleSelect(formatoId) {
  const state = getState();
  const temTexto = state.texto.trim() || state.corpo.trim();
  const trocando = state.formatoId && state.formatoId !== formatoId && temTexto;

  if (trocando) {
    const ok = await confirmModal({
      title: 'Trocar de formato?',
      message:
        'Ao trocar o formato, o texto já digitado será descartado, pois a área útil da arte muda de tamanho. Deseja continuar?',
      confirmLabel: 'Trocar formato',
      tone: 'danger',
    });
    if (!ok) return;
    setState({ texto: '', textoEs: '', corpo: '', libraryEntryId: null });
  }

  setState({ formatoId });
  goToStep('modelo');
}

/** Peças digitais (Acqua Park) são medidas em pixels; as de impressão, em mm. */
function medidaDoFormato(formato) {
  return formato.digital
    ? `${formato.largura}×${formato.altura} px`
    : `${formato.mmLargura}×${formato.mmAltura} mm`;
}

function cardEmBreve(formato) {
  const campos = (formato.camposFuturos || [])
    .map(
      (campo) => `
        <span class="inline-flex items-center gap-1 rounded-md bg-white/70 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
          ${icon(campo.icone, { size: 11 })} ${campo.label}
        </span>
      `
    )
    .join('');

  return `
    <div aria-disabled="true"
      class="relative overflow-hidden rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 text-left">
      <span class="absolute right-2.5 top-2.5 z-10 inline-flex items-center gap-1 rounded-full bg-status-amber px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white shadow">
        ${icon('clock', { size: 11 })} Em breve
      </span>
      <div class="flex h-28 items-center justify-center border-b border-slate-200 bg-white/60 p-3">
        <img src="${formato.imagem}" alt="Prévia de ${formato.nome}"
          class="max-h-full max-w-full rounded object-contain opacity-50 shadow-sm ring-1 ring-slate-200" loading="lazy" />
      </div>
      <div class="p-3.5">
        <h3 class="font-fibra font-extrabold text-slate-500">${formato.nome}</h3>
        <p class="mt-0.5 text-xs text-slate-400">${formato.descricao}</p>
        ${
          campos
            ? `<p class="mt-2.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Vai pedir</p>
               <div class="mt-1.5 flex flex-wrap gap-1.5">${campos}</div>`
            : ''
        }
      </div>
    </div>
  `;
}

function cardFormato(formato, selected) {
  const ratio = formato.largura / formato.altura;
  const orientacao = ratio > 1.05 ? 'Paisagem' : ratio < 0.95 ? 'Retrato' : 'Quadrado';

  return `
    <button type="button" data-formato="${formato.id}"
      class="group relative overflow-hidden rounded-2xl border-2 bg-white text-left shadow-sm transition-all duration-150
        hover:-translate-y-0.5 hover:border-brand-vivid hover:shadow-md
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue
        ${selected ? 'border-brand-blue shadow-md' : 'border-slate-200'}">
      ${
        selected
          ? `<span class="absolute right-2.5 top-2.5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-brand-blue text-white shadow">
              ${icon('check', { size: 12, strokeWidth: 3 })}
            </span>`
          : ''
      }
      <div class="flex h-28 items-center justify-center border-b border-slate-100 p-3 transition-colors
        ${selected ? 'bg-brand-light/40' : 'bg-slate-50 group-hover:bg-brand-light/25'}">
        <img src="${formato.imagem}" alt="Modelo ${formato.nome}"
          class="max-h-full max-w-full rounded object-contain shadow-sm ring-1 ring-slate-200" loading="lazy" />
      </div>
      <div class="p-3.5">
        <h3 class="font-fibra font-extrabold text-brand-deep">${formato.nome}</h3>
        <p class="mt-0.5 text-xs text-slate-500">${formato.descricao}</p>
        <div class="mt-2.5 flex flex-wrap items-center gap-1.5">
          <span class="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
            ${icon('ruler', { size: 11 })} ${medidaDoFormato(formato)}
          </span>
          <span class="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">${orientacao}</span>
        </div>
      </div>
    </button>
  `;
}

export function renderFormatoStep(container) {
  const state = getState();
  const setor = getSetor(state.setorId);

  if (!setor) {
    goToStep('setor');
    return;
  }

  preloadSetorImages(setor);

  const titulo =
    setor.tipoTexto === 'comunicado' ? 'Qual modelo de comunicado?' : 'Qual o formato da arte?';
  const subtitulo =
    setor.tipoTexto === 'comunicado'
      ? 'Escolha o fundo do comunicado que será publicado.'
      : 'Escolha o tamanho que será impresso.';

  container.innerHTML = `
    <div>
      <button type="button" data-back
        class="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 transition-colors hover:text-brand-blue">
        ${icon('arrowLeft', { size: 16 })} Voltar
      </button>

      <div class="mb-1 flex items-center gap-2">
        <span class="rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white"
          style="background:${setor.corDestaque}">${setor.sigla}</span>
        <span class="text-xs font-semibold text-slate-400">${setor.nome}</span>
      </div>
      <h1 class="font-fibra text-2xl font-extrabold text-brand-deep">${titulo}</h1>
      <p class="mt-1 mb-5 text-slate-500">${subtitulo}</p>

      <div class="grid gap-3 sm:grid-cols-2 ${setor.formatos.length > 2 ? 'lg:grid-cols-3' : ''}">
        ${setor.formatos
          .map((formato) =>
            formato.emBreve ? cardEmBreve(formato) : cardFormato(formato, state.formatoId === formato.id)
          )
          .join('')}
      </div>

      ${
        setor.id === 'governanca'
          ? `<div class="mt-5 flex items-start gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
              ${icon('info', { size: 17, className: 'mt-0.5 text-slate-400' })}
              <p>Procurando os cartões de hóspede, a carta de check-out ou os avisos de apartamento?
              Essas artes já existem prontas no <strong class="font-bold text-brand-deep">catálogo de Institucionais Gerais</strong>,
              no filtro "Hospitalidade".</p>
            </div>`
          : ''
      }
    </div>
  `;

  container.querySelector('[data-back]').addEventListener('click', goBack);
  container.querySelectorAll('[data-formato]').forEach((btn) => {
    btn.addEventListener('click', () => handleSelect(btn.dataset.formato));
  });
}
