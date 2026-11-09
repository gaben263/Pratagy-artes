// Colaboradores com foto para os bottons da Black Friday 2026.
//
// As fotos vieram da pasta de trabalho Bottons-black/fotos (JPG, PNG e
// HEIC/HEIF). Foram convertidas como as dos vendedores (ver vendedores.js):
// JPG com o lado menor em até 1000 px, nome ASCII, miniatura de 160 px em
// thumbs/ já recortada no rosto. HEIC não abre no Chrome nem no Edge.
//
// É uma lista à parte da dos vendedores: o botton é de qualquer colaborador da
// campanha, não só de quem vende, e as duas pastas de origem não coincidem.
//
// ENQUADRAMENTO: mesmo modelo do editor de foto ({ zoom, cx, cy }, ver
// `janelaDaFoto`, aspecto 1). Rosto detectado (OpenCV, Haar frontal), janela de
// 2,9× a altura do rosto — mais justa que a dos cards, porque o furo do botton
// tem 33 mm —, centro 0,47 rosto abaixo do meio do rosto: o rosto sobe para a
// metade de cima do furo, acima da pílula do nome. A detecção errou na Rebeca
// Santos (folhagem) e não se aplica aos dois times: esses três usam o
// enquadramento já ajustado à mão nos vendedores.
//
// Para incluir alguém: JPG em assets/images/blackfriday/bottons/<id>.jpg,
// miniatura em .../thumbs/<id>.jpg e uma linha abaixo (a ordem na tela é
// alfabética, não a desta lista).

const PASTA = 'assets/images/blackfriday/bottons';

const c = (id, nome, enquadramento, nomeArte = primeiroNome(nome)) => ({
  id,
  nome,
  nomeArte,
  foto: `${PASTA}/${id}.jpg`,
  miniatura: `${PASTA}/thumbs/${id}.jpg`,
  enquadramento,
});

