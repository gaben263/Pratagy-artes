// Modelos das peças de Esportes e Lazer, desenhados em Canvas sobre os fundos
// oficiais sem texto (assets/lazer/fundos/). As medidas vêm das camadas dos PSDs
// do Marketing e do gerador que produziu as peças de novembro; cada atração tem
// uma função de desenho só, parametrizada pelas medidas de cada formato.
//
// Contrato de cada formato:
//   { id, nome, w, h, uso: 'impressao' | 'tela', paginas?, icones: [...],
//     desenhar(ctx, d, R, rel, pagina) }
// `d` é a programação inteira (dados.js), `R` traz as imagens já carregadas
// (R.fundo, R.ic[nome], R.selo, R.poster) e `rel` acumula os textos que precisaram
// encolher para caber.

import { MEDIDAS } from './medidas.js';
import {
  COR, texto, medir, cap, caber, linhaMista, caixa, icone, cobrir,
  rotuloDatas, todaTodo, maiusculas as M,
} from './kit.js';

const SAMBA = '#3F2E35';
const NORDESTE = '#712E10';
const ROSA = '#D60B52';
const FAIXA_MUSICA = '#01509F';
const INFANTIL = '#004EA3';

// --------------------------------------------------------------------- comum
/** Selo do mês + passagens sobre as ondas (tratamento do Banner MyGuest de novembro). */
function selo(ctx, R, cx, top, w) {
  const s = R.selo;
  const h = (w * s.naturalHeight) / s.naturalWidth;
  ctx.drawImage(s, cx - w / 2, top, w, h);
  const p = R.ic.passagens;
  const iw = (w * 124) / 652;
  ctx.drawImage(p, cx - w / 2 + (w * 61) / 652, top + (h * 182) / 307, iw, (iw * p.naturalHeight) / p.naturalWidth);
}

/** Linha de ícones + textos centrada em cx; ícones centrados na altura das maiúsculas. */
function linhaIcones(ctx, cx, capMid, itens, size, cor, gi, gg, { key = 'bold', track = -40, rel, campo } = {}) {
  let larg = itens.map(([ic, t]) => ic.naturalWidth + gi + medir(ctx, t, key, size, track));
  let total = larg.reduce((a, b) => a + b, 0) + gg * (itens.length - 1);
  const maxw = ctx.canvas.width * 0.9;
  if (total > maxw) {
    const k = maxw / total;
    rel?.reducoes.push({ campo, texto: itens.map((i) => i[1]).join(' · '), fator: k });
    size *= k;
    larg = itens.map(([ic, t]) => ic.naturalWidth + gi + medir(ctx, t, key, size, track));
    total = larg.reduce((a, b) => a + b, 0) + gg * (itens.length - 1);
  }
  let x = cx - total / 2;
  const base = capMid + cap(ctx, key, size) / 2;
  itens.forEach(([ic, t], i) => {
    ctx.drawImage(ic, x, capMid - ic.naturalHeight / 2);
    texto(ctx, x + ic.naturalWidth + gi, base, t, key, size, cor, { track });
    x += larg[i] + gg;
  });
}

const centroY = (bb) => (bb[1] + bb[3]) / 2;

// ------------------------------------------------------------ Shows Teatrais
/** "TRIBUTO A MICHAEL JACKSON" -> ["TRIBUTO", "A MICHAEL JACKSON"]: 1ª linha curta, de impacto. */
function partirTitulo(t) {
  const p = t.split(/\s+/);
  if (p.length < 2) return [t, ''];
  const corte = p.length <= 3 ? 1 : Math.max(1, Math.floor(p.length / 3));
  return [p.slice(0, corte).join(' '), p.slice(corte).join(' ')];
}

