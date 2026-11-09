// Folha A4 de bottons: bottons de pessoas diferentes na mesma folha, para
// imprimir e cortar. É o equivalente da folha montada do A&B (folhaStep.js),
// com o mesmo encaixe (`montarFolhas`) e o mesmo PDF em tamanho real.
//
// Cada botton entra na folha a partir da tela de edição ("Adicionar à folha
// A4") ou do Download. O que entra é um retrato do botton naquele momento:
// a imagem em memória, o enquadramento e o nome. Daqui, "Adicionar outro
// botton" volta para a edição com o campo limpo.
//
// Como no folhaStep, a estrutura é montada uma vez e os renders seguintes só
// repintam lista, folha e botão.

import { getFormato } from '../../data/models.js';
import { getState, setState, goToStep, gravarFolhaBottons, entrarNaFolhaBottons } from '../../state.js';
import { ensureFontsReady } from '../../canvas/engine.js';
import { montarFolhas, exportFolhasPDF } from '../../canvas/lote.js';
import { renderBotton } from '../../blackfriday/botton.js';
import { janelaDaFoto } from '../../rh/cardRenderer.js';
import { acharPessoa } from '../../blackfriday/editorBF.js';
import { getCachedImage } from '../previewPanel.js';
import { icon } from '../icons.js';
import { showToast, confirmModal } from '../common.js';
import { comemorar } from '../confetti.js';
import { escapeHtml } from '../../utils.js';

const MAX_POR_BOTTON = 50;
const PX_POR_MM_MINIATURA = 4;
const ORIENTACAO = { portrait: 'em pé', landscape: 'deitada' };

let sequencia = 0;
const miniaturas = new Map(); // id → data URL
let paginaVista = 0;
let ultimaAdicionada = null;
let gerando = false;
let pintura = 0;

const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;
const formatoBotton = () => getFormato('blackfriday', 'botton');

// ------------------------------------------------------------------ Entrada

const mesmoBotton = (a, b) =>
  a.foto.img === b.foto.img &&
  a.foto.zoom === b.foto.zoom &&
  a.foto.cx === b.foto.cx &&
  a.foto.cy === b.foto.cy &&
  a.nome === b.nome;

/**
 * Coloca o botton que está na tela de edição na folha. O mesmo botton (mesma
 * foto, enquadramento e nome) soma na quantidade em vez de abrir outra linha.
 * Devolve false se ainda não há botton completo.
 */
export function adicionarBottonAtual() {
  const p = getState().bf.pessoas.botton;
  if (!p?.foto?.img || !p.nome.trim()) return false;
  const novo = {
    id: `b${(sequencia += 1)}`,
    nome: p.nome.trim().replace(/\s+/g, ' '),
    vendedorId: p.vendedorId,
    foto: { img: p.foto.img, zoom: p.foto.zoom ?? 1, cx: p.foto.cx ?? 0.5, cy: p.foto.cy ?? 0.5 },
    quantidade: 1,
  };
  const lista = getState().folhaBottons;
  const igual = lista.find((b) => mesmoBotton(b, novo));
  ultimaAdicionada = igual ? igual.id : novo.id;
  gravarFolhaBottons(
    igual
      ? lista.map((b) => (b === igual ? { ...b, quantidade: Math.min(MAX_POR_BOTTON, b.quantidade + 1) } : b))
      : [...lista, novo]
  );
  return true;
}

/** Adiciona o botton atual e abre a folha, com o aviso de confirmação. */
export function adicionarEAbrirFolha() {
  if (!adicionarBottonAtual()) return;
  const nome = getState().bf.pessoas.botton.nome.trim();
  showToast(`${nome} está na folha A4.`, { type: 'success' });
  entrarNaFolhaBottons();
}

// ------------------------------------------------------------------ Render

async function renderizar(item, { cantosBrancos = false } = {}) {
  const formato = formatoBotton();
  const image = await getCachedImage(formato.imagem);
  const canvas = document.createElement('canvas');
  renderBotton(canvas, { image, pessoa: item, janelaDaFoto, cantosBrancos });
  return canvas;
}

