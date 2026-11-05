// Montagem da folha A4: pratos e tamanhos diferentes na mesma folha, para a
// equipe do A&B imprimir no resort e cortar. O lote (loteModal.js) continua sendo
// o caminho para repetir uma única arte.
//
// Os textos vêm só da biblioteca oficial, como no gerador: aqui não há campo
// livre para não entrar no buffet uma grafia divergente da validada.
//
// Qualquer setState dispara um render completo, e reconstruir a tela faria o
// campo de busca perder o foco e o que estava digitado. Por isso a estrutura é
// montada uma vez e os renders seguintes só repintam lista, folha e botão.

import { getSetor, getFormato } from '../../data/models.js';
import { getState, setState, goBack, goToStep, gravarFolha, chavePeca } from '../../state.js';
import { renderCanvas, ensureFontsReady } from '../../canvas/engine.js';
import { montarFolhas, exportFolhasPDF } from '../../canvas/lote.js';
import { loadLibrary, searchLibrary, getLoadedLibrary } from '../../data/docxLibrary.js';
import { getCachedImage } from '../previewPanel.js';
import { renderAutocompleteResults } from './edicaoStep.js';
import { icon } from '../icons.js';
import { showToast, confirmModal } from '../common.js';
import { comemorar } from '../confetti.js';
import { debounce, escapeHtml } from '../../utils.js';

const MAX_POR_ARTE = 50;
// 4 px por mm: nítido na folha da tela (300 px = 210 mm) em monitores 2x.
const PX_POR_MM_MINIATURA = 4;

const ORIENTACAO = { portrait: 'em pé', landscape: 'deitada' };

// Arte → { url da miniatura, fits }. Trocar o tamanho e voltar não renderiza de novo.
const miniaturas = new Map();
let tamanhoNovo = null; // tamanho das próximas placas adicionadas
let paginaVista = 0;
let ultimaAdicionada = null; // só ela recebe a animação de pouso
let gerando = false;
let pintura = 0; // descarta pinturas assíncronas ultrapassadas

const medida = (formato) => formato.nome.replace('x', '×').replace(' cm', '');
const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;

/** Renderiza a arte com o mesmo motor e os mesmos parâmetros do PNG individual. */
async function renderizarArte(setor, peca) {
  const formato = getFormato(setor.id, peca.formatoId);
  const image = await getCachedImage(formato.imagem);
  const canvas = document.createElement('canvas');
  const { fits } = renderCanvas(canvas, {
    image,
    formato,
    texto: peca.pt,
    textoEs: peca.es,
    tipo: 'ab',
    titleCase: Boolean(setor.titleCase),
  });
  return { canvas, formato, fits };
}

async function miniaturaDe(setor, peca) {
  const chave = chavePeca(peca);
  if (!miniaturas.has(chave)) {
    const { canvas, formato, fits } = await renderizarArte(setor, peca);
    const mini = document.createElement('canvas');
    mini.width = formato.mmLargura * PX_POR_MM_MINIATURA;
    mini.height = formato.mmAltura * PX_POR_MM_MINIATURA;
    const ctx = mini.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(canvas, 0, 0, mini.width, mini.height);
    miniaturas.set(chave, { url: mini.toDataURL('image/png'), fits });
  }
  return miniaturas.get(chave);
}

/** Uma entrada por placa física, no formato que `montarFolhas` espera. */
function placasDe(setor, pecas) {
  return pecas.flatMap((peca) => {
    const { mmLargura, mmAltura } = getFormato(setor.id, peca.formatoId);
    const item = { chave: chavePeca(peca), pt: peca.pt, mmLargura, mmAltura };
    return Array.from({ length: peca.quantidade }, () => item);
  });
}

