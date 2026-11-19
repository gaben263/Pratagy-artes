/**
 * Pratos provisórios do A&B — código da planilha (Google Apps Script).
 *
 * Recebe os pratos cadastrados no Sistema de Artes e devolve a lista para que
 * todos os computadores encontrem os provisórios na busca.
 *
 * COMO PUBLICAR: ver tools/apps-script/COMO-PUBLICAR.md.
 *
 * A planilha pode (e deve) ficar com acesso "Restrito": este código roda com a
 * conta de quem o publicou, então o sistema grava sem que a planilha precise
 * estar aberta para qualquer pessoa.
 */

const ABA = 'Provisórios';
const CABECALHO = ['Data', 'Prato (português)', 'Tradução (espanhol)', 'Categoria', 'Revisão ortográfica', 'Tela', 'ID'];
const LIMITES = { pt: 90, es: 110, categoria: 60, revisao: 200, tela: 20, id: 60 };

function aba_() {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  let aba = planilha.getSheetByName(ABA);
  if (!aba) aba = planilha.insertSheet(ABA, 0);
  if (aba.getLastRow() === 0) {
    aba.appendRow(CABECALHO);
    aba.getRange(1, 1, 1, CABECALHO.length).setFontWeight('bold').setBackground('#E0F2FE');
    aba.setFrozenRows(1);
    aba.setColumnWidth(2, 280);
    aba.setColumnWidth(3, 280);
    aba.setColumnWidth(5, 260);
  }
  return aba;
}

/** Texto limpo, curto e que nunca vira fórmula na planilha. */
function limpo_(valor, max) {
  let s = String(valor == null ? '' : valor).replace(/\s+/g, ' ').trim().slice(0, max);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

const chave_ = (s) =>
  String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

function resposta_(objeto) {
  return ContentService.createTextOutput(JSON.stringify(objeto)).setMimeType(ContentService.MimeType.JSON);
}

function lerPratos_() {
  const aba = aba_();
  const n = aba.getLastRow() - 1;
  if (n < 1) return [];
  return aba
    .getRange(2, 1, n, CABECALHO.length)
    .getValues()
    .filter((linha) => linha[1])
    .map((linha) => ({
      data: linha[0] instanceof Date ? linha[0].toISOString() : String(linha[0]),
      pt: String(linha[1]).replace(/^'/, ''),
      es: String(linha[2]).replace(/^'/, ''),
      categoria: String(linha[3]),
      id: String(linha[6]),
    }));
}

/** GET: lista os provisórios. */
function doGet() {
  return resposta_({ ok: true, pratos: lerPratos_() });
}

/** POST (corpo em JSON, enviado como text/plain): cadastra um prato. */
function doPost(e) {
  const trava = LockService.getScriptLock();
  try {
    trava.waitLock(10000);
    const dados = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const pt = limpo_(dados.pt, LIMITES.pt);
    const es = limpo_(dados.es, LIMITES.es);
    if (!pt || !es) return resposta_({ ok: false, erro: 'Nome em português e espanhol são obrigatórios.' });

    // O mesmo prato enviado duas vezes (reenvio após falha de internet, ou
    // dois computadores) entra uma vez só.
    const id = limpo_(dados.id, LIMITES.id);
    const existentes = lerPratos_();
    if (existentes.some((p) => (id && p.id === id) || chave_(p.pt) === chave_(pt))) {
      return resposta_({ ok: true, duplicado: true });
    }

    aba_().appendRow([
      new Date(),
      pt,
      es,
      limpo_(dados.categoria, LIMITES.categoria),
      limpo_(dados.revisao, LIMITES.revisao),
      limpo_(dados.tela, LIMITES.tela),
      id,
    ]);
    return resposta_({ ok: true });
  } catch (erro) {
    return resposta_({ ok: false, erro: String(erro) });
  } finally {
    trava.releaseLock();
  }
}
