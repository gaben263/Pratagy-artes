// Editor da programação de Esportes e Lazer.
//
// A pessoa escolhe uma atração, altera as informações num formulário simples e
// vê a peça real se redesenhar ao lado, em qualquer formato. Cada atração é
// editada uma vez e vale para todos os formatos dela; a Programação Completa é
// montada a partir dos Shows Teatrais.
//
// Assim como o catálogo, este passo monta o próprio DOM uma vez e o atualiza
// diretamente: um setState global a cada tecla recriaria os campos e o cursor
// pularia. O rascunho fica no localStorage (js/lazer/dados.js).

import { getState, goToStep, goBack } from '../../state.js';
import { icon } from '../icons.js';
import { escapeHtml, debounce, slugify } from '../../utils.js';
import { showToast, confirmModal } from '../common.js';
import { comemorar } from '../confetti.js';
import { ATRACOES, PAGINAS_INFANTIL, recursos, desenhar } from '../../lazer/pecas.js';
import { imagem, limparCacheCap } from '../../lazer/kit.js';
import {
  carregar, salvar, temRascunho, descartarRascunho, lerArquivo, DIAS_SEMANA, VERSAO,
} from '../../lazer/dados.js';

// ------------------------------------------------------------------ esquema
// Tipos: texto, select, toggle, lista (itens com campos), dias (abas por dia),
// poster (envio + enquadramento), aviso (texto explicativo).
const T = (c, r, extra = {}) => ({ tipo: 'texto', c, r, ...extra });
const DIA = (c = 'dia') => ({ tipo: 'select', c, r: 'Dia da semana', opcoes: DIAS_SEMANA });
const HORA = (ph = '20h00') => T('hora', 'Horário', { ph, curto: true });

const ITEM_ATIVIDADE = [HORA('16h15'), T('atividade', 'Atividade', { ph: 'Hidro recreativa' })];

const FORMULARIOS = {
  teatral: [
    {
      tipo: 'lista', c: 'teatral.linhas', r: 'Atrações no teatro', nomeItem: 'atração',
      dica: 'A ordem aqui é a ordem das linhas na peça. A Programação Completa usa esta mesma lista.',
      resumo: (i) => `${i.atracao || 'Nova atração'} · ${i.dia}`,
      novo: () => ({ dia: 'Segunda-feira', datas: '', atracao: '', complemento: '', horario: '20h00', local: 'No teatro', destaque: false }),
      campos: [
        T('atracao', 'Atração', { ph: 'Show da Xuxa' }),
        T('complemento', 'Complemento', { ph: 'Opcional. Ex.: Uma aventura congelante' }),
        DIA(),
        T('datas', 'Datas', { ph: '3, 17 e 24', dica: 'Deixe vazio quando for toda semana.' }),
        T('horario', 'Horário', { ph: '20h00', curto: true }),
        T('local', 'Local', { ph: 'No teatro', curto: true }),
        { tipo: 'toggle', c: 'destaque', r: 'Destacar em laranja' },
      ],
    },
    T('teatral.nota', 'Observação no rodapé', { ph: 'Às segundas-feiras não há espetáculo no teatro.' }),
  ],
  completa: [
    {
      tipo: 'aviso',
      texto: 'Esta peça é montada automaticamente com as atrações dos Shows Teatrais. Para mudar um card, edite a atração em Shows Teatrais.',
      botao: { r: 'Editar Shows Teatrais', ir: 'teatral' },
    },
  ],
  musica: [
    T('musica.horario', 'Horário geral', { ph: 'Todos os dias das 20h às 22h30' }),
    T('musica.local', 'Local', { ph: 'Bar da Piscina' }),
    {
      tipo: 'lista', c: 'musica.dias', r: 'Programação da semana', nomeItem: 'dia', compacta: true,
      resumo: (i) => i.dia,
      novo: () => ({ dia: '', estilo: '' }),
      campos: [T('dia', 'Dia', { curto: true, ph: 'Segunda' }), T('estilo', 'Estilo e artista', { ph: 'Forró com Manu Paes' })],
    },
  ],
  piscina: [
    {
      tipo: 'lista', c: 'piscina.todosOsDias', r: 'Todos os dias', nomeItem: 'atividade', compacta: true,
      resumo: (i) => i.atividade, novo: () => ({ hora: '', atividade: '' }), campos: ITEM_ATIVIDADE,
    },
    {
      tipo: 'lista', c: 'piscina.blocos', r: 'Atividades da tarde', nomeItem: 'bloco',
      resumo: (i) => i.quando || 'Novo bloco',
      novo: () => ({ quando: '', hora: '', atividade: '' }),
      campos: [T('quando', 'Quando', { ph: 'Segundas e quartas' }), ...ITEM_ATIVIDADE],
    },
  ],
  fitness: [
    {
      tipo: 'lista', c: 'fitness.blocos', r: 'Aulas da semana', nomeItem: 'dia de aula',
      resumo: (i) => `${i.dia}${i.datas ? ` · dias ${i.datas}` : ''}`,
      novo: () => ({ dia: 'Segunda-feira', datas: '', atividades: [{ hora: '', atividade: '' }], local: '' }),
      campos: [
        DIA(),
        T('datas', 'Datas', { ph: '9 e 23', dica: 'Deixe vazio quando for toda semana.' }),
        T('local', 'Local', { ph: 'Gramado', largo: true }),
        {
          tipo: 'lista', c: 'atividades', r: 'Aulas', nomeItem: 'aula', compacta: true,
          resumo: (i) => i.atividade, novo: () => ({ hora: '', atividade: '' }), campos: ITEM_ATIVIDADE,
        },
      ],
    },
  ],
  step: [
    T('step.titulo', 'Título', { ph: 'Aula de Step' }),
    T('step.quando', 'Quando', { ph: 'Quinta-feira, dias 19 e 26' }),
    T('step.hora', 'Horário', { ph: '16h15' }),
    T('step.local', 'Local', { ph: 'Gramado Multicultural' }),
    T('step.aviso', 'Aviso', { ph: 'Nestes dias não haverá atividade na piscina à tarde' }),
  ],
  bingo: [T('bingo.quando', 'Datas', { ph: 'Domingos 8, 15 e 22 de Novembro' }), T('bingo.hora', 'Horário', { ph: '17H' }), T('bingo.local', 'Local', { ph: 'Área da Piscina' })],
  cine: [
    { tipo: 'poster' },
    T('cine.dia', 'Dia', { ph: 'Domingo' }),
    T('cine.hora', 'Horário', { ph: '19H30' }),
    T('cine.local', 'Local', { ph: 'Teatro Pratagy' }),
  ],
  xuxa: [T('xuxa.quando', 'Datas', { ph: 'Sextas 6 e 20 de Novembro' }), T('xuxa.hora', 'Horário', { ph: '20H' }), T('xuxa.local', 'Local', { ph: 'Teatro' })],
  samba: [T('samba.quando', 'Data', { ph: 'Quarta-Feira, 25 de Novembro' }), T('samba.hora', 'Horário', { ph: 'às 21h00' }), T('samba.local', 'Local', { ph: 'Teatro' })],
  nordeste: [
    T('nordeste.quando', 'Quando', { ph: 'Toda quinta-feira', dica: 'Na TV, o texto quebra em duas linhas depois de "Toda" ou na vírgula.' }),
    T('nordeste.hora', 'Horário', { ph: 'às 21h00' }),
    T('nordeste.local', 'Local', { ph: 'Teatro' }),
  ],
  infantil712: [{ tipo: 'dias', c: 'infantil712.dias' }],
  infantil46: [{ tipo: 'dias', c: 'infantil46.dias' }],
};

