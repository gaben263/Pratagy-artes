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
// miniatura em .../thumbs/<id>.jpg, a foto grande em .../retratos/<id>.jpg,
// uma linha abaixo e o enquadramento em RETRATO (a ordem na tela é
// alfabética, não a desta lista).
//
// Bruna, Iara, Julia e Maria Clara entraram depois, da pasta de trabalho
// "BFP 2026 - COMEMORAÇÃO VENDEDORES/fotos" (que hoje tem todos os
// colaboradores), convertidas e enquadradas do mesmo jeito.

const PASTA = 'assets/images/blackfriday/bottons';
const PASTA_RETRATO = 'assets/images/blackfriday/retratos';

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
  c('bruna', 'Bruna', { zoom: 1.628, cx: 0.4481, cy: 0.4252 }),
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
  c('iara', 'Iara', { zoom: 1.124, cx: 0.4496, cy: 0.461 }),
  c('italo-alves', 'Italo Alves', { zoom: 1, cx: 0.4765, cy: 0.4447 }),
  c('jonney-carvalho', 'Jonney Carvalho', { zoom: 1.716, cx: 0.5205, cy: 0.4613 }),
  c('jose-lima', 'José Lima', { zoom: 1.905, cx: 0.4755, cy: 0.4197 }),
  c('joao-braz', 'João Braz', { zoom: 1.627, cx: 0.479, cy: 0.3628 }),
  c('joao-lucas-menezes', 'João Lucas Menezes', { zoom: 1.351, cx: 0.4641, cy: 0.2966 }),
  c('julia', 'Julia', { zoom: 1.044, cx: 0.4807, cy: 0.3982 }),
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
  // Nome composto: a sugestão é o nome inteiro, não só "Maria".
  c('maria-clara', 'Maria Clara', { zoom: 1.044, cx: 0.4511, cy: 0.4071 }, 'Maria Clara'),
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

