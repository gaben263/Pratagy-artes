// Tela de edição das peças do RH com colaboradores: Talento do Mês (1),
// a grade de cards circulares (Aniversariantes, Destaque, Bem Vindos — 1 a N)
// e o Plantão de Gestores (1 gestor + data + tipo). Nome, setor e foto por
// pessoa.
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
import { debounce, escapeHtml } from '../utils.js';
import { montarEditorFoto } from './photoEditor.js';
import { TIPOS_PLANTAO, camposDoEncontro } from './templates.js';

const novoColaborador = () => ({ nome: '', setor: '', foto: null });

// Repinta a prévia no próximo frame, no máximo uma vez por frame: arrastar a
// foto dispara dezenas de eventos por segundo.
let agendado = false;
function commit() {
  if (agendado) return;
  agendado = true;
  requestAnimationFrame(() => {
    agendado = false;
    // Espalha o `rh` inteiro: `setState` troca a chave toda, e montar o objeto
    // só com `colaboradores` apagaria a data do Encontro Geral.
    setState({ rh: { ...getState().rh } });
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

/** Plantão: além de nome e setor do gestor, a data e o tipo de plantão. */
export function prontoPlantao(state) {
  const base = prontoRH(state);
  if (!base.ok) return base;
  if (!state.rh.data?.trim()) return { ok: false, hint: 'Preencha a data do plantão para continuar.' };
  if (!TIPOS_PLANTAO.includes(state.rh.tipoPlantao)) return { ok: false, hint: 'Escolha o tipo de plantão para continuar.' };
  return { ok: true, hint: '' };
}

// ------------------------------- Encontro Geral, Café com Gestor, Show
//
// Os campos ao lado dos ícones impressos são campos à parte do comunicado, e
// são eles (não o texto) que liberam o Continuar — um Encontro Geral sem
// comunicado é legítimo; sem data, não. A lista vem de `camposDoEncontro`:
// no Encontro Geral é o `data` de sempre; no Café, data, horário e local; no
// Show, data e horário (o local está impresso na arte).

/** O que falta para poder continuar: o primeiro campo vazio, pelo nome. */
export function prontoEncontro(state, formato) {
  for (const campo of camposDoEncontro(formato)) {
    if (!state.rh?.[campo.id]?.trim()) return { ok: false, hint: campo.dicaVazio };
  }
  return { ok: true, hint: '' };
}

export function camposEncontro(formato) {
  return camposDoEncontro(formato)
    .map(
      (campo) => `
    <div data-campo-data class="mt-4 border-t border-slate-100 pt-4">
      <label class="mb-1.5 flex items-center gap-1.5 text-sm font-bold text-slate-600">
        ${icon(campo.icone, { size: 14, className: 'text-slate-400' })} ${escapeHtml(campo.rotulo)}
      </label>
      <input type="text" data-data-input="${campo.id}" maxlength="${campo.maxCaracteres}" autocomplete="off"
        placeholder="${escapeHtml(campo.placeholder)}"
        class="w-full rounded-xl border-2 border-slate-200 px-3 py-2.5 text-sm font-semibold text-brand-deep outline-none transition-colors focus:border-brand-blue focus:ring-2 focus:ring-brand-light" />
      <p class="mt-1.5 text-xs text-slate-400">${escapeHtml(campo.ajuda)}</p>
    </div>
  `
    )
    .join('');
}

export function wireCampoData(container) {
  for (const input of container.querySelectorAll('[data-data-input]')) {
    const id = input.dataset.dataInput;
    input.value = getState().rh[id] || '';
    const commit = debounce(() => setState({ rh: { ...getState().rh, [id]: input.value } }), 150);
    input.addEventListener('input', commit);
  }
}

// ------------------------------------------------------------------ HTML

const DICA_CARD = 'As faixas crescem com o texto; se o nome for muito longo, ele quebra em duas linhas.';

function linhaColaborador(indice, colaborador, { forma, mostrarNumero, dica = DICA_CARD }) {
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
          <p class="text-[11px] leading-snug text-slate-400">${dica}</p>
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

  if (editor === 'plantao') {
    if (!lista.length) ajustarQuantidade(1);
    return `
      <div data-rh-root data-editor="plantao" class="space-y-4">
        <div class="rounded-2xl border border-brand-vivid/30 bg-brand-light/25 px-4 py-3 text-sm text-slate-600">
          ${icon('info', { size: 15, className: 'mr-1 inline align-[-2px] text-brand-deep' })}
          A foto entra no círculo da arte; nome e setor, na faixa azul. Data e tipo ficam ao lado dos ícones.
        </div>
        ${linhaColaborador(0, getState().rh.colaboradores[0], {
          forma: 'circulo',
          mostrarNumero: false,
          dica: 'Nome e setor entram na faixa azul da arte, em uma linha cada; se não couberem, a fonte reduz.',
        })}
        ${camposPlantao(state)}
      </div>
    `;
  }

  const max = formato.maxColaboradores || 9;
  if (!lista.length) ajustarQuantidade(1);
  const atual = getState().rh.colaboradores.slice(0, max);
  getState().rh.colaboradores.length = atual.length;
  return `
    <div data-rh-root data-editor="aniversariantes" class="space-y-4">
      ${max > 1 ? blocoQuantidade(max, atual.length, formato.grade) : ''}
      <div data-lista class="space-y-3">
        ${atual.map((c, i) => linhaColaborador(i, c, { forma: 'circulo', mostrarNumero: max > 1 })).join('')}
      </div>
    </div>
  `;
}

// Campo "Quantas pessoas?" da grade. Um template de uma pessoa só não mostra
// o bloco: um campo que só aceita um valor é ruído para o RH. O texto de
// ajuda descreve a distribuição só até o máximo da peça — e, no modo de duas
// linhas (Bem Vindos, Destaques), a distribuição por colunas.
function blocoQuantidade(max, atual, grade) {
  const distribuicao =
    grade === 'duasLinhas'
      ? `1 no centro, 2 lado a lado, a partir de 3 em duas linhas (até ${max} em quatro colunas)`
      : max <= 2
      ? '1 no centro, 2 lado a lado'
      : max <= 6
      ? `1 no centro, 2 lado a lado, até ${max} em duas colunas`
      : `1 no centro, 2 lado a lado, até 6 em duas colunas, até ${max} em três`;
  return `
    <div class="flex flex-wrap items-end gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <label class="block">
        <span class="mb-1 block text-xs font-bold text-slate-600">Quantas pessoas?</span>
        <input type="number" data-quantidade min="1" max="${max}" step="1" value="${atual}" inputmode="numeric"
          class="w-24 rounded-xl border-2 border-slate-200 px-3 py-2 text-lg font-extrabold text-brand-deep outline-none transition-colors focus:border-brand-blue focus:ring-2 focus:ring-brand-light" />
      </label>
      <p class="pb-2 text-xs text-slate-500">De 1 a ${max}. A distribuição na arte é automática: ${distribuicao}.</p>
    </div>
  `;
}

// Data e tipo do Plantão. O tipo é um <select> nativo com as três opções de
// TIPOS_PLANTAO e nada mais — o Poka-Yoke é estrutural: não existe como
// digitar outra coisa. Começa vazio para o RH escolher de propósito.
function camposPlantao(state) {
  const tipoAtual = state.rh.tipoPlantao;
  return `
    <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div class="grid gap-4 sm:grid-cols-2">
        <label class="block">
          <span class="mb-1 flex items-center gap-1.5 text-xs font-bold text-slate-600">
            ${icon('calendar', { size: 13, className: 'text-slate-400' })} Data do plantão
          </span>
          <input type="text" data-data-input maxlength="40" autocomplete="off" placeholder="Ex: 05/09 e 06/09"
            class="w-full rounded-xl border-2 border-slate-200 px-3 py-2.5 text-sm font-semibold text-brand-deep outline-none transition-colors focus:border-brand-blue focus:ring-2 focus:ring-brand-light" />
        </label>
        <label class="block">
          <span class="mb-1 flex items-center gap-1.5 text-xs font-bold text-slate-600">
            ${icon('clock', { size: 13, className: 'text-slate-400' })} Tipo de plantão
          </span>
          <select data-tipo-plantao
            class="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-brand-deep outline-none transition-colors focus:border-brand-blue focus:ring-2 focus:ring-brand-light">
            <option value="" ${tipoAtual ? '' : 'selected'}>Selecione…</option>
            ${TIPOS_PLANTAO.map((t) => `<option value="${escapeHtml(t)}" ${t === tipoAtual ? 'selected' : ''}>${escapeHtml(t)}</option>`).join('')}
          </select>
        </label>
      </div>
      <p class="mt-2 text-[11px] leading-snug text-slate-400">A data entra ao lado do calendário e o tipo ao lado do relógio, como já estão na arte.</p>
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

  const dataInput = root.querySelector('[data-data-input]');
  if (dataInput) {
    dataInput.value = getState().rh.data;
    const commitData = debounce(() => setState({ rh: { ...getState().rh, data: dataInput.value } }), 150);
    dataInput.addEventListener('input', commitData);
  }
  const tipo = root.querySelector('[data-tipo-plantao]');
  if (tipo) {
    tipo.addEventListener('change', () => {
      // Só aceita um dos três valores; qualquer outra coisa vira vazio.
      const valor = TIPOS_PLANTAO.includes(tipo.value) ? tipo.value : '';
      setState({ rh: { ...getState().rh, tipoPlantao: valor } });
    });
  }

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