/** Quantas placas de cada formato ainda entram sem abrir outra folha. */
function vagas(setor, placas, totalFolhas) {
  return setor.formatos
    .map((formato) => {
      const extra = { chave: '', pt: '', mmLargura: formato.mmLargura, mmAltura: formato.mmAltura };
      let n = 0;
      while (montarFolhas([...placas, ...Array(n + 1).fill(extra)]).length === totalFolhas) n += 1;
      return { formato, n };
    })
    .filter(({ n }) => n > 0);
}

// ------------------------------------------------------------------- Partes

/** Os retângulos estão em escala entre si: o tamanho se escolhe pelo desenho. */
function seletorTamanho(setor, atual, indice = null) {
  const alvo = indice === null ? 'data-tamanho-novo' : `data-trocar="${indice}"`;
  return setor.formatos
    .map((f) => {
      const ativo = f.id === atual;
      return `
        <button type="button" ${alvo} data-formato="${f.id}" aria-pressed="${ativo}"
          ${indice === null ? '' : `data-foco="tamanho-${indice}-${f.id}"`}
          aria-label="${medida(f)} centímetros"
          class="flex h-10 items-center gap-1.5 rounded-lg border-2 px-2 text-xs font-extrabold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-blue ${
            ativo
              ? 'border-brand-blue bg-brand-light/40 text-brand-deep'
              : 'border-transparent bg-slate-100 text-slate-500 hover:bg-brand-light/30 hover:text-brand-deep'
          }">
          <span aria-hidden="true" class="block rounded-[1px] bg-current"
            style="width:${f.mmLargura / 6}px;height:${f.mmAltura / 6}px"></span>
          ${medida(f)}
        </button>
      `;
    })
    .join('');
}

function botaoQuantidade(acao, indice, rotulo, simbolo, desabilitado) {
  return `
    <button type="button" data-acao="${acao}" data-i="${indice}" data-foco="${acao}-${indice}"
      aria-label="${rotulo}" ${desabilitado ? 'disabled' : ''}
      class="flex h-9 w-9 items-center justify-center rounded-lg text-lg font-extrabold text-brand-deep transition-colors hover:bg-brand-light/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-blue disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent">
      ${simbolo}
    </button>
  `;
}

function linhaPeca(setor, peca, indice) {
  const { fits } = miniaturas.get(chavePeca(peca));
  const nome = escapeHtml(peca.pt);
  return `
    <li class="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
      <div class="min-w-[10rem] flex-1">
        <p class="font-fibra font-extrabold leading-tight text-brand-deep">${nome}</p>
        <p class="text-xs text-slate-500">${escapeHtml(peca.es)}</p>
        ${
          fits
            ? ''
            : `<p class="mt-1 flex items-center gap-1 text-xs font-bold text-brand-coral">
                ${icon('alertTriangle', { size: 13 })} O texto não cabe neste tamanho. Escolha um maior.
              </p>`
        }
      </div>
      <div class="flex items-center gap-1" role="group" aria-label="Tamanho de ${nome}">
        ${seletorTamanho(setor, peca.formatoId, indice)}
      </div>
      <div class="flex items-center" role="group" aria-label="Quantidade de ${nome}">
        ${botaoQuantidade('menos', indice, `Tirar uma placa de ${nome}`, '−', peca.quantidade <= 1)}
        <span class="w-7 text-center font-fibra text-lg font-extrabold text-brand-deep">${peca.quantidade}</span>
        ${botaoQuantidade('mais', indice, `Colocar mais uma placa de ${nome}`, '+', peca.quantidade >= MAX_POR_ARTE)}
      </div>
      <button type="button" data-acao="tirar" data-i="${indice}" aria-label="Tirar ${nome} da folha"
        class="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-brand-coral/10 hover:text-brand-coral focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-blue">
        ${icon('trash', { size: 16 })}
      </button>
    </li>
  `;
}

