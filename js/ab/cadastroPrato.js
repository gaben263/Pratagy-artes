// Cadastro de prato provisório do A&B, para pratos definidos de última hora.
//
// Fluxo, tudo num modal só:
//   1. Nome      → nome em português e categoria.
//   2. Parecidos → se já existe algo igual ou quase igual, oferece usar o
//                  oficial (evita duplicar a biblioteca).
//   3. Revisão   → corretor ortográfico com a caixa Aceitar / Manter.
//   4. Confirmar → espanhol montado pela biblioteca, editável; o que o tradutor
//                  não conhece vem sinalizado para a pessoa completar.
// Ao confirmar, o prato vai para a planilha de provisórios e já preenche a
// placa. O Marketing revisa a planilha e inclui o prato no .docx oficial.

import { icon } from '../ui/icons.js';
import { openModal, showToast } from '../ui/common.js';
import { escapeHtml, normalizeSearch } from '../utils.js';
import { getLoadedLibrary, getBibliotecaOficial, searchLibrary } from '../data/docxLibrary.js';
import { criarTradutor } from './tradutor.js';
import { criarCorretor, palavrasDe } from '../revisao/corretor.js';
import { montarPainelRevisao } from '../revisao/caixaRevisao.js';
import { cadastrarProvisorio, planilhaConfigurada } from './provisorios.js';

const MAX_PT = 60;
const MAX_ES = 80;
const CATEGORIA_FORA = /louças/i; // utensílios não são pratos

// Tradutor e corretor são montados uma vez a partir da biblioteca oficial.
let base = null;
function ferramentas() {
  const oficial = getBibliotecaOficial();
  if (!oficial) return null;
  if (base?.oficial !== oficial) {
    const pratos = oficial.filter((e) => !CATEGORIA_FORA.test(e.categoria));
    base = {
      oficial,
      traduzir: criarTradutor(pratos),
      corretor: criarCorretor(palavrasDe(oficial.map((e) => e.pt))),
      categorias: [...new Set(pratos.map((e) => e.categoria))],
    };
  }
  return base;
}

/** "  frango   GRELHADO " → "Frango grelhado"; CAPS LOCK vira minúscula. */
function arrumarNome(bruto) {
  let s = bruto.replace(/\s+/g, ' ').trim();
  if (s && s === s.toLocaleUpperCase('pt-BR') && /\p{L}{2}/u.test(s)) s = s.toLocaleLowerCase('pt-BR');
  return s.charAt(0).toLocaleUpperCase('pt-BR') + s.slice(1);
}

/** Distância de edição simples, para achar nomes quase iguais. */
function distancia(a, b) {
  const linha = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let anterior = linha[0];
    linha[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const guardado = linha[j];
      linha[j] = Math.min(linha[j] + 1, linha[j - 1] + 1, anterior + (a[i - 1] === b[j - 1] ? 0 : 1));
      anterior = guardado;
    }
  }
  return linha[b.length];
}

/** Pratos já cadastrados com nome igual ou quase igual (até 3). */
function parecidos(nome) {
  const biblioteca = getLoadedLibrary() || [];
  const alvo = normalizeSearch(nome);
  const teto = Math.max(2, Math.round(alvo.length * 0.15));
  return biblioteca
    .filter((e) => !CATEGORIA_FORA.test(e.categoria))
    .map((e) => ({ e, d: distancia(alvo, normalizeSearch(e.pt)) }))
    .filter(({ d }) => d <= teto)
    .sort((a, b) => a.d - b.d)
    .slice(0, 3)
    .map(({ e, d }) => ({ ...e, igual: d === 0 }));
}

/** Categoria do prato da biblioteca mais parecido pelo começo do nome. */
// Com o nome ainda escrito errado ("Tortilede…"), a primeira palavra não acha
// nada: tenta o prato quase igual e depois as outras palavras do nome.
function categoriaProvavel(nome, categorias) {
  const oficial = getBibliotecaOficial() || [];
  const valida = (e) => e && categorias.includes(e.categoria);
  const palavras = normalizeSearch(nome).split(' ').filter((p) => p.length > 2 && !['com', 'sem'].includes(p));
  if (!palavras.length) return '';
  const pelaPrimeira = searchLibrary(oficial, palavras[0], 5).find(valida);
  if (pelaPrimeira) return pelaPrimeira.categoria;
  const quaseIgual = parecidos(nome).find(valida);
  if (quaseIgual) return quaseIgual.categoria;
  for (const p of palavras.slice(1)) {
    const achado = searchLibrary(oficial, p, 5).find(valida);
    if (achado) return achado.categoria;
  }
  return '';
}

