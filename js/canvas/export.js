// Exportação da arte renderizada em Canvas para PNG (blob nativo) e PDF (jsPDF).

import { slugify } from '../utils.js';

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Falha ao gerar imagem PNG.'));
    }, 'image/png');
  });
}

export async function exportPNG(canvas, nomeArquivo) {
  const blob = await canvasToBlob(canvas);
  triggerDownload(blob, `${slugify(nomeArquivo)}.png`);
}

/**
 * Exporta o canvas como PDF, com a imagem ocupando 100% da página no
 * tamanho físico real do formato (mmLargura x mmAltura), sem bordas.
 */
export async function exportPDF(canvas, formato, nomeArquivo) {
  const { jsPDF } = window.jspdf;
  const { mmLargura, mmAltura } = formato;
  const orientation = mmLargura >= mmAltura ? 'landscape' : 'portrait';

  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format: [mmLargura, mmAltura],
  });

  const dataUrl = canvas.toDataURL('image/png', 1.0);
  pdf.addImage(dataUrl, 'PNG', 0, 0, mmLargura, mmAltura, undefined, 'FAST');
  pdf.save(`${slugify(nomeArquivo)}.pdf`);
}

// ---------------------------------------------------------------------------
// Catálogo de artes prontas
//
// Aqui não há Canvas: o arquivo já existe pronto em assets/catalogo/. O PNG é
// entregue como está (qualidade de impressão preservada) e o PDF é montado no
// navegador em cima dele, no tamanho físico real da peça.
// ---------------------------------------------------------------------------

async function fetchBlob(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Arquivo não encontrado no servidor (${res.status}).`);
  return res.blob();
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo baixado.'));
    reader.readAsDataURL(blob);
  });
}

/** Baixa o PNG original do catálogo, com um nome de arquivo amigável. */
export async function exportCatalogPNG({ arquivo }, nomeArquivo) {
  const blob = await fetchBlob(arquivo);
  triggerDownload(blob, `${slugify(nomeArquivo)}.png`);
}

/**
 * Gera o PDF de um item do catálogo a partir do PNG estático.
 *
 * O caminho preferido embute o PNG direto no PDF (o jsPDF lê o stream
 * comprimido sem passar por Canvas), o que importa porque há peças grandes no
 * catálogo — o regulamento da academia tem 7087×14173 px e rasterizar isso em
 * Canvas estoura o limite de memória do navegador. Se o jsPDF recusar o PNG,
 * tentamos o caminho por Canvas como alternativa.
 */
export async function exportCatalogPDF({ arquivo, mmLargura, mmAltura }, nomeArquivo) {
  const { jsPDF } = window.jspdf;
  const orientation = mmLargura >= mmAltura ? 'landscape' : 'portrait';
  const pdf = new jsPDF({ orientation, unit: 'mm', format: [mmLargura, mmAltura] });

  const dataUrl = await blobToDataUrl(await fetchBlob(arquivo));

  try {
    pdf.addImage(dataUrl, 'PNG', 0, 0, mmLargura, mmAltura, undefined, 'FAST');
  } catch (err) {
    console.warn('Embutir o PNG direto falhou, tentando via Canvas:', err);
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Não foi possível abrir a imagem da arte.'));
      el.src = dataUrl;
    });
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    canvas.getContext('2d').drawImage(img, 0, 0);
    pdf.addImage(canvas.toDataURL('image/png', 1.0), 'PNG', 0, 0, mmLargura, mmAltura, undefined, 'FAST');
  }

  pdf.save(`${slugify(nomeArquivo)}.pdf`);
}