// ------------------------------------------------------------------- estado
let prog = null; // programação em edição
let atracaoId = 'teatral';
const formatoPorAtracao = {};
let pagina = 0;
let diaInfantil = 'Segunda-feira';
let raiz = null;
const canvas = document.createElement('canvas');
let ultimoRel = { reducoes: [], erros: [] };
let fontesProntas = null;

const atual = () => ATRACOES.find((a) => a.id === atracaoId);
const formatoAtual = () => atual().formatos[formatoPorAtracao[atracaoId] || 0];

function ler(caminho) {
  return caminho.split('.').reduce((o, k) => (o == null ? o : o[k]), prog);
}
function escrever(caminho, valor) {
  const partes = caminho.split('.');
  const ultimo = partes.pop();
  partes.reduce((o, k) => o[k], prog)[ultimo] = valor;
}

function carregarFontes() {
  if (!fontesProntas) {
    fontesProntas = Promise.all([
      ...['400', '600', '700', '750', '800'].map((p) => document.fonts.load(`${p} 40px "Fibra One"`)),
      document.fonts.load('40px "Bebas Neue Pratagy"'),
    ]).then(() => limparCacheCap());
  }
  return fontesProntas;
}

// ------------------------------------------------------------------ campos
const CLASSE_INPUT =
  'w-full rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-300 focus:border-brand-blue focus:ring-2 focus:ring-brand-light';

function campoHtml(f, caminho, { semRotulo = false } = {}) {
  const v = ler(caminho);
  const id = `f-${caminho.replace(/\./g, '-')}`;
  if (f.tipo === 'toggle') {
    return `
      <label class="flex cursor-pointer items-center gap-2.5 self-end rounded-lg py-2 text-sm text-slate-600">
        <input type="checkbox" data-path="${caminho}" ${v ? 'checked' : ''}
          class="h-4 w-4 rounded border-slate-300 text-brand-coral focus:ring-brand-coral" />
        ${f.r}
      </label>`;
  }
  const controle =
    f.tipo === 'select'
      ? `<select id="${id}" data-path="${caminho}" class="${CLASSE_INPUT}">
           ${f.opcoes.map((o) => `<option ${o === v ? 'selected' : ''}>${o}</option>`).join('')}
         </select>`
      : `<input id="${id}" type="text" data-path="${caminho}" value="${escapeHtml(v ?? '')}"
           placeholder="${escapeHtml(f.ph || '')}" autocomplete="off" class="${CLASSE_INPUT}" />`;
  return `
    <div class="${f.largo ? 'sm:col-span-2' : ''} min-w-0">
      <label for="${id}" class="${semRotulo ? 'sr-only' : 'mb-1 block text-xs font-semibold text-slate-500'}">${f.r}</label>
      ${controle}
      ${f.dica ? `<p class="mt-1 text-[11px] leading-snug text-slate-400">${f.dica}</p>` : ''}
    </div>`;
}

