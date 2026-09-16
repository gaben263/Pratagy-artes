// Editor de foto reutilizável: escolher arquivo → arrastar para enquadrar →
// roda do mouse ou slider para zoom. A prévia do enquadramento usa a mesma
// `janelaDaFoto` do renderizador, então o que se vê aqui é o que sai na arte.
//
// LGPD: a foto vive só em memória (um HTMLImageElement no objeto do
// colaborador). Não vai para IndexedDB, localStorage nem para servidor algum;
// recarregar a página apaga tudo. A URL temporária do arquivo é revogada assim
// que a imagem termina de carregar.

import { janelaDaFoto } from './cardRenderer.js';
import { icon } from '../ui/icons.js';

const ZOOM_MIN = 1;
const ZOOM_MAX = 4;
const LARGURA_VISOR = 200;

function html({ forma, aspecto, temFoto, zoom }) {
  const alturaVisor = Math.round(LARGURA_VISOR / aspecto);
  const mascara =
    forma === 'circulo'
      ? 'radial-gradient(circle at center, transparent 0, transparent 49.5%, rgba(15,23,42,0.55) 50%)'
      : 'none';
  return `
    <div data-foto-editor class="flex flex-col items-center gap-2.5">
      <div class="relative overflow-hidden rounded-xl border-2 border-slate-200 bg-slate-100 ${temFoto ? 'cursor-grab' : ''}"
        style="width:${LARGURA_VISOR}px;height:${alturaVisor}px">
        <canvas data-visor width="${LARGURA_VISOR}" height="${alturaVisor}" class="block touch-none"></canvas>
        <div class="pointer-events-none absolute inset-0" style="background:${temFoto ? mascara : 'none'}"></div>
        ${
          temFoto
            ? ''
            : `<div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1 text-slate-400">
                ${icon('camera', { size: 26 })}
                <span class="text-[11px] font-semibold">Sem foto</span>
              </div>`
        }
      </div>
      <input type="file" accept="image/*" data-arquivo class="sr-only" />
      <div class="flex items-center gap-2">
        <button type="button" data-escolher
          class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-brand-deep transition-colors hover:border-brand-blue">
          ${icon('camera', { size: 14 })} ${temFoto ? 'Trocar foto' : 'Escolher foto'}
        </button>
        ${
          temFoto
            ? `<button type="button" data-remover aria-label="Remover foto"
                class="inline-flex items-center rounded-lg border border-slate-200 bg-white p-1.5 text-slate-400 transition-colors hover:border-brand-coral hover:text-brand-coral">
                ${icon('trash', { size: 14 })}
              </button>`
            : ''
        }
      </div>
      <label class="flex w-full items-center gap-2 text-[11px] font-semibold text-slate-500 ${temFoto ? '' : 'opacity-40'}">
        Zoom
        <input type="range" data-zoom min="${ZOOM_MIN}" max="${ZOOM_MAX}" step="0.05" value="${zoom}" ${temFoto ? '' : 'disabled'}
          class="w-full accent-brand-blue" />
      </label>
      <p class="text-center text-[11px] leading-snug text-slate-400">${
        temFoto ? 'Arraste para enquadrar · role para dar zoom' : 'JPG ou PNG. Fica só neste navegador, até fechar a página.'
      }</p>
    </div>
  `;
}

function carregarImagem(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Não foi possível ler a imagem.'));
    };
    img.src = url;
  });
}

/**
 * Monta o editor dentro de `container`.
 *
 * @param {HTMLElement} container
 * @param {object} opts
 * @param {'circulo'|'quadrado'} opts.forma
 * @param {number} opts.aspecto - largura/altura da moldura na arte
 * @param {() => object|null} opts.getFoto - foto atual do colaborador
 * @param {(foto: object|null) => void} opts.setFoto - grava a foto (ou remove)
 * @param {() => void} opts.onChange - avisa que o enquadramento mudou
 */
export function montarEditorFoto(container, { forma, aspecto, getFoto, setFoto, onChange }) {
  const render = () => {
    const foto = getFoto();
    container.innerHTML = html({ forma, aspecto, temFoto: Boolean(foto?.img), zoom: foto?.zoom || 1 });
    const visor = container.querySelector('[data-visor]');
    const arquivo = container.querySelector('[data-arquivo]');
    const zoomInput = container.querySelector('[data-zoom]');
    const ctx = visor.getContext('2d');

    const pintar = () => {
      const f = getFoto();
      ctx.clearRect(0, 0, visor.width, visor.height);
      if (!f?.img) return;
      const j = janelaDaFoto(f, aspecto);
      ctx.drawImage(f.img, j.x, j.y, j.w, j.h, 0, 0, visor.width, visor.height);
    };

    container.querySelector('[data-escolher]').addEventListener('click', () => arquivo.click());
    arquivo.addEventListener('change', async () => {
      const file = arquivo.files?.[0];
      if (!file) return;
      try {
        const img = await carregarImagem(file);
        setFoto({ img, zoom: 1, cx: 0.5, cy: 0.5 });
        render();
        onChange();
      } catch (err) {
        console.error(err);
      }
    });

    container.querySelector('[data-remover]')?.addEventListener('click', () => {
      setFoto(null);
      render();
      onChange();
    });

    // O zoom é sempre em torno do centro do enquadramento: para foto de rosto
    // é o que se espera, e dispensa a matemática de zoom no ponto do cursor.
    const aplicarZoom = (novo) => {
      const f = getFoto();
      if (!f?.img) return;
      f.zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, novo));
      zoomInput.value = String(f.zoom);
      pintar();
      onChange();
    };

    zoomInput.addEventListener('input', () => aplicarZoom(Number(zoomInput.value)));
    visor.addEventListener('wheel', (e) => {
      if (!getFoto()?.img) return;
      e.preventDefault();
      aplicarZoom((getFoto().zoom || 1) * (e.deltaY < 0 ? 1.1 : 1 / 1.1));
    }, { passive: false });

    // Arrastar: Pointer Events cobrem mouse, toque e caneta com um código só.
    let arraste = null;
    visor.addEventListener('pointerdown', (e) => {
      const f = getFoto();
      if (!f?.img) return;
      visor.setPointerCapture(e.pointerId);
      arraste = { x: e.clientX, y: e.clientY, cx: f.cx, cy: f.cy };
      visor.parentElement.classList.add('cursor-grabbing');
    });
    visor.addEventListener('pointermove', (e) => {
      const f = getFoto();
      if (!arraste || !f?.img) return;
      const j = janelaDaFoto(f, aspecto);
      // Quantos pixels da imagem cada pixel do visor representa.
      const escala = j.w / visor.width;
      const largura = f.img.naturalWidth || f.img.width;
      const altura = f.img.naturalHeight || f.img.height;
      f.cx = arraste.cx - ((e.clientX - arraste.x) * escala) / largura;
      f.cy = arraste.cy - ((e.clientY - arraste.y) * escala) / altura;
      // Recentra dentro do que a janela permite (a foto nunca mostra borda).
      const jj = janelaDaFoto(f, aspecto);
      f.cx = (jj.x + jj.w / 2) / largura;
      f.cy = (jj.y + jj.h / 2) / altura;
      pintar();
      onChange();
    });
    const soltar = () => {
      arraste = null;
      visor.parentElement.classList.remove('cursor-grabbing');
    };
    visor.addEventListener('pointerup', soltar);
    visor.addEventListener('pointercancel', soltar);

    pintar();
  };

  render();
}
