// Tela de edição das peças do RH com cards: Talento do Mês (1 colaborador) e
// Aniversariantes do Dia (1 a N). Nome, setor e foto por pessoa.
//
// Os colaboradores vivem em `state.rh.colaboradores` como objetos mutáveis
// (a foto é um HTMLImageElement, que não se serializa nem se clona). Cada
// mudança chama `setState` para a prévia repintar; o passo de edição não é
// remontado nesse render (guarda de assinatura em edicaoStep.js), então os
// campos e os editores de foto continuam onde estão e o foco não se perde.
//
// Nada disto é persistido em lugar nenhum — ver photoEditor.js (LGPD).

import { getState, setState } from '../state.js';
import { icon } from '../ui/icons.js';
import { escapeHtml } from '../utils.js';
import { montarEditorFoto } from './photoEditor.js';

const novoColaborador = () => ({ nome: '', setor: '', foto: null });

// Repinta a prévia no próximo frame, no máximo uma vez por frame: arrastar a
// foto dispara dezenas de eventos por segundo.
let agendado = false;
function commit() {
  if (agendado) return;
  agendado = true;
  requestAnimationFrame(() => {
    agendado = false;
    setState({ rh: { colaboradores: getState().rh.colaboradores } });
  });
}

/** Garante a lista com exatamente `n` colaboradores (preserva os existentes). */
function ajustarQuantidade(n) {
  const lista = getState().rh.colaboradores;
  while (lista.length < n) lista.push(novoColaborador());
  lista.length = n;
  return lista;
}

/**
 * O que falta para poder continuar: todos precisam de nome e setor.
 * @returns {{ ok: boolean, hint: string }}
 */
export function prontoRH(state) {
  const lista = state.rh?.colaboradores || [];
  if (!lista.length) return { ok: false, hint: 'Preencha o nome do colaborador para continuar.' };
  const faltando = lista.filter((c) => !c.nome.trim() || !c.setor.trim()).length;
  if (faltando) {
    return {
      ok: false,
      hint: lista.length === 1 ? 'Preencha nome e setor para continuar.' : `Preencha nome e setor de todos (${faltando} incompleto${faltando > 1 ? 's' : ''}).`,
    };
  }
  return { ok: true, hint: '' };
}

// ------------------------------------------------------------------ HTML