function botaoMini(acao, caminho, i, nome, titulo, desabilitado = false) {
  return `
    <button type="button" data-acao="${acao}" data-lista="${caminho}" data-i="${i}" title="${titulo}" aria-label="${titulo}"
      ${desabilitado ? 'disabled' : ''}
      class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-brand-deep disabled:pointer-events-none disabled:opacity-30
        ${acao === 'remover' ? 'hover:!bg-red-50 hover:!text-red-600' : ''}">
      ${icon(nome, { size: 15 })}
    </button>`;
}

function listaHtml(f, caminho) {
  const itens = ler(caminho) || [];
  const corpo = itens
    .map((item, i) => {
      const base = `${caminho}.${i}`;
      const acoes = `
        <div class="flex shrink-0 items-center">
          ${botaoMini('subir', caminho, i, 'arrowUp', `Mover ${f.nomeItem} para cima`, i === 0)}
          ${botaoMini('descer', caminho, i, 'arrowDown', `Mover ${f.nomeItem} para baixo`, i === itens.length - 1)}
          ${botaoMini('remover', caminho, i, 'trash', `Remover ${f.nomeItem}`)}
        </div>`;
      if (f.compacta) {
        return `
          <div class="flex items-end gap-2">
            <div class="grid min-w-0 flex-1 gap-2 ${f.campos.length > 2 ? 'sm:grid-cols-[5.5rem_minmax(0,1.4fr)_minmax(0,1fr)]' : 'sm:grid-cols-[7rem_minmax(0,1fr)]'}">
              ${f.campos.map((c) => campoHtml(c, `${base}.${c.c}`, { semRotulo: i > 0 })).join('')}
            </div>
            <div class="pb-1">${acoes}</div>
          </div>`;
      }
      return `
        <div class="rounded-xl border-2 border-slate-100 bg-white p-3.5">
          <div class="mb-2.5 flex items-center justify-between gap-2">
            <p class="min-w-0 truncate font-fibra text-sm font-extrabold text-brand-deep">${escapeHtml(f.resumo(item))}</p>
            ${acoes}
          </div>
          <div class="grid gap-3 sm:grid-cols-2">
            ${f.campos.map((c) => (c.tipo === 'lista' ? `<div class="sm:col-span-2">${listaHtml(c, `${base}.${c.c}`)}</div>` : campoHtml(c, `${base}.${c.c}`))).join('')}
          </div>
        </div>`;
    })
    .join('');
  return `
    <section>
      <div class="mb-2">
        <h3 class="font-fibra text-sm font-extrabold text-slate-700">${f.r}</h3>
        ${f.dica ? `<p class="text-xs text-slate-400">${f.dica}</p>` : ''}
      </div>
      <div class="${f.compacta ? 'space-y-2' : 'space-y-3'}">
        ${corpo || `<p class="rounded-lg border-2 border-dashed border-slate-200 p-3 text-center text-xs text-slate-400">Nenhum item. Adicione abaixo.</p>`}
      </div>
      <button type="button" data-acao="adicionar" data-lista="${caminho}"
        class="mt-2 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-brand-blue transition-colors hover:bg-brand-light/40">
        ${icon('plus', { size: 14 })} Adicionar ${f.nomeItem}
      </button>
    </section>`;
}

function diasHtml(f) {
  const dias = ler(f.c);
  const abas = DIAS_SEMANA.map((d) => {
    const sel = d === diaInfantil;
    return `<button type="button" data-dia="${d}" role="tab" aria-selected="${sel}"
      class="rounded-lg px-2.5 py-1.5 text-xs font-bold transition-colors ${sel ? 'bg-brand-deep text-white' : 'text-slate-500 hover:bg-slate-100'}">
      ${d.replace('-feira', '')} <span class="${sel ? 'text-white/60' : 'text-slate-300'}">${dias[d]?.length || 0}</span></button>`;
  }).join('');
  const lista = {
    tipo: 'lista', r: `Atividades de ${diaInfantil.toLowerCase()}`, nomeItem: 'atividade',
    dica: 'O local é opcional. As três páginas da peça se reorganizam sozinhas.',
    resumo: (i) => `${i.hora || '--:--'} · ${i.atividade || 'Nova atividade'}`,
    novo: () => ({ hora: '', atividade: '', local: '' }),
    compacta: true,
    campos: [T('hora', 'Horário', { ph: '10:00' }), T('atividade', 'Atividade', { ph: 'Resgate de brincadeiras' }), T('local', 'Local', { ph: 'Área kids' })],
  };
  return `
    <div role="tablist" class="mb-3 flex flex-wrap gap-1 rounded-xl bg-slate-50 p-1">${abas}</div>
    ${listaHtml(lista, `${f.c}.${diaInfantil}`)}`;
}