function papelHtml(folha) {
  if (!folha) {
    return `
      <div class="folha-papel mx-auto flex w-[300px] max-w-full flex-col items-center justify-center bg-white p-10 text-center" style="aspect-ratio:210/297">
        <p class="font-fibra text-lg font-extrabold text-brand-deep">Folha em branco</p>
        <p class="mt-1 text-sm text-slate-500">Busque um prato para colocar a primeira placa.</p>
      </div>
    `;
  }

  const { largura, altura } = folha.paginaMm;
  const pct = (valor, total) => `${(valor / total) * 100}%`;
  const placas = folha.pecas
    .map((p, i) => {
      const { url, fits } = miniaturas.get(p.chave);
      // Num conjunto de placas iguais, só a última é a novidade.
      const nova = p.chave === ultimaAdicionada && folha.pecas[i + 1]?.chave !== p.chave;
      return `<img src="${url}" alt="${escapeHtml(p.pt)}"
        class="absolute ${nova ? 'folha-pousa' : ''} ${fits ? '' : 'outline outline-2 outline-brand-coral'}"
        style="left:${pct(p.x, largura)};top:${pct(p.y, altura)};width:${pct(p.mmLargura, largura)};height:${pct(p.mmAltura, altura)}" />`;
    })
    .join('');

  const larguraPx = folha.orientacao === 'landscape' ? (largura / 210) * 300 : 300;
  return `
    <div class="folha-papel relative mx-auto max-w-full bg-white"
      style="width:${larguraPx}px;aspect-ratio:${largura}/${altura}">
      ${placas}
    </div>
  `;
}

function resumo(setor, placas, folhas) {
  if (!placas.length) return '';
  const lugar = folhas.length > 1 ? 'na última folha' : 'nesta folha';
  const livres = vagas(setor, placas, folhas.length);
  const quanto = livres.map(({ formato, n }) => `${n} de ${medida(formato)}`).join(' ou ');
  const espaco = livres.length
    ? `Ainda ${livres[0].n === 1 ? 'cabe' : 'cabem'} ${quanto} ${lugar}.`
    : 'Folha cheia. A próxima placa abre outra folha.';
  return `<strong class="font-extrabold text-brand-deep">${plural(placas.length, 'placa', 'placas')} em ${plural(folhas.length, 'folha', 'folhas')}.</strong> ${espaco}`;
}

// ------------------------------------------------------------------ Pintura

function pintarBotao(container, placas, folhas) {
  const botao = container.querySelector('[data-gerar]');
  const dica = container.querySelector('[data-dica]');
  const naoCabem = getState().folha.filter((p) => !miniaturas.get(chavePeca(p)).fits);

  botao.disabled = gerando || !placas.length || naoCabem.length > 0;
  botao.innerHTML = gerando
    ? `<span class="spinner inline-flex">${icon('spinner', { size: 18 })}</span> Gerando…`
    : `${icon('printer', { size: 18 })} Gerar PDF${folhas.length > 1 ? ` das ${folhas.length} folhas` : ' da folha'}`;
  dica.textContent = naoCabem.length
    ? `Para gerar o PDF, escolha um tamanho maior para ${naoCabem[0].pt}.`
    : '';
}

function pintarPagina(container, folhas) {
  paginaVista = Math.min(paginaVista, Math.max(0, folhas.length - 1));
  const folha = folhas[paginaVista];

  container.querySelector('[data-papel]').innerHTML = papelHtml(folha);
  container.querySelector('[data-legenda]').textContent = folha
    ? `Folha ${paginaVista + 1} de ${folhas.length}, ${ORIENTACAO[folha.orientacao]}`
    : 'Folha A4';
  container.querySelector('[data-paginas]').classList.toggle('invisible', folhas.length < 2);
  container.querySelector('[data-anterior]').disabled = paginaVista === 0;
  container.querySelector('[data-proxima]').disabled = paginaVista >= folhas.length - 1;
}