const ROTULO = 'mb-1.5 block text-sm font-bold text-slate-600';
const CAMPO =
  'w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition-colors focus:border-brand-blue focus:ring-2 focus:ring-brand-light';
const PRIMARIO =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-brand-blue px-5 py-2.5 font-fibra font-extrabold text-white shadow-sm transition-colors hover:bg-brand-deep disabled:cursor-not-allowed disabled:opacity-40';
const SECUNDARIO = 'inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100';

function moldura() {
  return `
    <header class="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
      <div class="min-w-0">
        <p class="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Prato de última hora</p>
        <h3 class="mt-1 font-fibra text-xl font-extrabold leading-tight text-brand-deep">Cadastrar prato novo</h3>
        <ol data-etapas class="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-bold text-slate-400"></ol>
      </div>
      <button type="button" data-close aria-label="Fechar"
        class="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
        ${icon('x', { size: 18 })}
      </button>
    </header>
    <div data-corpo class="max-h-[70vh] overflow-y-auto p-5"></div>
    <footer data-rodape class="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 p-4"></footer>
  `;
}

const ETAPAS = ['Nome', 'Revisão', 'Espanhol'];

/**
 * Abre o cadastro.
 * @param {object} opcoes
 * @param {string} [opcoes.nome] - o que a pessoa já tinha digitado na busca.
 * @param {'edicao'|'folha'} opcoes.tela - de onde veio (vai para a planilha).
 * @param {(entrada: object) => void} opcoes.aoEscolher - recebe o prato
 *   cadastrado, ou um oficial que a pessoa preferiu usar.
 */