function teatral(c) {
  return (ctx, d, R, rel) => {
    const linhas = d.teatral.linhas;
    const s = (c.x1 - c.x0) / 1861;
    const n = Math.max(linhas.length, 1);
    const gap = 23 * s;
    const h = (c.y1 - c.y0 - gap * (n - 1)) / n;
    const hs = h / (218 * s);
    const k = hs < 1 ? s * hs : s;
    linhas.forEach((l, i) => {
      const top = c.y0 + i * (h + gap);
      caixa(ctx, c.x0, top, c.x1, top + h, 21 * s, l.destaque ? COR.coral : COR.blue);
      const [d1, d2] = l.datas.trim() ? [M(l.dia), rotuloDatas(l.datas)] : [M(todaTodo(l.dia)), M(l.dia)];
      const xl = c.x0 + 138 * s;
      const L1 = 46 * k, L2 = 54 * k, L3 = 44 * k, lh = 57 * k;
      const b1 = top + (h - (2 * lh + cap(ctx, 'heavy', L2))) / 2 + cap(ctx, 'heavy', L2);
      texto(ctx, xl, b1, d1, 'regular', L1, COR.branco, { track: -10 });
      texto(ctx, xl, b1 + lh, d2, 'heavy', caber(ctx, rel, d2, 'heavy', L2, 500 * s, -10, 'Datas'), COR.branco, { track: -10 });
      texto(ctx, xl, b1 + 2 * lh, M(l.local), 'regular', caber(ctx, rel, M(l.local), 'regular', L3, 500 * s, 0, 'Local'), COR.branco, { track: -10 });

      const xm = c.x0 + 676 * s;
      const T = 68 * k, S = 44 * k, maxw = 700 * s;
      let t1 = M(l.atracao), t2 = M(l.complemento);
      // Nome longo sem complemento quebra em duas linhas, a segunda menor
      // (como "TRIBUTO / A MICHAEL JACKSON" na peça aprovada), em vez de encolher.
      if (!t2 && medir(ctx, t1, 'heavy', T, -25) > maxw) [t1, t2] = partirTitulo(t1);
      if (t2) {
        const ct = cap(ctx, 'heavy', T), cs = cap(ctx, 'heavy', S), g = 22 * k;
        const bt = top + (h - (ct + g + cs)) / 2 + ct;
        texto(ctx, xm, bt, t1, 'heavy', caber(ctx, rel, t1, 'heavy', T, maxw, -25, 'Atração'), COR.branco, { track: -25 });
        texto(ctx, xm, bt + g + cs, t2, 'heavy', caber(ctx, rel, t2, 'heavy', S, maxw, -25, 'Complemento'), COR.branco, { track: -25 });
      } else {
        texto(ctx, xm, top + (h + cap(ctx, 'heavy', T)) / 2, t1, 'heavy', caber(ctx, rel, t1, 'heavy', T, maxw, -25, 'Atração'), COR.branco, { track: -25 });
      }
      const xr = c.x0 + 1421 * s;
      const Aa = 32 * k, Bb = 56 * k, g = 24 * k;
      const ba = top + (h - (cap(ctx, 'heavy', Aa) + g + cap(ctx, 'bold', Bb))) / 2 + cap(ctx, 'heavy', Aa);
      texto(ctx, xr, ba, 'HORÁRIO:', 'heavy', Aa, COR.branco, { track: -25 });
      const hora = `às ${l.horario}`;
      texto(ctx, xr, ba + g + cap(ctx, 'bold', Bb), hora, 'bold', caber(ctx, rel, hora, 'bold', Bb, 400 * s, -25, 'Horário'), COR.branco, { track: -25 });
    });
    const [mx, mb, ms] = c.mes;
    texto(ctx, mx, mb, M(d.mes), 'semibold', caber(ctx, rel, M(d.mes), 'semibold', ms, ms * 7, 40, 'Mês'), COR.deep, { track: 40, align: 'c' });
    const [nx, nb, ns] = c.nota;
    texto(ctx, nx, nb, d.teatral.nota, 'bold', caber(ctx, rel, d.teatral.nota, 'bold', ns, ns * 30, 0, 'Observação'), COR.deep, { align: 'c' });
  };
}

// ------------------------------------------------------- Programação Completa
function cardsCompleta(d) {
  return d.teatral.linhas.map((l) => ({
    t1: M(l.atracao),
    t2: M(l.complemento),
    q: l.datas.trim() ? [M(l.dia) + ' ', rotuloDatas(l.datas)] : [M(todaTodo(l.dia)) + ' ', M(l.dia)],
    hora: M(`às ${l.horario}`),
    local: M(l.local) + ',',
  }));
}

function cardCompleta(ctx, x0, top, w, h, s, c, rel) {
  const T = 50 * s, S = 31 * s;
  let base = top - 24 * s;
  if (c.t2) {
    texto(ctx, x0 + w / 2, base, c.t2, 'heavy', caber(ctx, rel, c.t2, 'heavy', S, w, 0, 'Complemento'), COR.deep, { align: 'c' });
    base -= cap(ctx, 'heavy', S) + 16 * s;
  }
  texto(ctx, x0 + w / 2, base, c.t1, 'heavy', caber(ctx, rel, c.t1, 'heavy', T, w, 0, 'Atração'), COR.deep, { align: 'c' });
  caixa(ctx, x0, top, x0 + w, top + h, 22 * s, COR.card);
  const L = 38.8 * s, lh = 55.4 * s;
  const b1 = top + (h - (2 * lh + cap(ctx, 'heavy', L))) / 2 + cap(ctx, 'heavy', L);
  const cx = x0 + w / 2;
  texto(ctx, cx, b1, c.local, 'heavy', caber(ctx, rel, c.local, 'heavy', L, w - 50 * s, 0, 'Local'), COR.branco, { align: 'c' });
  linhaMista(ctx, cx, b1 + lh, [[c.q[0], 'regular', L], [c.q[1], 'heavy', L]], COR.branco, { align: 'c', maxw: w - 50 * s, rel, campo: 'Datas' });
  texto(ctx, cx, b1 + 2 * lh, c.hora, 'heavy', L, COR.branco, { align: 'c' });
}

function completa(c) {
  return (ctx, d, R, rel) => {
    selo(ctx, R, ...c.selo);
    const [mx, b1, b2, ms, mw] = c.manchete;
    texto(ctx, mx, b1, 'PROGRAMAÇÃO', 'heavy', ms, COR.deep, { align: 'c' });
    const esp = `ESPECIAL DE ${M(d.mes)}`;
    texto(ctx, mx, b2, esp, 'heavy', caber(ctx, rel, esp, 'heavy', ms, mw, 0, 'Mês'), COR.deep, { align: 'c' });
    const cards = cardsCompleta(d);
    // Linhas de cards; com mais atrações que o previsto, a grade inteira encolhe
    // (cards, títulos e espaços) para caber até o limite de baixo da peça.
    const linhas = Math.ceil(cards.length / c.porLinha);
    const natural = (linhas - 1) * c.pitch + c.h;
    const k = Math.min(1, (c.limite - c.top) / natural);
    if (k < 0.75) {
      rel.erros.push(`A Programação Completa (${c.nome}) não comporta ${cards.length} atrações. Remova alguma linha dos Shows Teatrais.`);
    } else if (k < 1) {
      rel.reducoes.push({ campo: 'Quantidade de atrações', texto: '', fator: k });
    }
    let i = 0;
    for (let ln = 0; ln < linhas; ln++) {
      const n = Math.min(c.porLinha, cards.length - i);
      const w = c.w * k, gap = c.gap * k;
      const total = n * w + (n - 1) * gap;
      const top = c.top + ln * c.pitch * k;
      for (let j = 0; j < n; j++) cardCompleta(ctx, c.cx - total / 2 + j * (w + gap), top, w, c.h * k, c.s * k, cards[i++], rel);
    }
  };
}