function posterHtml() {
  const enq = prog.cine.enquadramento || { zoom: 1, cx: 0.5, cy: 0.5 };
  const faixa = (c, r, min, max, step) => `
    <label class="block text-xs font-semibold text-slate-500">${r}
      <input type="range" data-path="cine.enquadramento.${c}" data-num min="${min}" max="${max}" step="${step}" value="${enq[c]}"
        class="mt-1 w-full accent-[#008BCE]" />
    </label>`;
  return `
    <section class="rounded-xl border-2 border-slate-100 bg-white p-3.5">
      <h3 class="font-fibra text-sm font-extrabold text-slate-700">Pôster do filme</h3>
      <p class="mb-3 text-xs text-slate-400">Use uma imagem vertical e de boa resolução (pelo menos 1200 px de altura) para a impressão sair nítida.</p>
      <div class="flex flex-wrap gap-2">
        <label class="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-brand-light/50 px-3 py-2 text-xs font-bold text-brand-deep transition-colors hover:bg-brand-light">
          ${icon('upload', { size: 14 })} Enviar pôster
          <input type="file" accept="image/*" data-upload="poster" class="sr-only" />
        </label>
        ${prog.cine.poster ? `<button type="button" data-acao="poster-padrao" class="rounded-lg px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100">Usar o pôster publicado</button>` : ''}
      </div>
      <div class="mt-3 grid gap-3 sm:grid-cols-3">
        ${faixa('zoom', 'Zoom', 1, 2.5, 0.01)}
        ${faixa('cx', 'Posição horizontal', 0, 1, 0.01)}
        ${faixa('cy', 'Posição vertical', 0, 1, 0.01)}
      </div>
    </section>`;
}

function formularioHtml() {
  const a = atual();
  const cabecalho = `<div class="mb-4"><h2 class="font-fibra text-xl font-extrabold text-brand-deep">${a.nome}</h2>
    <p class="text-sm text-slate-500">${a.resumo}. Vale para ${a.formatos.length === 1 ? 'o formato' : `os ${a.formatos.length} formatos`} ao lado.</p></div>`;
  return cabecalho + FORMULARIOS[atracaoId]
    .map((f) => {
      if (f.tipo === 'lista') return listaHtml(f, f.c);
      if (f.tipo === 'dias') return diasHtml(f);
      if (f.tipo === 'poster') return posterHtml();
      if (f.tipo === 'aviso') {
        return `
          <div class="rounded-xl border-2 border-brand-vivid/30 bg-brand-light/25 p-4 text-sm text-brand-deep">
            <p class="flex items-start gap-2">${icon('info', { size: 16, className: 'mt-0.5' })}<span>${f.texto}</span></p>
            <button type="button" data-ir="${f.botao.ir}"
              class="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-brand-deep px-3 py-2 text-xs font-bold text-white hover:bg-brand-blue">
              ${icon('edit', { size: 14 })} ${f.botao.r}
            </button>
          </div>`;
      }
      return `<div class="grid gap-3 sm:grid-cols-2">${campoHtml({ ...f, largo: true }, f.c)}</div>`;
    })
    .join('<div class="h-5"></div>');
}

// ------------------------------------------------------------------ prévia
const desenharPrevia = debounce(async () => {
  const a = atual();
  const fmt = formatoAtual();
  const pag = fmt.paginas ? Math.min(pagina, fmt.paginas - 1) : 0;
  const alvo = raiz?.querySelector('[data-previa]');
  try {
    await carregarFontes();
    const R = await recursos(fmt, prog, imagem);
    if (atual() !== a || formatoAtual() !== fmt) return; // trocou no meio
    ultimoRel = desenhar(canvas, fmt, prog, R, pag);
    if (alvo && !alvo.contains(canvas)) {
      alvo.innerHTML = '';
      alvo.appendChild(canvas);
    }
    canvas.style.aspectRatio = `${fmt.w} / ${fmt.h}`;
  } catch (err) {
    console.error(err);
    ultimoRel = { reducoes: [], erros: ['Não foi possível desenhar a peça. Recarregue a página e tente de novo.'] };
  }
  atualizarAvisos();
}, 120);

