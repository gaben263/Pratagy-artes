// Catálogo de artes prontas (Institucionais Gerais e Hospitalidade).
//
// Diferente das demais telas, aqui não há Canvas: o usuário busca uma arte já
// aprovada, confere as instruções de impressão e baixa o arquivo.
//
// O termo de busca e o filtro de categoria ficam em variáveis de módulo, não no
// estado global: qualquer setState dispara um render completo da aplicação, o
// que recriaria o campo de busca e faria o usuário perder o foco a cada letra
// digitada. A grade é atualizada por manipulação direta do DOM.

import { CATALOGO, CATEGORIAS, buscarCatalogo, getItemCatalogo, tamanhoMm } from '../../data/catalogData.js';
import { getSetor } from '../../data/models.js';
import { getState, goToStep, goBack, entrarNoGerador } from '../../state.js';
import { icon } from '../icons.js';
import { debounce, escapeHtml } from '../../utils.js';
import { openModal, showToast, emptyState } from '../common.js';
import { exportCatalogPNG, exportCatalogPDF } from '../../canvas/export.js';

let termo = '';
let categoria = 'todos';

const totalPorCategoria = (id) =>
  id === 'todos' ? CATALOGO.length : CATALOGO.filter((item) => item.categoria === id).length;

// ------------------------------------------------------------------ Cartões

function cardCatalogo(item) {
  const cat = CATEGORIAS[item.categoria];
  return `
    <button type="button" data-item="${item.id}"
      class="group flex flex-col overflow-hidden rounded-2xl border-2 border-slate-200 bg-white text-left shadow-sm transition-all duration-150
        hover:-translate-y-0.5 hover:border-brand-vivid hover:shadow-md
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue">
      <div class="flex h-36 items-center justify-center border-b border-slate-100 bg-slate-50 p-2.5 transition-colors group-hover:bg-brand-light/25">
        <img src="${item.thumb}" alt="Miniatura da arte ${escapeHtml(item.titulo)}" loading="lazy"
          class="max-h-full max-w-full rounded object-contain shadow-sm ring-1 ring-slate-200" />
      </div>
      <div class="flex flex-1 flex-col p-3">
        <h3 class="font-fibra text-sm font-extrabold leading-snug text-brand-deep">${escapeHtml(item.titulo)}</h3>
        <div class="mt-auto flex flex-wrap items-center gap-1.5 pt-2.5">
          <span class="rounded-md px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white"
            style="background:${cat.cor}">${cat.nome}</span>
          <span class="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
            ${icon('ruler', { size: 11 })} ${escapeHtml(item.size)}
          </span>
        </div>
      </div>
    </button>
  `;
}

function gradeHtml() {
  const itens = buscarCatalogo(termo, categoria);

  if (!itens.length) {
    return emptyState({
      iconName: 'search',
      title: 'Nenhuma arte encontrada',
      description: `Nada corresponde a "${escapeHtml(termo)}". Tente outra palavra — a busca também procura por assunto, como "proibido", "piscina" ou "hóspede".`,
    });
  }

  return `
    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      ${itens.map(cardCatalogo).join('')}
    </div>
  `;
}

// -------------------------------------------------------------------- Modal

function linhaInfo(label, valor, { destaque = false } = {}) {
  return `
    <div class="flex items-baseline justify-between gap-4">
      <dt class="shrink-0 text-sm text-slate-500">${label}</dt>
      <dd class="text-right text-sm ${destaque ? 'font-extrabold text-brand-deep' : 'text-slate-600'}">${valor}</dd>
    </div>
  `;
}

function botaoDownload(kind, iconName, titulo, descricao) {
  return `
    <button type="button" data-baixar="${kind}"
      class="group flex items-center gap-3 rounded-xl border-2 border-slate-200 bg-white p-3 text-left transition-all duration-150 hover:-translate-y-0.5 hover:border-brand-blue hover:shadow-md">
      <span class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-light text-brand-deep transition-colors group-hover:bg-brand-blue group-hover:text-white">
        ${icon(iconName, { size: 19 })}
      </span>
      <span class="min-w-0">
        <span class="block font-fibra text-sm font-extrabold text-brand-deep">${titulo}</span>
        <span class="block truncate text-xs text-slate-500">${descricao}</span>
      </span>
    </button>
  `;
}

/** Milímetros no padrão pt-BR: 124,5 e não 124.5. */
const mm = (valor) => String(valor).replace('.', ',');