async function pintar(container) {
  const atual = (pintura += 1);
  const setor = getSetor(getState().setorId);
  const { folha: pecas } = getState();

  await ensureFontsReady();
  await Promise.all(pecas.map((peca) => miniaturaDe(setor, peca)));
  if (atual !== pintura) return;

  const placas = placasDe(setor, pecas);
  const folhas = montarFolhas(placas);

  const lista = container.querySelector('[data-lista]');
  const foco = document.activeElement?.dataset?.foco;
  lista.innerHTML = pecas.map((peca, i) => linhaPeca(setor, peca, i)).join('');
  if (foco) lista.querySelector(`[data-foco="${foco}"]`)?.focus();
  container.querySelector('[data-vazia]').classList.toggle('hidden', pecas.length > 0);
  container.querySelector('[data-limpar]').classList.toggle('hidden', !pecas.length);

  container.querySelector('[data-resumo]').innerHTML = resumo(setor, placas, folhas);
  container.querySelector('[data-deitada]').classList.toggle(
    'hidden',
    !folhas.some((f) => f.orientacao === 'landscape')
  );

  // A folha em que a última placa caiu é a que a pessoa quer ver.
  if (ultimaAdicionada) {
    const pagina = folhas.findIndex((f) => f.pecas.some((p) => p.chave === ultimaAdicionada));
    if (pagina >= 0) paginaVista = pagina;
  }
  pintarPagina(container, folhas);
  ultimaAdicionada = null;
  pintarBotao(container, placas, folhas);
}

// ------------------------------------------------------------------ Ações

function adicionar(entry) {
  const peca = { pt: entry.pt, es: entry.es, formatoId: tamanhoNovo, quantidade: 1 };
  ultimaAdicionada = chavePeca(peca);
  gravarFolha([...getState().folha, peca]);
}

function alterarPeca(indice, mudanca, { destacar = true } = {}) {
  const pecas = getState().folha.map((p, i) => (i === indice ? { ...p, ...mudanca } : p));
  if (destacar) ultimaAdicionada = chavePeca(pecas[indice]);
  gravarFolha(pecas);
}

async function gerarPDF(container) {
  const setor = getSetor(getState().setorId);
  const { folha: pecas } = getState();
  const placas = placasDe(setor, pecas);

  gerando = true;
  pintarBotao(container, placas, montarFolhas(placas));
  try {
    await ensureFontsReady();
    const imagens = new Map();
    for (const peca of pecas) {
      const { canvas } = await renderizarArte(setor, peca);
      imagens.set(chavePeca(peca), canvas.toDataURL('image/png', 1.0));
    }
    const folhas = montarFolhas(placas);
    exportFolhasPDF(folhas, imagens, `pratagy-folha-a4-${placas.length}-placas`);
    setState({ exported: true });
    showToast(`PDF gerado com ${plural(placas.length, 'placa', 'placas')} em ${plural(folhas.length, 'folha', 'folhas')}.`, {
      type: 'success',
    });
    comemorar();
  } catch (err) {
    console.error(err);
    showToast('Não foi possível gerar o PDF. Tente novamente.', { type: 'error' });
  } finally {
    gerando = false;
    pintar(container);
  }
}

function ligarBusca(container) {
  const campo = container.querySelector('[data-search-input]');
  const resultados = container.querySelector('[data-search-results]');
  const fechar = () => {
    resultados.classList.add('hidden');
    resultados.innerHTML = '';
  };
  const buscar = (termo) => {
    const biblioteca = getLoadedLibrary();
    return biblioteca && termo.trim() ? searchLibrary(biblioteca, termo) : [];
  };
  const escolher = (entry) => {
    adicionar(entry);
    campo.value = '';
    fechar();
    campo.focus(); // o próximo prato já pode ser digitado
  };

  const mostrar = debounce((termo) => {
    if (!termo.trim()) return fechar();
    resultados.innerHTML = renderAutocompleteResults(
      buscar(termo),
      'Nenhum prato encontrado. Tente outra palavra.'
    );
    resultados.classList.remove('hidden');
  }, 120);

  campo.addEventListener('input', (e) => mostrar(e.target.value));
  campo.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') fechar();
    if (e.key === 'Enter') {
      const [primeiro] = buscar(campo.value);
      if (primeiro) escolher(primeiro);
    }
  });
  resultados.addEventListener('click', (e) => {
    const botao = e.target.closest('[data-entry]');
    const entry = botao && getLoadedLibrary()?.find((it) => it.id === botao.dataset.entry);
    if (entry) escolher(entry);
  });

  const liberar = (total) => {
    campo.disabled = false;
    campo.placeholder = `Buscar entre ${total} pratos`;
  };
  const cache = getLoadedLibrary();
  if (cache) {
    liberar(cache.length);
    return;
  }
  loadLibrary()
    .then((entries) => liberar(entries.length))
    .catch((err) => {
      console.error(err);
      campo.placeholder = 'Biblioteca indisponível. Recarregue a página.';
    });
}

