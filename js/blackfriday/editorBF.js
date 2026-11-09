// Tela de edição dos cards da Black Friday: um seletor de vendedor (com foto)
// por pessoa do card, o nome que vai na arte e, no "Já Vendi", a conquista.
//
// O seletor é um combobox próprio, não um <select>: a escolha é por rosto, e
// <option> não mostra imagem. Teclado: ↓/Enter/Espaço abre, digitar filtra,
// ↑/↓ percorrem, Enter escolhe, Esc fecha. Quem já está em outra posição do
// mesmo card aparece desabilitado — não dá para a mesma pessoa ser vendedor e
// ajudante, nem ocupar dois lugares do pódio.
//
// As pessoas vivem em `state.bf.pessoas[slot]` como objetos mutáveis (a foto é
// um HTMLImageElement), como os colaboradores do RH; cada mudança chama
// `setState` para a prévia repintar e o passo não é remontado (guarda de
// assinatura em edicaoStep.js), então o foco não se perde.

import { getState, setState } from '../state.js';
import { icon } from '../ui/icons.js';
import { escapeHtml, normalizeSearch } from '../utils.js';
import { montarEditorFoto } from '../rh/photoEditor.js';
import { VENDEDORES } from './vendedores.js';
import { COLABORADORES_BOTTON } from './colaboradores.js';
import { CONQUISTAS, ROTULOS_SLOT } from './templates.js';

// Os cards escolhem entre os vendedores; o botton, entre todos os
// colaboradores da pasta Bottons-black (ver colaboradores.js).
export const pessoasDo = (formato) => (formato?.botton ? COLABORADORES_BOTTON : VENDEDORES);
export const acharPessoa = (formato, id) => pessoasDo(formato).find((p) => p.id === id) || null;

// Clique fora fecha o seletor aberto. Registrado uma vez, como o da busca do A&B.
document.addEventListener('click', (e) => {
  document.querySelectorAll('[data-picker]').forEach((p) => {
    if (!p.contains(e.target)) fecharPicker(p);
  });
});

let agendado = false;
function commit() {
  if (agendado) return;
  agendado = true;
  requestAnimationFrame(() => {
    agendado = false;
    setState({ bf: { ...getState().bf } });
  });
}