// ------------------------------------------------------------ Música ao Vivo
function musica(c) {
  return (ctx, d, R, rel) => {
    const dias = d.musica.dias;
    const maxw = c.x1 - c.stylex - (c.dayx - c.x0);
    let size = c.size;
    for (const l of dias) size = Math.min(size, caber(ctx, null, M(l.estilo), 'heavy', c.size, maxw));
    if (size < c.size) rel.reducoes.push({ campo: 'Estilo musical', texto: '', fator: size / c.size });
    const cp = cap(ctx, 'heavy', size);
    const n = dias.length;
    const pitch = n > 7 ? (c.pitch * 7) / n : c.pitch;
    const h = c.h * (pitch / c.pitch);
    dias.forEach((l, i) => {
      const t = c.top + i * pitch;
      if (i % 2 === 0) caixa(ctx, c.x0, t, c.x1, t + h, c.r, FAIXA_MUSICA);
      const b = t + (h + cp) / 2;
      texto(ctx, c.dayx, b, M(l.dia), 'heavy', size, COR.branco);
      texto(ctx, c.stylex, b, M(l.estilo), 'heavy', size, COR.branco);
    });
    const [mt, mx, mbottom, ms] = c.mes;
    const linhaMes = M(mt.replace('{mes}', d.mes));
    ctx.font = `800 ${ms}px "Fibra One"`;
    const desc = ctx.measureText(linhaMes).actualBoundingBoxDescent;
    texto(ctx, mx, mbottom - desc, linhaMes, 'heavy', ms, COR.branco, { align: 'c' });
    const [tx, tb, ts] = c.todos;
    texto(ctx, tx, tb, M(d.musica.horario), 'heavy', caber(ctx, rel, M(d.musica.horario), 'heavy', ts, (c.x1 - c.x0) * 1.05, 0, 'Horário'), COR.branco, { align: 'c' });
    const [lx, lb, ls] = c.local;
    const loc = `LOCAL: ${M(d.musica.local)}`;
    texto(ctx, lx, lb, loc, 'heavy', caber(ctx, rel, loc, 'heavy', ls, c.x1 - c.x0, 0, 'Local'), COR.branco, { align: 'c' });
  };
}

// ---------------------------------------------------------- Lazer na Piscina
function piscina(c) {
  return (ctx, d, R, rel) => {
    const m = MEDIDAS[c.id];
    const [b0, b1, b2] = m.caixas;
    const x0 = b0[0], x1 = b0[2];
    const r = 0.014 * (x1 - x0);
    const corTxt = m.cor === '#ffffff' ? COR.deep : COR.branco;
    const f = c.size;
    const cp = cap(ctx, 'bold', f);
    const maxw = (c.xr - c.x) - 0.5 * f;
    const larguraTotal = x1 - c.x - 0.6 * f;

    // "Todos os dias": título + itens em duas colunas
    const itens = d.piscina.todosOsDias;
    const porColuna = Math.ceil(itens.length / 2);
    const lhT = 1.6 * f;
    const H0 = b0[3] - b0[1] + Math.max(0, porColuna - 2) * lhT;
    caixa(ctx, x0, b0[1], x1, b0[1] + H0, r, m.cor);
    const bt = b0[1] + (H0 - (porColuna * lhT + cp)) / 2 + cp;
    texto(ctx, c.x, bt, 'TODOS OS DIAS', 'bold', f, corTxt);
    itens.forEach((it, i) => {
      const col = i < porColuna ? 0 : 1;
      const lin = col ? i - porColuna : i;
      const t = `${it.hora} – ${it.atividade}`;
      texto(ctx, col ? c.xr : c.x, bt + (lin + 1) * lhT, t, 'bold', caber(ctx, rel, t, 'bold', f, col ? larguraTotal - (c.xr - c.x) : maxw, 0, 'Todos os dias'), corTxt);
    });

    // blocos da tarde
    const hb = b1[3] - b1[1];
    const gapTopo = b1[1] - b0[3];
    const gap = b2[1] - b1[3];
    const lh = 1.4 * f;
    let y = b0[1] + H0 + gapTopo;
    for (const bl of d.piscina.blocos) {
      caixa(ctx, x0, y, x1, y + hb, r, m.cor);
      const b = y + (hb - (lh + cp)) / 2 + cp;
      const rot = `${bl.quando}:`;
      const at = `${bl.hora} – ${bl.atividade}`;
      texto(ctx, c.x, b, rot, 'bold', caber(ctx, rel, rot, 'bold', f, larguraTotal, 0, 'Quando'), corTxt);
      texto(ctx, c.x, b + lh, at, 'bold', caber(ctx, rel, at, 'bold', f, larguraTotal, 0, 'Atividade'), corTxt);
      y += hb + gap;
    }
    if (y - gap > c.limite) rel.erros.push(`Lazer na Piscina (${c.nome}): há blocos demais para o espaço. Remova um bloco ou um item de "Todos os dias".`);
  };
}