async function miniaturaDe(item) {
  if (!miniaturas.has(item.id)) {
    const grande = await renderizar(item);
    const formato = formatoBotton();
    const mini = document.createElement('canvas');
    mini.width = mini.height = Math.round(formato.mmLargura * PX_POR_MM_MINIATURA);
    const ctx = mini.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(grande, 0, 0, mini.width, mini.height);
    miniaturas.set(item.id, mini.toDataURL('image/png'));
  }
  return miniaturas.get(item.id);
}

/** Uma entrada por botton físico, no formato que `montarFolhas` espera. */
function pecasDe(lista) {
  const { mmLargura, mmAltura } = formatoBotton();
  return lista.flatMap((b) =>
    Array.from({ length: b.quantidade }, () => ({ chave: b.id, nome: b.nome, mmLargura, mmAltura }))
  );
}

function cabemMais(pecas, totalFolhas) {
  const { mmLargura, mmAltura } = formatoBotton();
  const extra = { chave: '', nome: '', mmLargura, mmAltura };
  let n = 0;
  while (n < 40 && montarFolhas([...pecas, ...Array(n + 1).fill(extra)]).length === totalFolhas) n += 1;
  return n;
}

// ------------------------------------------------------------------ Partes

function botaoQuantidade(acao, indice, rotulo, simbolo, desabilitado) {
  return `
    <button type="button" data-acao="${acao}" data-i="${indice}" data-foco="${acao}-${indice}"
      aria-label="${rotulo}" ${desabilitado ? 'disabled' : ''}
      class="flex h-9 w-9 items-center justify-center rounded-lg text-lg font-extrabold text-brand-deep transition-colors hover:bg-[#fdf3d7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-blue disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent">
      ${simbolo}
    </button>
  `;
}

function linhaBotton(item, indice, formato) {
  const nome = escapeHtml(item.nome);
  const origem = acharPessoa(formato, item.vendedorId) ? 'Foto da pasta' : 'Foto enviada do computador';
  return `
    <li class="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
      <img src="${miniaturas.get(item.id)}" alt="" width="56" height="56" class="h-14 w-14 shrink-0 rounded-full" />
      <div class="min-w-[9rem] flex-1">
        <p class="font-fibra font-extrabold leading-tight text-brand-deep">${nome}</p>
        <p class="text-xs text-slate-500">${origem}</p>
      </div>
      <div class="flex items-center" role="group" aria-label="Quantidade de ${nome}">
        ${botaoQuantidade('menos', indice, `Tirar um botton de ${nome}`, '−', item.quantidade <= 1)}
        <span class="w-7 text-center font-fibra text-lg font-extrabold text-brand-deep">${item.quantidade}</span>
        ${botaoQuantidade('mais', indice, `Colocar mais um botton de ${nome}`, '+', item.quantidade >= MAX_POR_BOTTON)}
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
        <p class="mt-1 text-sm text-slate-500">Monte um botton e toque em “Adicionar à folha A4”.</p>
      </div>
    `;
  }
  const { largura, altura } = folha.paginaMm;
  const pct = (v, total) => `${(v / total) * 100}%`;
  const discos = folha.pecas
    .map((p, i) => {
      const nova = p.chave === ultimaAdicionada && folha.pecas[i + 1]?.chave !== p.chave;
      return `<img src="${miniaturas.get(p.chave)}" alt="${escapeHtml(p.nome)}"
        class="absolute rounded-full ${nova ? 'folha-pousa' : ''}"
        style="left:${pct(p.x, largura)};top:${pct(p.y, altura)};width:${pct(p.mmLargura, largura)};height:${pct(p.mmAltura, altura)}" />`;
    })
    .join('');
  const larguraPx = folha.orientacao === 'landscape' ? (largura / 210) * 300 : 300;
  return `
    <div class="folha-papel relative mx-auto max-w-full bg-white" style="width:${larguraPx}px;aspect-ratio:${largura}/${altura}">
      ${discos}
    </div>
  `;
}

function resumo(pecas, folhas) {
  if (!pecas.length) return '';
  const n = cabemMais(pecas, folhas.length);
  const lugar = folhas.length > 1 ? 'na última folha' : 'nesta folha';
  const espaco = n ? `Ainda ${n === 1 ? 'cabe' : 'cabem'} ${n} ${lugar}.` : 'Folha cheia. O próximo botton abre outra folha.';
  return `<strong class="font-extrabold text-brand-deep">${plural(pecas.length, 'botton', 'bottons')} em ${plural(folhas.length, 'folha', 'folhas')}.</strong> ${espaco}`;
}

