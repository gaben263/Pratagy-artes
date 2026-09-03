// Exportação da placa renderizada em Canvas para PNG (blob nativo) e PDF (jsPDF).

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