// ------------------------------------------------------------------- Fitness
function fitnessBlocos(ctx, d, rel, x0, x1, top, bottom, f0, gap) {
  const blocos = d.fitness.blocos;
  const alturas = (f) => {
    const lh = 1.25 * f, pad = 0.78 * f;
    return { hs: blocos.map((b) => 2 * pad + cap(ctx, 'heavy', f) + (b.atividades.length + 1) * lh), lh, pad };
  };
  let f = f0;
  let { hs, lh, pad } = alturas(f);
  let total = hs.reduce((a, b) => a + b, 0) + gap * (hs.length - 1);
  if (total > bottom - top) {
    const k = (bottom - top - gap * (hs.length - 1)) / hs.reduce((a, b) => a + b, 0);
    f *= k;
    rel.reducoes.push({ campo: 'Quantidade de atividades', texto: '', fator: k });
    ({ hs, lh, pad } = alturas(f));
    total = hs.reduce((a, b) => a + b, 0) + gap * (hs.length - 1);
  }
  let y = top + (bottom - top - total) / 2;
  const xt = x0 + (70 * (x1 - x0)) / 953;
  const maxw = x1 - xt - 30;
  blocos.forEach((bl, i) => {
    const h = hs[i];
    caixa(ctx, x0, y, x1, y + h, 0.032 * (x1 - x0), i % 2 === 0 ? COR.blue : COR.deep);
    const b = y + pad + cap(ctx, 'heavy', f);
    const dia = M(bl.dia) + (bl.datas.trim() ? ` – ${rotuloDatas(bl.datas)}` : '');
    texto(ctx, xt, b, dia, 'heavy', caber(ctx, rel, dia, 'heavy', f, maxw, 0, 'Dia'), COR.branco);
    bl.atividades.forEach((a, j) => {
      const t = `${a.hora} – ${a.atividade}`;
      texto(ctx, xt, b + (j + 1) * lh, t, 'heavy', caber(ctx, rel, t, 'heavy', f, maxw, 0, 'Atividade'), COR.branco);
    });
    const loc = `Local: ${bl.local}`;
    texto(ctx, xt, b + (bl.atividades.length + 1) * lh, loc, 'bold', caber(ctx, rel, loc, 'bold', f, maxw, 0, 'Local'), COR.branco);
    y += h + gap;
  });
}

function fitness(c) {
  return (ctx, d, R, rel) => {
    const [linhas, cx, b1, size, lh] = c.titulo;
    linhas.forEach((l, i) => {
      const t = M(l.replace('{mes}', d.mes));
      texto(ctx, cx, b1 + i * lh, t, 'heavy', caber(ctx, rel, t, 'heavy', size, c.tituloMax, 0, 'Mês'), COR.deep, { align: 'c' });
    });
    fitnessBlocos(ctx, d, rel, ...c.area);
  };
}

function step(c) {
  return (ctx, d, R, rel) => {
    const s = d.step;
    const linha = (t, [b, size], key, campo) =>
      texto(ctx, c.cx, b, t, key, caber(ctx, rel, t, key, size, c.maxw, 0, campo), COR.branco, { align: 'c' });
    linha(M(s.titulo), c.titulo, 'heavy', 'Título');
    linha(M(s.quando), c.quando, 'heavy', 'Quando');
    linha(`${s.hora} – ${M(s.local)}`, c.hora, 'heavy', 'Horário e local');
    linha(M(s.aviso), c.aviso, 'bold', 'Aviso');
  };
}

// --------------------------------------------- Bingo, Xuxa, Samba, Nordeste
function bingo(c) {
  return (ctx, d, R, rel) => {
    const ic = R.ic;
    const b = d.bingo;
    linhaIcones(ctx, c.cx, c.centro - c.dist / 2, [[ic.calendario, b.quando]], c.a, COR.deep, 34 * c.s, 0, { rel, campo: 'Datas' });
    linhaIcones(ctx, c.cx, c.centro + c.dist / 2, [[ic.relogio, b.hora], [ic.pin, b.local]], c.b, COR.deep, 34 * c.s, 100 * c.s, { rel, campo: 'Horário e local' });
  };
}

function xuxa(c) {
  return (ctx, d, R, rel) => {
    const ic = R.ic;
    const x = d.xuxa;
    const lg = ic.logo;
    ctx.drawImage(lg, c.cx - lg.naturalWidth / 2, c.logoCy - lg.naturalHeight / 2);
    linhaIcones(ctx, c.cxData, c.centro - c.dist / 2, [[ic.calendario, x.quando]], c.a, ROSA, c.gi, 0, { rel, campo: 'Datas' });
    linhaIcones(ctx, c.cxInfo, c.centro + c.dist / 2, [[ic.relogio, x.hora], [ic.pin, x.local]], c.b, ROSA, c.gi, c.gg, { rel, campo: 'Horário e local' });
  };
}

