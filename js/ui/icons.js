// Ícones da interface — Lucide Icons (via CDN) com fallback inline.
//
// O SVG é montado de forma síncrona a partir de `lucide.icons`, em vez de usar
// `lucide.createIcons()`: como a aplicação reescreve o DOM a cada render, uma
// varredura pós-render exigiria reprocessar a árvore inteira toda vez e
// correria o risco de aninhar SVGs já convertidos.
//
// Se o CDN estiver bloqueado pela rede corporativa, o fallback inline mantém a
// interface legível — nunca fica sem ícone.

// Nome semântico usado na app -> nome do ícone no Lucide (PascalCase).
const LUCIDE_NAMES = {
  ab: 'Utensils',
  manutencao: 'Wrench',
  governanca: 'BedDouble',
  check: 'Check',
  checkCircle: 'CircleCheck',
  arrowRight: 'ArrowRight',
  arrowLeft: 'ArrowLeft',
  download: 'Download',
  image: 'Image',
  filePdf: 'FileText',
  search: 'Search',
  alertTriangle: 'TriangleAlert',
  refresh: 'RefreshCw',
  x: 'X',
  spinner: 'LoaderCircle',
  edit: 'Pencil',
  globe: 'Globe',
  sparkles: 'Sparkles',
  layers: 'Layers',
  ruler: 'Ruler',
  eye: 'Eye',
  info: 'Info',
  printer: 'Printer',
};

// Fallback usado apenas se `window.lucide` não estiver disponível.
const FALLBACK_PATHS = {
  ab: '<path d="M3 2v7a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V2"/><path d="M6 11v11"/><path d="M18 2v20"/><path d="M18 9h3V6a4 4 0 0 0-3-3.9"/>',
  manutencao: '<path d="M14.7 6.3a4 4 0 1 0-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 0 0 5.4-5.4l-2.1 2.1-2.3-.6-.6-2.3z"/>',
  governanca: '<path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8"/><path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4"/><path d="M2 17h20"/><path d="M6 8h4"/><path d="M14 8h4"/>',
  check: '<polyline points="20 6 9 17 4 12"/>',
  checkCircle: '<circle cx="12" cy="12" r="9"/><polyline points="8 12 11 15 16 9"/>',
  arrowRight: '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
  arrowLeft: '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>',
  download: '<path d="M12 3v12"/><polyline points="7 11 12 16 17 11"/><path d="M4 19h16"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/>',
  filePdf: '<path d="M15 2H6v20h12V7z"/><path d="M15 2v5h5"/><path d="M9 13h6"/><path d="M9 17h6"/>',
  search: '<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  alertTriangle: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  refresh: '<polyline points="1 4 1 10 7 10"/><polyline points="23 20 23 14 17 14"/><path d="M20.5 9A9 9 0 0 0 5.6 5.6L1 10m22 4-4.6 4.4A9 9 0 0 1 3.5 15"/>',
  x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  spinner: '<path d="M21 12a9 9 0 1 1-6.2-8.6"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  globe: '<circle cx="12" cy="12" r="9"/><line x1="3" y1="12" x2="21" y2="12"/><path d="M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18z"/>',
  sparkles: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/>',
  layers: '<path d="m12 2 9 5-9 5-9-5 9-5z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/>',
  ruler: '<path d="M3 15 15 3l6 6L9 21z"/><path d="m7 11 2 2"/><path d="m11 7 2 2"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  printer: '<path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
};

function attrsToString(attrs) {
  return Object.entries(attrs)
    .map(([key, value]) => `${key}="${String(value).replace(/"/g, '&quot;')}"`)
    .join(' ');
}

/**
 * Monta os filhos do SVG a partir do IconNode do Lucide:
 * [["path", { d: "..." }], ["circle", { cx, cy, r }], ...]
 */
function lucideChildren(name) {
  const lucideName = LUCIDE_NAMES[name];
  const node = lucideName && window.lucide?.icons?.[lucideName];
  if (!Array.isArray(node)) return null;
  return node.map(([tag, attrs]) => `<${tag} ${attrsToString(attrs || {})}/>`).join('');
}

/**
 * Devolve o markup de um ícone, já dimensionado e centralizado.
 *
 * Use sempre com um container flex (`inline-flex items-center justify-center`)
 * para o alinhamento óptico ficar correto ao lado de texto.
 */
export function icon(name, { size = 20, className = '', strokeWidth = 2 } = {}) {
  const children = lucideChildren(name) ?? FALLBACK_PATHS[name] ?? '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="shrink-0 ${className}" aria-hidden="true" focusable="false">${children}</svg>`;
}
