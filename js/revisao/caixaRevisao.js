// Caixa de revisão ortográfica: mostra cada possível erro com a sugestão e os
// botões "Aceitar correção" / "Manter como escrevi". Serve para qualquer campo
// de texto livre do sistema (A&B hoje; RH e Acqua Park depois).
//
// Duas formas de usar:
// - montarPainelRevisao(): o painel dentro de uma tela ou modal que já existe
//   (o cadastro de pratos usa assim, porque já está num modal);
// - revisarComCaixa(): abre o próprio modal e devolve o texto final.
//
// A caixa nunca trava o trabalho: "Manter como escrevi" sempre vale, e a
// revisão fora do ar só gera um aviso.

import { icon } from '../ui/icons.js';
import { escapeHtml } from '../utils.js';
import { openModal } from '../ui/common.js';
import { aplicarDecisoes } from './corretor.js';

const BOTAO_BASE =
  'inline-flex items-center gap-1.5 rounded-lg border-2 px-3 py-1.5 text-xs font-bold transition-colors';
const ESTILO = {
  aceitar: { ativo: 'border-status-green bg-status-green text-white', inativo: 'border-slate-200 bg-white text-slate-600 hover:border-status-green' },
  manter: { ativo: 'border-brand-deep bg-brand-deep text-white', inativo: 'border-slate-200 bg-white text-slate-600 hover:border-brand-deep' },
};

/**
 * Resumo da revisão para registro (vai para a planilha de provisórios).
 */
export function resumoDaRevisao(achados, decisoes, indisponivel) {
  const partes = [];
  const aceitas = achados.filter((a, i) => decisoes[i].tipo === 'aceita');
  const mantidas = achados.filter((a, i) => decisoes[i].tipo === 'mantida');
  if (!achados.length) partes.push('Sem erros encontrados');
  if (aceitas.length) partes.push(`${aceitas.length} correç${aceitas.length > 1 ? 'ões aceitas' : 'ão aceita'}`);
  if (mantidas.length) partes.push(`Mantido como digitado: ${mantidas.map((a) => `“${a.original}”`).join(', ')}`);
  if (indisponivel) partes.push('revisão online indisponível');
  return partes.join(' · ');
}

function itemHtml(achado, i, decisao) {
  const temSugestao = Boolean(achado.sugestao);
  const btn = (tipo, rotulo, iconName) => {
    const ativo = decisao.tipo === (tipo === 'aceitar' ? 'aceita' : 'mantida');
    return `<button type="button" data-decidir="${tipo}" data-i="${i}" aria-pressed="${ativo}"
      class="${BOTAO_BASE} ${ativo ? ESTILO[tipo].ativo : ESTILO[tipo].inativo}">
      ${icon(iconName, { size: 13 })} ${rotulo}</button>`;
  };
  return `
    <li class="rounded-xl border ${decisao.tipo === 'pendente' ? 'border-amber-300 bg-amber-50/60' : 'border-slate-200 bg-white'} p-3">
      <p class="text-[11px] font-semibold text-slate-500">${escapeHtml(achado.motivo)}</p>
      ${
        temSugestao
          ? `<p class="mt-1 text-sm">
              <span class="font-semibold text-brand-coral line-through decoration-2">${escapeHtml(achado.original)}</span>
              <span class="mx-1 text-slate-400">→</span>
              <span class="font-extrabold text-brand-deep">${escapeHtml(achado.sugestao)}</span>
            </p>`
          : `<p class="mt-1 text-sm text-slate-700">Não reconhecemos <strong>“${escapeHtml(achado.original)}”</strong>. Confira a grafia
              ou corrija aqui:</p>
             <input type="text" data-editar="${i}" value="${escapeHtml(decisao.valor)}"
               class="mt-2 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-light" />`
      }
      <div class="mt-2 flex flex-wrap gap-2">
        ${temSugestao ? btn('aceitar', 'Aceitar correção', 'check') : btn('aceitar', 'Usar o que digitei acima', 'check')}
        ${btn('manter', `Manter “${escapeHtml(achado.original)}”`, 'x')}
      </div>
    </li>
  `;
}

/**
 * Monta o painel de revisão em `el`.
 *
 * @param {HTMLElement} el
 * @param {string} texto - o texto revisado.
 * @param {Array} achados - saída de corretor.revisar().
 * @param {object} opcoes
 * @param {boolean} [opcoes.indisponivel]
 * @param {(r: {pronto: boolean, texto: string, resumo: string}) => void} opcoes.aoMudar
 */
