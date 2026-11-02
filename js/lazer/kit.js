// Kit de desenho das peças de Esportes e Lazer.
//
// Mesmo vocabulário do gerador em Python que produziu as peças de novembro
// (tracking em milésimos de "em", texto pela linha de base, encaixe por largura),
// para que o editor no navegador reproduza o layout aprovado. O kerning vem do
// próprio Canvas, que lê a tabela da fonte.

export const COR = {
  deep: '#004F9F',
  blue: '#008BCE',
  card: '#004EA3',
  coral: '#E95029',
  branco: '#FFFFFF',
};

// Pesos da Fibra One declarados em css/fonts.css (UltraBold = 750).
const PESO = { regular: 400, semibold: 600, bold: 700, ultrabold: 750, heavy: 800 };

/** Espaço extra por palavra (em): a Fibra One tem espaço estreito para leitura à distância. */
const WORD_SPACE = 0.04;

function fonte(key, size) {
  if (key === 'bebas') return `${size}px "Bebas Neue Pratagy"`;
  return `${PESO[key]} ${size}px "Fibra One"`;
}

function aplicar(ctx, key, size, track) {
  ctx.font = fonte(key, size);
  // Tracking negativo não encosta palavras: o espaço recebe o tracking de volta.
  ctx.letterSpacing = `${(track * size) / 1000}px`;
  ctx.wordSpacing = `${WORD_SPACE * size - (track * size) / 1000}px`;
}

export function medir(ctx, texto, key, size, track = 0) {
  if (!texto) return 0;
  ctx.save();
  aplicar(ctx, key, size, track);
  const w = ctx.measureText(texto).width - (track * size) / 1000;
  ctx.restore();
  return w;
}

const capCache = new Map();
/** Altura das maiúsculas (do 'H') no corpo pedido. */
export function cap(ctx, key, size) {
  const k = `${key}`;
  if (!capCache.has(k)) {
    ctx.save();
    ctx.font = fonte(key, 1000);
    capCache.set(k, ctx.measureText('H').actualBoundingBoxAscent / 1000);
    ctx.restore();
  }
  return capCache.get(k) * size;
}
export const limparCacheCap = () => capCache.clear();

/** Escreve com a linha de base em y. align: 'l' | 'c' | 'r'. Devolve a largura. */
export function texto(ctx, x, y, t, key, size, cor, { track = 0, align = 'l' } = {}) {
  if (!t) return 0;
  const w = medir(ctx, t, key, size, track);
  const x0 = align === 'c' ? x - w / 2 : align === 'r' ? x - w : x;
  ctx.save();
  aplicar(ctx, key, size, track);
  ctx.fillStyle = cor;
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.fillText(t, x0, y);
  ctx.restore();
  return w;
}

/**
 * Registro de encaixe da peça em produção. `caber` reduz o corpo quando o texto
 * não cabe e anota o quanto reduziu; o editor transforma isso em aviso
 * (reduziu um pouco) ou bloqueio (ficaria ilegível).
 */
export function novoRelatorio() {
  return { reducoes: [] };
}

export function caber(ctx, rel, t, key, size, maxw, track = 0, campo = '') {
  const w = medir(ctx, t, key, size, track);
  if (w <= maxw || !w) return size;
  const k = maxw / w;
  if (rel) rel.reducoes.push({ campo, texto: t, fator: k });
  return size * k;
}

/** Linha com vários estilos: runs = [[texto, key, size], ...], todos na mesma cor. */
export function linhaMista(ctx, x, y, runs, cor, { align = 'l', maxw = Infinity, rel = null, campo = '' } = {}) {
  let total = runs.reduce((s, [t, k, sz]) => s + medir(ctx, t, k, sz), 0);
  let f = 1;
  if (total > maxw) {
    f = maxw / total;
    if (rel) rel.reducoes.push({ campo, texto: runs.map((r) => r[0]).join(''), fator: f });
    total *= f;
  }
  let cx = align === 'c' ? x - total / 2 : align === 'r' ? x - total : x;
  for (const [t, k, sz] of runs) cx += texto(ctx, cx, y, t, k, sz * f, cor);
}

export function caixa(ctx, x0, y0, x1, y1, r, cor) {
  ctx.save();
  ctx.fillStyle = cor;
  ctx.beginPath();
  ctx.roundRect(x0, y0, x1 - x0, y1 - y0, r);
  ctx.fill();
  ctx.restore();
}

// ------------------------------------------------------------------- imagens
const cacheImg = new Map();
export function imagem(src) {
  if (!cacheImg.has(src)) {
    cacheImg.set(
      src,
      new Promise((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => {
          cacheImg.delete(src);
          reject(new Error(`Não foi possível carregar ${src}`));
        };
        el.src = src;
      })
    );
  }
  return cacheImg.get(src);
}

/** Desenha a imagem preenchendo a caixa (corta o excesso, centralizado + deslocamento). */
export function cobrir(ctx, img, x0, y0, x1, y1, { zoom = 1, cx = 0.5, cy = 0.5 } = {}) {
  const w = x1 - x0;
  const h = y1 - y0;
  const k = Math.max(w / img.naturalWidth, h / img.naturalHeight) * zoom;
  const dw = img.naturalWidth * k;
  const dh = img.naturalHeight * k;
  const dx = x0 - (dw - w) * cx;
  const dy = y0 - (dh - h) * cy;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x0, y0, w, h);
  ctx.clip();
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

/** Ícone desenhado com largura w, centrado verticalmente em cy. Devolve a largura. */
export function icone(ctx, img, x, cy, w) {
  const h = (w * img.naturalHeight) / img.naturalWidth;
  ctx.drawImage(img, x, cy - h / 2, w, h);
  return w;
}

// -------------------------------------------------------------------- textos
/** "3, 17 e 24" -> "DIAS 3, 17 E 24"; "25" -> "DIA 25". */
export function rotuloDatas(datas) {
  const d = (datas || '').trim();
  if (!d) return '';
  const plural = /[,e]/.test(d.replace(/^\d+$/, ''));
  return `${plural ? 'DIAS' : 'DIA'} ${d}`.toUpperCase();
}

/** "Todo" para sábado e domingo, "Toda" para os demais dias. */
export function todaTodo(dia) {
  return /^(s[áa]bado|domingo)/i.test(dia || '') ? 'Todo' : 'Toda';
}

export const maiusculas = (t) => (t || '').toLocaleUpperCase('pt-BR');