function samba(c) {
  return (ctx, d, R, rel) => {
    const ic = R.ic;
    const m = MEDIDAS[c.id];
    const sb = d.samba;
    if (c.umaLinha) {
      linhaIcones(ctx, c.cx, centroY(m.calendario), [[ic.calendario, sb.quando], [ic.relogio, sb.hora], [ic.pin, sb.local]], c.a, SAMBA, 9, 70, { rel, campo: 'Data, horário e local' });
      // "Equipe Peixe Boi" sob o PRATAGY, como no A4 e na TV vertical
      texto(ctx, 950.5, 737, 'EQUIPE PEIXE BOI', 'bold', 19, SAMBA, { track: -40, align: 'c' });
      return;
    }
    linhaIcones(ctx, c.cx, centroY(m.calendario), [[ic.calendario, sb.quando]], c.a, SAMBA, 0.27 * c.a, 0, { rel, campo: 'Data' });
    linhaIcones(ctx, c.cx, centroY(m.relogio), [[ic.relogio, sb.hora], [ic.pin, sb.local]], c.b, SAMBA, 0.3 * c.b, 0.55 * c.b, { rel, campo: 'Horário e local' });
  };
}

/** Quebra "Toda quinta-feira" em ["TODA", "QUINTA-FEIRA"] e "Quinta, 25 de novembro" na vírgula. */
function duasLinhas(t) {
  const s = (t || '').trim();
  const m = s.match(/^(toda|todo|todas|todos)\s+(.*)$/i);
  if (m) return [m[1], m[2]];
  const i = s.indexOf(',');
  if (i > 0) return [s.slice(0, i), s.slice(i + 1).trim()];
  return ['', s];
}

function nordeste(c) {
  return (ctx, d, R, rel) => {
    const ic = R.ic;
    const m = MEDIDAS[c.id];
    const n = d.nordeste;
    if (c.quando.length === 1) {
      const [x, b, s] = c.quando[0];
      const t = M(n.quando);
      texto(ctx, x, b, t, 'bebas', caber(ctx, rel, t, 'bebas', s, 2000, 0, 'Quando'), NORDESTE, { align: 'c' });
    } else {
      const [l1, l2] = duasLinhas(n.quando);
      const [[x1, b1, s1, a1], [x2, b2, s2]] = c.quando;
      texto(ctx, x1, b1, M(l1), 'bebas', s1, NORDESTE, { align: a1 });
      texto(ctx, x2, b2, M(l2), 'bebas', caber(ctx, rel, M(l2), 'bebas', s2, c.quandoMax, 0, 'Quando'), NORDESTE, { align: a1 });
    }
    linhaIcones(ctx, c.cx, centroY(m.relogio), [[ic.relogio, n.hora], [ic.pin, n.local]], c.info, NORDESTE, 0.3 * c.info, 0.55 * c.info, { rel, campo: 'Horário e local' });
  };
}

// ---------------------------------------------------------------------- Cine
/** Divide o local em duas linhas equilibradas ("Teatro Pratagy" -> TEATRO / PRATAGY). */
function partirLocal(t) {
  const p = M(t).split(/\s+/).filter(Boolean);
  if (p.length < 2) return [p.join(' ')];
  let melhor = 1, dif = Infinity;
  for (let i = 1; i < p.length; i++) {
    const a = p.slice(0, i).join(' ').length, b = p.slice(i).join(' ').length;
    if (Math.abs(a - b) < dif) { dif = Math.abs(a - b); melhor = i; }
  }
  return [p.slice(0, melhor).join(' '), p.slice(melhor).join(' ')];
}

function cine(c) {
  return (ctx, d, R, rel) => {
    const m = MEDIDAS[c.id];
    const [mx0, my0, mx1, my1] = m.moldura;
    cobrir(ctx, R.poster, mx0, my0, mx1, my1, d.cine.enquadramento || {});

    // faixa do mês: ícone + mês centralizados juntos
    const [fx0, fy0, fx1, fy1] = m.faixa;
    const ic = R.ic.calendario;
    const gap = 0.35 * ic.naturalWidth;
    const mes = M(d.mes);
    const size = caber(ctx, rel, mes, 'semibold', m.mes_px, (fx1 - fx0) * 0.82 - ic.naturalWidth - gap, 10, 'Mês');
    const tw = medir(ctx, mes, 'semibold', size, 10);
    const gx = (fx0 + fx1) / 2 - (ic.naturalWidth + gap + tw) / 2;
    const cy = (fy0 + fy1) / 2;
    ctx.drawImage(ic, gx, cy - ic.naturalHeight / 2);
    texto(ctx, gx + ic.naturalWidth + gap, cy + cap(ctx, 'semibold', size) / 2, mes, 'semibold', size, COR.branco, { track: 10 });

    const larg = (fx1 - fx0) * 0.9;
    const dia = M(d.cine.dia);
    const md = m.dia;
    texto(ctx, (md.bbox[0] + md.bbox[2]) / 2, md.bbox[3], dia, 'heavy', caber(ctx, rel, dia, 'heavy', md.px, larg, 0, 'Dia'), COR.deep, { align: 'c' });
    const mh = m.hora;
    const hora = M(d.cine.hora);
    texto(ctx, mh.bbox[0], mh.bbox[3], hora, 'heavy', caber(ctx, rel, hora, 'heavy', mh.px, fx1 - mh.bbox[0] - 20, 0, 'Horário'), COR.deep);
    const ml = m.local;
    const [l1, l2] = partirLocal(d.cine.local);
    const b1 = ml.bbox[1] + cap(ctx, 'ultrabold', ml.px);
    const maxl = fx1 - ml.bbox[0] - 20;
    texto(ctx, ml.bbox[0], b1, l1, 'ultrabold', caber(ctx, rel, l1, 'ultrabold', ml.px, maxl, 0, 'Local'), COR.deep);
    if (l2) texto(ctx, ml.bbox[0], b1 + ml.lead, l2, 'ultrabold', caber(ctx, rel, l2, 'ultrabold', ml.px, maxl, 0, 'Local'), COR.deep);
  };
}

