import { getSetor, getFormato } from '../../data/models.js';
import { getState, setState, goToStep, goBack } from '../../state.js';
import { icon } from '../icons.js';
import { debounce, escapeHtml, toTitleCase } from '../../utils.js';
import { loadLibrary, searchLibrary, getLoadedLibrary } from '../../data/docxLibrary.js';

// Listener único (registrado uma vez) que fecha o dropdown de busca ao
// clicar fora dele, evitando acumular listeners a cada remontagem do passo.
document.addEventListener('click', (e) => {
  const wrap = document.querySelector('[data-search-wrap]');
  const results = document.querySelector('[data-search-results]');
  if (wrap && results && !wrap.contains(e.target)) {
    results.classList.add('hidden');
  }
});

function updateContinueState(container) {
  const state = getState();
  const btn = container.querySelector('[data-continue]');
  if (!btn) return;
  const hasText = state.texto.trim().length > 0;
  const enabled = hasText && state.fits;
  btn.disabled = !enabled;
  btn.classList.toggle('opacity-40', !enabled);
  btn.classList.toggle('cursor-not-allowed', !enabled);

  const hint = container.querySelector('[data-continue-hint]');
  if (hint) {
    hint.textContent = !hasText
      ? 'Digite o texto da placa para continuar.'
      : !state.fits
      ? 'Reduza o texto: ele não cabe na área segura (veja o alerta na prévia).'
      : '';
  }
}

function shell({ setor, formato, bodyHtml }) {
  return `
    <div data-edicao-root>
      <button type="button" data-back
        class="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 transition-colors hover:text-brand-blue">
        ${icon('arrowLeft', { size: 16 })} Voltar
      </button>

      <div class="mb-1 flex items-center gap-2">
        <span class="rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white"
          style="background:${setor.corDestaque}">${setor.sigla}</span>
        <span class="text-xs font-semibold text-slate-400">${formato.nome} &middot; ${formato.mmLargura}×${formato.mmAltura} mm</span>
      </div>
      <h1 class="font-fibra text-2xl font-extrabold text-brand-deep">Preencha o texto da placa</h1>
      <p class="mt-1 mb-5 text-slate-500">A prévia é atualizada automaticamente conforme você digita.</p>

      <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        ${bodyHtml}
      </div>

      <div class="mt-5 flex items-center gap-4">
        <button type="button" data-continue disabled
          class="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-brand-blue px-6 py-3 font-fibra font-extrabold text-white opacity-40 shadow-sm transition-colors hover:bg-brand-deep">
          Ir para a prévia ${icon('arrowRight', { size: 18 })}
        </button>
        <p data-continue-hint class="max-w-[220px] text-xs text-slate-400"></p>
      </div>
    </div>
  `;
}

function wireCommon(container) {
  container.querySelector('[data-back]').addEventListener('click', goBack);
  const continueBtn = container.querySelector('[data-continue]');
  continueBtn.addEventListener('click', () => {
    if (continueBtn.disabled) return;
    goToStep('previa');
  });
}

// ---------- Setor A&B: busca com autocomplete ----------

function renderAutocompleteResults(entries) {
  if (!entries.length) {
    return `<p class="px-4 py-3 text-sm text-slate-400">Nenhum item encontrado. Você pode digitar o nome manualmente abaixo.</p>`;
  }
  return entries
    .map(
      (e) => `
      <button type="button" data-entry="${e.id}"
        class="flex w-full items-start justify-between gap-3 border-b border-slate-100 px-4 py-2.5 text-left transition-colors last:border-0 hover:bg-brand-light/40">
        <span>
          <span class="block text-sm font-bold text-brand-deep">${escapeHtml(e.pt)}</span>
          <span class="block text-xs text-slate-500">${escapeHtml(e.es)}</span>
        </span>
        <span class="flex shrink-0 flex-col items-end gap-1">
          <span class="text-[10px] text-slate-400">${escapeHtml(e.categoria)}</span>
          ${
            e.status === 'SUGESTAO'
              ? '<span class="rounded bg-status-yellow/30 px-1.5 py-0.5 text-[10px] font-bold text-status-amber">sugestão</span>'
              : ''
          }
        </span>
      </button>
    `
    )
    .join('');
}