// RETRATO (moldura A4, js/blackfriday/retrato.js): a mesma pessoa, com a foto
// grande de retratos/ (lado menor em até 1800 px; o furo da moldura tem
// 1882×2580 px a 300 DPI, e a de 1000 px do botton sairia mole no papel) e um
// enquadramento próprio, no aspecto do furo (0,729). Rosto detectado como no
// botton, janela de 5,2× a altura do rosto — meio corpo, como as fotos foram
// tiradas —, rosto a 34% do topo da janela: abaixo do selo e da polaroid, que
// cobrem o alto do furo, e longe da pílula do nome, que cobre o pé. Zoom 1 em
// quem já veio enquadrado justo. Rebeca Santos (folhagem) e os dois times
// (fotos de grupo) foram ajustados à mão.
const RETRATO = {
  'bernardo-amorim': { zoom: 1, cx: 0.5129, cy: 0.3379 },
  'bruna': { zoom: 1.21, cx: 0.4481, cy: 0.4828 },
  'bruno-carvalho': { zoom: 1, cx: 0.52, cy: 0.5441 },
  'carol-castro': { zoom: 1, cx: 0.4881, cy: 0.6697 },
  'clara-lyra': { zoom: 1, cx: 0.4744, cy: 0.5474 },
  'cuca-deri': { zoom: 1, cx: 0.49, cy: 0.6658 },
  'daniel-alves': { zoom: 1, cx: 0.4459, cy: 0.5419 },
  'danilo-stacciarini': { zoom: 1, cx: 0.4459, cy: 0.5159 },
  'denise-helena': { zoom: 1, cx: 0.4454, cy: 0.4912 },
  'enrique-bertini': { zoom: 1, cx: 0.5178, cy: 0.6023 },
  'ericka-marques': { zoom: 1.273, cx: 0.4963, cy: 0.4679 },
  'erivaldo-inacio': { zoom: 1, cx: 0.4444, cy: 0.4968 },
  'gabriel-nascimento': { zoom: 1.018, cx: 0.4889, cy: 0.5616 },
  'gabriela-santos': { zoom: 1, cx: 0.4733, cy: 0.5494 },
  'gabryell-jatoba': { zoom: 1, cx: 0.5007, cy: 0.5042 },
  'gemilla-almeida': { zoom: 1.254, cx: 0.4756, cy: 0.5087 },
  'gleydson-silva': { zoom: 1, cx: 0.4811, cy: 0.4481 },
  'gustavo-hendrick': { zoom: 1, cx: 0.4688, cy: 0.5159 },
  'henrique-cecilio': { zoom: 1.236, cx: 0.4904, cy: 0.565 },
  'iara': { zoom: 1, cx: 0.4496, cy: 0.5441 },
  'italo-alves': { zoom: 1, cx: 0.477, cy: 0.5441 },
  'joao-braz': { zoom: 1.177, cx: 0.4793, cy: 0.4242 },
  'joao-lucas-menezes': { zoom: 1, cx: 0.4667, cy: 0.3686 },
  'jonney-carvalho': { zoom: 1.292, cx: 0.5185, cy: 0.5161 },
  'jose-lima': { zoom: 1.396, cx: 0.4726, cy: 0.4702 },
  'julia': { zoom: 1, cx: 0.4807, cy: 0.4878 },
  'laura-calheiros': { zoom: 1.082, cx: 0.4563, cy: 0.5524 },
  'lavynnia-santos': { zoom: 1.227, cx: 0.4837, cy: 0.5142 },
  'leonardo-vinicius': { zoom: 1.095, cx: 0.5289, cy: 0.4472 },
  'luciano-bernardo': { zoom: 1.109, cx: 0.5141, cy: 0.5198 },
  'luix-santos': { zoom: 1, cx: 0.4828, cy: 0.349 },
  'luiz-matarazzo': { zoom: 1.352, cx: 0.4474, cy: 0.4561 },
  'macielle-cristovao': { zoom: 1.374, cx: 0.4667, cy: 0.4898 },
  'maira-biasucci': { zoom: 1, cx: 0.5, cy: 0.4158 },
  'manuela-falibene': { zoom: 1, cx: 0.5567, cy: 0.7148 },
  'marcos-rocha': { zoom: 1.086, cx: 0.5672, cy: 0.5409 },
  'maria-clara': { zoom: 1, cx: 0.4511, cy: 0.4967 },
  'maria-elizabete': { zoom: 1, cx: 0.5244, cy: 0.5767 },
  'mario-guedes': { zoom: 1.109, cx: 0.5185, cy: 0.6053 },
  'mario-silva': { zoom: 1, cx: 0.46, cy: 0.4623 },
  'mayrla-leite': { zoom: 1, cx: 0.4963, cy: 0.4753 },
  'nayara-ferrer': { zoom: 1.166, cx: 0.525, cy: 0.3948 },
  'nayara-nataly': { zoom: 1.311, cx: 0.4563, cy: 0.4276 },
  'nida-souza': { zoom: 1, cx: 0.443, cy: 0.5245 },
  'patrik-dos-santos': { zoom: 1, cx: 0.5074, cy: 0.5582 },
  'priscilla-felix': { zoom: 1, cx: 0.5356, cy: 0.5119 },
  'rebeca-santos': { zoom: 1.05, cx: 0.48, cy: 0.45 },
  'renata-lira': { zoom: 1, cx: 0.4674, cy: 0.514 },
  'rodrigo-montenegro': { zoom: 1, cx: 0.5479, cy: 0.4364 },
  'rodrigo-silva': { zoom: 1, cx: 0.4938, cy: 0.4797 },
  'sarah-elias': { zoom: 1.036, cx: 0.4861, cy: 0.4549 },
  'shay-leite': { zoom: 1, cx: 0.565, cy: 0.6863 },
  'simone-dos-santos': { zoom: 1.117, cx: 0.5193, cy: 0.5372 },
  'talita-peixoto': { zoom: 1.006, cx: 0.4711, cy: 0.5034 },
  'tayna-peixoto': { zoom: 1.254, cx: 0.5363, cy: 0.5998 },
  'thales-athalimar': { zoom: 1.182, cx: 0.5311, cy: 0.4339 },
  'time-b2b': { zoom: 1, cx: 0.5, cy: 0.5 },
  'time-my-pratagy': { zoom: 1, cx: 0.5, cy: 0.5 },
  'veronica-bulamah': { zoom: 1.282, cx: 0.5, cy: 0.5642 },
  'victoria-ferreira': { zoom: 1.366, cx: 0.5092, cy: 0.4965 },
  'wagner-franca': { zoom: 1, cx: 0.4867, cy: 0.6349 },
  'wagner-mendonca': { zoom: 1, cx: 0.585, cy: 0.5031 },
  'yuri-evangelista': { zoom: 1, cx: 0.477, cy: 0.4567 },
};

export const COLABORADORES_RETRATO = COLABORADORES_BOTTON.map((p) => ({
  ...p,
  foto: `${PASTA_RETRATO}/${p.id}.jpg`,
  enquadramento: RETRATO[p.id] || { zoom: 1, cx: 0.5, cy: 0.5 },
}));

/** Primeiro nome — o que o botton sugere por padrão; a tela deixa editar. */
function primeiroNome(nome) {
  return (nome || '').trim().split(/\s+/)[0] || '';
}