// ------------------------------------------------------------------ Infantil
const PAGINAS = [['Segunda-feira', 'Terça-feira'], ['Quarta-feira', 'Quinta-feira'], ['Sexta-feira', 'Sábado', 'Domingo']];
const TITULO = 1.7, RESPIRO = 0.7;
const altura = (dias, pag) => pag.reduce((s, dia) => s + (dias[dia]?.length || 0), 0) + TITULO * pag.length + RESPIRO * (pag.length - 1);

function infantil(c) {
  return (ctx, d, R, rel, pagina = 0) => {
    const dias = d[c.chave].dias;
    selo(ctx, R, ...c.selo);
    const pFit = (c.bottom - c.top) / Math.max(...PAGINAS.map((p) => altura(dias, p)));
    const f = Math.min(c.f, pFit / 1.4);
    if (f < c.f * 0.999) rel.reducoes.push({ campo: 'Quantidade de atividades', texto: '', fator: f / c.f });
    const pag = PAGINAS[pagina];
    const p = Math.min((c.bottom - c.top) / altura(dias, pag), 1.75 * f);
    let y = c.top + (c.bottom - c.top - altura(dias, pag) * p) / 2;
    const cp = cap(ctx, 'heavy', f);
    const ft = f * 1.33;
    pag.forEach((dia, i) => {
      if (i) y += RESPIRO * p;
      texto(ctx, c.cx, y + (TITULO * p + cap(ctx, 'heavy', ft)) / 2, M(dia), 'heavy', ft, INFANTIL, { align: 'c' });
      y += TITULO * p;
      for (const a of dias[dia] || []) {
        const b = y + (p + cp) / 2;
        texto(ctx, c.xt, b, a.hora, 'heavy', f, INFANTIL);
        texto(ctx, c.xa, b, a.atividade, 'regular', caber(ctx, rel, a.atividade, 'regular', f, c.xl - c.xa - 0.6 * f, 0, 'Atividade'), INFANTIL);
        if (a.local) texto(ctx, c.xl, b, a.local, 'heavy', caber(ctx, rel, a.local, 'heavy', f, c.xmax - c.xl, 0, 'Local'), INFANTIL);
        y += p;
      }
    });
  };
}

// ------------------------------------------------------------------ catálogo
const A4 = { nome: 'Impressão A4', w: 2480, h: 3508, uso: 'impressao' };
const TVV = { nome: 'TV vertical', w: 1080, h: 1920, uso: 'tela' };
const TVH = { nome: 'TV horizontal', w: 1920, h: 1080, uso: 'tela' };
const F = (base, id, desenhar, extra = {}) => ({ ...base, id, desenhar, icones: [], ...extra });

const icones = (id, nomes) => Object.fromEntries(nomes.map((n) => [n, `assets/lazer/icones/${id}-${n}.png`]));