// ------------------------------------------------------------------ Pintura

function pintarBotao(container, pecas, folhas) {
  const botao = container.querySelector('[data-gerar]');
  botao.disabled = gerando || !pecas.length;
  botao.innerHTML = gerando
    ? `<span class="spinner inline-flex">${icon('spinner', { size: 18 })}</span> Gerando…`
    : `${icon('printer', { size: 18 })} Gerar PDF${folhas.length > 1 ? ` das ${folhas.length} folhas` : ' da folha'}`;
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
  const lista = getState().folhaBottons;
  const formato = formatoBotton();

  await ensureFontsReady();
  await Promise.all(lista.map(miniaturaDe));
  if (atual !== pintura) return;

  const pecas = pecasDe(lista);
  const folhas = montarFolhas(pecas);

  const ul = container.querySelector('[data-lista]');
  const foco = document.activeElement?.dataset?.foco;
  ul.innerHTML = lista.map((b, i) => linhaBotton(b, i, formato)).join('');
  if (foco) ul.querySelector(`[data-foco="${foco}"]`)?.focus();
  container.querySelector('[data-vazia]').classList.toggle('hidden', lista.length > 0);
  container.querySelector('[data-limpar]').classList.toggle('hidden', !lista.length);
  container.querySelector('[data-resumo]').innerHTML = resumo(pecas, folhas);

  if (ultimaAdicionada) {
    const pagina = folhas.findIndex((f) => f.pecas.some((p) => p.chave === ultimaAdicionada));
    if (pagina >= 0) paginaVista = pagina;
  }
  pintarPagina(container, folhas);
  ultimaAdicionada = null;
  pintarBotao(container, pecas, folhas);
}

// ------------------------------------------------------------------ Ações