export function montarPainelRevisao(el, texto, achados, { indisponivel = false, aoMudar }) {
  const decisoes = achados.map((a) => ({ tipo: 'pendente', valor: a.sugestao ?? a.original }));

  const final = () =>
    aplicarDecisoes(
      texto,
      achados,
      decisoes.map((d, i) => (d.tipo === 'aceita' ? d.valor : achados[i].original))
    );

  const notificar = () => {
    aoMudar?.({
      pronto: decisoes.every((d) => d.tipo !== 'pendente'),
      texto: final(),
      resumo: resumoDaRevisao(achados, decisoes, indisponivel),
    });
  };

  function pintar() {
    const faltam = decisoes.filter((d) => d.tipo === 'pendente').length;
    el.innerHTML = `
      ${
        indisponivel
          ? `<p class="mb-3 flex items-start gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs text-slate-600">
              ${icon('info', { size: 14, className: 'mt-0.5 shrink-0' })}
              A revisão online está fora do ar agora. Conferimos só com o vocabulário do resort: revise a grafia com atenção.
            </p>`
          : ''
      }
      ${
        achados.length
          ? `<div class="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p class="text-sm font-bold text-slate-700">
                ${achados.length === 1 ? 'Encontramos um possível erro' : `Encontramos ${achados.length} possíveis erros`}
              </p>
              ${
                achados.some((a) => a.sugestao) && faltam
                  ? `<button type="button" data-aceitar-todas class="text-xs font-bold text-brand-blue hover:underline">Aceitar todas as correções</button>`
                  : ''
              }
            </div>
            <ul class="space-y-2">${achados.map((a, i) => itemHtml(a, i, decisoes[i])).join('')}</ul>`
          : `<p class="flex items-center gap-2 text-sm font-semibold text-status-green">${icon('checkCircle', { size: 16 })} Nenhum erro encontrado.</p>`
      }
      <div class="mt-3 rounded-xl border border-brand-vivid/30 bg-brand-light/25 px-3 py-2">
        <p class="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Fica assim</p>
        <p data-final class="text-sm font-bold text-brand-deep">${escapeHtml(final())}</p>
      </div>
      ${faltam ? `<p class="mt-2 text-xs text-amber-700">Escolha uma opção em cada item para continuar.</p>` : ''}
    `;
  }

  el.addEventListener('click', (e) => {
    if (e.target.closest('[data-aceitar-todas]')) {
      decisoes.forEach((d, i) => {
        if (d.tipo === 'pendente' && achados[i].sugestao) d.tipo = 'aceita';
      });
    } else {
      const botao = e.target.closest('[data-decidir]');
      if (!botao) return;
      decisoes[Number(botao.dataset.i)].tipo = botao.dataset.decidir === 'aceitar' ? 'aceita' : 'mantida';
    }
    pintar();
    notificar();
  });
  el.addEventListener('input', (e) => {
    const campo = e.target.closest('[data-editar]');
    if (!campo) return;
    const d = decisoes[Number(campo.dataset.editar)];
    d.valor = campo.value.trim() || achados[Number(campo.dataset.editar)].original;
    d.tipo = 'aceita';
    // Repinta só a prévia e mantém o foco no campo que está sendo digitado.
    el.querySelector('[data-final]').textContent = final();
    notificar();
  });
  el.addEventListener('change', (e) => {
    if (e.target.closest('[data-editar]')) pintar();
  });

  pintar();
  notificar();
}

/**
 * Revisa um texto e, se houver o que conferir, abre a caixa.
 *
 * @param {{revisar: Function}} corretor - de criarCorretor().
 * @param {string} texto
 * @param {object} [opcoes] - repassadas a corretor.revisar().
 * @returns {Promise<{texto: string, resumo: string} | null>} null = cancelou.
 */
export async function revisarComCaixa(corretor, texto, opcoes = {}) {
  const { achados, indisponivel } = await corretor.revisar(texto, opcoes);
  if (!achados.length) return { texto, resumo: resumoDaRevisao([], [], indisponivel), indisponivel };

  return new Promise((resolve) => {
    let resultado = null;
    let concluido = false;
    const fechar = openModal(
      `
      <header class="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
        <div>
          <p class="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Revisão ortográfica</p>
          <h3 class="mt-1 font-fibra text-xl font-extrabold text-brand-deep">Confira antes de continuar</h3>
        </div>
        <button type="button" data-close aria-label="Fechar" class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">${icon('x', { size: 18 })}</button>
      </header>
      <div data-painel class="max-h-[60vh] overflow-y-auto p-5"></div>
      <footer class="flex justify-end gap-3 border-t border-slate-100 p-4">
        <button type="button" data-close class="rounded-lg px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100">Voltar e editar</button>
        <button type="button" data-confirmar disabled
          class="rounded-lg bg-brand-blue px-4 py-2 text-sm font-bold text-white hover:bg-brand-deep disabled:cursor-not-allowed disabled:opacity-40">Continuar</button>
      </footer>`,
      {
        maxWidth: 'max-w-lg',
        onMount: (dialog, close) => {
          const confirmar = dialog.querySelector('[data-confirmar]');
          montarPainelRevisao(dialog.querySelector('[data-painel]'), texto, achados, {
            indisponivel,
            aoMudar: (r) => {
              resultado = r;
              confirmar.disabled = !r.pronto;
            },
          });
          confirmar.addEventListener('click', () => {
            concluido = true;
            close();
            resolve({ texto: resultado.texto, resumo: resultado.resumo, indisponivel });
          });
          // Fechar sem confirmar (Esc, X, clique fora, "Voltar e editar").
          new MutationObserver((_, obs) => {
            if (!dialog.isConnected) {
              obs.disconnect();
              if (!concluido) resolve(null);
            }
          }).observe(document.getElementById('modal-root'), { childList: true });
        },
      }
    );
    void fechar;
  });
}
