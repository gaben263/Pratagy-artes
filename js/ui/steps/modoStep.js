// Tela de escolha de caminho, usada pelos setores de `fluxo: 'misto'`.
//
// Hoje só o A&B é misto. Ele podia ter reaproveitado o padrão da Hospitalidade
// — catálogo com um cartão de "criar" no topo —, mas ali o catálogo é o prato
// principal e o gerador é acessório. No A&B a relação é inversa: criar a
// identificação de um prato é a tarefa diária e as artes prontas são consulta
// ocasional. Enterrar o gerador atrás de uma grade de miniaturas inverteria a
// hierarquia de uso, então os dois caminhos aparecem com o mesmo peso.

import { getSetor } from '../../data/models.js';
import { CATALOGO } from '../../data/catalogData.js';
import { getState, goToStep, goBack, entrarNoGerador, entrarNoCatalogo } from '../../state.js';
import { icon } from '../icons.js';

function cardModo({ id, modo, corDestaque, rodape }) {
  return `
    <button type="button" data-modo="${id}"
      class="group flex flex-col rounded-2xl border-2 border-slate-200 bg-white p-5 text-left shadow-sm transition-all duration-150
        hover:-translate-y-0.5 hover:border-brand-vivid hover:shadow-md
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue">
      <span class="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-sm"
        style="background:${corDestaque}">
        ${icon(modo.icone, { size: 21 })}
      </span>
      <span class="font-fibra font-extrabold text-brand-deep">${modo.titulo}</span>
      <span class="mt-1 text-sm leading-snug text-slate-500">${modo.descricao}</span>
      <span class="mt-3 flex items-center gap-1.5 border-t border-slate-100 pt-3 text-xs font-semibold text-slate-400">
        ${icon('layers', { size: 13 })} ${rodape}
        <span class="ml-auto text-slate-300 transition-colors group-hover:text-brand-blue">
          ${icon('arrowRight', { size: 18 })}
        </span>
      </span>
    </button>
  `;
}

export function renderModoStep(container) {
  const state = getState();
  const setor = getSetor(state.setorId);

  if (!setor?.modos) {
    goToStep('setor');
    return;
  }

  const totalFormatos = setor.formatos.length;
  const totalArtes = CATALOGO.filter((item) => item.categoria === setor.categoriaCatalogo).length;

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
      <h1 class="font-fibra text-2xl font-extrabold text-brand-deep">O que você quer fazer?</h1>
      <p class="mt-1 mb-5 text-slate-500">Crie uma arte do zero ou baixe uma que já está pronta.</p>

      <div class="grid gap-3 sm:grid-cols-2">
        ${cardModo({
          id: 'gerador',
          modo: setor.modos.gerador,
          corDestaque: setor.corDestaque,
          rodape: `${totalFormatos} ${totalFormatos === 1 ? 'formato' : 'formatos'}`,
        })}
        ${cardModo({
          id: 'catalogo',
          modo: setor.modos.catalogo,
          corDestaque: setor.corDestaque,
          rodape: `${totalArtes} ${totalArtes === 1 ? 'arte pronta' : 'artes prontas'}`,
        })}
      </div>
    </div>
  `;

  container.querySelector('[data-back]').addEventListener('click', goBack);
  container.querySelectorAll('[data-modo]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.dataset.modo === 'catalogo') entrarNoCatalogo();
      else entrarNoGerador();
    });
  });
}