function linhaColaborador(indice, colaborador, { forma, mostrarNumero }) {
  return `
    <div data-colaborador="${indice}" class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      ${mostrarNumero ? `<p class="mb-3 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Colaborador ${indice + 1}</p>` : ''}
      <div class="grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)]">
        <div data-foto-slot data-forma="${forma}"></div>
        <div class="space-y-3">
          <label class="block">
            <span class="mb-1 block text-xs font-bold text-slate-600">Nome</span>
            <input type="text" data-campo="nome" value="${escapeHtml(colaborador.nome)}" maxlength="60" autocomplete="off"
              placeholder="Ex: Maria Aparecida"
              class="w-full rounded-xl border-2 border-slate-200 px-3 py-2.5 text-sm font-semibold text-brand-deep outline-none transition-colors focus:border-brand-blue focus:ring-2 focus:ring-brand-light" />
          </label>
          <label class="block">
            <span class="mb-1 block text-xs font-bold text-slate-600">Setor</span>
            <input type="text" data-campo="setor" value="${escapeHtml(colaborador.setor)}" maxlength="40" autocomplete="off"
              placeholder="Ex: Recepção"
              class="w-full rounded-xl border-2 border-slate-200 px-3 py-2.5 text-sm font-semibold text-brand-deep outline-none transition-colors focus:border-brand-blue focus:ring-2 focus:ring-brand-light" />
          </label>
          <p class="text-[11px] leading-snug text-slate-400">As faixas crescem com o texto; se o nome for muito longo, ele quebra em duas linhas.</p>
        </div>
      </div>
    </div>
  `;
}

export function bodyRH(formato, state) {
  const editor = formato.editor;
  const lista = state.rh.colaboradores;

  if (editor === 'talento') {
    if (!lista.length) ajustarQuantidade(1);
    return `
      <div data-rh-root data-editor="talento" class="space-y-4">
        <div class="rounded-2xl border border-brand-vivid/30 bg-brand-light/25 px-4 py-3 text-sm text-slate-600">
          ${icon('info', { size: 15, className: 'mr-1 inline align-[-2px] text-brand-deep' })}
          A foto entra no polaroid e as faixas de nome e setor acompanham a inclinação dele.
        </div>
        ${linhaColaborador(0, getState().rh.colaboradores[0], { forma: 'quadrado', mostrarNumero: false })}
      </div>
    `;
  }

  const max = formato.maxColaboradores || 9;
  if (!lista.length) ajustarQuantidade(1);
  const atual = getState().rh.colaboradores;
  return `
    <div data-rh-root data-editor="aniversariantes" class="space-y-4">
      <div class="flex flex-wrap items-end gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <label class="block">
          <span class="mb-1 block text-xs font-bold text-slate-600">Quantas pessoas?</span>
          <input type="number" data-quantidade min="1" max="${max}" step="1" value="${atual.length}" inputmode="numeric"
            class="w-24 rounded-xl border-2 border-slate-200 px-3 py-2 text-lg font-extrabold text-brand-deep outline-none transition-colors focus:border-brand-blue focus:ring-2 focus:ring-brand-light" />
        </label>
        <p class="pb-2 text-xs text-slate-500">De 1 a ${max}. A distribuição na arte é automática: 1 no centro, 2 lado a lado, até 6 em duas colunas, até ${max} em três.</p>
      </div>
      <div data-lista class="space-y-3">
        ${atual.map((c, i) => linhaColaborador(i, c, { forma: 'circulo', mostrarNumero: true })).join('')}
      </div>
    </div>
  `;
}

// ---------------------------------------------------------------- Wiring

function ligarLinha(linha, formato) {
  const indice = Number(linha.dataset.colaborador);
  const colaborador = () => getState().rh.colaboradores[indice];

  linha.querySelectorAll('[data-campo]').forEach((input) => {
    input.addEventListener('input', () => {
      const c = colaborador();
      if (!c) return;
      c[input.dataset.campo] = input.value;
      commit();
    });
  });

  const slot = linha.querySelector('[data-foto-slot]');
  const quadrado = slot.dataset.forma === 'quadrado';
  montarEditorFoto(slot, {
    forma: quadrado ? 'quadrado' : 'circulo',
    aspecto: quadrado ? formato.polaroid.largura / formato.polaroid.altura : 1,
    getFoto: () => colaborador()?.foto || null,
    setFoto: (foto) => {
      const c = colaborador();
      if (c) c.foto = foto;
    },
    onChange: commit,
  });
}

export function wireRH(container, formato) {
  const root = container.querySelector('[data-rh-root]');
  root.querySelectorAll('[data-colaborador]').forEach((linha) => ligarLinha(linha, formato));

  const quantidade = root.querySelector('[data-quantidade]');
  if (!quantidade) return;

  const max = formato.maxColaboradores || 9;
  const lista = root.querySelector('[data-lista]');

  // Poka-Yoke do número: acima do máximo corrige para o máximo; vazio ou zero
  // vira 1 ao sair do campo. Reduzir a quantidade descarta as últimas linhas.
  const aplicar = () => {
    let n = Math.floor(Number(quantidade.value));
    if (!Number.isFinite(n) || n < 1) return; // ainda digitando
    if (n > max) {
      n = max;
      quantidade.value = String(n);
    }
    const atual = getState().rh.colaboradores.length;
    if (n === atual) return;
    ajustarQuantidade(n);
    const colaboradores = getState().rh.colaboradores;
    if (n < atual) {
      lista.querySelectorAll('[data-colaborador]').forEach((el) => {
        if (Number(el.dataset.colaborador) >= n) el.remove();
      });
    } else {
      for (let i = atual; i < n; i += 1) {
        lista.insertAdjacentHTML('beforeend', linhaColaborador(i, colaboradores[i], { forma: 'circulo', mostrarNumero: true }));
        ligarLinha(lista.lastElementChild, formato);
      }
    }
    commit();
  };
  quantidade.addEventListener('input', aplicar);
  quantidade.addEventListener('blur', () => {
    if (!(Math.floor(Number(quantidade.value)) >= 1)) {
      quantidade.value = '1';
      aplicar();
    }
  });
}
