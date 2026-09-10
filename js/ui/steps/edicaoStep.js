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
  const setor = getSetor(state.setorId);
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
      ? setor?.tipoTexto === 'comunicado'
        ? 'Escreva o texto do comunicado para continuar.'
        : 'Digite o texto da arte para continuar.'
      : !state.fits
      ? 'Reduza o texto: ele não cabe na área segura (veja o alerta na prévia).'
      : '';
  }
}

/** Peças digitais (Acqua Park) são medidas em pixels; as de impressão, em mm. */
function medidaDoFormato(formato) {
  return formato.digital
    ? `${formato.largura}×${formato.altura} px`
    : `${formato.mmLargura}×${formato.mmAltura} mm`;
}

function shell({ setor, formato, bodyHtml }) {
  const isComunicado = setor.tipoTexto === 'comunicado';
  return `
    <div data-edicao-root>
      <button type="button" data-back
        class="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 transition-colors hover:text-brand-blue">
        ${icon('arrowLeft', { size: 16 })} Voltar
      </button>

      <div class="mb-1 flex items-center gap-2">
        <span class="rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white"
          style="background:${setor.corDestaque}">${setor.sigla}</span>
        <span class="text-xs font-semibold text-slate-400">${formato.nome} &middot; ${medidaDoFormato(formato)}</span>
      </div>
      <h1 class="font-fibra text-2xl font-extrabold text-brand-deep">${
        isComunicado ? 'Escreva o comunicado' : 'Preencha o texto da arte'
      }</h1>
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
    // Sem biblioteca não há como preencher a arte: os campos de nome e tradução
    // são somente leitura justamente para impedir grafia não validada.
    loadingEl.innerHTML = `
      <p class="flex items-start gap-2 text-sm text-brand-coral">
        ${icon('alertTriangle', { size: 15, className: 'mt-0.5' })}
        <span>Não foi possível carregar a biblioteca de pratos. Recarregue a página;
        se o erro persistir, avise a equipe responsável pelo sistema.</span>
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

  // Os campos de nome e tradução são somente leitura de propósito: o texto da
  // arte de A&B só pode vir da biblioteca oficial, para não entrar no buffet
  // uma grafia divergente da validada. Quem preenche é selectEntry().
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
        <label class="mb-1.5 flex items-center gap-1.5 text-sm font-bold text-slate-600">
          Nome do prato (português)
          <span class="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
            ${icon('lock', { size: 10 })} preenchido pela busca
          </span>
        </label>
        <input type="text" data-pt-input readonly tabindex="-1" placeholder="Selecione um item na busca acima"
          class="w-full cursor-default select-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600 outline-none" />
      </div>

      <div>
        <label class="mb-1.5 flex items-center gap-1.5 text-sm font-bold text-slate-600">
          ${icon('globe', { size: 14, className: 'text-slate-400' })} Tradução em espanhol
          <span class="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
            ${icon('lock', { size: 10 })} preenchido pela busca
          </span>
        </label>
        <input type="text" data-es-input readonly tabindex="-1" placeholder="Selecione um item na busca acima"
          class="w-full cursor-default select-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600 outline-none" />
      </div>

      <p class="flex items-start gap-1.5 text-xs text-slate-400">
        ${icon('info', { size: 13, className: 'mt-0.5' })}
        A arte aplica automaticamente as maiúsculas do padrão editorial (ex: "polvo grelhado" vira "Polvo Grelhado").
      </p>
    </div>
  `;
}

// ---------- Texto livre: aviso, carta de boas-vindas e comunicado ----------
//
// Os três coletam um bloco de texto só, no mesmo campo `texto` do estado — o
// que muda é o rótulo, o tamanho do campo e o limite de caracteres.

const CAMPO_TEXTO = {
  carta: {
    icone: 'edit',
    label: 'Texto da carta de boas-vindas',
    rows: 10,
    max: 1200,
    placeholder: 'Escreva a mensagem de boas-vindas…',
    dica: 'O tamanho da fonte se ajusta automaticamente ao texto.',
  },
  comunicado: {
    icone: 'alignLeft',
    label: 'Corpo do texto',
    rows: 8,
    max: 600,
    placeholder: 'Ex: A piscina de ondas fica fechada nesta quarta, das 8h às 16h, para manutenção preventiva. As demais atrações seguem funcionando normalmente.',
    dica: 'O texto entra logo abaixo da palavra "COMUNICADO", que já vem impressa na arte. A fonte se ajusta sozinha ao tamanho do texto.',
  },
  livre: {
    icone: 'edit',
    label: 'Texto da arte',
    rows: 5,
    max: 240,
    placeholder: 'Ex: Piscina em manutenção. Retornamos às 14h.',
    dica: 'Use frases curtas e diretas para melhor leitura.',
  },
};

function bodyTextoLivre(setor) {
  const campo = CAMPO_TEXTO[setor.tipoTexto] || CAMPO_TEXTO.livre;
  return `
    <div>
      <label class="mb-1.5 flex items-center gap-1.5 text-sm font-bold text-slate-600">
        ${icon(campo.icone, { size: 14, className: 'text-slate-400' })} ${campo.label}
      </label>
      <textarea data-textarea rows="${campo.rows}" maxlength="${campo.max}"
        placeholder="${escapeHtml(campo.placeholder)}"
        class="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition-colors focus:border-brand-blue focus:ring-2 focus:ring-brand-light"></textarea>
      <div class="mt-1.5 flex items-start justify-between gap-3">
        <p class="text-xs text-slate-400">${campo.dica}</p>
        <p data-char-count class="shrink-0 text-xs tabular-nums text-slate-400"></p>
      </div>
    </div>
  `;
}

function wireTextoLivre(container, initialState) {
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

  const bodyHtml = setor.tipoTexto === 'busca' ? bodyAB() : bodyTextoLivre(setor);

  container.innerHTML = shell({ setor, formato, bodyHtml });
  wireCommon(container);

  if (setor.tipoTexto === 'busca') wireBuscaAB(container, state);
  else wireTextoLivre(container, state);

  updateContinueState(container);
}
