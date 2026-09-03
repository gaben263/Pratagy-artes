import { getSetor, getFormato } from '../../data/models.js';
import { getState, goToStep, goBack } from '../../state.js';
import { icon } from '../icons.js';

export function renderModeloStep(container) {
  const state = getState();
  const setor = getSetor(state.setorId);
  const formato = getFormato(state.setorId, state.formatoId);

  if (!setor || !formato) {
    goToStep(!setor ? 'setor' : 'formato');
    return;
  }

  container.innerHTML = `
    <div>
      <button type="button" data-back
        class="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 transition-colors hover:text-brand-blue">
        ${icon('arrowLeft', { size: 16 })} Voltar
      </button>

      <h1 class="font-fibra text-2xl font-extrabold text-brand-deep">Confirme o modelo oficial</h1>
      <p class="mt-1 mb-5 text-slate-500">Este é o fundo aprovado da sua placa. Você só precisa preencher o texto.</p>

      <div class="mb-4 flex flex-col items-center gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row">
        <img src="${formato.imagem}" alt="Modelo ${formato.nome}"
          class="h-32 w-32 rounded-lg border border-slate-100 bg-slate-50 object-contain p-2" />
        <div class="flex-1">
          <span class="rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white"
            style="background:${setor.corDestaque}">${setor.sigla}</span>
          <h3 class="mt-2 font-fibra text-lg font-extrabold text-brand-deep">${formato.nome}</h3>
          <p class="text-sm text-slate-500">${formato.descricao}</p>
          <div class="mt-3 flex flex-wrap gap-1.5">
            <span class="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-500">
              ${icon('ruler', { size: 12 })} ${formato.mmLargura}×${formato.mmAltura} mm
            </span>
            <span class="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-500">
              ${icon('image', { size: 12 })} ${formato.largura}×${formato.altura} px
            </span>
          </div>
        </div>
      </div>

      <div class="mb-5 flex items-start gap-2.5 rounded-xl border border-brand-vivid/30 bg-brand-light/25 px-4 py-3 text-sm text-brand-deep">
        ${icon('sparkles', { size: 17, className: 'mt-0.5' })}
        <p>O texto é posicionado automaticamente dentro da área segura, sem sobrepor as ondas, o sol ou as palmeiras do fundo.</p>
      </div>

      <button type="button" data-continue
        class="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-blue px-6 py-3 font-fibra font-extrabold text-white shadow-sm transition-colors hover:bg-brand-deep sm:w-auto">
        Usar este modelo ${icon('arrowRight', { size: 18 })}
      </button>
    </div>
  `;

  container.querySelector('[data-back]').addEventListener('click', goBack);
  container.querySelector('[data-continue]').addEventListener('click', () => goToStep('edicao'));
}