function atualizarAvisos() {
  const box = raiz?.querySelector('[data-avisos]');
  if (!box) return;
  const reduzidos = ultimoRel.reducoes.filter((r) => r.fator >= 0.7 && r.fator < 0.85 && !r.campo.startsWith('Quantidade'));
  const campos = [...new Set(reduzidos.map((r) => r.campo))];
  box.innerHTML = ultimoRel.erros.length
    ? `<div role="alert" class="flex items-start gap-2 rounded-xl border-2 border-red-200 bg-red-50 p-3 text-xs leading-relaxed text-red-700">
         ${icon('alertTriangle', { size: 15, className: 'mt-0.5' })}
         <div>${ultimoRel.erros.map((e) => `<p>${escapeHtml(e)}</p>`).join('')}<p class="mt-1 font-bold">O download fica bloqueado até corrigir.</p></div>
       </div>`
    : campos.length
      ? `<div class="flex items-start gap-2 rounded-xl border-2 border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">
           ${icon('info', { size: 15, className: 'mt-0.5' })}
           <p>Texto longo em <strong>${campos.join(', ')}</strong>: a letra foi reduzida para caber. Confira se continua fácil de ler.</p>
         </div>`
      : '';
  raiz.querySelectorAll('[data-baixar]').forEach((b) => (b.disabled = ultimoRel.erros.length > 0));
}

// ----------------------------------------------------------------- download
function nomeArquivo(a, fmt, pag) {
  const p = fmt.paginas ? ` ${PAGINAS_INFANTIL[pag]}` : '';
  return slugify(`${a.nome} ${fmt.nome}${p} ${prog.mes}`);
}

function baixarBlob(blob, nome) {
  const url = URL.createObjectURL(blob);
  const el = document.createElement('a');
  el.href = url;
  el.download = nome;
  document.body.appendChild(el);
  el.click();
  el.remove();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

const jpg = (c) => new Promise((ok, erro) => c.toBlob((b) => (b ? ok(b) : erro(new Error('Falha ao gerar a imagem.'))), 'image/jpeg', 0.92));

async function exportar(c, a, fmt, pag, tipo) {
  if (tipo === 'pdf') {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [210, 297] });
    pdf.addImage(c.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
    pdf.save(`${nomeArquivo(a, fmt, pag)}.pdf`);
  } else {
    baixarBlob(await jpg(c), `${nomeArquivo(a, fmt, pag)}.jpg`);
  }
}

async function baixarAtual(tipo, btn) {
  const a = atual();
  const fmt = formatoAtual();
  if (ultimoRel.erros.length) return;
  const original = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `${icon('spinner', { size: 16, className: 'spinner' })} Gerando…`;
  try {
    await exportar(canvas, a, fmt, fmt.paginas ? pagina : 0, tipo);
    showToast(`${a.nome} — ${fmt.nome} baixado.`, { type: 'success' });
    comemorar();
  } catch (err) {
    console.error(err);
    showToast('Não foi possível gerar o arquivo. Tente de novo.', { type: 'error' });
  } finally {
    btn.disabled = false;
    btn.innerHTML = original;
  }
}

/** Todas as peças da atração (todos os formatos e páginas), em JPG. */
async function baixarTodas(btn) {
  const a = atual();
  const original = btn.innerHTML;
  btn.disabled = true;
  const off = document.createElement('canvas');
  try {
    await carregarFontes();
    const tarefas = a.formatos.flatMap((fmt) => Array.from({ length: fmt.paginas || 1 }, (_, p) => [fmt, p]));
    let n = 0;
    for (const [fmt, p] of tarefas) {
      btn.innerHTML = `${icon('spinner', { size: 16, className: 'spinner' })} ${++n} de ${tarefas.length}…`;
      const rel = desenhar(off, fmt, prog, await recursos(fmt, prog, imagem), p);
      if (rel.erros.length) throw new Error(rel.erros[0]);
      baixarBlob(await jpg(off), `${nomeArquivo(a, fmt, p)}.jpg`);
      await new Promise((r) => setTimeout(r, 350)); // o navegador recusa downloads em rajada
    }
    showToast(`${tarefas.length} peças de ${a.nome} baixadas.`, { type: 'success' });
    comemorar();
  } catch (err) {
    showToast(err.message || 'Não foi possível baixar todas as peças.', { type: 'error' });
  } finally {
    btn.disabled = false;
    btn.innerHTML = original;
  }
}

