// Gera css/satisfy-embedded.css com a fonte Satisfy embutida em Base64.
//
// Por que embutir: o Canvas só desenha com a tipografia correta se a fonte já
// estiver carregada na memória do navegador. Um data URI elimina a requisição
// de rede e qualquer chance de a exportação (PNG/PDF) sair com a fonte de
// fallback porque o arquivo ainda não tinha chegado.
//
// Uso:  node tools/embed-font.js

const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const ORIGEM = path.join(RAIZ, 'assets/fonts/Satisfy-Regular.ttf');
const DESTINO = path.join(RAIZ, 'css/satisfy-embedded.css');

const base64 = fs.readFileSync(ORIGEM).toString('base64');

const css = `/* ARQUIVO GERADO — não edite à mão.
 * Origem: assets/fonts/Satisfy-Regular.ttf
 * Regenerar: node tools/embed-font.js
 *
 * A fonte vai embutida em Base64 para que o Canvas nunca dependa de uma
 * requisição de rede no momento de desenhar — o que faria a exportação sair
 * com a tipografia de fallback.
 */
@font-face {
  font-family: 'Satisfy';
  src: url('data:font/ttf;base64,${base64}') format('truetype');
  font-weight: 400;
  font-style: normal;
  font-display: block;
}
`;

fs.writeFileSync(DESTINO, css);
console.log(
  `satisfy-embedded.css gerado: ${(base64.length / 1024).toFixed(1)} KB de Base64 ` +
    `(fonte original ${(fs.statSync(ORIGEM).size / 1024).toFixed(1)} KB)`
);