function ligarTela(container, setor) {
  container.querySelector('[data-back]').addEventListener('click', goBack);
  ligarBusca(container);

  const seletorNovo = container.querySelector('[data-tamanhos-novos]');
  seletorNovo.addEventListener('click', (e) => {
    const botao = e.target.closest('[data-tamanho-novo]');
    if (!botao) return;
    tamanhoNovo = botao.dataset.formato;
    seletorNovo.innerHTML = seletorTamanho(setor, tamanhoNovo);
  });

  container.querySelector('[data-lista]').addEventListener('click', (e) => {
    const troca = e.target.closest('[data-trocar]');
    if (troca) {
      alterarPeca(Number(troca.dataset.trocar), { formatoId: troca.dataset.formato });
      return;
    }
    const botao = e.target.closest('[data-acao]');
    if (!botao || botao.disabled) return;
    const indice = Number(botao.dataset.i);
    const pecas = getState().folha;
    if (botao.dataset.acao === 'tirar') {
      gravarFolha(pecas.filter((_, i) => i !== indice));
      container.querySelector('[data-search-input]').focus();
    } else {
      const passo = botao.dataset.acao === 'mais' ? 1 : -1;
      alterarPeca(indice, { quantidade: pecas[indice].quantidade + passo }, { destacar: passo > 0 });
    }
  });

  container.querySelector('[data-limpar]').addEventListener('click', async () => {
    const ok = await confirmModal({
      title: 'Limpar a folha?',
      message: 'Todas as placas saem da folha. Os pratos continuam na biblioteca.',
      confirmLabel: 'Limpar folha',
      tone: 'danger',
    });
    if (ok) gravarFolha([]);
  });

  const mudarPagina = (passo) => {
    paginaVista += passo;
    pintar(container);
  };
  container.querySelector('[data-anterior]').addEventListener('click', () => mudarPagina(-1));
  container.querySelector('[data-proxima]').addEventListener('click', () => mudarPagina(1));
  container.querySelector('[data-gerar]').addEventListener('click', () => gerarPDF(container));
}