export const ATRACOES = [
  {
    id: 'teatral', nome: 'Shows Teatrais', resumo: 'Shows, cinema e espetáculos no teatro',
    formatos: [
      F(A4, 'teatral-a4', teatral({ x0: 310, x1: 2171, y0: 1172, y1: 3080, mes: [1180.5, 1124, 94.4], nota: [1240, 3140, 40] })),
      F(TVV, 'teatral-tvv', teatral({ x0: 70, x1: 1010, y0: 718, y1: 1690, mes: [540, 688, 54.5], nota: [540, 1730, 22] })),
      F(TVH, 'teatral-tvh', teatral({ x0: 1081, x1: 1842, y0: 150, y1: 965, mes: [499, 871, 74.5], nota: [499, 935, 24] })),
    ],
  },
  {
    id: 'completa', nome: 'Programação Completa', resumo: 'Montada a partir dos Shows Teatrais', derivada: 'teatral',
    formatos: [
      F(A4, 'completa-a4', completa({ nome: 'Impressão A4', selo: [1240, 150, 1180], manchete: [1240, 1224, 1387, 135.7, 2050], top: 1655, pitch: 420, limite: 2860, porLinha: 3, w: 712, h: 201, gap: 25, s: 1, cx: 1240 }), { comSelo: true }),
      F(TVV, 'completa-tvv', completa({ nome: 'TV vertical', selo: [540, 70, 600], manchete: [540, 606, 666, 50.4, 900], top: 802, pitch: 210, limite: 1640, porLinha: 2, w: 454, h: 128, gap: 21, s: 454 / 712, cx: 540 }), { comSelo: true }),
      F(TVH, 'completa-tvh', completa({ nome: 'TV horizontal', selo: [440, 236, 560], manchete: [1395, 164, 225, 50.9, 820], top: 338, pitch: 172, limite: 820, porLinha: 3, w: 294, h: 83, gap: 10, s: 294 / 712, cx: 1375 }), { comSelo: true }),
    ],
  },
  {
    id: 'musica', nome: 'Música ao Vivo', resumo: 'Estilo musical de cada dia no bar',
    formatos: [
      F(A4, 'musica-a4', musica({ x0: 273, x1: 2211, top: 1659, h: 152, pitch: 158, dayx: 348, stylex: 897, size: 74.9, r: 34, mes: ['Programação de {mes}', 1240, 1526, 57], todos: [1240, 1602, 63.8], local: [1240, 2960, 91.8] })),
      F(TVV, 'musica-tvv', musica({ x0: 97, x1: 984, top: 1017, h: 70, pitch: 72, dayx: 132, stylex: 380, size: 34.3, r: 16, mes: ['Programação de {mes}', 540, 936, 30.3], todos: [540, 976, 33.95], local: [540, 1615, 35.7] })),
      F(TVH, 'musica-tvh', musica({ x0: 1051, x1: 1837, top: 405, h: 61, pitch: 63.5, dayx: 1082, stylex: 1303, size: 30.3, r: 14, mes: ['Programação especial de {mes}', 1444.5, 324, 34.1], todos: [1444.5, 368, 34.1], local: [1444, 925, 37.7] })),
    ],
  },
  {
    id: 'piscina', nome: 'Lazer na Piscina', resumo: 'Atividades de todos os dias e da tarde',
    formatos: [
      F(A4, 'piscina-a4', piscina({ id: 'piscina-a4', nome: 'Impressão A4', x: 450, xr: 1308, size: 57.8, limite: 2900 })),
      F(TVV, 'piscina-tvv', piscina({ id: 'piscina-tvv', nome: 'TV vertical', x: 170, xr: 571, size: 27, limite: 1600 })),
      F(TVH, 'piscina-tvh', piscina({ id: 'piscina-tvh', nome: 'TV horizontal', x: 1120, xr: 1491, size: 25, limite: 1050 })),
    ],
  },
  {
    id: 'fitness', nome: 'Programação Fitness', resumo: 'Aulas da semana, horários e locais',
    formatos: [
      F({ nome: 'Feed e WhatsApp', w: 1080, h: 1440, uso: 'tela' }, 'fitness-feed', fitness({ titulo: [['Programação de {mes}'], 540, 392, 56, 0], tituloMax: 990, area: [64, 1017, 425, 1112, 29.7, 13] })),
      F({ nome: 'Stories', w: 1080, h: 1920, uso: 'tela' }, 'fitness-stories', fitness({ titulo: [['Programação', 'de {mes}'], 547, 626, 58, 68], tituloMax: 990, area: [52, 1029, 760, 1510, 30.3, 16] })),
      F(TVH, 'fitness-tvh', fitness({ titulo: [['Programação especial de {mes}'], 1382, 168, 36, 0], tituloMax: 900, area: [920, 1845, 192, 860, 28.6, 11] })),
    ],
  },
  {
    id: 'step', nome: 'Aula de Step', resumo: 'Peça de destaque da aula',
    formatos: [
      F({ nome: 'Feed e WhatsApp', w: 1080, h: 1440, uso: 'tela' }, 'step-feed', step({ cx: 540, maxw: 860, titulo: [853, 88.7], quando: [917, 43.1], hora: [963, 30], aviso: [1074, 15.8] })),
      F({ nome: 'Stories', w: 1080, h: 1920, uso: 'tela' }, 'step-stories', step({ cx: 540, maxw: 900, titulo: [1222, 93.2], quando: [1289, 45.4], hora: [1338, 31.4], aviso: [1455, 16.6] })),
    ],
  },
  {
    id: 'bingo', nome: 'Bingo', resumo: 'Datas, horário e local',
    formatos: [
      F(A4, 'bingo-a4', bingo({ cx: 1240, centro: 2700, s: 1, a: 94.2, b: 85.8, dist: 190 }), { icones: icones('bingo-a4', ['calendario', 'relogio', 'pin']) }),
      F(TVV, 'bingo-tvv', bingo({ cx: 540, centro: 1500, s: 0.4913, a: 94.2 * 0.4913, b: 85.8 * 0.4913, dist: 190 * 0.4913 }), { icones: icones('bingo-tvv', ['calendario', 'relogio', 'pin']) }),
    ],
  },
  {
    id: 'cine', nome: 'Cine Pratagy', resumo: 'Filme do mês, dia e horário',
    formatos: [
      F(A4, 'cine-a4', cine({ id: 'cine-a4' }), { icones: icones('cine-a4', ['calendario']), comPoster: true }),
      F(TVV, 'cine-tvv', cine({ id: 'cine-tvv' }), { icones: icones('cine-tvv', ['calendario']), comPoster: true }),
      F(TVH, 'cine-tvh', cine({ id: 'cine-tvh' }), { icones: icones('cine-tvh', ['calendario']), comPoster: true }),
    ],
  },
  {
    id: 'xuxa', nome: 'Show da Xuxa', resumo: 'Datas, horário e local',
    formatos: [
      F(A4, 'xuxa-a4', xuxa({ cx: 1240, logoCy: 560, centro: 2176, a: 88.3, b: 80.4, gi: 30, gg: 64, dist: 188, cxData: 1209, cxInfo: 1143 }), { icones: icones('xuxa-a4', ['calendario', 'relogio', 'pin', 'logo']) }),
      F(TVV, 'xuxa-tvv', xuxa({ cx: 540, logoCy: 360, centro: 1157, a: 50.9, b: 46.3, gi: 17, gg: 36, dist: 106, cxData: 540, cxInfo: 534 }), { icones: icones('xuxa-tvv', ['calendario', 'relogio', 'pin', 'logo']) }),
    ],
  },
  {
    id: 'samba', nome: 'Show Samba', resumo: 'Data, horário e local',
    formatos: [
      F(A4, 'samba-a4', samba({ id: 'samba-a4', cx: 1240, a: 98.3, b: 107 }), { icones: icones('samba-a4', ['calendario', 'relogio', 'pin']) }),
      F(TVV, 'samba-tvv', samba({ id: 'samba-tvv', cx: 540, a: 51.4, b: 56 }), { icones: icones('samba-tvv', ['calendario', 'relogio', 'pin']) }),
      F(TVH, 'samba-tvh', samba({ id: 'samba-tvh', cx: 960, a: 40, umaLinha: true }), { icones: icones('samba-tvh', ['calendario', 'relogio', 'pin']) }),
    ],
  },
  {
    id: 'nordeste', nome: 'Show Nordeste', resumo: 'Dia, horário e local',
    formatos: [
      F(A4, 'nordeste-a4', nordeste({ id: 'nordeste-a4', cx: 1225, info: 121, quando: [[1240, 276, 121.6]] }), { icones: icones('nordeste-a4', ['relogio', 'pin']) }),
      F(TVV, 'nordeste-tvv', nordeste({ id: 'nordeste-tvv', cx: 540, info: 47.6, quando: [[541, 143, 43.9, 'c'], [541, 215, 80.8]], quandoMax: 900 }), { icones: icones('nordeste-tvv', ['relogio', 'pin']) }),
      F(TVH, 'nordeste-tvh', nordeste({ id: 'nordeste-tvh', cx: 955, info: 43.7, quando: [[107, 283, 48, 'l'], [107, 327, 48]], quandoMax: 520 }), { icones: icones('nordeste-tvh', ['relogio', 'pin']) }),
    ],
  },
  ...['712', '46'].map((faixa) => {
    const c712 = faixa === '712';
    const chave = `infantil${faixa}`;
    const P = { paginas: 3, comSelo: true };
    return {
      id: chave, nome: `Infantil ${c712 ? '7 a 12' : '4 a 6'} anos`, resumo: 'Atividades da recreação, dia a dia',
      formatos: c712
        ? [
            F(A4, 'inf712-a4', infantil({ chave, cx: 1231, top: 905, bottom: 3150, xt: 307, xa: 601, xl: 1541, xmax: 2250, f: 50.1, selo: [1240, 75, 900] }), P),
            F(TVV, 'inf712-tvv', infantil({ chave, cx: 545, top: 684, bottom: 1600, xt: 155, xa: 282, xl: 691, xmax: 995, f: 21.7, selo: [540, 70, 520] }), P),
            F(TVH, 'inf712-tvh', infantil({ chave, cx: 1418, top: 150, bottom: 945, xt: 1065, xa: 1174, xl: 1524, xmax: 1815, f: 18.6, selo: [470, 345, 540] }), P),
          ]
        : [
            F(A4, 'inf46-a4', infantil({ chave, cx: 1240, top: 1045, bottom: 3080, xt: 312, xa: 643, xl: 1493, xmax: 2265, f: 50.1, selo: [1240, 120, 900] }), P),
            F(TVV, 'inf46-tvv', infantil({ chave, cx: 545, top: 684, bottom: 1590, xt: 120, xa: 261, xl: 622, xmax: 995, f: 21.3, selo: [540, 80, 500] }), P),
            F(TVH, 'inf46-tvh', infantil({ chave, cx: 1418, top: 128, bottom: 970, xt: 1040, xa: 1201, xl: 1508, xmax: 1815, f: 19.8, selo: [455, 320, 540] }), P),
          ],
    };
  }),
];