async function gerarPDF(container) {
  const lista = getState().folhaBottons;
  const pecas = pecasDe(lista);
  gerando = true;
  pintarBotao(container, pecas, montarFolhas(pecas));
  try {
    await ensureFontsReady();
    // JPEG com os cantos brancos: um PNG de 1536 px por pessoa deixaria o PDF
    // com dezenas de MB, e no papel branco os cantos já são brancos.
    const imagens = new Map();
    for (const item of lista) {
      const canvas = await renderizar(item, { cantosBrancos: true });
      imagens.set(item.id, canvas.toDataURL('image/jpeg', 0.92));
    }
    const folhas = montarFolhas(pecas);
    exportFolhasPDF(folhas, imagens, `bf-2026-bottons-folha-a4-${pecas.length}un`, 'JPEG');
    setState({ exported: true });
    showToast(`PDF gerado com ${plural(pecas.length, 'botton', 'bottons')} em ${plural(folhas.length, 'folha', 'folhas')}.`, {
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

function novoBotton() {
  // Limpa só o botton em edição; a folha fica.
  const bf = getState().bf;
  const pessoas = { ...bf.pessoas };
  delete pessoas.botton;
  setState({ bf: { ...bf, pessoas }, fits: true, avisoEncaixe: null });
  goToStep('edicao');
}

function ligarTela(container) {
  container.querySelector('[data-back]').addEventListener('click', () => goToStep('edicao'));
  container.querySelector('[data-novo]').addEventListener('click', novoBotton);

  container.querySelector('[data-lista]').addEventListener('click', (e) => {
    const botao = e.target.closest('[data-acao]');
    if (!botao || botao.disabled) return;
    const i = Number(botao.dataset.i);
    const lista = getState().folhaBottons;
    if (botao.dataset.acao === 'tirar') {
      gravarFolhaBottons(lista.filter((_, k) => k !== i));
      return;
    }
    const passo = botao.dataset.acao === 'mais' ? 1 : -1;
    if (passo > 0) ultimaAdicionada = lista[i].id;
    gravarFolhaBottons(lista.map((b, k) => (k === i ? { ...b, quantidade: b.quantidade + passo } : b)));
  });

  container.querySelector('[data-limpar]').addEventListener('click', async () => {
    const ok = await confirmModal({
      title: 'Limpar a folha?',
      message: 'Todos os bottons saem da folha. Para gerar de novo, será preciso montar cada um outra vez.',
      confirmLabel: 'Limpar folha',
      tone: 'danger',
    });
    if (ok) gravarFolhaBottons([]);
  });

  const mudarPagina = (passo) => {
    paginaVista += passo;
    pintar(container);
  };
  container.querySelector('[data-anterior]').addEventListener('click', () => mudarPagina(-1));
  container.querySelector('[data-proxima]').addEventListener('click', () => mudarPagina(1));
  container.querySelector('[data-gerar]').addEventListener('click', () => gerarPDF(container));
}

function telaHtml() {
  const f = formatoBotton();
  const cm = (mm) => String(mm / 10).replace('.', ',');
  return `
    <div data-folha-botton-root>
      <button type="button" data-back
        class="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 transition-colors hover:text-brand-blue">
        ${icon('arrowLeft', { size: 16 })} Voltar para o botton
      </button>

      <h1 class="font-fibra text-2xl font-extrabold text-brand-deep">Folha A4 de bottons</h1>
      <p class="mt-1 mb-5 text-slate-500">Junte os bottons de várias pessoas para imprimir de uma vez. A folha se organiza sozinha.</p>

      <div class="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div class="min-w-0">
          <button type="button" data-novo
            class="flex w-full items-center gap-3.5 rounded-2xl border-2 border-dashed border-[#d9a930] bg-[#fdf8ea] p-4 text-left transition-colors hover:bg-[#fbefcc] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue">
            <span class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#A3120C] text-white">
              ${icon('plus', { size: 20 })}
            </span>
            <span>
              <span class="block font-fibra font-extrabold text-brand-deep">Adicionar outro botton</span>
              <span class="block text-xs text-slate-500">Escolha a foto e escreva o nome; depois toque em “Adicionar à folha A4”.</span>
            </span>
          </button>

          <ul data-lista class="mt-3 divide-y divide-slate-200"></ul>
          <p data-vazia class="mt-4 text-sm text-slate-400">Nenhum botton na folha ainda.</p>
          <button type="button" data-limpar
            class="mt-3 hidden text-sm font-bold text-slate-400 transition-colors hover:text-brand-coral">
            Limpar folha
          </button>
        </div>

        <aside class="lg:sticky lg:top-24">
          <div class="folha-base-bf rounded-2xl p-4">
            <div class="flex min-h-[424px] items-center justify-center" data-papel></div>
            <div class="mt-3 flex items-center justify-between gap-2 text-sm font-bold text-[#f3d073]">
              <span data-legenda aria-live="polite"></span>
              <span data-paginas class="invisible flex gap-1">
                <button type="button" data-anterior aria-label="Folha anterior"
                  class="rounded-md bg-white/10 p-1.5 transition-colors hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white disabled:opacity-40">
                  ${icon('arrowLeft', { size: 15 })}
                </button>
                <button type="button" data-proxima aria-label="Próxima folha"
                  class="rounded-md bg-white/10 p-1.5 transition-colors hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white disabled:opacity-40">
                  ${icon('arrowRight', { size: 15 })}
                </button>
              </span>
            </div>
          </div>

          <p data-resumo class="mt-3 min-h-[2.5rem] text-sm text-slate-600" aria-live="polite"></p>

          <button type="button" data-gerar disabled
            class="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-blue px-5 py-3 font-fibra font-extrabold text-white shadow-sm transition-colors hover:bg-brand-deep disabled:cursor-not-allowed disabled:opacity-40"></button>

          <p class="mt-2 text-xs leading-relaxed text-slate-500">
            Imprima em <strong>tamanho real (100%)</strong>, sem “ajustar à página”. Cada botton sai com
            ${cm(f.mmLargura)} cm (${cm(f.mmFace)} cm de face + 0,5 cm de margem): corte pela borda do disco escuro.
          </p>
        </aside>
      </div>
    </div>
  `;
}

export function renderFolhaBottonStep(container) {
  const formato = getFormato(getState().setorId, getState().formatoId);
  if (!formato?.folhaBottons) {
    goToStep('formato');
    return;
  }
  if (!container.querySelector('[data-folha-botton-root]')) {
    container.innerHTML = telaHtml();
    ligarTela(container);
  }
  pintar(container);
}
