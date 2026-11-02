// Programação de lazer do mês, em campos editáveis.
//
// PROGRAMACAO_PUBLICADA é a versão oficial (a mesma das peças prontas do
// catálogo). O que o usuário edita vira um rascunho salvo só neste navegador
// (localStorage). Para levar a edição a outro computador ou a um colega, o
// editor baixa/abre um "arquivo de programação" (.json) com este mesmo formato.
//
// Para virar o mês: atualize este objeto junto com as peças do catálogo e
// troque VERSAO (o rascunho antigo de quem editou o mês passado é descartado).

export const VERSAO = '2026-11-b';
const CHAVE = 'pratagy-lazer-programacao';

const TP = 'Tablado próximo ao teatro';
const PG = 'Área do playground';
const GM = 'Gramado multicultural';
const A = (hora, atividade, local = '') => ({ hora, atividade, local });

export const PROGRAMACAO_PUBLICADA = {
  versao: VERSAO,
  mes: 'Novembro',
  selo: null, // null = selo padrão do mês (assets/lazer/icones/selo-novembro.png)

  teatral: {
    linhas: [
      { dia: 'Terça-feira', datas: '3, 17 e 24', atracao: 'Frozen', complemento: 'Uma aventura congelante', horario: '20h00', local: 'No teatro', destaque: true },
      { dia: 'Quarta-feira', datas: '4 e 18', atracao: 'Show Udara', complemento: 'Dança afro-brasileira', horario: '21h00', local: 'No teatro', destaque: false },
      { dia: 'Quarta-feira', datas: '25', atracao: 'Show Samba', complemento: '', horario: '21h00', local: 'No teatro', destaque: false },
      { dia: 'Quinta-feira', datas: '', atracao: 'Show Nordeste', complemento: '', horario: '21h00', local: 'No teatro', destaque: false },
      { dia: 'Sexta-feira', datas: '13 e 27', atracao: 'Show Fadas e Duendes', complemento: '', horario: '20h00', local: 'No teatro', destaque: false },
      { dia: 'Sexta-feira', datas: '6 e 20', atracao: 'Xou da Xôxa', complemento: '', horario: '20h00', local: 'No teatro', destaque: false },
      { dia: 'Sábado', datas: '', atracao: 'Tributo a Michael Jackson', complemento: '', horario: '21h00', local: 'No teatro', destaque: false },
      { dia: 'Domingo', datas: '', atracao: 'Cine Pratagy', complemento: 'Hotel Transilvânia 4', horario: '19h30', local: 'No teatro', destaque: false },
    ],
    nota: 'Às segundas-feiras não há espetáculo no teatro.',
  },

  // Entram na Programação Completa junto com os Shows Teatrais (em ordem de dia e
  // horário). Uma atração que já está nos Shows Teatrais não é repetida.
  outras: {
    linhas: [
      { dia: 'Terça-feira', datas: '17 e 24', atracao: 'Aula de Alongamento', complemento: '', horario: '07h00', local: 'No tablado em frente à academia' },
      { dia: 'Sexta-feira', datas: '20', atracao: 'Sunset Pratagy', complemento: 'Voz e violão com Well Filho', horario: '16h30 às 17h45', local: 'Na praia' },
      { dia: 'Sábado', datas: '21', atracao: 'Dance Party Pratagy', complemento: 'Com a equipe Peixe-Boi', horario: '16h00', local: 'Na piscina' },
      { dia: 'Domingo', datas: '8, 15 e 22', atracao: 'Bingo', complemento: '', horario: '17h00', local: 'Na área da piscina' },
    ],
  },

  musica: {
    horario: 'Todos os dias das 20h às 22h30',
    local: 'Bar da Piscina',
    dias: [
      { dia: 'Segunda', estilo: 'MPB' },
      { dia: 'Terça', estilo: 'Samba com H3Samba' },
      { dia: 'Quarta', estilo: 'Sertanejo com Jonas Melo' },
      { dia: 'Quinta', estilo: 'Samba e pagode' },
      { dia: 'Sexta', estilo: 'Forró com Manu Paes' },
      { dia: 'Sábado', estilo: 'Axé e piseiro' },
      { dia: 'Domingo', estilo: 'Eclético com Kleber Kanto' },
    ],
  },

  piscina: {
    todosOsDias: [A('10h15', 'Alongamento'), A('10h30', 'Momento esporte'), A('11h30', 'Hidro recreativa'), A('14h30', 'Jogos e desafios')],
    blocos: [
      { quando: 'Segundas e quartas', hora: '16h15', atividade: 'Hidro recreativa' },
      { quando: 'Demais dias', hora: '16h00', atividade: 'Aula de dança' },
    ],
  },

  fitness: {
    blocos: [
      { dia: 'Segunda-feira', datas: '9 e 23', atividades: [A('16h30', 'Aula de Aeróbico')], local: 'Tablado próximo à academia' },
      { dia: 'Terça-feira', datas: '17 e 24', atividades: [A('07h00', 'Aula de Alongamento')], local: 'Tablado em frente à academia' },
      { dia: 'Quinta-feira', datas: '', atividades: [A('16h15', 'Aula de Ritmos (dia 5)'), A('16h15', 'Aula de Step (dias 19 e 26)')], local: 'Gramado Multicultural' },
      { dia: 'Sexta-feira', datas: '', atividades: [A('09h15', 'Aula de GAP')], local: 'Gramado' },
      { dia: 'Sábado', datas: '', atividades: [A('07h00', 'Funcional')], local: 'Praia' },
    ],
  },

  step: {
    titulo: 'Aula de Step',
    quando: 'Quinta-feira, dias 19 e 26',
    hora: '16h15',
    local: 'Gramado Multicultural',
    aviso: 'Nestes dias não haverá atividade na piscina à tarde',
  },

  bingo: { quando: 'Domingos 8, 15 e 22 de Novembro', hora: '17H', local: 'Área da Piscina' },

  cine: { poster: null, enquadramento: { zoom: 1, cx: 0.5, cy: 0.5 }, dia: 'Domingo', hora: '19H30', local: 'Teatro Pratagy' },

  xuxa: { quando: 'Sextas 6 e 20 de Novembro', hora: '20H', local: 'Teatro' },
  samba: { quando: 'Quarta-Feira, 25 de Novembro', hora: 'às 21h00', local: 'Teatro' },
  nordeste: { quando: 'Toda quinta-feira', hora: 'às 21h00', local: 'Teatro' },

  infantil712: {
    dias: {
      'Segunda-feira': [A('10:00', 'Resgate de brincadeiras', 'Praia'), A('10:30', 'Momento hidratação', 'Teatro'), A('10:50', 'Atividades molhadas', 'Resort'), A('12:00', 'Almoço coletivo com os tios', 'Restaurante'), A('14:00', 'Momento desportivo', PG), A('15:00', 'Basquete', 'Área kids'), A('15:30', 'Momento hidratação', TP), A('16:00', 'Vôlei Xiga', 'Área kids'), A('17:30', 'Hora do banho'), A('19:00', 'Jantar do colorido'), A('19:50', 'Batalha musical')],
      'Terça-feira': [A('10:00', 'Funcional kids', 'Praia'), A('10:30', 'Momento hidratação', 'Teatro'), A('10:50', 'Vamos ao Acqua Park'), A('12:00', 'Almoço coletivo com os tios', 'Restaurante'), A('14:00', 'Momento diversão', PG), A('15:00', 'Circuito animado', PG), A('15:30', 'Momento hidratação', TP), A('16:00', 'Caça ao autógrafo'), A('17:30', 'Hora do banho')],
      'Quarta-feira': [A('10:00', 'Corrida de revezamento', 'Praia'), A('10:30', 'Momento hidratação', 'Teatro'), A('10:50', 'Vamos ao Acqua Park'), A('12:00', 'Almoço coletivo com os tios', 'Restaurante'), A('14:00', 'Jogo do arremesso', PG), A('15:00', 'Bexiga maluca', 'Área kids'), A('15:30', 'Momento hidratação', TP), A('16:00', 'Momento radical'), A('17:30', 'Hora do banho'), A('19:00', 'Jantar do chapéu'), A('19:50', 'Resgate de brincadeiras', GM)],
      'Quinta-feira': [A('10:00', 'Gincana das cores', 'Praia'), A('10:30', 'Momento hidratação', 'Teatro'), A('10:50', 'Vamos ao Acqua Park'), A('12:00', 'Almoço coletivo com os tios', 'Restaurante'), A('14:00', 'Brincadeiras com balões', 'Área kids'), A('15:00', 'Quiz de perguntas e respostas'), A('15:30', 'Momento hidratação', TP), A('16:00', 'Resgate de brincadeiras', 'Área kids'), A('17:30', 'Hora do banho'), A('19:00', 'Jantar dos heróis', 'Restaurante'), A('19:50', 'Avance o cone', GM)],
      'Sexta-feira': [A('10:00', 'Pique-bandeirinha'), A('10:30', 'Momento hidratação', 'Teatro'), A('10:50', 'Vamos ao Acqua Park'), A('12:00', 'Almoço coletivo com os tios', 'Restaurante'), A('14:00', 'Quem sou eu?', 'Área kids'), A('15:00', 'Campo minado', PG), A('15:30', 'Momento hidratação', TP), A('16:00', 'Voleiçol'), A('17:30', 'Hora do banho')],
      'Sábado': [A('10:00', 'Corrida de balões', 'Praia'), A('10:30', 'Momento hidratação', 'Teatro'), A('10:50', 'Vamos ao Acqua Park'), A('12:00', 'Almoço coletivo com os tios', 'Restaurante'), A('14:00', 'Jokenpô', PG), A('15:00', 'Caça ao tesouro', 'Pelo resort'), A('15:30', 'Momento hidratação', TP), A('16:00', 'Gira o cone em equipe'), A('17:30', 'Hora do banho'), A('19:00', 'Jantar do encantado', 'Restaurante'), A('19:50', 'Jogos cooperativos', GM)],
      'Domingo': [A('10:15', 'Torta na cara', PG), A('10:30', 'Momento hidratação', 'Teatro'), A('10:50', 'Vamos ao Acqua Park'), A('12:00', 'Almoço coletivo com os tios', 'Restaurante'), A('14:00', 'Hora da diversão', PG), A('15:00', 'Jogo do arremesso'), A('16:00', 'Proteja sua torre', PG), A('17:30', 'Hora do banho'), A('19:30', 'Cineminha kids', 'Teatro')],
    },
  },

  infantil46: {
    dias: {
      'Segunda-feira': [A('10:00', 'Resgate de brincadeiras', 'Praia'), A('10:30', 'Momento hidratação', 'Teatro'), A('11:00', 'Atividades aquáticas', 'Resort'), A('12:00', 'Almoço coletivo com os tios', 'Restaurante'), A('14:00', 'Momento integração', 'Área kids'), A('15:00', 'Brincando no parquinho', 'Área kids'), A('15:30', 'Momento hidratação', TP), A('16:00', 'Caça ao tesouro da natureza'), A('17:30', 'Hora do banho'), A('19:00', 'Jantar do colorido', 'Restaurante'), A('19:50', 'Batalha musical', 'Teatro')],
      'Terça-feira': [A('10:00', 'Funcional kids', 'Praia'), A('10:30', 'Momento hidratação', 'Teatro'), A('10:50', 'Vamos ao Acqua Park'), A('12:00', 'Almoço coletivo com os tios', 'Restaurante'), A('14:00', 'Interação kids', PG), A('15:00', 'Diversão kids', PG), A('15:30', 'Momento hidratação', TP), A('16:00', 'Passa bexiga', 'Área kids'), A('17:30', 'Hora do banho')],
      'Quarta-feira': [A('10:00', 'Corrida de revezamento', 'Praia'), A('10:30', 'Momento hidratação', 'Teatro'), A('10:50', 'Vamos ao Acqua Park'), A('12:00', 'Almoço kids', 'Restaurante'), A('14:00', 'Criart', 'Kids club'), A('15:00', 'Movimentart', PG), A('16:00', 'Tesouro das cores'), A('17:30', 'Hora do banho'), A('19:00', 'Jantar do chapéu', 'Restaurante'), A('19:50', 'Circuito do bambolê', 'Área kids')],
      'Quinta-feira': [A('10:00', 'Gincana das cores', 'Praia'), A('10:30', 'Momento hidratação', 'Teatro'), A('10:50', 'Vamos ao Acqua Park'), A('12:00', 'Almoço kids', 'Restaurante'), A('14:00', 'Momento diversão'), A('15:00', 'Quente ou frio', 'Área kids'), A('15:30', 'Momento hidratação', TP), A('16:00', 'Caixa musical', 'Área kids'), A('17:30', 'Hora do banho'), A('19:00', 'Jantar dos heróis', 'Restaurante'), A('19:50', 'Meu herói favorito', PG)],
      'Sexta-feira': [A('10:00', 'Pique-bandeirinha', 'Praia'), A('10:30', 'Momento hidratação', 'Teatro'), A('10:50', 'Vamos ao Acqua Park'), A('12:00', 'Almoço kids', 'Restaurante'), A('14:00', 'Criart', 'Kids club'), A('15:00', 'Circuito animado', PG), A('15:30', 'Momento hidratação', TP), A('16:00', 'Circuito das argolas'), A('17:30', 'Hora do banho')],
      'Sábado': [A('10:00', 'Corrida dos balões', 'Praia'), A('10:30', 'Momento hidratação', 'Teatro'), A('10:50', 'Vamos ao Acqua Park'), A('12:00', 'Almoço kids', 'Restaurante'), A('14:00', 'Brincadeiras cantadas', 'Área kids'), A('15:00', 'Coelho sai da toca', PG), A('15:30', 'Momento hidratação', TP), A('16:00', 'Contos de fadas', 'Pelo resort'), A('17:30', 'Hora do banho'), A('19:00', 'Jantar do encantado', 'Restaurante'), A('19:50', 'Buscando a Cinderela', PG)],
      'Domingo': [A('10:15', 'Torta na cara', PG), A('10:30', 'Momento hidratação', 'Teatro'), A('10:50', 'Vamos ao Acqua Park'), A('12:00', 'Almoço kids', 'Restaurante'), A('14:00', 'Hora da diversão', 'Área kids'), A('15:00', 'Pique-esconde', PG), A('16:00', 'Bolinhas ao alvo', 'Área kids'), A('17:30', 'Hora do banho'), A('19:30', 'Cineminha kids', 'Teatro')],
    },
  },
};