function modalHtml(item) {
  const cat = CATEGORIAS[item.categoria];
  const { mmLargura, mmAltura } = tamanhoMm(item);
  const medida = `${mm(mmLargura)}×${mm(mmAltura)} mm`;

  return `
    <div class="max-h-[88vh] overflow-y-auto">
      <header class="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
        <div class="min-w-0">
          <span class="rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white"
            style="background:${cat.cor}">${cat.nome}</span>
          <h3 class="mt-2 font-fibra text-xl font-extrabold leading-tight text-brand-deep">${escapeHtml(item.titulo)}</h3>
        </div>
        <button type="button" data-close aria-label="Fechar"
          class="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
          ${icon('x', { size: 18 })}
        </button>
      </header>

      <div class="grid gap-5 p-5 sm:grid-cols-[minmax(0,260px)_minmax(0,1fr)]">
        <div class="flex items-start justify-center rounded-xl border border-slate-200 bg-slate-50 p-3">
          <img src="${item.thumb}" alt="Prévia da arte ${escapeHtml(item.titulo)}"
            class="max-h-[300px] w-auto max-w-full rounded object-contain shadow-sm ring-1 ring-slate-200" />
        </div>

        <div class="space-y-4">
          <div class="rounded-xl border border-brand-vivid/30 bg-brand-light/25 p-4">
            <p class="mb-3 flex items-center gap-1.5 font-fibra text-[11px] font-extrabold uppercase tracking-wider text-brand-deep">
              ${icon('printer', { size: 14 })} Instruções de impressão
            </p>
            <dl class="space-y-2">
              ${linhaInfo(`<span class="inline-flex items-center gap-1.5">${icon('sticker', { size: 13 })} Material</span>`, escapeHtml(item.printMaterial), { destaque: true })}
              ${linhaInfo(`<span class="inline-flex items-center gap-1.5">${icon('filePdf', { size: 13 })} Melhor formato</span>`, escapeHtml(item.bestFormat), { destaque: true })}
              ${linhaInfo(`<span class="inline-flex items-center gap-1.5">${icon('ruler', { size: 13 })} Tamanho</span>`, escapeHtml(item.size))}
              ${linhaInfo('Dimensões reais', `${medida} · ${item.largura}×${item.altura} px`)}
            </dl>
            ${
              item.materialConfirmado
                ? ''
                : `<p class="mt-3 flex items-start gap-1.5 border-t border-brand-vivid/25 pt-3 text-xs leading-relaxed text-slate-500">
                     ${icon('info', { size: 13, className: 'mt-0.5' })}
                     <span>Material sugerido como padrão do sistema. Confirme com o time de Design antes de mandar imprimir em quantidade.</span>
                   </p>`
            }
          </div>

          <div>
            <p class="mb-2 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              ${icon('tag', { size: 12 })} Também aparece na busca por
            </p>
            <div class="flex flex-wrap gap-1.5">
              ${item.tags
                .map(
                  (t) =>
                    `<span class="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">${escapeHtml(t)}</span>`
                )
                .join('')}
            </div>
          </div>

          <div class="grid gap-2.5 sm:grid-cols-2">
            ${botaoDownload('pdf', 'printer', 'Baixar PDF', `Impressão · ${medida}`)}
            ${botaoDownload('png', 'image', 'Baixar PNG', `Arquivo original · ${item.largura}×${item.altura} px`)}
          </div>
        </div>
      </div>
    </div>
  `;
}

async function baixar(kind, item, btn) {
  const original = btn.innerHTML;
  btn.disabled = true;
  btn.classList.add('cursor-wait', 'opacity-60');
  btn.innerHTML = `
    <span class="spinner inline-flex h-10 w-10 shrink-0 items-center justify-center text-brand-blue">${icon('spinner', { size: 19 })}</span>
    <span class="font-fibra text-sm font-extrabold text-brand-deep">Preparando arquivo…</span>
  `;

  try {
    const { mmLargura, mmAltura } = tamanhoMm(item);
    if (kind === 'png') await exportCatalogPNG(item, item.titulo);
    else await exportCatalogPDF({ arquivo: item.arquivo, mmLargura, mmAltura }, item.titulo);
    showToast(`${item.titulo} — ${kind.toUpperCase()} baixado.`, { type: 'success' });
  } catch (err) {
    console.error(err);
    showToast(
      kind === 'pdf'
        ? 'Não foi possível gerar o PDF desta arte. Baixe o PNG e envie para a gráfica.'
        : 'Não foi possível baixar o arquivo. Verifique a conexão e tente novamente.',
      { type: 'error' }
    );
  } finally {
    btn.disabled = false;
    btn.classList.remove('cursor-wait', 'opacity-60');
    btn.innerHTML = original;
  }
}

function abrirDetalhe(itemId) {
  const item = getItemCatalogo(itemId);
  if (!item) return;

  openModal(modalHtml(item), {
    onMount: (dialog) => {
      dialog.querySelectorAll('[data-baixar]').forEach((btn) => {
        btn.addEventListener('click', () => baixar(btn.dataset.baixar, item, btn));
      });
    },
  });
}

// --------------------------------------------------------------------- Passo