export const COLABORADORES_BOTTON = [
  c('bernardo-amorim', 'Bernardo Amorim', { zoom: 1.183, cx: 0.5158, cy: 0.266 }),
  c('bruno-carvalho', 'Bruno Carvalho', { zoom: 1.091, cx: 0.518, cy: 0.4618 }),
  c('carol-castro', 'Carol Castro', { zoom: 1, cx: 0.4835, cy: 0.5777 }),
  c('clara-lyra', 'Clara Lyra', { zoom: 1.254, cx: 0.4735, cy: 0.4467 }),
  c('cuca-deri', 'Cuca Deri', { zoom: 1, cx: 0.4872, cy: 0.5362 }),
  c('daniel-alves', 'Daniel Alves', { zoom: 1.258, cx: 0.443, cy: 0.4612 }),
  c('danilo-stacciarini', 'Danilo Stacciarini', { zoom: 1, cx: 0.4479, cy: 0.4169 }),
  c('denise-helena', 'Denise Helena', { zoom: 1, cx: 0.4444, cy: 0.422 }),
  c('enrique-bertini', 'Enrique Bertini', { zoom: 1.084, cx: 0.517, cy: 0.5188 }),
  c('erivaldo-inacio', 'Erivaldo Inacio', { zoom: 1.263, cx: 0.4448, cy: 0.4142 }),
  c('gabriel-nascimento', 'Gabriel Nascimento', { zoom: 1.363, cx: 0.4925, cy: 0.4924 }),
  c('gabriela-santos', 'Gabriela Santos', { zoom: 1.306, cx: 0.476, cy: 0.4832 }),
  c('gabryell-jatoba', 'Gabryell Jatobá', { zoom: 1.321, cx: 0.5055, cy: 0.4285 }),
  c('gemilla-almeida', 'Gemilla Almeida', { zoom: 1.658, cx: 0.474, cy: 0.4552 }),
  c('gleydson-silva', 'Gleydson Silva', { zoom: 1.368, cx: 0.4816, cy: 0.3544 }),
  c('gustavo-hendrick', 'Gustavo Hendrick', { zoom: 1, cx: 0.4652, cy: 0.3727 }),
  c('henrique-cecilio', 'Henrique Cecilio', { zoom: 1.672, cx: 0.4938, cy: 0.5079 }),
  c('italo-alves', 'Italo Alves', { zoom: 1, cx: 0.4765, cy: 0.4447 }),
  c('jonney-carvalho', 'Jonney Carvalho', { zoom: 1.716, cx: 0.5205, cy: 0.4613 }),
  c('jose-lima', 'José Lima', { zoom: 1.905, cx: 0.4755, cy: 0.4197 }),
  c('joao-braz', 'João Braz', { zoom: 1.627, cx: 0.479, cy: 0.3628 }),
  c('joao-lucas-menezes', 'João Lucas Menezes', { zoom: 1.351, cx: 0.4641, cy: 0.2966 }),
  c('laura-calheiros', 'Laura Calheiros', { zoom: 1.449, cx: 0.457, cy: 0.489 }),
  c('lavynnia-santos', 'Lavynnia Santos', { zoom: 1.611, cx: 0.489, cy: 0.458 }),
  c('leonardo-vinicius', 'Leonardo Vinicius', { zoom: 1.506, cx: 0.5285, cy: 0.3826 }),
  c('luciano-bernardo', 'Luciano Bernardo', { zoom: 1.506, cx: 0.5105, cy: 0.4554 }),
  c('luix-santos', 'Luix Santos', { zoom: 1.245, cx: 0.4835, cy: 0.2828 }),
  c('luiz-matarazzo', 'Luiz Matarazzo', { zoom: 1.864, cx: 0.4475, cy: 0.4024 }),
  c('macielle-cristovao', 'Macielle Cristovão', { zoom: 1.884, cx: 0.4685, cy: 0.437 }),
  c('maira-biasucci', 'Maira Biasucci', { zoom: 1.575, cx: 0.5017, cy: 0.3424 }),
  c('manuela-falibene', 'Manuela Falibene', { zoom: 1, cx: 0.5578, cy: 0.5989 }),
  c('marcos-rocha', 'Marcos Rocha', { zoom: 1.455, cx: 0.5655, cy: 0.4784 }),
  c('maria-elizabete', 'Maria Elizabete', { zoom: 1.089, cx: 0.526, cy: 0.4906 }),
  c('mario-guedes', 'Mario Guedes', { zoom: 1.461, cx: 0.52, cy: 0.5439 }),
  c('mario-silva', 'Mario Silva', { zoom: 1.182, cx: 0.4625, cy: 0.3755 }),
  c('mayrla-leite', 'Mayrla Leite', { zoom: 1.161, cx: 0.4965, cy: 0.3977 }),
  c('nayara-ferrer', 'Nayara Férrer', { zoom: 2.053, cx: 0.524, cy: 0.337 }),
  c('nayara-nataly', 'Nayara Nataly', { zoom: 1.759, cx: 0.455, cy: 0.3745 }),
  c('nida-souza', 'Nida Souza', { zoom: 1.109, cx: 0.4415, cy: 0.4401 }),
  c('patrik-dos-santos', 'Patrik dos Santos', { zoom: 1.236, cx: 0.5045, cy: 0.4798 }),
  c('priscilla-felix', 'Priscilla Felix', { zoom: 1.084, cx: 0.528, cy: 0.4363 }),
  c('rebeca-santos', 'Rebeca Santos', { zoom: 1.5, cx: 0.48, cy: 0.34 }),
  c('renata-lira', 'Renata Lira', { zoom: 1, cx: 0.465, cy: 0.392 }),
  c('rodrigo-montenegro', 'Rodrigo Montenegro', { zoom: 1.192, cx: 0.5451, cy: 0.3591 }),
  c('rodrigo-silva', 'Rodrigo Silva', { zoom: 1, cx: 0.4978, cy: 0.3901 }),
  c('sarah-elias', 'Sarah Elias', { zoom: 1.425, cx: 0.485, cy: 0.3891 }),
  c('shay-leite', 'Shay Leite', { zoom: 1.589, cx: 0.5383, cy: 0.3945 }),
  c('simone-dos-santos', 'Simone dos Santos', { zoom: 1.48, cx: 0.5235, cy: 0.4771 }),
  c('talita-peixoto', 'Talita Peixoto', { zoom: 1.368, cx: 0.471, cy: 0.434 }),
  c('tayna-peixoto', 'Tayna Peixoto', { zoom: 1.724, cx: 0.535, cy: 0.5431 }),
  c('thales-athalimar', 'Thales Athalimar', { zoom: 1.526, cx: 0.532, cy: 0.3804 }),
  c('time-b2b', 'Time B2B', { zoom: 1, cx: 0.5, cy: 0.51 }, 'Time B2B'),
  c('time-my-pratagy', 'Time My Pratagy', { zoom: 1.15, cx: 0.518, cy: 0.495 }, 'Time My Pratagy'),
  c('veronica-bulamah', 'Veronica Bulamah', { zoom: 1.742, cx: 0.502, cy: 0.5094 }),
  c('victoria-ferreira', 'Victória Ferreira', { zoom: 1.787, cx: 0.5075, cy: 0.4471 }),
  c('wagner-franca', 'Wagner França', { zoom: 1.025, cx: 0.4911, cy: 0.5471 }),
  c('wagner-mendonca', 'Wagner Mendonça', { zoom: 1.116, cx: 0.5805, cy: 0.4272 }),
  c('yuri-evangelista', 'Yuri Evangelista', { zoom: 1.146, cx: 0.4765, cy: 0.384 }),
  c('ericka-marques', 'Éricka Marques', { zoom: 1.724, cx: 0.495, cy: 0.4126 }),
].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

/** Primeiro nome — o que o botton sugere por padrão; a tela deixa editar. */
function primeiroNome(nome) {
  return (nome || '').trim().split(/\s+/)[0] || '';
}