// Fotos já carregadas, por arquivo: trocar de pessoa e voltar não baixa de
// novo. A chave é o caminho, não o id — a mesma pessoa pode estar nas duas
// listas com fotos diferentes.
const fotosCarregadas = new Map();
function carregarFoto(vendedor) {
  if (!fotosCarregadas.has(vendedor.foto)) {
    const p = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Foto de ${vendedor.nome} não encontrada.`));
      img.src = vendedor.foto;
    });
    p.catch(() => fotosCarregadas.delete(vendedor.foto));
    fotosCarregadas.set(vendedor.foto, p);
  }
  return fotosCarregadas.get(vendedor.foto);
}

/** Slots do card que mostram o nome na arte (o Top 3 só mostra as fotos). */
const slotsComNome = (formato) => new Set(formato.textos.filter((t) => t.fonte === 'nome').map((t) => t.slot));

// ------------------------------------------------------------- Pronto?

export function prontoBF(state, formato) {
  const pessoas = state.bf?.pessoas || {};
  // Botton: vale foto da pasta ou enviada do computador; o nome é livre.
  if (formato.botton) {
    const p = pessoas[formato.slots[0]];
    if (!p?.foto?.img) return { ok: false, hint: 'Escolha a foto do colaborador ou envie uma do computador.' };
    if (!p.nome.trim()) return { ok: false, hint: 'Escreva o nome que vai no botton.' };
    return { ok: true, hint: '' };
  }
  const comNome = slotsComNome(formato);
  for (const slot of formato.slots) {
    const p = pessoas[slot];
    const rotulo = ROTULOS_SLOT[slot].titulo;
    if (!p?.vendedorId) {
      return { ok: false, hint: slot === 'ajudante' ? 'Escolha quem ajudou a bater a meta.' : `Escolha o ${rotulo.toLowerCase()} para continuar.` };
    }
    if (comNome.has(slot) && !p.nome.trim()) return { ok: false, hint: `Preencha o nome que vai na arte (${rotulo.toLowerCase()}).` };
  }
  const ids = formato.slots.map((s) => pessoas[s].vendedorId);
  if (new Set(ids).size !== ids.length) return { ok: false, hint: 'A mesma pessoa está em duas posições do card.' };
  if (formato.comConquista && !CONQUISTAS.some((c) => c.valor === state.bf.conquista)) {
    return { ok: false, hint: 'Escolha a conquista para continuar.' };
  }
  return { ok: true, hint: '' };
}

// ------------------------------------------------------------------ HTML

const CAMPO =
  'w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-brand-deep outline-none transition-colors focus:border-brand-blue focus:ring-2 focus:ring-brand-light';

function avatar(vendedor, tamanho) {
  return vendedor
    ? `<img src="${vendedor.miniatura}" alt="" width="${tamanho}" height="${tamanho}" loading="lazy"
        class="shrink-0 rounded-full object-cover ring-2 ring-[#d9a930]" style="width:${tamanho}px;height:${tamanho}px" />`
    : `<span class="inline-flex shrink-0 items-center justify-center rounded-full border-2 border-dashed border-slate-300 text-slate-300"
        style="width:${tamanho}px;height:${tamanho}px">${icon('user', { size: Math.round(tamanho / 2.2) })}</span>`;
}

function rotuloVazio(slot) {
  if (slot === 'ajudante') return 'Escolha o colega';
  if (slot === 'botton') return 'Escolha da pasta de fotos';
  return 'Escolha o vendedor';
}

function conteudoBotao(vendedor, slot, formato, { enviada = false } = {}) {
  return `
    ${avatar(vendedor, 44)}
    <span class="min-w-0 flex-1 text-left">
      <span class="block truncate font-fibra font-extrabold ${vendedor ? 'text-brand-deep' : 'text-slate-400'}">
        ${vendedor ? escapeHtml(vendedor.nome) : enviada ? 'Foto enviada do computador' : rotuloVazio(slot)}
      </span>
      ${
        vendedor
          ? ''
          : `<span class="block text-xs text-slate-400">${
              enviada ? 'Abra para trocar por uma da pasta' : `${pessoasDo(formato).length} pessoas com foto`
            }</span>`
      }
    </span>
    <span class="text-slate-400">${icon('chevronDown', { size: 18 })}</span>
  `;
}

function opcoes(slot, formato, filtro = '') {
  const pessoas = getState().bf.pessoas;
  const ocupados = new Map(
    Object.entries(pessoas)
      // Só as posições deste card: o estado guarda também as de outras peças
      // (o botton de quem passou por ele antes de trocar de formato).
      .filter(([s, p]) => s !== slot && formato.slots.includes(s) && p?.vendedorId)
      .map(([s, p]) => [p.vendedorId, ROTULOS_SLOT[s].titulo])
  );
  const termo = normalizeSearch(filtro);
  const lista = pessoasDo(formato).filter((v) => !termo || normalizeSearch(v.nome).includes(termo));
  if (!lista.length) return `<li class="px-3 py-4 text-center text-sm text-slate-400">Ninguém com esse nome.</li>`;
  return lista
    .map((v) => {
      const ocupadoEm = ocupados.get(v.id);
      const selecionado = pessoas[slot]?.vendedorId === v.id;
      return `
        <li role="option" id="opt-${slot}-${v.id}" data-id="${v.id}" aria-selected="${selecionado}" ${ocupadoEm ? 'aria-disabled="true"' : ''}
          class="flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 aria-disabled:cursor-not-allowed aria-disabled:opacity-40 [&.ativo]:bg-brand-light/50 ${
            selecionado ? 'bg-[#fdf3d7]' : ''
          }">
          ${avatar(v, 36)}
          <span class="min-w-0 flex-1">
            <span class="block truncate text-sm font-bold text-brand-deep">${escapeHtml(v.nome)}</span>
            ${ocupadoEm ? `<span class="block text-[11px] text-slate-500">Já está como ${escapeHtml(ocupadoEm.toLowerCase())}</span>` : ''}
          </span>
          ${selecionado ? `<span class="text-[#b8860b]">${icon('check', { size: 16, strokeWidth: 3 })}</span>` : ''}
        </li>`;
    })
    .join('');
}

function blocoPessoa(slot, formato, comNome) {
  const pessoa = getState().bf.pessoas[slot];
  const vendedor = acharPessoa(formato, pessoa?.vendedorId);
  const rotulo = ROTULOS_SLOT[slot];
  const botton = Boolean(formato.botton);
  const enviada = botton && !vendedor && Boolean(pessoa?.foto?.img);
  return `
    <div data-slot="${slot}" class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div class="mb-3 flex items-baseline justify-between gap-3">
        <p class="font-fibra font-extrabold text-brand-deep">${rotulo.titulo}</p>
        <p class="text-right text-[11px] text-slate-400">${rotulo.ajuda}</p>
      </div>

      <div data-picker="${slot}" class="relative">
        <button type="button" data-picker-btn role="combobox" aria-haspopup="listbox" aria-expanded="false"
          aria-controls="lista-${slot}" aria-label="${rotulo.titulo}: escolher pessoa"
          class="flex w-full items-center gap-3 rounded-xl border-2 border-slate-200 bg-white px-3 py-2.5 transition-colors hover:border-[#d9a930] focus-visible:border-brand-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-light">
          ${conteudoBotao(vendedor, slot, formato, { enviada })}
        </button>
        <div data-picker-pop class="absolute z-30 mt-1.5 hidden w-full rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
          <div class="relative mb-1.5">
            <span class="pointer-events-none absolute left-2.5 top-1/2 flex -translate-y-1/2 text-slate-300">${icon('search', { size: 15 })}</span>
            <input type="text" data-picker-busca autocomplete="off" placeholder="Buscar pelo nome"
              aria-label="Buscar pelo nome" aria-controls="lista-${slot}"
              class="w-full rounded-lg border border-slate-200 py-2 pl-8 pr-2 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-light" />
          </div>
          <ul id="lista-${slot}" role="listbox" data-picker-lista class="max-h-72 space-y-0.5 overflow-y-auto"></ul>
        </div>
      </div>

      ${
        botton
          ? `<button type="button" data-enviar
              class="mt-2 inline-flex items-center gap-1.5 rounded-lg px-1 py-0.5 text-xs font-bold text-slate-500 underline decoration-slate-300 underline-offset-2 transition-colors hover:text-brand-blue hover:decoration-brand-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-light">
              ${icon('camera', { size: 13 })} Ou envie uma foto do computador
            </button>`
          : ''
      }

      <div data-detalhe class="${vendedor || botton ? '' : 'hidden'} mt-4 grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-[auto_minmax(0,1fr)]">
        <div data-foto-slot></div>
        <div class="space-y-1.5">
          ${
            comNome
              ? `<label class="block">
                  <span class="mb-1 block text-xs font-bold text-slate-600">Nome na arte</span>
                  <input type="text" data-nome maxlength="${botton ? 32 : 24}" autocomplete="off" value="${escapeHtml(pessoa?.nome || '')}"
                    ${botton ? 'placeholder="Como o colaborador é chamado"' : ''} class="${CAMPO}" />
                </label>
                <p class="text-[11px] leading-snug text-slate-400">${
                  botton
                    ? 'Sai em maiúsculas na pílula dourada. Nome longo quebra em duas linhas.'
                    : 'Sai em maiúsculas. Vem com o primeiro nome; acrescente o sobrenome se quiser.'
                }</p>`
              : `<p class="text-[11px] leading-snug text-slate-400">No Top 3 a arte mostra só as fotos.</p>`
          }
          <p class="text-[11px] leading-snug text-slate-400">${
            botton
              ? 'As fotos da pasta já vêm enquadradas no rosto. Arraste ou use o zoom para ajustar dentro do círculo.'
              : 'A foto já vem enquadrada no rosto. Arraste ou use o zoom se quiser ajustar.'
          }</p>
        </div>
      </div>
    </div>
  `;
}

function blocoConquista() {
  const atual = getState().bf.conquista;
  return `
    <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <label class="block">
        <span class="mb-1 flex items-center gap-1.5 font-fibra font-extrabold text-brand-deep">
          ${icon('trophy', { size: 16, className: 'text-[#b8860b]' })} Conquista
        </span>
        <span class="mb-2 block text-[11px] text-slate-400">O valor que entra na pílula dourada, depois de "JÁ VENDI".</span>
        <select data-conquista class="${CAMPO}">
          <option value="" ${atual ? '' : 'selected'}>Selecione…</option>
          <optgroup label="Mil">
            ${CONQUISTAS.filter((c) => c.valor.endsWith('K'))
              .map((c) => `<option value="${c.valor}" ${c.valor === atual ? 'selected' : ''}>${escapeHtml(c.rotulo)}</option>`)
              .join('')}
          </optgroup>
          <optgroup label="Milhão">
            ${CONQUISTAS.filter((c) => c.valor.endsWith('MI'))
              .map((c) => `<option value="${c.valor}" ${c.valor === atual ? 'selected' : ''}>${escapeHtml(c.rotulo)}</option>`)
              .join('')}
          </optgroup>
        </select>
      </label>
    </div>
  `;
}

export function bodyBF(formato) {
  const comNome = slotsComNome(formato);
  return `
    <div data-bf-root class="space-y-4">
      ${formato.slots.map((slot) => blocoPessoa(slot, formato, comNome.has(slot))).join('')}
      ${formato.comConquista ? blocoConquista() : ''}
    </div>
  `;
}

// ---------------------------------------------------------------- Wiring

function fecharPicker(picker) {
  const pop = picker.querySelector('[data-picker-pop]');
  if (!pop || pop.classList.contains('hidden')) return;
  pop.classList.add('hidden');
  picker.querySelector('[data-picker-btn]').setAttribute('aria-expanded', 'false');
}

function montarFoto(bloco, slot, formato) {
  montarEditorFoto(bloco.querySelector('[data-foto-slot]'), {
    forma: 'circulo',
    aspecto: 1,
    getFoto: () => getState().bf.pessoas[slot]?.foto || null,
    setFoto: (foto) => {
      const pessoas = getState().bf.pessoas;
      if (!formato.botton) {
        if (pessoas[slot]) pessoas[slot].foto = foto;
        return;
      }
      // Botton: o editor de foto é também o caminho do upload. Uma foto nova
      // vinda dele desvincula a pessoa da pasta (o seletor passa a dizer
      // "Foto enviada do computador"); o nome digitado fica.
      const p = pessoas[slot] || (pessoas[slot] = { vendedorId: null, nome: '', foto: null });
      if (foto?.img && foto.img !== p.foto?.img) p.vendedorId = null;
      p.foto = foto;
      const enviada = Boolean(foto?.img) && !p.vendedorId;
      bloco.querySelector('[data-picker-btn]').innerHTML = conteudoBotao(acharPessoa(formato, p.vendedorId), slot, formato, { enviada });
    },
    onChange: commit,
  });
}

function ligarPessoa(bloco, root, formato) {
  const slot = bloco.dataset.slot;
  const picker = bloco.querySelector('[data-picker]');
  const botao = picker.querySelector('[data-picker-btn]');
  const pop = picker.querySelector('[data-picker-pop]');
  const busca = picker.querySelector('[data-picker-busca]');
  const lista = picker.querySelector('[data-picker-lista]');
  const detalhe = bloco.querySelector('[data-detalhe]');
  const nomeInput = bloco.querySelector('[data-nome]');
  let ativo = -1;

  const itens = () => [...lista.querySelectorAll('[role="option"]:not([aria-disabled="true"])')];
  const marcarAtivo = (i) => {
    const todos = itens();
    if (!todos.length) return;
    ativo = (i + todos.length) % todos.length;
    todos.forEach((el, k) => el.classList.toggle('ativo', k === ativo));
    todos[ativo].scrollIntoView({ block: 'nearest' });
    busca.setAttribute('aria-activedescendant', todos[ativo].id);
  };
  const pintarLista = () => {
    lista.innerHTML = opcoes(slot, formato, busca.value);
    ativo = -1;
    busca.removeAttribute('aria-activedescendant');
  };

  const abrir = () => {
    root.querySelectorAll('[data-picker]').forEach((p) => p !== picker && fecharPicker(p));
    busca.value = '';
    pintarLista();
    pop.classList.remove('hidden');
    botao.setAttribute('aria-expanded', 'true');
    const atual = itens().findIndex((el) => el.getAttribute('aria-selected') === 'true');
    if (atual >= 0) marcarAtivo(atual);
    busca.focus();
  };

  const escolher = async (id) => {
    const vendedor = acharPessoa(formato, id);
    if (!vendedor) return;
    fecharPicker(picker);
    botao.focus();
    botao.innerHTML = conteudoBotao(vendedor, slot, formato);

    const pessoas = getState().bf.pessoas;
    const anterior = pessoas[slot];
    // No botton o nome é livre: só é sugerido se o campo estiver vazio ou
    // ainda com a sugestão da pessoa anterior — o que foi digitado fica.
    const sugestaoAnterior = acharPessoa(formato, anterior?.vendedorId)?.nomeArte || '';
    const manterNome = formato.botton && anterior?.nome.trim() && anterior.nome !== sugestaoAnterior;
    const pessoa = { vendedorId: id, nome: manterNome ? anterior.nome : vendedor.nomeArte, foto: null };
    pessoas[slot] = pessoa;
    if (nomeInput) nomeInput.value = pessoa.nome;
    detalhe.classList.remove('hidden');
    montarFoto(bloco, slot, formato);
    commit();

    try {
      const img = await carregarFoto(vendedor);
      // Outra escolha pode ter chegado enquanto a foto carregava.
      if (getState().bf.pessoas[slot] !== pessoa) return;
      pessoa.foto = { img, ...vendedor.enquadramento };
    } catch (err) {
      console.error(err);
      // Sem a foto o card sai com as iniciais (placeholder) — e o editor
      // oferece "Escolher foto" para subir uma do computador.
    }
    montarFoto(bloco, slot, formato);
    commit();
  };

  botao.addEventListener('click', () => (pop.classList.contains('hidden') ? abrir() : fecharPicker(picker)));
  botao.addEventListener('keydown', (e) => {
    if (['ArrowDown', 'Enter', ' '].includes(e.key)) {
      e.preventDefault();
      abrir();
    }
  });
  busca.addEventListener('input', () => {
    pintarLista();
    if (busca.value.trim()) marcarAtivo(0);
  });
  busca.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      marcarAtivo(ativo + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      marcarAtivo(ativo - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const el = itens()[ativo];
      if (el) escolher(el.dataset.id);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      fecharPicker(picker);
      botao.focus();
    }
  });
  lista.addEventListener('click', (e) => {
    const el = e.target.closest('[role="option"]');
    if (!el || el.getAttribute('aria-disabled') === 'true') return;
    escolher(el.dataset.id);
  });

  nomeInput?.addEventListener('input', () => {
    const pessoas = getState().bf.pessoas;
    // Botton: dá para escrever o nome antes de escolher a foto.
    if (!pessoas[slot] && formato.botton) pessoas[slot] = { vendedorId: null, nome: '', foto: null };
    const p = pessoas[slot];
    if (!p) return;
    p.nome = nomeInput.value;
    commit();
  });

  bloco.querySelector('[data-enviar]')?.addEventListener('click', () => {
    bloco.querySelector('[data-foto-slot] [data-arquivo]')?.click();
  });

  if (getState().bf.pessoas[slot]?.vendedorId || formato.botton) montarFoto(bloco, slot, formato);
}

export function wireBF(container, formato) {
  const root = container.querySelector('[data-bf-root]');
  root.querySelectorAll('[data-slot]').forEach((bloco) => ligarPessoa(bloco, root, formato));

  const conquista = root.querySelector('[data-conquista]');
  conquista?.addEventListener('change', () => {
    const valor = CONQUISTAS.some((c) => c.valor === conquista.value) ? conquista.value : '';
    setState({ bf: { ...getState().bf, conquista: valor } });
  });
}
