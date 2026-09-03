// Servidor estático local, sem dependências externas (só o Node.js embutido).
// Existe para servir a aplicação via http://localhost, evitando os bloqueios de
// CORS que o Chrome/Edge aplicam a arquivos abertos diretamente via file://
// (o fetch() do .docx e das imagens não funciona sob file://).
//
// Uso:  node server.js  [porta opcional, padrão 5173]

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = Number(process.argv[2]) || 5173;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.otf': 'font/otf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';

  const filePath = path.normalize(path.join(ROOT, urlPath));

  // Impede acesso a arquivos fora da pasta da aplicação.
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Acesso negado.');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Arquivo não encontrado: ' + urlPath);
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log('');
  console.log('  Pratagy Placas rodando em:');
  console.log(`  http://localhost:${PORT}`);
  console.log('');
  console.log('  Pressione Ctrl+C para encerrar.');
  console.log('');
});