// --------------------------------------------------------------- arquivos
const statusSalvo = () => {
  const el = raiz?.querySelector('[data-status]');
  if (!el) return;
  el.textContent = temRascunho()
    ? `Alterações salvas neste navegador às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
    : 'Sem alterações: esta é a programação publicada';
};

const salvarRascunho = debounce(() => {
  if (!salvar(prog)) {
    showToast('O navegador não tem espaço para guardar este rascunho (imagens grandes). Use "Salvar programação" para não perder as alterações.', { type: 'error', duration: 6000 });
  }
  statusSalvo();
}, 400);

function alterou({ refazerForm = false } = {}) {
  if (refazerForm) montarFormulario();
  salvarRascunho();
  desenharPrevia();
}

function baixarProgramacao() {
  const blob = new Blob([JSON.stringify(prog, null, 2)], { type: 'application/json' });
  baixarBlob(blob, `programacao-lazer-${slugify(prog.mes)}-${VERSAO.slice(0, 4)}.json`);
  showToast('Arquivo de programação baixado. Envie para quem vai continuar a edição.', { type: 'success' });
}

async function abrirProgramacao(file) {
  try {
    prog = await lerArquivo(file);
    salvar(prog);
    montarTudo();
    showToast(`Programação de ${prog.mes} aberta.`, { type: 'success' });
  } catch (err) {
    showToast(err.message, { type: 'error', duration: 6000 });
  }
}

async function voltarPublicada() {
  const ok = await confirmModal({
    title: 'Voltar à programação publicada?',
    message: 'Todas as alterações feitas neste navegador serão descartadas. Se quiser guardá-las, use antes "Salvar programação".',
    confirmLabel: 'Descartar alterações',
    tone: 'danger',
  });
  if (!ok) return;
  prog = descartarRascunho();
  montarTudo();
  showToast('Programação publicada restaurada.', { type: 'success' });
}

/** Lê a imagem enviada e a reduz para caber no rascunho sem perder qualidade de impressão. */
async function lerImagem(file, { max, tipo }) {
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas');
  c.width = Math.round(bmp.width * k);
  c.height = Math.round(bmp.height * k);
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  return c.toDataURL(tipo, 0.9);
}

// ------------------------------------------------------------------ montagem
function montarFormulario() {
  const alvo = raiz.querySelector('[data-form]');
  const y = window.scrollY;
  alvo.innerHTML = formularioHtml();
  window.scrollTo({ top: y });
}

function montarPreviaControles() {
  const a = atual();
  const fmt = formatoAtual();
  const chips = a.formatos
    .map((f, i) => {
      const sel = f === fmt;
      return `<button type="button" data-formato="${i}" aria-pressed="${sel}"
        class="rounded-lg px-2.5 py-1.5 text-xs font-bold transition-colors ${sel ? 'bg-white text-brand-deep shadow-sm' : 'text-slate-500 hover:text-brand-deep'}">${f.nome}</button>`;
    })
    .join('');
  const paginas = fmt.paginas
    ? `<div class="mt-2 flex flex-wrap gap-1">${PAGINAS_INFANTIL.map(
        (p, i) => `<button type="button" data-pagina="${i}" aria-pressed="${i === pagina}"
          class="rounded-md px-2 py-1 text-[11px] font-bold ${i === pagina ? 'bg-brand-deep text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}">Página ${i + 1} · ${p.toLowerCase()}</button>`
      ).join('')}</div>`
    : '';
  const botoes =
    fmt.uso === 'impressao'
      ? `${botaoBaixar('pdf', 'printer', 'Baixar PDF', 'Para imprimir em A4')}${botaoBaixar('jpg', 'image', 'Baixar JPG', `${fmt.w}×${fmt.h} px`)}`
      : botaoBaixar('jpg', 'image', 'Baixar JPG', `Pronto para a tela · ${fmt.w}×${fmt.h} px`);
  const total = a.formatos.reduce((s, f) => s + (f.paginas || 1), 0);
  raiz.querySelector('[data-controles]').innerHTML = `
    <div role="group" aria-label="Formato" class="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">${chips}</div>
    ${paginas}`;
  raiz.querySelector('[data-acoes-previa]').innerHTML = `
    <div class="grid gap-2 ${fmt.uso === 'impressao' ? 'sm:grid-cols-2' : ''}">${botoes}</div>
    <button type="button" data-baixar-todas
      class="mt-2 w-full rounded-lg px-3 py-2 text-xs font-bold text-brand-blue transition-colors hover:bg-brand-light/40">
      Baixar as ${total} peças de ${a.nome} (JPG)
    </button>`;
}

function botaoBaixar(tipo, ic, titulo, desc) {
  return `
    <button type="button" data-baixar="${tipo}"
      class="group flex items-center gap-3 rounded-xl border-2 border-slate-200 bg-white p-3 text-left transition-colors hover:border-brand-blue disabled:cursor-not-allowed disabled:opacity-50">
      <span class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-light text-brand-deep group-hover:bg-brand-blue group-hover:text-white">${icon(ic, { size: 17 })}</span>
      <span class="min-w-0"><span class="block font-fibra text-sm font-extrabold text-brand-deep">${titulo}</span>
      <span class="block truncate text-[11px] text-slate-500">${desc}</span></span>
    </button>`;
}

function montarAtracoes() {
  raiz.querySelector('[data-atracoes]').innerHTML = ATRACOES.map((a) => {
    const sel = a.id === atracaoId;
    return `<button type="button" data-atracao="${a.id}" aria-current="${sel ? 'true' : 'false'}" title="${a.resumo}"
      class="rounded-lg border-2 px-3 py-1.5 font-fibra text-sm font-extrabold transition-colors
        ${sel ? 'border-brand-deep bg-brand-deep text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-brand-vivid hover:text-brand-deep'}">
      ${a.nome}
    </button>`;
  }).join('');
}

function montarSelo() {
  raiz.querySelector('[data-selo]').innerHTML = `
    <img src="${prog.selo || 'assets/lazer/icones/selo-novembro.png'}" alt="Selo do mês" class="h-10 w-auto" />
    <div class="flex flex-col items-start">
      <label class="cursor-pointer text-xs font-bold text-brand-blue hover:underline">
        Trocar selo<input type="file" accept="image/png" data-upload="selo" class="sr-only" />
      </label>
      ${prog.selo ? '<button type="button" data-acao="selo-padrao" class="text-[11px] text-slate-400 hover:text-slate-600">Usar o selo publicado</button>' : ''}
    </div>`;
}

function montarTudo() {
  raiz.querySelector('[data-mes]').value = prog.mes;
  montarSelo();
  montarAtracoes();
  montarFormulario();
  montarPreviaControles();
  statusSalvo();
  desenharPrevia();
}

function trocarAtracao(id) {
  atracaoId = id;
  pagina = 0;
  montarAtracoes();
  montarFormulario();
  montarPreviaControles();
  desenharPrevia();
  raiz.querySelector('[data-form]').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ------------------------------------------------------------------- passo
export function renderLazerStep(container) {
  const state = getState();
  if (state.setorId !== 'lazer') {
    goToStep('setor');
    return;
  }
  if (container.dataset.sig === 'lazer' && container.querySelector('[data-lazer-root]')) return;
  container.dataset.sig = 'lazer';
  prog = carregar();

  container.innerHTML = `
    <div data-lazer-root>
      <button type="button" data-back
        class="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 transition-colors hover:text-brand-blue">
        ${icon('arrowLeft', { size: 16 })} Voltar ao catálogo
      </button>

      <div class="flex flex-wrap items-end justify-between gap-4">
        <div class="min-w-0">
          <h1 class="font-fibra text-2xl font-extrabold text-brand-deep">Editar a programação de lazer</h1>
          <p class="mt-1 text-slate-500">Escolha a atração, altere as informações e baixe as peças. A prévia mostra a peça real.</p>
          <p data-status class="mt-1 text-xs font-semibold text-slate-400"></p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button type="button" data-salvar-arquivo
            class="inline-flex items-center gap-1.5 rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition-colors hover:border-brand-blue hover:text-brand-deep">
            ${icon('save', { size: 14 })} Salvar programação
          </button>
          <label class="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition-colors hover:border-brand-blue hover:text-brand-deep">
            ${icon('folderOpen', { size: 14 })} Abrir programação
            <input type="file" accept=".json,application/json" data-abrir-arquivo class="sr-only" />
          </label>
          <button type="button" data-publicada
            class="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
            ${icon('undo', { size: 14 })} Voltar à programação publicada
          </button>
        </div>
      </div>

      <details class="mt-3 rounded-xl border-2 border-brand-vivid/30 bg-brand-light/20 px-4 py-3 text-sm text-brand-deep">
        <summary class="cursor-pointer font-bold">Onde ficam as alterações e para que serve o arquivo de programação</summary>
        <div class="mt-2 space-y-2 leading-relaxed text-slate-600">
          <p>O que você altera aqui fica guardado <strong>só neste navegador, neste computador</strong>. Se você fechar a página e voltar depois, continua de onde parou. Mas outra pessoa, ou você em outro computador, não vê essas alterações: o sistema não tem um servidor para guardá-las.</p>
          <p>Para continuar em outro computador ou passar a edição a um colega:</p>
          <ol class="list-decimal space-y-1 pl-5">
            <li>Clique em <strong>Salvar programação</strong>. O navegador baixa um arquivo <code>.json</code> com todas as informações (textos, pôster e selo).</li>
            <li>Envie esse arquivo por e-mail ou WhatsApp, ou guarde na pasta da equipe.</li>
            <li>No outro computador, abra o Sistema de Artes, entre em <strong>Esportes e Lazer › Editar a programação do mês</strong> e clique em <strong>Abrir programação</strong>, escolhendo o arquivo.</li>
          </ol>
          <p>As peças prontas do catálogo não mudam com estas edições. Para atualizar o catálogo para todos, envie o arquivo de programação ao Marketing.</p>
        </div>
      </details>

      <div class="mt-5 flex flex-wrap items-center gap-4 rounded-2xl border-2 border-slate-200 bg-white p-3">
        <label class="flex items-center gap-2 text-sm font-semibold text-slate-600">
          Mês
          <input type="text" data-mes class="${CLASSE_INPUT} w-40" aria-describedby="dica-mes" />
        </label>
        <p id="dica-mes" class="text-xs text-slate-400">Aparece em "Programação de…", nos Shows Teatrais e no Cine.</p>
        <div data-selo class="ml-auto flex items-center gap-3"></div>
      </div>

      <nav aria-label="Atrações" data-atracoes class="mt-4 flex flex-wrap gap-1.5"></nav>

      <div class="mt-3 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <form data-form class="min-w-0" onsubmit="return false"></form>
        <aside class="lg:sticky lg:top-40">
          <div data-controles></div>
          <div data-previa class="mt-3 flex max-h-[62vh] justify-center overflow-hidden rounded-2xl border-2 border-slate-200 bg-slate-100 p-3
            [&>canvas]:max-h-[calc(62vh-1.5rem)] [&>canvas]:w-auto [&>canvas]:max-w-full [&>canvas]:rounded [&>canvas]:shadow-md">
            <p class="py-16 text-sm text-slate-400">Carregando a peça…</p>
          </div>
          <div data-avisos class="mt-3"></div>
          <div data-acoes-previa class="mt-3"></div>
        </aside>
      </div>
    </div>
  `;
  raiz = container.querySelector('[data-lazer-root]');

  raiz.querySelector('[data-back]').addEventListener('click', goBack);
  raiz.querySelector('[data-salvar-arquivo]').addEventListener('click', baixarProgramacao);
  raiz.querySelector('[data-abrir-arquivo]').addEventListener('change', (e) => {
    if (e.target.files[0]) abrirProgramacao(e.target.files[0]);
    e.target.value = '';
  });
  raiz.querySelector('[data-publicada]').addEventListener('click', voltarPublicada);
  raiz.querySelector('[data-mes]').addEventListener('input', (e) => {
    prog.mes = e.target.value;
    alterou();
  });

  // Edição de campos (delegada: o formulário é remontado ao trocar de atração)
  raiz.addEventListener('input', (e) => {
    const el = e.target;
    if (!el.dataset.path) return;
    const v = el.type === 'checkbox' ? el.checked : 'num' in el.dataset ? Number(el.value) : el.value;
    if (el.dataset.path.startsWith('cine.enquadramento') && !prog.cine.enquadramento) {
      prog.cine.enquadramento = { zoom: 1, cx: 0.5, cy: 0.5 };
    }
    escrever(el.dataset.path, v);
    alterou();
  });

  raiz.addEventListener('change', async (e) => {
    const tipo = e.target.dataset.upload;
    if (!tipo || !e.target.files[0]) return;
    try {
      if (tipo === 'poster') {
        prog.cine.poster = await lerImagem(e.target.files[0], { max: 1800, tipo: 'image/jpeg' });
        prog.cine.enquadramento = { zoom: 1, cx: 0.5, cy: 0.5 };
      } else {
        prog.selo = await lerImagem(e.target.files[0], { max: 1600, tipo: 'image/png' });
        montarSelo();
      }
      alterou({ refazerForm: tipo === 'poster' });
    } catch {
      showToast('Não foi possível abrir esta imagem. Use um arquivo JPG ou PNG.', { type: 'error' });
    }
    e.target.value = '';
  });

  raiz.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.atracao) return trocarAtracao(b.dataset.atracao);
    if (b.dataset.ir) return trocarAtracao(b.dataset.ir);
    if (b.dataset.formato) {
      formatoPorAtracao[atracaoId] = Number(b.dataset.formato);
      montarPreviaControles();
      return desenharPrevia();
    }
    if (b.dataset.pagina) {
      pagina = Number(b.dataset.pagina);
      montarPreviaControles();
      return desenharPrevia();
    }
    if (b.dataset.dia) {
      diaInfantil = b.dataset.dia;
      return montarFormulario();
    }
    if (b.dataset.baixar) return baixarAtual(b.dataset.baixar, b);
    if ('baixarTodas' in b.dataset) return baixarTodas(b);
    const acao = b.dataset.acao;
    if (!acao) return;
    if (acao === 'poster-padrao') {
      prog.cine.poster = null;
      prog.cine.enquadramento = { zoom: 1, cx: 0.5, cy: 0.5 };
      return alterou({ refazerForm: true });
    }
    if (acao === 'selo-padrao') {
      prog.selo = null;
      montarSelo();
      return alterou();
    }
    const lista = ler(b.dataset.lista);
    const i = Number(b.dataset.i);
    if (acao === 'adicionar') {
      const esquema = acharLista(b.dataset.lista);
      lista.push(esquema ? esquema.novo() : {});
    } else if (acao === 'remover') {
      lista.splice(i, 1);
    } else if (acao === 'subir' && i > 0) {
      [lista[i - 1], lista[i]] = [lista[i], lista[i - 1]];
    } else if (acao === 'descer' && i < lista.length - 1) {
      [lista[i + 1], lista[i]] = [lista[i], lista[i + 1]];
    }
    alterou({ refazerForm: true });
    if (acao === 'adicionar') {
      // leva o foco ao primeiro campo do item novo
      const campos = raiz.querySelectorAll(`[data-path^="${b.dataset.lista}.${lista.length - 1}."]`);
      campos[0]?.focus();
    }
  });

  montarTudo();
}

/** Encontra o esquema da lista pelo caminho (ignora os índices numéricos). */
function acharLista(caminho) {
  const alvo = caminho.replace(/\.\d+\./g, '.').replace(/\.\d+$/, '');
  const procurar = (campos, prefixo) => {
    for (const f of campos) {
      if (f.tipo !== 'lista') continue;
      const c = prefixo ? `${prefixo}.${f.c}` : f.c;
      if (c === alvo) return f;
      const dentro = procurar(f.campos, c);
      if (dentro) return dentro;
    }
    return null;
  };
  if (/^infantil\d+\.dias\./.test(caminho)) {
    return { novo: () => ({ hora: '', atividade: '', local: '' }) };
  }
  return procurar(FORMULARIOS[atracaoId], '');
}