/**
 * Habilita o campo de busca e esconde o indicador de carregamento.
 * Precisa rodar tanto ao terminar o carregamento quanto ao remontar a tela com
 * a biblioteca já em cache — era exatamente esse segundo caso que deixava o
 * campo travado em "Carregando biblioteca...".
 */
function marcarBuscaPronta(container, total) {
  const searchInput = container.querySelector('[data-search-input]');
  const loadingEl = container.querySelector('[data-search-loading]');
  if (searchInput) {
    searchInput.disabled = false;
    searchInput.placeholder = `Buscar entre ${total} itens…`;
  }
  loadingEl?.classList.add('hidden');
}

function marcarBuscaComErro(container) {
  const searchInput = container.querySelector('[data-search-input]');
  const loadingEl = container.querySelector('[data-search-loading]');
  if (searchInput) {
    searchInput.disabled = true;
    searchInput.placeholder = 'Biblioteca indisponível';
  }
  if (loadingEl) {
    loadingEl.classList.remove('hidden');
    loadingEl.innerHTML = `
      <p class="flex items-center gap-2 text-sm text-brand-coral">
        ${icon('alertTriangle', { size: 15 })}
        Não foi possível carregar a biblioteca. Você ainda pode digitar o nome manualmente.
      </p>
    `;
  }
}

function wireBuscaAB(container, initialState) {
  const searchInput = container.querySelector('[data-search-input]');
  const results = container.querySelector('[data-search-results]');
  const ptInput = container.querySelector('[data-pt-input]');
  const esInput = container.querySelector('[data-es-input]');

  ptInput.value = initialState.texto;
  esInput.value = initialState.textoEs;

  const commit = debounce(() => {
    setState({ texto: ptInput.value, textoEs: esInput.value });
  }, 150);

  ptInput.addEventListener('input', commit);
  esInput.addEventListener('input', commit);

  function selectEntry(entry) {
    ptInput.value = entry.pt;
    esInput.value = entry.es;
    setState({ texto: entry.pt, textoEs: entry.es, libraryEntryId: entry.id });
    results.classList.add('hidden');
    searchInput.value = '';
  }

  const runSearch = debounce((query) => {
    const library = getLoadedLibrary();
    if (!library || !query.trim()) {
      results.classList.add('hidden');
      results.innerHTML = '';
      return;
    }
    results.innerHTML = renderAutocompleteResults(searchLibrary(library, query));
    results.classList.remove('hidden');
  }, 120);

  searchInput.addEventListener('input', (e) => runSearch(e.target.value));
  searchInput.addEventListener('focus', (e) => {
    if (e.target.value.trim()) runSearch(e.target.value);
  });
  results.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-entry]');
    const library = getLoadedLibrary();
    if (!btn || !library) return;
    const entry = library.find((it) => it.id === btn.dataset.entry);
    if (entry) selectEntry(entry);
  });

  // A biblioteca já pode estar em memória (pré-carregada na inicialização ou
  // por uma visita anterior a esta tela). Nesse caso, habilita na hora.
  const cached = getLoadedLibrary();
  if (cached) {
    marcarBuscaPronta(container, cached.length);
    return;
  }

  loadLibrary()
    .then((entries) => marcarBuscaPronta(container, entries.length))
    .catch((err) => {
      console.error(err);
      marcarBuscaComErro(container);
    });
}

