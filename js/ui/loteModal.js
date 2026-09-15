// Modal "Impressão em lote": quantas placas por folha A4, diagrama da
// distribuição e o botão que gera o PDF.
//
// Sem estado de módulo: o modal é montado do zero a cada abertura a partir do
// formato atual. Trocar o formato e reabrir já mostra o novo máximo, e fechar
// descarta tudo — não há nada para "limpar".

import { calcularGrade, posicoes, MARGEM_MM } from '../canvas/lote.js';
import { icon } from './icons.js';
import { openModal } from './common.js';

const ORIENTACAO = { portrait: 'A4 em pé', landscape: 'A4 deitada' };

/**
 * Diagrama da folha em SVG, em escala. Não é miniatura da arte: cada retângulo
 * é o lugar de uma placa. Os slots além da quantidade escolhida ficam
 * tracejados, para a pessoa ver o máximo sem precisar ler o número.
 */
function diagramaSvg(formato, quantidade) {
  const grade = calcularGrade(formato);
  const { largura, altura } = grade.paginaMm;
  const todas = posicoes(formato, grade.max);

  const retangulos = todas
    .map(({ x, y }, i) => {
      const usada = i < quantidade;
      return `<rect x="${x}" y="${y}" width="${formato.mmLargura}" height="${formato.mmAltura}" rx="1.5"
        fill="${usada ? '#008BCE' : 'none'}" stroke="${usada ? '#004F9F' : '#CBD5E1'}"
        stroke-width="${usada ? 0.6 : 0.8}" ${usada ? '' : 'stroke-dasharray="2 2"'} />`;
    })
    .join('');

  // A altura da caixa é fixa para o modal não pular de tamanho entre A4 em pé
  // e deitada; a folha se ajusta dentro dela.
  return `
    <svg viewBox="-2 -2 ${largura + 4} ${altura + 4}" role="img"
      aria-label="Folha ${ORIENTACAO[grade.orientacao]} com ${quantidade} de ${grade.max} placas"
      class="mx-auto h-56 w-auto max-w-full">
      <rect x="0" y="0" width="${largura}" height="${altura}" rx="2" fill="#FFFFFF" stroke="#94A3B8" stroke-width="1" />
      <rect x="${MARGEM_MM}" y="${MARGEM_MM}" width="${largura - 2 * MARGEM_MM}" height="${altura - 2 * MARGEM_MM}"
        fill="none" stroke="#E2E8F0" stroke-width="0.5" stroke-dasharray="1.5 1.5" />
      ${retangulos}
    </svg>
  `;
}

function modalHtml(formato, grade) {
  return `
    <header class="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
      <div class="min-w-0">
        <p class="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Impressão em lote</p>
        <h3 class="mt-1 font-fibra text-xl font-extrabold leading-tight text-brand-deep">Várias placas numa folha A4</h3>
      </div>
      <button type="button" data-close aria-label="Fechar"
        class="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
        ${icon('x', { size: 18 })}
      </button>
    </header>

    <div class="grid gap-5 p-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,260px)]">
      <div class="space-y-4">
        <div>
          <label for="lote-quantidade" class="mb-1.5 block text-sm font-bold text-slate-700">
            Quantas placas por folha A4?
          </label>
          <input id="lote-quantidade" type="number" inputmode="numeric" data-quantidade
            min="1" max="${grade.max}" step="1" value="${grade.max}"
            class="w-32 rounded-xl border-2 border-slate-200 px-3 py-2.5 text-lg font-extrabold text-brand-deep outline-none transition-colors focus:border-brand-blue focus:ring-2 focus:ring-brand-light" />
          <p data-aviso class="mt-2 min-h-[1.25rem] text-xs font-semibold text-brand-coral" aria-live="polite"></p>
        </div>

        <dl class="space-y-1.5 rounded-xl border border-brand-vivid/30 bg-brand-light/25 p-4 text-sm">
          <div class="flex justify-between gap-3"><dt class="text-slate-500">Placa</dt><dd class="font-extrabold text-brand-deep">${formato.nome} · ${formato.mmLargura}×${formato.mmAltura} mm</dd></div>
          <div class="flex justify-between gap-3"><dt class="text-slate-500">Máximo por folha</dt><dd class="font-extrabold text-brand-deep" data-max>${grade.max} placas</dd></div>
          <div class="flex justify-between gap-3"><dt class="text-slate-500">Distribuição</dt><dd class="text-slate-600">${grade.colunas} × ${grade.linhas} · ${ORIENTACAO[grade.orientacao]}</dd></div>
        </dl>

        <p class="text-xs leading-relaxed text-slate-500">
          Imprima em <strong>tamanho real (100%)</strong>, sem “ajustar à página”. As placas ficam alinhadas
          no canto superior esquerdo, com 3 mm de respiro entre elas para cortar com tesoura.
          ${grade.orientacao === 'landscape' ? 'A folha sai <strong>deitada</strong>: o leitor de PDF já escolhe a orientação certa ao imprimir.' : ''}
        </p>

        <button type="button" data-gerar
          class="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-blue px-5 py-3 font-fibra font-extrabold text-white shadow-sm transition-colors hover:bg-brand-deep disabled:cursor-not-allowed disabled:opacity-40">
          ${icon('printer', { size: 18 })} Gerar PDF da folha A4
        </button>
      </div>

      <div class="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <p class="mb-2 text-center text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Como fica na folha</p>
        <div data-diagrama>${diagramaSvg(formato, grade.max)}</div>
        <p data-legenda class="mt-2 text-center text-xs text-slate-500"></p>
      </div>
    </div>
  `;
}

