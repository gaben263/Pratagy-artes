# Sistema de Artes — Pratagy

Sistema interno de artes oficiais do Pratagy Beach. Quatro módulos:

| Módulo | O que faz |
|---|---|
| **Alimentos & Bebidas** | Dois caminhos: gera a identificação de pratos a partir da biblioteca oficial (.docx), com tradução em espanhol, ou baixa uma das 5 artes prontas |
| **Operacional** | Catálogo buscável de 22 avisos e sinalizações prontos para baixar. Só consulta — não gera arte |
| **Hospitalidade** | 8 artes prontas (cartões de hóspede, check-out, QR Code) mais o gerador da carta de boas-vindas manuscrita em A4 |
| **Acqua Park** | Gera comunicados 1080×1440 px (WhatsApp) sobre fundo azul ou branco |

> Cada setor mostra uma categoria só, definida em `categoriaCatalogo`. `fluxo: 'catalogo'` abre
> direto na busca; `fluxo: 'misto'` (A&B) passa antes por uma tela de escolha entre criar e baixar;
> `fluxo: 'gerador'` (Acqua Park) vai direto para o Canvas. Hospitalidade é catálogo com um
> gerador acessório, declarado em `acaoGerador`.

> Os IDs internos dos dois módulos renomeados continuam `manutencao` (Institucionais Gerais) e `governanca` (Hospitalidade): eles indexam os caminhos dos assets e o cache já gravado no navegador dos usuários. Só os nomes de interface mudaram.

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
tools/
  embed-font.js            regenera css/satisfy-embedded.css
css/
  fonts.css               @font-face da Fibra One
  satisfy-embedded.css     Satisfy em Base64 (GERADO — veja tools/)
  styles.css               estilos e animações auxiliares
js/
  main.js                  bootstrap da aplicação
  state.js                 estado central (setor, formato, texto, navegação)
  utils.js                 normalização de texto, slugify, debounce
  data/
    models.js               setores, formatos e áreas seguras de cada modelo
    catalogData.js           catálogo de artes prontas (títulos, tags, tamanhos, material)
    docxLibrary.js           leitura da biblioteca de pratos (.docx) + cache IndexedDB
  canvas/
    engine.js                motor de renderização (texto + quebra de linha + auto-shrink)
    export.js                exportação PNG/PDF
  ui/
    steps/                   telas de cada etapa do fluxo
    previewPanel.js          painel de prévia (canvas ao vivo)
    stepper.js, common.js, icons.js
assets/
  images/{ab,governanca,acquapark}/             modelos oficiais do gerador (PNG)
  catalogo/{ab,operacional,hospitalidade}/      artes prontas do catálogo (PNG, 300 DPI)
  catalogo/thumbs/                              miniaturas das artes prontas (JPG)
  fonts/                                        Fibra One (.otf) e Satisfy (.ttf)
  logo/                                         logo do cabeçalho (não aparece nas artes)
  docx/                                         biblioteca de pratos PT/ES
```

## Bibliotecas usadas (via CDN, sem npm)

- **Tailwind CSS** (play CDN) — estilos
- **mammoth.js** — leitura do `.docx` da biblioteca de pratos
- **idb** — cache da biblioteca no IndexedDB do navegador
- **jsPDF** — exportação em PDF no tamanho físico real da arte
- **Lucide Icons** — ícones da interface (com fallback inline caso o CDN seja bloqueado)

As tipografias são locais, não vêm de CDN: **Fibra One** (interface e artes) e **Satisfy** (carta de Hospitalidade).

## Atualizando os modelos oficiais

Se um modelo (imagem de fundo) for atualizado pelo design, substitua o PNG correspondente em `assets/images/...` mantendo o mesmo nome de arquivo. Se as dimensões da imagem mudarem, ajuste `largura`/`altura` em `js/data/models.js`.

As áreas seguras ficam em `js/data/models.js`, no campo `safeAreaMm`: **margens em milímetros** a partir de cada borda da arte.

A medida é física, não percentual. Todas as imagens-base estão em **300 DPI** (945px = 80,01mm; 2480px = 209,97mm), então a conversão mm↔px é exata e um respiro de 6 mm continua valendo 6 mm no PNG e no PDF exportados, em qualquer formato.

Três regras valem para esses valores:

1. **As margens laterais são simétricas** (`left = right`). O texto centralizado usa o eixo central da arte; margens assimétricas deslocam a composição visualmente.
2. **A faixa vertical evita as ilustrações**, em vez de cobrir toda a altura útil. O sol e as palmeiras ficam concentrados no topo e na base: incluí-los estrangula a caixa inteira e força quebras de linha desnecessárias no miolo, que está livre.
3. **Nas artes de A&B há 5–8 mm de respiro da onda azul.** A onda superior do 8x5 termina a 3,4 mm do topo e a inferior a 12,1 mm da base — daí `top: 9.4` e `bottom: 18.1` (6 mm de folga em cada).

## Atualizando o catálogo de artes prontas

As artes ficam em `assets/catalogo/<categoria>/<id>.png` e as miniaturas em
`assets/catalogo/thumbs/<categoria>/<id>.jpg`. Os metadados (título, tags, tamanho,
material de impressão) vivem em `js/data/catalogData.js`.

Para adicionar uma arte:

1. Copie o PNG para `assets/catalogo/ab/`, `.../operacional/` ou `.../hospitalidade/` com um
   **nome em ASCII, sem espaço nem acento** — os nomes originais das pastas de trabalho
   têm acento, espaço duplo e um acento agudo solto (`d´água`), que quebram a URL em
   host estático.
2. Gere uma miniatura de ~600px na maior dimensão em `assets/catalogo/thumbs/...`.
3. Adicione o objeto correspondente em `ITENS`, no `catalogData.js`. As `tags` são o que
   faz a arte aparecer na busca — escreva-as com acento, porque elas também são exibidas
   no modal; a busca continua insensível a acento.

O campo `printMaterial` vem preenchido com o padrão `"PVC Adesivado"` e `materialConfirmado: false`,
o que faz a interface exibir a informação como **sugestão a validar**. Quando o time de Marketing
confirmar o material de um item, ajuste o valor e marque `materialConfirmado: true` para o aviso sumir.

Para mover uma arte de categoria, troque o campo `categoria` no `catalogData.js` e mova o PNG e a
miniatura para a pasta correspondente — os caminhos são derivados de `categoria` + `id`.

As pastas de trabalho `Operacional/`, `A&B/Artes Prontas/`, `Hospitalidade/` e `AcquaPark/` continuam versionadas
no Git, mas ficam fora do deploy (`.vercelignore`) — o site consome só o que está em `assets/`.

## Atualizando a biblioteca de pratos (A&B)

Substitua o arquivo em `assets/docx/biblioteca_ab.docx` (mesma estrutura de tabela: Categoria, Nome em português, Tradução em espanhol, Origem/status). Na primeira visita após a troca, mude a constante `DOCX_VERSION_TAG` em `js/data/docxLibrary.js` para forçar o app a reprocessar o arquivo em vez de usar o cache antigo do navegador.
