# Sistema de Artes — Pratagy

Sistema interno de artes oficiais do Pratagy Beach. Sete módulos:

| Módulo | O que faz |
|---|---|
| **Alimentos & Bebidas** | Dois caminhos: gera a identificação de pratos a partir da biblioteca oficial (.docx), com tradução em espanhol — individual, em folha A4 com várias placas da mesma arte ou em folha A4 montada com pratos e tamanhos diferentes —, ou baixa uma das 5 artes prontas |
| **Manutenção** | Catálogo buscável de 22 avisos e sinalizações prontos para baixar. Só consulta — não gera arte |
| **Hospitalidade** | 8 artes prontas (cartões de hóspede, check-out, QR Code) mais o gerador da carta de boas-vindas manuscrita em A4 |
| **Acqua Park** | Gera comunicados 1080×1440 px (WhatsApp) sobre fundo azul ou branco |
| **RH** | Três peças 1080×1440 px: **Atenção** (comunicado só-texto), **Talento do Mês** (foto no polaroid + nome e setor) e **Aniversariantes do Dia** (de 1 a 9 colaboradores com foto circular, distribuídos automaticamente). Fotos e nomes ficam só em memória — recarregar apaga (LGPD) |
| **Esportes e Lazer** | Catálogo da programação mensal de lazer (shows, música ao vivo, piscina, fitness, bingo, cinema, programação infantil de 4 a 6 e de 7 a 12 anos): 50 peças de novembro de 2026, em A4 para impressão e nos formatos de tela (TV vertical e horizontal, stories, feed, banner do app). Peças de tela baixam só a imagem; as A4 também em PDF |
| **Black Friday** | Quatro cards 1080×1440 px de comemoração de vendedor da campanha 2026: **Já Vendi** (vendedor + conquista de 50K a 2MI), **Meta Batida**, **Meta com Ajuda** (vendedor + o colega que ajudou) e **Top 3**. Vendedor escolhido num seletor com foto; a foto já vem enquadrada no rosto |

> Cada setor mostra uma categoria só, definida em `categoriaCatalogo`. `fluxo: 'catalogo'` abre
> direto na busca; `fluxo: 'gerador'` (Acqua Park) vai direto para o Canvas. Hospitalidade e A&B
> são catálogos com um cartão de "criar" no topo, declarado em `acaoGerador` — a carta manuscrita
> num caso, a identificação de prato no outro.

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
    lote.js                  folha A4: grade de uma arte e encaixe de peças diferentes (+ PDF)
  ui/
    loteModal.js             modal da impressão em lote (quantidade, diagrama, gerar)
    steps/folhaStep.js       montagem da folha A4 com pratos e tamanhos diferentes
  blackfriday/
    templates.js             os 4 cards (medições em px, máscaras, textos, conquistas)
    vendedores.js            lista de vendedores com foto e enquadramento inicial
    render.js                compositor: arte + fotos mascaradas + textos, devolve `fits`
    editorBF.js              seletor de vendedor com foto, nome na arte e conquista
  rh/
    templates.js             os 3 templates do RH (medições em px, áreas seguras, cores das faixas)
    cardRenderer.js          card de colaborador: foto (círculo/quadrado), faixas que crescem com o texto
    gridLayout.js            distribuição de N cards na área do Aniversariantes
    render.js                compositor: template + cards, devolve `fits` como o motor
    photoEditor.js           upload + arrastar + zoom (Pointer Events), tudo em memória
    editorRH.js              tela de edição (nome, setor, foto por colaborador)
    steps/                   telas de cada etapa do fluxo
    previewPanel.js          painel de prévia (canvas ao vivo)
    stepper.js, common.js, icons.js
assets/
  images/{ab,governanca,acquapark}/             modelos oficiais do gerador (PNG)
  images/blackfriday/                           artes da Black Friday, máscaras dos círculos e vendedores/ (JPG + thumbs/)
  catalogo/{ab,manutencao,hospitalidade}/       artes prontas do catálogo (PNG, 300 DPI)
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

As tipografias são locais, não vêm de CDN: **Fibra One** (interface e artes), **Satisfy** (carta de Hospitalidade) e **Intro Black** (cards da Black Friday).

## Vendedores da Black Friday

Para incluir alguém: converta a foto para JPG (lado menor até 1000 px, nome ASCII sem espaço), salve em `assets/images/blackfriday/vendedores/<id>.jpg`, gere a miniatura de 160 px em `.../thumbs/<id>.jpg` e acrescente a linha em `js/blackfriday/vendedores.js` com o enquadramento inicial (`zoom`, `cx`, `cy` — `{ zoom: 1, cx: 0.5, cy: 0.4 }` serve de partida para foto de meio corpo). HEIC/HEIF precisa ser convertido: o Chrome e o Edge não abrem.

> **Privacidade:** diferente das peças do RH (fotos só em memória), as fotos dos vendedores ficam em `assets/` e vão para o deploy, porque o seletor precisa delas. Se o site for público, qualquer pessoa com o link vê as fotos. Para tirá-las do site, acrescente `/assets/images/blackfriday/vendedores/` ao `.vercelignore` e rode o sistema localmente.

## Atualizando os modelos oficiais

Se um modelo (imagem de fundo) for atualizado pelo design, substitua o PNG correspondente em `assets/images/...` mantendo o mesmo nome de arquivo. Se as dimensões da imagem mudarem, ajuste `largura`/`altura` em `js/data/models.js`.

