import { getState, setState } from '../state.js';
import { getFormato, getSetor } from '../data/models.js';
import { renderCanvas, drawSafeAreaGuide, loadImage, ensureFontsReady } from '../canvas/engine.js';
import { icon } from './icons.js';
import { emptyState } from './common.js';

const imageCache = new Map();
let showGuide = false;

async function getCachedImage(src) {
  if (imageCache.has(src)) return imageCache.get(src);
  const promise = loadImage(src);
  imageCache.set(src, promise);
  return promise;
}

/**
 * Pré-carrega todas as imagens de um setor (chamado ao entrar no passo Formato,
 * para a prévia ficar instantânea quando o usuário escolher o modelo).
 */
export function preloadSetorImages(setor) {
  setor.formatos.forEach((f) => getCachedImage(f.imagem).catch(() => {}));
}

export function mountPreviewPanel(container) {
  container.innerHTML = `
    <div class="flex flex-col gap-3 lg:sticky lg:top-24">
      <div class="flex items-center justify-between gap-3">
        <h2 class="flex items-center gap-1.5 font-fibra text-xs font-extrabold uppercase tracking-wider text-slate-500">
          ${icon('eye', { size: 14 })} Prévia da placa
        </h2>
        <label class="flex cursor-pointer select-none items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-500 transition-colors hover:border-brand-coral hover:text-brand-coral">
          <input type="checkbox" id="toggle-safe-area" class="rounded accent-[#E95029]" />
          Área segura
        </label>
      </div>
      <div id="preview-canvas-wrap"
        class="relative flex min-h-[220px] items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"></div>
      <div id="preview-fits-banner"></div>
    </div>
  `;

  container.querySelector('#toggle-safe-area').addEventListener('change', (e) => {
    showGuide = e.target.checked;
    updatePreview();
  });

  updatePreview();
}

const CANVAS_DISPLAY_CLASS = 'max-w-full max-h-[65vh] rounded-lg';

function ensureCanvases(wrap) {
  let stack = wrap.querySelector('[data-canvas-stack]');
  if (stack) {
    return {
      canvas: stack.querySelector('[data-canvas-main]'),
      guideCanvas: stack.querySelector('[data-canvas-guide]'),
    };
  }

  wrap.innerHTML = '';
  stack = document.createElement('div');
  stack.dataset.canvasStack = '';
  stack.className = 'relative inline-block';

  const canvas = document.createElement('canvas');
  canvas.dataset.canvasMain = '';
  canvas.className = `${CANVAS_DISPLAY_CLASS} block shadow-inner`;
  canvas.setAttribute('aria-label', 'Prévia da placa');

  // Canvas overlay exclusivo para o guia da área segura: nunca é exportado,
  // evitando que a linha pontilhada vaze para o PNG/PDF final.
  const guideCanvas = document.createElement('canvas');
  guideCanvas.dataset.canvasGuide = '';
  guideCanvas.className = `${CANVAS_DISPLAY_CLASS} absolute inset-0 w-full h-full pointer-events-none`;

  stack.appendChild(canvas);
  stack.appendChild(guideCanvas);
  wrap.appendChild(stack);

  return { canvas, guideCanvas };
}

export async function updatePreview() {
  const wrap = document.getElementById('preview-canvas-wrap');
  const banner = document.getElementById('preview-fits-banner');
  if (!wrap || !banner) return;

  const state = getState();
  const formato = getFormato(state.setorId, state.formatoId);

  if (!formato) {
    wrap.innerHTML = emptyState({
      iconName: 'image',
      title: 'Nenhum modelo selecionado',
      description: 'Escolha um setor e um formato para visualizar a prévia da placa aqui.',
    });
    banner.innerHTML = '';
    return;
  }

  const { canvas, guideCanvas } = ensureCanvases(wrap);

  try {
    const [image] = await Promise.all([getCachedImage(formato.imagem), ensureFontsReady()]);

    const setor = getSetor(state.setorId);
    const { fits } = renderCanvas(canvas, {
      image,
      formato,
      texto: state.texto,
      textoEs: state.textoEs,
      tipo: state.setorId === 'ab' ? 'ab' : state.setorId === 'governanca' ? 'governanca' : 'manutencao',
      titleCase: Boolean(setor?.titleCase),
    });

    guideCanvas.width = formato.largura;
    guideCanvas.height = formato.altura;
    guideCanvas.getContext('2d').clearRect(0, 0, formato.largura, formato.altura);
    if (showGuide) drawSafeAreaGuide(guideCanvas, formato);

    if (fits !== state.fits) {
      setState({ fits });
    }

    banner.innerHTML = fits
      ? ''
      : `
        <div class="flex items-start gap-2 rounded-xl border border-brand-coral/30 bg-brand-coral/10 px-3 py-2.5 text-sm text-brand-coral">
          ${icon('alertTriangle', { size: 17, className: 'mt-0.5' })}
          <p><strong class="font-extrabold">O texto ultrapassa a área segura.</strong> Reduza o texto para liberar a exportação.</p>
        </div>
      `;
  } catch (err) {
    console.error(err);
    wrap.innerHTML = emptyState({
      iconName: 'alertTriangle',
      title: 'Não foi possível carregar o modelo',
      description: 'Verifique se o servidor local está rodando e recarregue a página.',
    });
  }
}