export const PAGINAS_INFANTIL = ['Segunda e terça', 'Quarta e quinta', 'Sexta a domingo'];

// ---------------------------------------------------------------- produção
const SELO_PADRAO = 'assets/lazer/icones/selo-novembro.png';
const POSTER_PADRAO = 'assets/lazer/icones/poster-padrao.jpg';

/** Carrega fundo, ícones, selo e pôster de um formato. */
export async function recursos(fmt, d, imagem) {
  const [fundo, ...ics] = await Promise.all([
    imagem(`assets/lazer/fundos/${fmt.id}.jpg`),
    ...Object.values(fmt.icones).map(imagem),
  ]);
  const ic = Object.fromEntries(Object.keys(fmt.icones).map((k, i) => [k, ics[i]]));
  if (fmt.comSelo) {
    ic.passagens = await imagem('assets/lazer/icones/passagens.png');
  }
  const seloImg = fmt.comSelo ? await imagem(d.selo || SELO_PADRAO) : null;
  const poster = fmt.comPoster ? await imagem(d.cine.poster || POSTER_PADRAO) : null;
  return { fundo, ic, selo: seloImg, poster };
}

/**
 * Desenha a peça inteira no canvas (tamanho real) e devolve o relatório de encaixe.
 * Uma redução abaixo de 70% vira bloqueio: o texto ficaria pequeno demais para ler.
 */
export function desenhar(canvas, fmt, d, R, pagina = 0) {
  canvas.width = fmt.w;
  canvas.height = fmt.h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(R.fundo, 0, 0, fmt.w, fmt.h);
  const rel = { reducoes: [], erros: [] };
  fmt.desenhar(ctx, d, R, rel, pagina);
  for (const r of rel.reducoes) {
    if (r.fator < 0.7) {
      rel.erros.push(
        `"${r.campo}"${r.texto ? ` (${r.texto})` : ''} ficaria pequeno demais em ${fmt.nome}. Encurte o texto.`
      );
    }
  }
  return rel;
}
