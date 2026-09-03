# Pratagy Placas

Sistema interno para gerar as placas oficiais do Pratagy Beach (Alimentos & Bebidas, Manutenção e Governança) a partir dos modelos visuais aprovados.

## Como rodar

Este projeto é **HTML, CSS e JavaScript puro** — não precisa de `npm install`, build ou qualquer ferramenta extra. A única dependência é o Node.js (já usado só para servir os arquivos localmente).

```bash
node server.js
```

Depois abra **http://localhost:5173** no navegador (Chrome ou Edge).

> Por quê um servidor e não abrir o `index.html` direto?
> O navegador bloqueia por segurança o carregamento de arquivos locais (a biblioteca de pratos `.docx`, as imagens dos modelos) quando a página é aberta como `file://`. O `server.js` é um servidor local mínimo, sem dependências, que resolve isso.

Para usar outra porta: `node server.js 8080`.

## Estrutura

```
index.html              Página principal
server.js                Servidor estático local (sem dependências)
css/
  fonts.css               @font-face da Fibra One
  styles.css               estilos e animações auxiliares
js/
  main.js                  bootstrap da aplicação
  state.js                 estado central (setor, formato, texto, navegação)
  utils.js                 normalização de texto, slugify, debounce
  data/
    models.js               setores, formatos e áreas seguras de cada modelo
    docxLibrary.js           leitura da biblioteca de pratos (.docx) + cache IndexedDB
  canvas/
    engine.js                motor de renderização (texto + quebra de linha + auto-shrink)
    export.js                exportação PNG/PDF
  ui/
    steps/                   telas de cada etapa do fluxo
    previewPanel.js          painel de prévia (canvas ao vivo)
    stepper.js, common.js, icons.js
assets/
  images/{ab,manutencao,governanca}/   modelos oficiais (PNG)
  fonts/                                 Fibra One (.otf)
  logo/                                  logo do cabeçalho (não aparece nas placas)
  docx/                                  biblioteca de pratos PT/ES
```

## Bibliotecas usadas (via CDN, sem npm)

- **Tailwind CSS** (play CDN) — estilos
- **mammoth.js** — leitura do `.docx` da biblioteca de pratos
- **idb** — cache da biblioteca no IndexedDB do navegador
- **jsPDF** — exportação em PDF no tamanho físico real da placa
- **Lucide Icons** — ícones da interface (com fallback inline caso o CDN seja bloqueado)

## Atualizando os modelos oficiais

Se um modelo (imagem de fundo) for atualizado pelo design, substitua o PNG correspondente em `assets/images/...` mantendo o mesmo nome de arquivo. Se as dimensões da imagem mudarem, ajuste `largura`/`altura` em `js/data/models.js`. A área segura (onde o texto pode ser escrito sem sobrepor as ilustrações) também está configurada ali, em porcentagem, por formato.

Duas regras valem para esses valores:

1. **As margens horizontais são simétricas** (`left = 100 - right`). O texto centralizado usa o eixo central da placa; margens assimétricas deslocam a composição visualmente.
2. **A faixa vertical evita as ilustrações**, em vez de cobrir toda a altura útil. O sol e as palmeiras ficam concentrados no topo e na base: incluí-los na faixa estrangula a caixa inteira e força quebras de linha desnecessárias no miolo, que está livre.

## Atualizando a biblioteca de pratos (A&B)

Substitua o arquivo em `assets/docx/biblioteca_ab.docx` (mesma estrutura de tabela: Categoria, Nome em português, Tradução em espanhol, Origem/status). Na primeira visita após a troca, mude a constante `DOCX_VERSION_TAG` em `js/data/docxLibrary.js` para forçar o app a reprocessar o arquivo em vez de usar o cache antigo do navegador.