export const DIAS_SEMANA = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];

const copia = (o) => JSON.parse(JSON.stringify(o));

/** Rascunho deste navegador, ou a programação publicada se não houver um válido. */
export function carregar() {
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE) || 'null');
    if (salvo && salvo.versao === VERSAO) return completar(salvo);
  } catch {
    // rascunho corrompido: segue com a publicada
  }
  return copia(PROGRAMACAO_PUBLICADA);
}

/** Preenche campos que não existiam quando o arquivo foi salvo. */
function completar(p) {
  const base = copia(PROGRAMACAO_PUBLICADA);
  for (const k of Object.keys(base)) if (p[k] === undefined) p[k] = base[k];
  return p;
}

/** Salva o rascunho. Imagens enviadas (pôster, selo) podem estourar a cota: avisa sem quebrar. */
export function salvar(p) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(p));
    return true;
  } catch {
    return false;
  }
}

export function temRascunho() {
  return Boolean(localStorage.getItem(CHAVE));
}

export function descartarRascunho() {
  localStorage.removeItem(CHAVE);
  return copia(PROGRAMACAO_PUBLICADA);
}

/** Lê um arquivo de programação e devolve o objeto, ou lança erro com motivo legível. */
export async function lerArquivo(file) {
  let p;
  try {
    p = JSON.parse(await file.text());
  } catch {
    throw new Error('Este arquivo não é um arquivo de programação válido. Use o arquivo .json baixado pelo botão "Salvar programação".');
  }
  if (!p || typeof p !== 'object' || !p.teatral || !p.musica) {
    throw new Error('Este arquivo não é um arquivo de programação do Sistema de Artes.');
  }
  p.versao = VERSAO;
  return completar(p);
}