function chipsHtml() {
  const opcoes = [{ id: 'todos', nome: 'Todos' }, ...Object.values(CATEGORIAS)];
  return opcoes
    .map((op) => {
      const ativo = op.id === categoria;
      return `
        <button type="button" data-categoria="${op.id}"
          class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
            ativo
              ? 'border-brand-blue bg-brand-blue text-white shadow-sm'
              : 'border-slate-200 bg-white text-slate-500 hover:border-brand-vivid hover:text-brand-blue'
          }">
          ${escapeHtml(op.nome)}
          <span class="rounded-full px-1.5 text-[10px] tabular-nums ${
            ativo ? 'bg-white/25' : 'bg-slate-100'
          }">${totalPorCategoria(op.id)}</span>
        </button>
      `;
    })
    .join('');
}

function atualizarGrade(container) {
  const grade = container.querySelector('[data-grade]');
  const contador = container.querySelector('[data-contador]');
  if (!grade) return;

  const total = buscarCatalogo(termo, categoria).length;
  grade.innerHTML = gradeHtml();
  contador.textContent = total === 1 ? '1 arte encontrada' : `${total} artes encontradas`;

  grade.querySelectorAll('[data-item]').forEach((btn) => {
    btn.addEventListener('click', () => abrirDetalhe(btn.dataset.item));
  });
}

export function renderCatalogoStep(container) {
  const state = getState();
  const setor = getSetor(state.setorId);

  if (!setor) {
    goToStep('setor');
    return;
  }

  // Remonta só quando muda de setor. Sem esse guarda, cada tecla digitada na
  // busca recriaria o input e o cursor saltaria para o começo.
  const signature = `catalogo-${state.setorId}`;
  if (container.dataset.sig === signature && container.querySelector('[data-catalogo-root]')) {
    return;
  }
  container.dataset.sig = signature;

  const temGerador = setor.formatos?.some((f) => !f.emBreve);

  container.innerHTML = `
    <div data-catalogo-root>
      <button type="button" data-back
        class="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 transition-colors hover:text-brand-blue">
        ${icon('arrowLeft', { size: 16 })} Voltar
      </button>

      <div class="mb-1 flex items-center gap-2">
        <span class="rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white"
          style="background:${setor.corDestaque}">${setor.sigla}</span>
        <span class="text-xs font-semibold text-slate-400">${setor.nome}</span>
      </div>
      <h1 class="font-fibra text-2xl font-extrabold text-brand-deep">Catálogo de artes prontas</h1>
      <p class="mt-1 mb-5 text-slate-500">
        Artes já aprovadas pelo Design, prontas para baixar e imprimir. Busque pelo nome ou pelo assunto.
      </p>

      <div class="mb-4 space-y-3">
        <div class="relative">
          <span class="pointer-events-none absolute left-3.5 top-1/2 flex -translate-y-1/2 text-slate-300">
            ${icon('search', { size: 19 })}
          </span>
          <input type="search" data-busca value="${escapeHtml(termo)}"
            placeholder="Ex: proibido fumar, poço, hóspede, academia…"
            class="w-full rounded-xl border-2 border-slate-200 py-3 pl-11 pr-3 text-sm outline-none transition-colors focus:border-brand-blue focus:ring-2 focus:ring-brand-light" />
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <span class="mr-0.5 inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
            ${icon('filter', { size: 12 })} Filtrar
          </span>
          <span data-chips class="flex flex-wrap gap-2">${chipsHtml()}</span>
        </div>

        <p data-contador class="text-xs font-semibold text-slate-400"></p>
      </div>

      <div data-grade></div>

      ${
        temGerador
          ? `
        <div class="mt-6 border-t border-slate-200 pt-6">
          <p class="mb-3 text-sm text-slate-500">Não encontrou o que precisava?</p>
          <button type="button" data-personalizado
            class="group flex w-full items-center gap-3.5 rounded-2xl border-2 border-dashed border-slate-300 bg-white p-4 text-left transition-all duration-150 hover:border-brand-blue hover:bg-brand-light/20 sm:w-auto">
            <span class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-colors group-hover:bg-brand-blue group-hover:text-white">
              ${icon('plus', { size: 21 })}
            </span>
            <span>
              <span class="block font-fibra font-extrabold text-brand-deep">Criar um aviso personalizado</span>
              <span class="block text-xs text-slate-500">Escreva o seu próprio texto em um modelo A3 ou A4 oficial</span>
            </span>
          </button>
        </div>
      `
          : ''
      }
    </div>
  `;

  container.querySelector('[data-back]').addEventListener('click', goBack);
  container.querySelector('[data-personalizado]')?.addEventListener('click', entrarNoGerador);

  const busca = container.querySelector('[data-busca]');
  const aplicarBusca = debounce(() => {
    termo = busca.value;
    atualizarGrade(container);
  }, 140);
  busca.addEventListener('input', aplicarBusca);

  container.querySelector('[data-chips]').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-categoria]');
    if (!btn) return;
    categoria = btn.dataset.categoria;
    container.querySelector('[data-chips]').innerHTML = chipsHtml();
    atualizarGrade(container);
  });

  atualizarGrade(container);
}