function bodyAB() {
  const cached = getLoadedLibrary();
  const pronto = Boolean(cached);

  return `
    <div class="space-y-4">
      <div data-search-wrap class="relative">
        <label class="mb-1.5 block text-sm font-bold text-slate-600">Buscar na biblioteca de pratos</label>
        <div class="relative">
          <span class="pointer-events-none absolute left-3 top-1/2 flex -translate-y-1/2 text-slate-300">
            ${icon('search', { size: 17 })}
          </span>
          <input type="text" data-search-input ${pronto ? '' : 'disabled'}
            placeholder="${pronto ? `Buscar entre ${cached.length} itens…` : 'Carregando biblioteca…'}"
            class="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none transition-colors focus:border-brand-blue focus:ring-2 focus:ring-brand-light disabled:bg-slate-50 disabled:text-slate-400" />
        </div>
        <div data-search-loading class="mt-2 flex items-center gap-2 text-sm text-slate-400 ${pronto ? 'hidden' : ''}">
          <span class="spinner inline-flex text-brand-blue">${icon('spinner', { size: 14 })}</span>
          Carregando biblioteca de pratos…
        </div>
        <div data-search-results
          class="absolute z-20 mt-1 hidden max-h-72 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg"></div>
      </div>

      <div class="border-t border-slate-100 pt-4">
        <label class="mb-1.5 block text-sm font-bold text-slate-600">Nome do prato (português)</label>
        <input type="text" data-pt-input maxlength="60" placeholder="Ex: Filé de peixe"
          class="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition-colors focus:border-brand-blue focus:ring-2 focus:ring-brand-light" />
      </div>

      <div>
        <label class="mb-1.5 flex items-center gap-1.5 text-sm font-bold text-slate-600">
          ${icon('globe', { size: 14, className: 'text-slate-400' })} Tradução em espanhol
        </label>
        <input type="text" data-es-input maxlength="60" placeholder="Ex: Filete de pescado"
          class="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition-colors focus:border-brand-blue focus:ring-2 focus:ring-brand-light" />
      </div>

      <p class="flex items-start gap-1.5 text-xs text-slate-400">
        ${icon('info', { size: 13, className: 'mt-0.5' })}
        A placa aplica automaticamente as maiúsculas do padrão editorial (ex: "polvo grelhado" vira "Polvo Grelhado").
      </p>
    </div>
  `;
}

// ---------- Manutenção (texto livre) e Governança (carta longa) ----------

function bodyLivreOuCarta(setor) {
  const isCarta = setor.tipoTexto === 'carta';
  return `
    <div>
      <label class="mb-1.5 block text-sm font-bold text-slate-600">
        ${isCarta ? 'Texto da carta de boas-vindas' : 'Texto da placa'}
      </label>
      <textarea data-textarea rows="${isCarta ? 10 : 5}" maxlength="${isCarta ? 1200 : 240}"
        placeholder="${isCarta ? 'Escreva a mensagem de boas-vindas…' : 'Ex: Piscina em manutenção. Retornamos às 14h.'}"
        class="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition-colors focus:border-brand-blue focus:ring-2 focus:ring-brand-light"></textarea>
      <div class="mt-1.5 flex items-center justify-between gap-3">
        <p class="text-xs text-slate-400">
          ${isCarta ? 'O tamanho da fonte se ajusta automaticamente ao texto.' : 'Use frases curtas e diretas para melhor leitura.'}
        </p>
        <p data-char-count class="shrink-0 text-xs tabular-nums text-slate-400"></p>
      </div>
    </div>
  `;
}

function wireLivreOuCarta(container, initialState) {
  const textarea = container.querySelector('[data-textarea]');
  const charCount = container.querySelector('[data-char-count]');
  textarea.value = initialState.texto;

  const updateCount = () => {
    charCount.textContent = `${textarea.value.length} / ${textarea.maxLength}`;
  };
  updateCount();

  const commit = debounce(() => setState({ texto: textarea.value }), 150);

  textarea.addEventListener('input', () => {
    updateCount();
    commit();
  });
}

export function renderEdicaoStep(container) {
  const state = getState();
  const setor = getSetor(state.setorId);
  const formato = getFormato(state.setorId, state.formatoId);

  if (!setor || !formato) {
    goToStep(!setor ? 'setor' : 'formato');
    return;
  }

  // Só reaproveita o formulário já montado se a assinatura bater E a raiz deste
  // passo ainda estiver no DOM (outra etapa pode ter substituído o innerHTML do
  // container nesse meio-tempo, ex: ida e volta até a Prévia).
  const signature = `${state.setorId}-${state.formatoId}`;
  const alreadyMounted =
    container.dataset.sig === signature && container.querySelector('[data-edicao-root]');
  if (alreadyMounted) {
    updateContinueState(container);
    return; // evita recriar inputs e perder o foco do usuário
  }
  container.dataset.sig = signature;

  const bodyHtml = setor.tipoTexto === 'busca' ? bodyAB() : bodyLivreOuCarta(setor);
  container.innerHTML = shell({ setor, formato, bodyHtml });
  wireCommon(container);

  if (setor.tipoTexto === 'busca') wireBuscaAB(container, state);
  else wireLivreOuCarta(container, state);

  updateContinueState(container);
}