As áreas seguras ficam em `js/data/models.js`, no campo `safeAreaMm`: **margens em milímetros** a partir de cada borda da arte.

A medida é física, não percentual. Todas as imagens-base estão em **300 DPI** (945px = 80,01mm; 2480px = 209,97mm), então a conversão mm↔px é exata e um respiro de 6 mm continua valendo 6 mm no PNG e no PDF exportados, em qualquer formato.

Três regras valem para esses valores:

1. **As margens laterais são simétricas** (`left = right`). O texto centralizado usa o eixo central da arte; margens assimétricas deslocam a composição visualmente.
2. **A faixa vertical evita as ilustrações**, em vez de cobrir toda a altura útil. O sol e as palmeiras ficam concentrados no topo e na base: incluí-los estrangula a caixa inteira e força quebras de linha desnecessárias no miolo, que está livre.
3. **Nas artes de A&B há 5–8 mm de respiro da onda azul.** A onda superior do 8x5 termina a 3,4 mm do topo e a inferior a 12,1 mm da base — daí `top: 9.4` e `bottom: 18.1` (6 mm de folga em cada).

## Editor da programação de lazer

Em **Esportes e Lazer › Editar a programação do mês**, qualquer pessoa altera datas, horários e
atrações e baixa as peças atualizadas (JPG para tela, PDF + JPG para A4). Cada atração é editada uma
vez e vale para todos os formatos; a Programação Completa junta os Shows Teatrais com as outras
atividades do mês (em ordem de dia e horário, sem repetir atração).

- `js/lazer/dados.js`: a programação publicada, em campos. As edições ficam salvas só no navegador
  (localStorage); "Salvar programação" baixa um `.json` que outra pessoa abre em "Abrir programação".
- `js/lazer/pecas.js`: os modelos de cada atração, desenhados em Canvas sobre os fundos oficiais.
  Texto longo encolhe para caber; abaixo de 70% do corpo o download é bloqueado e o aviso diz qual
  campo encurtar.
- `js/lazer/kit.js`: desenho de texto (tracking, linha de base, encaixe), caixas e imagens.
- `js/lazer/medidas.js` (gerado): posições de caixas e ícones medidas nos PSDs.
- `assets/lazer/fundos/`: as peças sem os textos editáveis, uma por formato. `assets/lazer/icones/`:
  ícones, logos, selo do mês e pôster padrão.

Os fundos e as medidas saem dos PSDs do Marketing por um script em Python (psd-tools), fora deste
repositório. Se o layout de uma peça mudar no PSD, os fundos precisam ser exportados de novo.

## Virando o mês em Esportes e Lazer

As peças ficam em `assets/catalogo/lazer/<id>.jpg` (JPG, 300 DPI) com miniatura em
`assets/catalogo/thumbs/lazer/<id>.jpg`. Para publicar a programação de outro mês, substitua os
arquivos **mantendo os IDs** e atualize `tituloCatalogo` do setor `lazer` em `js/data/models.js`
(ele diz de que mês é a programação), atualize `PROGRAMACAO_PUBLICADA` e `VERSAO` em
`js/lazer/dados.js` e troque o selo em `assets/lazer/icones/`. Atração nova ou removida = acrescentar ou apagar o item
correspondente em `catalogData.js`. O campo `uso` decide a tela de download: `'impressao'` mostra
instruções de gráfica e PDF; `'tela'` mostra o formato de exibição e baixa só a imagem.

## Atualizando o catálogo de artes prontas

As artes ficam em `assets/catalogo/<categoria>/<id>.png` e as miniaturas em
`assets/catalogo/thumbs/<categoria>/<id>.jpg`. Os metadados (título, tags, tamanho,
material de impressão) vivem em `js/data/catalogData.js`.

Para adicionar uma arte:

1. Copie o PNG para `assets/catalogo/ab/`, `.../manutencao/` ou `.../hospitalidade/` com um
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

As pastas de trabalho `Manutencao/`, `A&B/Artes Prontas/`, `Hospitalidade/` e `AcquaPark/` continuam versionadas
no Git, mas ficam fora do deploy (`.vercelignore`) — o site consome só o que está em `assets/`.

## Atualizando a biblioteca de pratos (A&B)

Substitua o arquivo em `assets/docx/biblioteca_ab.docx` mantendo a estrutura atual: cada categoria é um parágrafo `N. Nome da categoria` seguido de uma tabela de três colunas (`#`, `Nome em Português`, `Tradução em Espanhol`). Tabelas sem a coluna "Nome em Português" no cabeçalho são ignoradas. Pratos repetidos ficam com a primeira ocorrência. Depois da troca, mude a constante `DOCX_VERSION_TAG` em `js/data/docxLibrary.js` (`v2` → `v3`…) para forçar o app a reprocessar o arquivo em vez de usar o cache antigo do navegador.

Os três itens em `LEGADOS` no mesmo módulo vieram dos cardápios oficiais de 2025 e não estão no `.docx` — quando a cozinha confirmar que saíram do cardápio, basta apagá-los da lista.

**Acentuação em espanhol:** os termos foram validados pela tradutora do resort e devem ser usados como estão no arquivo (ex.: "Pure de papas", "Pernil suino"). Não "corrija" acentos no código nem no documento sem passar por ela.