export function abrirCadastroPrato({ nome = '', tela, aoEscolher }) {
  const f = ferramentas();
  if (!f) {
    showToast('A biblioteca de pratos ainda está carregando. Tente de novo em instantes.', { type: 'error' });
    return;
  }

  // Estado do cadastro, preservado ao ir e voltar entre as etapas.
  const dados = {
    digitado: arrumarNome(nome),
    categoria: categoriaProvavel(nome, f.categorias),
    pt: '',
    revisao: '',
    es: '',
    lacunas: [],
    esEditado: false,
  };

  openModal(moldura(), {
    maxWidth: 'max-w-xl',
    onMount: (dialog, close) => {
      const corpo = dialog.querySelector('[data-corpo]');
      const rodape = dialog.querySelector('[data-rodape]');
      const etapas = dialog.querySelector('[data-etapas]');

      const marcarEtapa = (atual) => {
        etapas.innerHTML = ETAPAS.map(
          (rotulo, i) =>
            `<li class="${i === atual ? 'text-brand-blue' : i < atual ? 'text-status-green' : ''}">${i + 1}. ${rotulo}</li>`
        ).join('');
      };

      const escolher = (entrada) => {
        close();
        aoEscolher(entrada);
      };

      // ---------- 1. Nome e categoria ----------
      function etapaNome() {
        marcarEtapa(0);
        corpo.innerHTML = `
          <div class="space-y-4">
            <p class="rounded-xl bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">
              Use só para pratos que <strong>não estão na biblioteca</strong>. O prato entra como
              <strong>provisório</strong>: já pode ir para a placa, e o Marketing revisa e inclui na biblioteca oficial depois.
            </p>
            <div>
              <label for="cad-nome" class="${ROTULO}">Nome do prato (português)</label>
              <input id="cad-nome" type="text" data-nome maxlength="${MAX_PT}" autocomplete="off" spellcheck="false"
                value="${escapeHtml(dados.digitado)}" placeholder="Ex: Tortilete de maracujá com coco" class="${CAMPO}" />
              <p class="mt-1 text-xs text-slate-400">Escreva como no cardápio, só a primeira letra maiúscula. A placa aplica as maiúsculas do padrão sozinha.</p>
            </div>
            <div>
              <label for="cad-categoria" class="${ROTULO}">Categoria</label>
              <select id="cad-categoria" data-categoria class="${CAMPO} bg-white">
                <option value="">Escolha a categoria</option>
                ${f.categorias
                  .map((c) => `<option value="${escapeHtml(c)}" ${c === dados.categoria ? 'selected' : ''}>${escapeHtml(c)}</option>`)
                  .join('')}
              </select>
            </div>
            <div data-parecidos></div>
          </div>
        `;
        rodape.innerHTML = `
          <button type="button" data-close-local class="${SECUNDARIO}">Cancelar</button>
          <button type="button" data-avancar class="${PRIMARIO}">Revisar e traduzir ${icon('arrowRight', { size: 17 })}</button>
        `;
        const campoNome = corpo.querySelector('[data-nome]');
        const campoCategoria = corpo.querySelector('[data-categoria]');
        const avancar = rodape.querySelector('[data-avancar]');
        const atualizar = () => {
          avancar.disabled = !campoNome.value.trim() || !campoCategoria.value;
        };
        campoNome.addEventListener('input', () => {
          dados.digitado = campoNome.value;
          corpo.querySelector('[data-parecidos]').innerHTML = '';
          delete avancar.dataset.ignorarParecidos; // nome novo: confere de novo
          // Sugere a categoria enquanto a pessoa ainda não escolheu nenhuma.
          if (!campoCategoria.dataset.escolhida) {
            dados.categoria = categoriaProvavel(campoNome.value, f.categorias);
            campoCategoria.value = dados.categoria;
          }
          atualizar();
        });
        campoCategoria.addEventListener('change', () => {
          dados.categoria = campoCategoria.value;
          campoCategoria.dataset.escolhida = '1';
          atualizar();
        });
        campoNome.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && !avancar.disabled) avancar.click();
        });
        rodape.querySelector('[data-close-local]').addEventListener('click', close);
        avancar.addEventListener('click', () => {
          dados.digitado = arrumarNome(campoNome.value);
          dados.categoria = campoCategoria.value;
          const iguais = parecidos(dados.digitado);
          if (iguais.length && !avancar.dataset.ignorarParecidos) {
            mostrarParecidos(corpo.querySelector('[data-parecidos]'), iguais, avancar);
            return;
          }
          etapaRevisao();
        });
        atualizar();
        campoNome.focus();
        campoNome.setSelectionRange(campoNome.value.length, campoNome.value.length);
      }

      function mostrarParecidos(el, lista, avancar) {
        const igual = lista.find((e) => e.igual);
        el.innerHTML = `
          <div class="rounded-xl border-2 border-brand-vivid/40 bg-brand-light/30 p-3">
            <p class="text-sm font-bold text-brand-deep">
              ${igual ? 'Esse prato já está na biblioteca.' : 'Já existe um prato parecido. É algum destes?'}
            </p>
            <ul class="mt-2 space-y-2">
              ${lista
                .map(
                  (e) => `
                <li class="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2">
                  <span class="min-w-0">
                    <span class="block text-sm font-bold text-brand-deep">${escapeHtml(e.pt)}
                      ${e.provisorio ? '<span class="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">provisório</span>' : ''}</span>
                    <span class="block text-xs text-slate-500">${escapeHtml(e.es)}</span>
                  </span>
                  <button type="button" data-usar="${escapeHtml(e.id)}"
                    class="shrink-0 rounded-lg bg-brand-blue px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-deep">Usar este</button>
                </li>`
                )
                .join('')}
            </ul>
            ${
              igual
                ? ''
                : `<button type="button" data-outro class="mt-2 text-xs font-bold text-brand-blue hover:underline">Não, é outro prato: continuar o cadastro</button>`
            }
          </div>
        `;
        el.querySelectorAll('[data-usar]').forEach((b) =>
          b.addEventListener('click', () => {
            const entrada = (getLoadedLibrary() || []).find((e) => e.id === b.dataset.usar);
            if (entrada) escolher(entrada);
          })
        );
        el.querySelector('[data-outro]')?.addEventListener('click', () => {
          avancar.dataset.ignorarParecidos = '1';
          etapaRevisao();
        });
        if (igual) avancar.disabled = true;
      }

      // ---------- 2. Revisão ortográfica ----------
      async function etapaRevisao() {
        marcarEtapa(1);
        corpo.innerHTML = `
          <p class="flex items-center gap-2 py-6 text-sm text-slate-500">
            <span class="spinner inline-flex text-brand-blue">${icon('spinner', { size: 16 })}</span> Revisando a grafia…
          </p>`;
        rodape.innerHTML = '';
        const texto = dados.digitado;
        const { achados, indisponivel } = await f.corretor.revisar(texto, { soOrtografia: true });
        if (!dialog.isConnected) return; // fechou enquanto revisava

        if (!achados.length) {
          if (texto !== dados.pt) dados.esEditado = false; // nome mudou: retraduz
          dados.pt = texto;
          dados.revisao = indisponivel ? 'Revisão online indisponível; conferido com o vocabulário do resort' : 'Sem erros encontrados';
          etapaEspanhol();
          return;
        }

        corpo.innerHTML = `
          <p class="mb-3 text-sm text-slate-600">Confira a grafia de <strong>“${escapeHtml(texto)}”</strong> antes de cadastrar.</p>
          <div data-painel></div>`;
        rodape.innerHTML = `
          <button type="button" data-voltar class="${SECUNDARIO}">${icon('arrowLeft', { size: 15 })} Voltar e editar</button>
          <button type="button" data-avancar disabled class="${PRIMARIO}">Continuar ${icon('arrowRight', { size: 17 })}</button>`;
        const avancar = rodape.querySelector('[data-avancar]');
        let resultado = null;
        montarPainelRevisao(corpo.querySelector('[data-painel]'), texto, achados, {
          indisponivel,
          aoMudar: (r) => {
            resultado = r;
            avancar.disabled = !r.pronto;
          },
        });
        rodape.querySelector('[data-voltar]').addEventListener('click', etapaNome);
        avancar.addEventListener('click', () => {
          const novoPt = arrumarNome(resultado.texto);
          if (novoPt !== dados.pt) dados.esEditado = false; // nome mudou: retraduz
          dados.pt = novoPt;
          dados.revisao = resultado.resumo;
          etapaEspanhol();
        });
      }

      // ---------- 3. Espanhol e confirmação ----------
      function etapaEspanhol() {
        marcarEtapa(2);
        if (!dados.esEditado) {
          const { es, lacunas } = f.traduzir(dados.pt);
          dados.es = es;
          dados.lacunas = lacunas;
        }
        corpo.innerHTML = `
          <div class="space-y-4">
            <div>
              <p class="${ROTULO}">Nome do prato (português)</p>
              <p class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold text-brand-deep">${escapeHtml(dados.pt)}</p>
              <p class="mt-1 text-xs text-slate-400">${escapeHtml(dados.revisao)} · ${escapeHtml(dados.categoria)}</p>
            </div>
            <div>
              <label for="cad-es" class="${ROTULO} flex items-center gap-1.5">
                ${icon('globe', { size: 14, className: 'text-slate-400' })} Tradução em espanhol
              </label>
              <input id="cad-es" type="text" data-es maxlength="${MAX_ES}" autocomplete="off" spellcheck="false"
                value="${escapeHtml(dados.es)}" class="${CAMPO}" />
              ${
                dados.lacunas.length && !dados.esEditado
                  ? `<p class="mt-2 flex items-start gap-1.5 rounded-lg bg-amber-50 px-2.5 py-2 text-xs text-amber-800">
                      ${icon('alertTriangle', { size: 14, className: 'mt-0.5 shrink-0' })}
                      <span>Não conheço a tradução de ${dados.lacunas.map((l) => `<strong>“${escapeHtml(l)}”</strong>`).join(', ')}.
                      Deixei em português: troque pelo espanhol, se houver, antes de cadastrar.</span>
                    </p>`
                  : `<p class="mt-1 text-xs text-slate-400">Montada a partir dos pratos da biblioteca. Confira e ajuste se precisar.</p>`
              }
            </div>
          </div>`;
        rodape.innerHTML = `
          <button type="button" data-voltar class="${SECUNDARIO}">${icon('arrowLeft', { size: 15 })} Voltar</button>
          <button type="button" data-confirmar-cadastro class="${PRIMARIO}">${icon('check', { size: 17 })} Cadastrar e usar na placa</button>`;
        const campoEs = corpo.querySelector('[data-es]');
        const cadastrar = rodape.querySelector('[data-confirmar-cadastro]');
        campoEs.addEventListener('input', () => {
          dados.es = campoEs.value;
          dados.esEditado = true;
          cadastrar.disabled = !campoEs.value.trim();
        });
        rodape.querySelector('[data-voltar]').addEventListener('click', etapaNome);
        cadastrar.addEventListener('click', async () => {
          const es = arrumarNome(campoEs.value);
          if (!es) return;
          cadastrar.disabled = true;
          cadastrar.innerHTML = `<span class="spinner inline-flex">${icon('spinner', { size: 17 })}</span> Cadastrando…`;
          const { entrada, enviado } = await cadastrarProvisorio({
            pt: dados.pt,
            es,
            categoria: dados.categoria,
            revisao: dados.revisao,
            tela,
          });
          escolher(entrada);
          showToast(
            enviado
              ? 'Prato cadastrado. Ele já aparece na busca de todos os computadores.'
              : planilhaConfigurada()
              ? 'Prato guardado neste computador. Ele vai para a planilha assim que a conexão voltar.'
              : 'Prato guardado neste computador.',
            { type: 'success', duration: 4500 }
          );
        });
        campoEs.focus();
      }

      etapaNome();
    },
  });
}
