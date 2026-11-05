// Vendedores da Black Friday 2026: nome, foto e enquadramento inicial.
//
// As fotos vieram da pasta de trabalho "BFP 2026 - COMEMORAÇÃO VENDEDORES/fotos"
// (JPG, PNG e HEIC/HEIF, de 476 a 4855 px). Foram convertidas para JPG com o
// lado menor em até 1000 px — o maior círculo das artes tem 564 px — e nome
// ASCII, como o resto de assets/ (ver README). HEIC não abre no Chrome nem no
// Edge, então a conversão não é opcional. Miniaturas de 160 px em thumbs/.
//
// O nome é o do arquivo original, sem acento inventado: "Erivaldo Inacio" e
// "Italo Alves" estão assim na origem. O card mostra só o primeiro nome por
// padrão; a tela deixa editar ("João Lucas", por exemplo). O Time My Pratagy é
// uma equipe, não uma pessoa: declara o nome completo em `nomeArte`, senão a
// arte sairia só com "TIME".
//
// ENQUADRAMENTO: as fotos são de meio corpo ou corpo inteiro, e o recorte
// central do círculo mostraria o tronco. `enquadramento` é o ponto de partida
// no mesmo modelo do editor de foto do RH ({ zoom, cx, cy }, ver
// `janelaDaFoto`): rosto detectado (OpenCV, Haar frontal), janela de 3,1× a
// altura do rosto, centro 0,28 rosto abaixo dos olhos para entrarem os ombros.
// A detecção errou só na Rebeca Santos (pegou folhagem), ajustada à mão. Quem
// usa o sistema ainda pode arrastar e dar zoom.
//
// Para incluir alguém: JPG em assets/images/blackfriday/vendedores/<id>.jpg,
// miniatura em .../thumbs/<id>.jpg e uma linha abaixo.

const PASTA = 'assets/images/blackfriday/vendedores';

const v = (id, nome, enquadramento, nomeArte = primeiroNome(nome)) => ({
  id,
  nome,
  nomeArte,
  foto: `${PASTA}/${id}.jpg`,
  miniatura: `${PASTA}/thumbs/${id}.jpg`,
  enquadramento,
});

export const VENDEDORES = [
  v('bruno-carvalho', 'Bruno Carvalho', { zoom: 1.037, cx: 0.518, cy: 0.4145 }),
  v('cuca-deri', 'Cuca Deri', { zoom: 1, cx: 0.5, cy: 0.5 }),
  v('denise-helena', 'Denise Helena', { zoom: 1, cx: 0.5, cy: 0.3852 }),
  v('erivaldo-inacio', 'Erivaldo Inacio', { zoom: 1.156, cx: 0.4438, cy: 0.3782 }),
  v('gleydson-silva', 'Gleydson Silva', { zoom: 1.285, cx: 0.4812, cy: 0.389 }),
  v('gustavo-hendrick', 'Gustavo Hendrick', { zoom: 1, cx: 0.5, cy: 0.3444 }),
  v('italo-alves', 'Italo Alves', { zoom: 1, cx: 0.5, cy: 0.3967 }),
  v('joao-lucas-menezes', 'João Lucas Menezes', { zoom: 1.285, cx: 0.4641, cy: 0.2918 }),
  v('jose-lima', 'José Lima', { zoom: 1.792, cx: 0.474, cy: 0.3934 }),
  v('luciano-bernardo', 'Luciano Bernardo', { zoom: 1.421, cx: 0.5115, cy: 0.4224 }),
  v('luix-santos', 'Luix Santos', { zoom: 1.177, cx: 0.482, cy: 0.2835 }),
  v('macielle-cristovao', 'Macielle Cristovão', { zoom: 1.753, cx: 0.466, cy: 0.4122 }),
  v('maira-biasucci', 'Maira Biasucci', { zoom: 1.466, cx: 0.5013, cy: 0.341 }),
  v('manuela-falibene', 'Manuela Falibene', { zoom: 1, cx: 0.5, cy: 0.5468 }),
  v('maria-elizabete', 'Maria Elizabete', { zoom: 1.012, cx: 0.5059, cy: 0.4458 }),
  v('mario-silva', 'Mario Silva', { zoom: 1.114, cx: 0.4573, cy: 0.3366 }),
  v('nayara-nataly', 'Nayara Nataly', { zoom: 1.613, cx: 0.455, cy: 0.3481 }),
  v('patrik-dos-santos', 'Patrik dos Santos', { zoom: 1.182, cx: 0.5055, cy: 0.4381 }),
  v('priscilla-felix', 'Priscilla Felix', { zoom: 1.018, cx: 0.5086, cy: 0.3933 }),
  v('rebeca-santos', 'Rebeca Santos', { zoom: 1.5, cx: 0.48, cy: 0.34 }),
  v('renata-lira', 'Renata Lira', { zoom: 1, cx: 0.5, cy: 0.3751 }),
  v('rodrigo-montenegro', 'Rodrigo Montenegro', { zoom: 1.089, cx: 0.5408, cy: 0.3253 }),
  v('simone-dos-santos', 'Simone dos Santos', { zoom: 1.415, cx: 0.52, cy: 0.4432 }),
  v('time-my-pratagy', 'Time My Pratagy', { zoom: 1.15, cx: 0.518, cy: 0.495 }, 'Time My Pratagy'),
  v('veronica-bulamah', 'Veronica Bulamah', { zoom: 1.605, cx: 0.5025, cy: 0.4815 }),
  v('victoria-ferreira', 'Victória Ferreira', { zoom: 1, cx: 0.5, cy: 0.444 }),
  v('wagner-mendonca', 'Wagner Mendonça', { zoom: 1.051, cx: 0.5242, cy: 0.3883 }),
];

export function getVendedor(id) {
  return VENDEDORES.find((p) => p.id === id) || null;
}

/** Primeiro nome — o que o card mostra por padrão, como nas referências ("ITALO"). */
function primeiroNome(nome) {
  return (nome || '').trim().split(/\s+/)[0] || '';
}