function telaHtml(setor) {
  const pronta = getLoadedLibrary();
  return `
    <div data-folha-root>
      <button type="button" data-back
        class="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 transition-colors hover:text-brand-blue">
        ${icon('arrowLeft', { size: 16 })} Voltar
      </button>

      <h1 class="font-fibra text-2xl font-extrabold text-brand-deep">Monte a folha A4</h1>
      <p class="mt-1 mb-5 text-slate-500">Escolha os pratos, o tamanho e quantas placas de cada. A folha se organiza sozinha.</p>

      <div class="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div class="min-w-0">
          <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div class="flex flex-wrap items-end gap-x-4 gap-y-3">
              <div data-search-wrap class="relative min-w-[14rem] flex-1">
                <label for="folha-busca" class="mb-1.5 block text-sm font-bold text-slate-600">Adicionar prato</label>
                <div class="relative">
                  <span class="pointer-events-none absolute left-3 top-1/2 flex -translate-y-1/2 text-slate-300">
                    ${icon('search', { size: 17 })}
                  </span>
                  <input id="folha-busca" type="text" data-search-input autocomplete="off" ${pronta ? '' : 'disabled'}
                    placeholder="Carregando biblioteca…"
                    class="h-10 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm outline-none transition-colors focus:border-brand-blue focus:ring-2 focus:ring-brand-light disabled:bg-slate-50 disabled:text-slate-400" />
                </div>
                <div data-search-results
                  class="absolute z-20 mt-1 hidden max-h-72 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg"></div>
              </div>
              <div>
                <p class="mb-1.5 text-sm font-bold text-slate-600">Tamanho (cm)</p>
                <div data-tamanhos-novos class="flex gap-1" role="group" aria-label="Tamanho das próximas placas">
                  ${seletorTamanho(setor, tamanhoNovo)}
                </div>
              </div>
            </div>
          </div>

          <ul data-lista class="mt-3 divide-y divide-slate-200"></ul>
          <p data-vazia class="mt-4 text-sm text-slate-400">Digite o nome de um prato e aperte Enter. Dá para adicionar vários em sequência.</p>
          <button type="button" data-limpar
            class="mt-3 hidden text-sm font-bold text-slate-400 transition-colors hover:text-brand-coral">
            Limpar folha
          </button>
        </div>

        <aside class="lg:sticky lg:top-24">
          <div class="folha-base rounded-2xl p-4">
            <div class="flex min-h-[424px] items-center justify-center" data-papel></div>
            <div class="mt-3 flex items-center justify-between gap-2 text-sm font-bold text-white">
              <span data-legenda aria-live="polite"></span>
              <span data-paginas class="invisible flex gap-1">
                <button type="button" data-anterior aria-label="Folha anterior"
                  class="rounded-md bg-white/15 p-1.5 transition-colors hover:bg-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white disabled:opacity-40">
                  ${icon('arrowLeft', { size: 15 })}
                </button>
                <button type="button" data-proxima aria-label="Próxima folha"
                  class="rounded-md bg-white/15 p-1.5 transition-colors hover:bg-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white disabled:opacity-40">
                  ${icon('arrowRight', { size: 15 })}
                </button>
              </span>
            </div>
          </div>

          <p data-resumo class="mt-3 min-h-[2.5rem] text-sm text-slate-600" aria-live="polite"></p>

          <button type="button" data-gerar disabled
            class="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-blue px-5 py-3 font-fibra font-extrabold text-white shadow-sm transition-colors hover:bg-brand-deep disabled:cursor-not-allowed disabled:opacity-40"></button>
          <p data-dica class="mt-2 text-xs font-semibold text-brand-coral" aria-live="polite"></p>

          <p class="mt-2 text-xs leading-relaxed text-slate-500">
            Imprima em <strong>tamanho real (100%)</strong>, sem “ajustar à página”. As placas saem com 3 mm de
            respiro para cortar com tesoura.
            <span data-deitada class="hidden">Folhas deitadas giram sozinhas ao imprimir.</span>
          </p>
        </aside>
      </div>
    </div>
  `;
}

export function renderFolhaStep(container) {
  const state = getState();
  const setor = getSetor(state.setorId);
  if (!setor?.permiteLote) {
    goToStep('setor');
    return;
  }

  // Já montada: é um render por setState (ver o topo do arquivo).
  if (!container.querySelector('[data-folha-root]')) {
    tamanhoNovo = tamanhoNovo || setor.formatos[0].id;
    // Quem chega do Download precisa ver a placa que trouxe, que pode ter caído
    // em outra folha que não a primeira.
    const ultima = state.folha[state.folha.length - 1];
    ultimaAdicionada = ultima ? chavePeca(ultima) : null;
    container.innerHTML = telaHtml(setor);
    ligarTela(container, setor);
    container.querySelector('[data-search-input]').focus();
  }
  pintar(container);
}