/**
 * Abre o modal. `onGerar(quantidade)` é chamado com um valor já validado
 * (1..max); o modal cuida do estado do botão enquanto o PDF é gerado.
 */
export function abrirLoteModal(formato, onGerar) {
  const grade = calcularGrade(formato);

  openModal(modalHtml(formato, grade), {
    maxWidth: 'max-w-2xl',
    onMount: (dialog, close) => {
      const input = dialog.querySelector('[data-quantidade]');
      const aviso = dialog.querySelector('[data-aviso]');
      const legenda = dialog.querySelector('[data-legenda]');
      const diagrama = dialog.querySelector('[data-diagrama]');
      const gerar = dialog.querySelector('[data-gerar]');

      const lerQuantidade = () => {
        const n = Math.floor(Number(input.value));
        return Number.isFinite(n) ? n : 0;
      };

      const atualizar = (quantidade) => {
        diagrama.innerHTML = diagramaSvg(formato, quantidade);
        legenda.textContent = `${quantidade} de ${grade.max} · ${grade.colunas} × ${grade.linhas}`;
        gerar.disabled = quantidade < 1;
        gerar.innerHTML = `${icon('printer', { size: 18 })} Gerar PDF da folha A4${quantidade >= 1 ? ` (${quantidade})` : ''}`;
      };

      // Enquanto digita: só o teto é corrigido na hora (15 → 10, com aviso).
      // Vazio ou zero deixa o botão desabilitado, sem brigar com quem apagou
      // o campo para digitar outro número.
      input.addEventListener('input', () => {
        let n = lerQuantidade();
        if (n > grade.max) {
          n = grade.max;
          input.value = String(n);
          aviso.textContent = `O máximo para ${formato.nome} numa folha A4 é ${grade.max}. Ajustei para ${grade.max}.`;
        } else if (n >= 1) {
          aviso.textContent = '';
        } else {
          aviso.textContent = `Digite de 1 a ${grade.max}.`;
        }
        atualizar(n);
      });

      // Ao sair do campo vazio ou zerado, volta ao máximo: uma folha cheia é o
      // caso comum, e ninguém quer gerar uma folha em branco.
      input.addEventListener('blur', () => {
        if (lerQuantidade() < 1) {
          input.value = String(grade.max);
          aviso.textContent = `Campo vazio — usei o máximo (${grade.max}).`;
          atualizar(grade.max);
        }
      });

      gerar.addEventListener('click', async () => {
        const n = lerQuantidade();
        if (n < 1 || n > grade.max) return;
        const original = gerar.innerHTML;
        gerar.disabled = true;
        gerar.innerHTML = `<span class="spinner inline-flex">${icon('spinner', { size: 18 })}</span> Gerando…`;
        try {
          await onGerar(n);
          close();
        } catch (err) {
          console.error(err);
          gerar.disabled = false;
          gerar.innerHTML = original;
        }
      });

      atualizar(grade.max);
      input.focus();
      input.select();
    },
  });
}
