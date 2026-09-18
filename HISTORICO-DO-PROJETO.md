# Sistema de Artes — Pratagy Beach

### Histórico completo do desenvolvimento

**Repositório:** https://github.com/gaben263/Pratagy-artes
**Publicado em:** https://pratagy-artes.vercel.app/
**Documento gerado em:** 10 de setembro de 2026 · **Atualizado em:** 11 de setembro de 2026

---

## Sobre este documento

Registra tudo que foi pedido e feito ao longo do desenvolvimento do sistema: cada solicitação,
as decisões técnicas tomadas, os bugs encontrados (inclusive os que eu mesmo introduzi) e o
estado atual do projeto.

**Uma ressalva honesta:** a conversa foi compactada duas vezes por limite de contexto. A parte
inicial — da construção do zero até o bloqueio dos campos de A&B — está reconstruída a partir
de um resumo, não do texto original. Os pedidos e as decisões estão corretos, mas as falas não
são transcrição literal. A partir da seção **"Atualização em 3 frentes"** o registro vem da
conversa direta.

---

## 1. O que é o sistema

Ferramenta interna para a equipe do resort gerar e baixar as artes oficiais sem depender do
time de Marketing para cada peça. O público-alvo não é técnico: recepcionistas, equipe de A&B,
governança e manutenção.

São quatro módulos:

| Módulo | O que faz |
|---|---|
| **Alimentos & Bebidas** | Gera a identificação de pratos a partir da biblioteca oficial (`.docx`), com tradução em espanhol — individual ou em folha A4 com várias placas — ou baixa uma das 5 artes prontas |
| **Manutenção** | Catálogo buscável de 22 avisos e sinalizações prontos para baixar |
| **Hospitalidade** | 8 artes prontas (cartões de hóspede, check-out, QR Code) + gerador da carta de boas-vindas manuscrita |
| **Acqua Park** | Gera comunicados 1080×1440 px (WhatsApp) sobre fundo azul ou branco |
| **RH** | Atenção (comunicado só-texto), Talento do Mês (foto no polaroid) e Aniversariantes do Dia (1 a 9 colaboradores). Dados só em memória |

---

## 2. A restrição que definiu a arquitetura

O pedido original trazia uma exigência que moldou todo o resto:

> "Se houver risco de falha no Node, faça em HTML, CSS e JS Vanilla (com ES Modules)
> utilizando CDNs confiáveis."

O ambiente é corporativo, com bloqueio de rede e política de execução do PowerShell restritiva.
Isso levou a decisões que se mantiveram até hoje:

- **Sem bundler, sem build, sem `npm install`.** HTML + CSS + JavaScript com ES Modules nativos.
- **Servidor local de desenvolvimento sem dependências** (`server.js`), usando só os módulos
  embutidos do Node — existe porque o navegador bloqueia `fetch` de arquivos locais sob `file://`.
- **Fontes locais, nunca de CDN.** A Fibra One vem de `assets/fonts/`; a Satisfy está embutida
  em Base64 no CSS, para a exportação nunca sair com fonte de fallback por falha de rede.
- **Bibliotecas externas com plano B.** Os ícones (Lucide) têm fallback inline: se o CDN cair
  ou for bloqueado, a interface continua legível.

Essa mesma lógica reapareceu no fim do projeto, na hora de fazer o confete: em vez de puxar
mais um CDN, escrevi a animação à mão em Canvas.

---

## 3. Histórico por pedido

### 3.1 Construção do zero

Especificação em 7 seções cobrindo arquitetura, fluxo de UX, design system, tipografia, regras
de negócio por setor, integração com o `.docx` e o motor de Canvas.

**Fluxo em etapas (Progressive Disclosure):** Setor → Formato → Modelo → Texto → Prévia → Download.
No desktop, Split View com os controles à esquerda e a prévia fixa à direita; no mobile, etapas
empilhadas.

**Poka-Yoke:** se o texto ultrapassa a área segura, os botões de exportação ficam **desabilitados**
com alerta explícito. A regra vale até hoje e é testada a cada alteração no motor.

**Regras por setor:**
- A&B — 3 formatos (8×5, 8×10, 10×15 cm), texto vindo da busca, exige tradução em espanhol
- Manutenção — A3 e A4 (horizontal e vertical), texto livre, sem tradução
- Governança — apenas a Carta de Boas-Vindas A4, textarea longo com redução automática de fonte

**Regra inviolável de marca:** a logo do Grupo Pratagy é exclusiva do cabeçalho da interface.
**Nunca** entra na renderização do Canvas.

**Integração com a biblioteca de pratos:** leitura do `.docx` com mammoth, cache em IndexedDB
via idb, busca que ignora acento e caixa, com autocomplete.

---

### 3.2 Primeira refatoração — bugs críticos

Quatro frentes:

**Texto fora do centro no Canvas.** A causa era a área segura assimétrica: no formato 10×15 as
margens iam de 4% a 82%, o que jogava o centro para 43% em vez de 50%. Corrigido centralizando
em `canvas.width / 2` e espelhando sempre a margem mais restritiva dos dois lados. Resultado:
desvio ≤1px em todos os formatos.

**Biblioteca travando em "Carregando biblioteca…".** Ao voltar para a tela de texto, a condição
`if (!libraryCache)` pulava o bloco que habilitava o campo. Corrigido com `getLoadedLibrary()`
e renderizando o input já habilitado quando o cache existe.

**Fonte errada no Canvas.** Aqui está uma armadilha da API que vale registrar:

> `document.fonts.ready` **não basta**. Ele só espera as fontes que já foram requisitadas, e uma
> fonte usada apenas via `ctx.font` pode nunca ter sido solicitada — o Canvas então desenha
> silenciosamente com a fonte de fallback. É preciso chamar `document.fonts.load()`
> explicitamente para cada peso **antes** de aguardar o `ready`.

**Acabamento visual.** Ícones amadores substituídos por Lucide (com fallback inline), `toTitleCase`
editorial para os nomes de prato, mais densidade visual, sombras suaves e feedback imediato de
seleção.

---

### 3.3 Publicação na Vercel — três problemas em sequência

**Problema 1: o site publicava só o `index.html`.** Diagnostiquei comparando o que respondia 404 —
o `README.md`, o `server.js` e a logo da raiz também não existiam no site publicado, o que
descartava um erro de caminho e apontava para o próprio deploy. Resolvido com `vercel.json`
declarando `framework: null` e `outputDirectory: "."`.

> Cheguei a levantar a hipótese de que o Root Directory estivesse configurado como `app` no
> painel. **Estava errado** e corrigi isso explicitamente na conversa.

**Problema 2: a logo sumiu depois da correção.** Esse bug foi meu. O `.vercelignore` tinha o
padrão `logo-grupo-cinza.png` sem barra inicial — e essa sintaxe casa em **qualquer profundidade**,
excluindo também `assets/logo/logo-grupo-cinza.png`, que o site usa. Corrigido ancorando todos os
padrões com `/`, e o arquivo hoje carrega um comentário explicando a armadilha para não repetir.

**Problema 3: "Unable to merge unrelated histories" no GitHub Desktop.** Orientei a **não** usar
force push antes de entender a causa. O `git fetch` mostrou o local 1 commit à frente e 0 atrás,
o que não combinava com o erro. A raiz era um **segundo clone** do repositório em
`Documents\GitHub\Pratagy-artes`, com 2 commits sem relação. Verifiquei que aquele clone não tinha
nada exclusivo antes de recomendar a remoção.

---

### 3.4 Segunda refatoração — "Sistema de Artes"

Renomeação de **"Placa" para "Arte"** em toda a interface e nos nomes dos arquivos exportados,
com uma restrição explícita:

> "Altere APENAS strings de interface e nomes de arquivos de saída. NÃO altere variáveis internas,
> props, chaves de API ou rotas para evitar quebras de lógica."

Essa instrução virou princípio do projeto e continua valendo — é a razão de os IDs internos
`manutencao` e `governanca` existirem até hoje, apesar de a interface mostrar "Institucionais
Gerais" e "Hospitalidade".

Também nesta rodada:
- Cabeçalho reconstruído em grid de 3 colunas `[1fr auto 1fr]`, para o título e a logo nunca se
  sobreporem em tela pequena
- Fonte **Satisfy** na carta de Governança, embutida em Base64 para não depender de rede
- Margens de A&B convertidas de percentual para **milímetros**

**A descoberta que mudou a abordagem da geometria:** todas as imagens-base estão exatamente em
300 DPI (945px = 80,01 mm; 2480px = 209,97 mm). Isso permitiu abandonar percentuais e trabalhar
em medida física — "6 mm de respiro da onda azul" continua valendo 6 mm no PNG e no PDF
exportados, em qualquer formato.

---

### 3.5 Ajustes na carta de Governança

Base da caixa elevada para 78% da altura e texto ancorado no topo em vez de centralizado
verticalmente, mantendo a centralização horizontal — para a carta crescer para baixo como uma
carta escrita à mão.

---

### 3.6 Bloqueio dos campos de A&B

> "Como a intenção é limitar a escrita de quem for criar a placa de A&B para que não haja erros
> de português (por isso a implementação de um docs como biblioteca de pratos), preciso que vc
> deixe bloqueada para digitação a parte do nome do prato em português e espanhol."

Campos de nome e tradução passaram a `readonly` — **não** `disabled`. A diferença importa:
`readonly` mantém o texto legível, selecionável e presente na árvore de acessibilidade; `disabled`
deixaria o texto acinzentado e invisível para leitores de tela.

Depois foi pedido para remover a frase que explicava o bloqueio. Os selos 🔒 "preenchido pela busca"
e o fundo cinza dos campos ficaram — comunicam a restrição sem precisar do texto.

---

### 3.7 Atualização em 3 frentes

O maior pedido do projeto, em três partes: banco de dados do catálogo, refatoração de rotas e
módulo novo.

#### Frente 1 — Banco de dados do catálogo

Leitura dos diretórios `Institucional/` e `Hospitalidade/`, extraindo nome do arquivo, título
limpo, tamanho e tags inteligentes.

**Correções de grafia aplicadas** (o pedido citava "Lucas Descataveis" como exemplo, mas esse
arquivo já estava correto; os erros reais eram outros):

| Arquivo original | Título corrigido |
|---|---|
| `...Disjuntores risco de **descaga** elétrica` | Risco de Desc**ar**ga Elétrica |
| `...Atividades **Nauticas**` | Atividades N**á**uticas |
| `...Copos **Retornaveis**` | Copos Retorn**á**veis |
| `...Sorvete e **Picole**` | Sorvete e Picol**é** |
| `...Casa de **Maquinas**` | Casa de M**á**quinas |
| `...Carta Hóspedes **Agencias**` | Cartão Hóspede — Ag**ê**ncias |
| `...Carta Hóspedes **Habitue**` | Cartão Hóspede — Habitu**é** |

**Desvio consciente do pedido:** foi pedido `src/data/catalogData.ts`. Criei
`js/data/catalogData.js`. O projeto é ESM puro sem build — um arquivo `.ts` simplesmente não
carregaria no navegador. Mesma estrutura, mesmos nomes de campo.

**Segundo desvio:** foi pedido que o download servisse "o arquivo estático da pasta `Institucional`".
Publiquei cópias em `assets/catalogo/` com nomes ASCII. Os nomes originais têm acento, espaço
duplo e um acento agudo solto (`d´água`) — caracteres que quebram URL em host estático. O campo
`arquivoOriginal` guarda o nome de origem para rastreabilidade.

**Material de impressão:** conforme pedido, todos os itens usam o padrão `PVC Adesivado` e
`bestFormat: PDF`. Adicionei a flag `materialConfirmado: false`, que faz a interface exibir a
informação como **sugestão a validar** em vez de especificação confirmada.

**Miniaturas:** gerei 35 thumbnails de ~600px (1,4 MB no total). Servir 27 MB de PNGs em grade
deixaria o catálogo impraticável.

#### Frente 2 — Renomeação e catálogo

"Governança" → **Hospitalidade**. "Manutenção" → **Institucionais Gerais**, transformado em
interface de catálogo com busca, grade de cards e modal com instruções de impressão.

A ordem dos passos deixou de ser uma constante global e passou a ser calculada a partir do estado
(`getStepOrder`), porque um setor de catálogo tem caminho diferente de um setor gerador.

#### Frente 3 — Acqua Park

Módulo novo de comunicados. Ao abrir as artes-base, descobri que **o título "COMUNICADO" já vem
impresso** — o que definiu o layout: os campos entram abaixo dele.

**Área segura medida na própria imagem**, não estimada: o título impresso termina em y=414px e a
fita laranja com a logo do parque volta a entrar em y=1173px. A caixa vai de 478 a 1133, com as
laterais 30px dentro do cartão.

Conforme pedido, os textos usam **exclusivamente Fibra One**, no peso SemiBold — confirmei no
navegador que o peso 600 é o realmente aplicado no Canvas (777px de largura contra 700px do
fallback, medindo a mesma palavra).

---

### 3.8 Ajustes finais de escopo

| Pedido | O que mudou |
|---|---|
| Remover o Assunto do Acqua Park | Sobrou só o corpo do texto; o campo `corpo` do estado deixou de existir |
| Tirar "Cartões de Boas-Vindas — Em breve" | Cartão removido |
| Artes de hospitalidade na aba de Hospitalidade | Setor virou catálogo próprio + gerador da carta em destaque |
| Institucionais só com artes institucionais | Categoria fixa por aba |
| Remover "Criar aviso personalizado" | Removido, junto com os modelos editáveis A3/A4 |
| "Design" → "Marketing" | Trocado na interface e nos comentários do código |

**Sobre a mudança de arquivos:** você moveu 3 artes de Hospitalidade para Institucional
(Prato Vegano, Alimentos Sem Glúten e Zero Lactose, Proibido Fumar Florestal). Identifiquei pelo
`git status` e reclassifiquei no `catalogData.js`. Como os caminhos são derivados de
`categoria` + `id`, bateram automaticamente. Institucional: 24 → 27. Hospitalidade: 11 → 8.

**Arquivos apagados:** `assets/images/manutencao/` (4 PNGs) e a pasta `Manutenção/` com os PSDs.
Estão recuperáveis pelo commit `368cc94`.

---

### 3.9 Bug da quebra de linha

> **Revertida na 3.13.** A correção abaixo fatiava palavras por caractere — exatamente o que
> uma placa impressa não pode ter. O bug original (fonte virando fiapo) foi resolvido de outro
> jeito; o diagnóstico continua válido e por isso a seção fica.

Reportado com dois prints: o texto não quebrava, a fonte encolhia até o mínimo e virava um fiapo
ilegível.

**Causa:** `wrapLines` só quebrava em espaço. Uma sequência longa sem espaço nenhum nunca era
quebrada, então virava uma linha única que jamais cabia na largura. O ajuste automático encolhia
até o mínimo, a linha continuava estourando na horizontal, e a exportação era bloqueada por
"não cabe".

**Correção:** quando a palavra sozinha é mais larga que a linha inteira, ela é fatiada por
caractere e só o último pedaço segue para a linha seguinte, podendo receber a próxima palavra.
A iteração usa `for…of` para não partir pares substitutos no meio de um caractere.

O bug afetava **os três setores de texto**, não só o Acqua Park — a carta de Hospitalidade tinha
o mesmo problema, visível no segundo print enviado.

---

### 3.10 Confete na exportação

Dois canhões nos cantos inferiores disparam quando um arquivo termina de ser gerado, em todos os
setores e nos dois formatos.

**Decisão que tomei sozinho:** dispara no **sucesso**, não no clique. Uma exportação que falha
mostra o toast de erro e nenhum confete — comemorar um download que não aconteceu seria pior que
não comemorar.

Cuidados aplicados:
- Só cores oficiais da marca
- Canvas criado sob demanda e removido quando a última partícula sai da tela
- `pointer-events: none` e z-index acima do modal e do toast — nunca intercepta um clique
- Exportações seguidas reaproveitam o mesmo canvas em vez de empilhar loops concorrentes
- A força acompanha a altura da janela
- `prefers-reduced-motion` suprime a animação; o toast continua sendo o feedback

---

### 3.11 Reorganização do catálogo em três categorias

> **Nomenclatura revista na 3.15.** O setor voltou a se chamar "Manutenção" (ID `manutencao`).
> A divisão do catálogo e tudo o mais desta seção continuam valendo.

Os 27 itens que estavam em `institucional` foram divididos: **5 para A&B**, **22 para Operacional**.
O setor "Institucionais Gerais" virou **"Operacional"** e o A&B passou a oferecer os dois caminhos.

**As 5 artes que migraram para A&B:** Cardápio de Tapioca, Alimentos Sem Glúten e Zero Lactose,
Sorvete e Picolé — Teatro, Prato Vegano, Copos Retornáveis.

| Categoria | Antes | Depois |
|---|---|---|
| `institucional` | 27 | — |
| `operacional` | — | **22** |
| `ab` | — | **5** |
| `hospitalidade` | 8 | **8** |
| **Total** | **35** | **35** |

**O rename do ID interno finalmente ficou seguro.** Até aqui a chave `manutencao` era intocável
porque indexava `assets/images/manutencao/`. Aquela pasta foi apagada na rodada anterior, então o
ID deixou de apontar para qualquer caminho de asset e pôde virar `operacional`. O `governanca`
continua como está — ele ainda indexa `assets/images/governanca/`.

> Atenção para dois `manutencao` diferentes: o **ID do setor** (renomeado) e o **tipo de
> renderização** do Canvas (`tipo: 'manutencao'`, o renderizador de texto livre). São namespaces
> distintos. O segundo ficou intacto de propósito — e hoje é código morto, já que nenhum setor usa
> mais aquele renderizador. Limpeza separada, em outra rodada.

**Fluxo misto.** O A&B ganhou `fluxo: 'misto'`, que insere um passo `modo` antes dos demais:

```
misto + modo=null       → ['setor','modo']
misto + modo='gerador'  → ['setor','modo','formato','modelo','edicao','previa','download']
misto + modo='catalogo' → ['setor','modo','catalogo']
```

Considerei reaproveitar o padrão da Hospitalidade — catálogo com um cartão de "criar" no topo,
zero código de navegação novo. Optei pela tela dedicada porque a hierarquia de uso é inversa: na
Hospitalidade o catálogo é o prato principal; no A&B, criar identificação de prato é a tarefa
diária e as 5 artes prontas são consulta ocasional. Enterrar o gerador atrás de uma grade de
miniaturas inverteria essa relação.

**Estrutura de pastas.** `Institucional/` → `Operacional/`; as 5 artes que migraram foram para
`A&B/Artes Prontas/`, preservando os modelos do gerador na raiz de `A&B/`. Como `/A&B/` já estava
no `.vercelignore` desde o início, a subpasta nova já nasceu fora do deploy.

**Miniaturas: zero regeneração.** As 27 já existiam em ~600px; só mudaram de pasta.

**Migração de cache: considerada e descartada** — veja a seção "Em aberto".

---

### 3.12 A&B abre direto no catálogo — fim da tela de modo

A tela de escolha da seção anterior durou uma rodada. Na prática ela era um passo a mais para
chegar ao mesmo lugar, e o A&B passou a seguir o padrão que a Hospitalidade já usava: catálogo
com o cartão **"Criar uma nova arte"** no topo, separador "ou baixe uma arte pronta", busca e
grade.

**O que saiu:** `js/ui/steps/modoStep.js`, o passo `modo` do stepper (rótulo "Opção"), as
constantes `FLUXO_MISTO*`, a função `entrarNoCatalogo` e o bloco `modos` do A&B em `models.js`.

**O que entrou:** o A&B virou `fluxo: 'catalogo'` com `acaoGerador`, igual à Hospitalidade. Os
dois setores ganharam `subtituloCatalogo` (a frase abaixo do título, que antes era fixa na tela e
falava só da carta), e a busca ganhou um placeholder por categoria com termos que existem de fato
nas tags (`tapioca, vegano, sem glúten, sorvete`).

**`getStepOrder` voltou a ter três saídas:**

```
fluxo gerador / sem setor    → ['setor','formato','modelo','edicao','previa','download']
catalogo + modo=null         → ['setor','catalogo']
catalogo + modo='gerador'    → ['setor','catalogo','formato','modelo','edicao','previa','download']
```

O flag `modo` (`null | 'gerador'`) **ficou**: remover o fluxo misto não implica remover o
mecanismo que a Hospitalidade sempre usou para sair do catálogo rumo à carta — é ele que estende a
ordem de passos, sem nenhum passo de "modo" na interface. Renomear para `noGerador` custaria
mexer em `setorStep.js` e `entrarNoGerador` sem ganho.

**Rodapé do card de setor:** catálogo com mais de um formato no gerador mostra as duas modalidades
("3 formatos + 5 prontas"); com um formato só, o gerador é acessório e o card fala apenas das artes
prontas ("8 artes prontas"). A Hospitalidade não mudou.

**Stepper:** o A&B mostra "Setor → Catálogo" ao abrir e "Setor → Catálogo → Formato → … →
Download" ao clicar em criar — o mesmo que a Hospitalidade.

**Decisão consciente — Voltar não limpa o `modo`.** Ao voltar do Formato para o catálogo,
`modo: 'gerador'` permanece e os sete passos continuam no stepper, com Formato alcançável. O teste
expôs isso (a expectativa inicial era "Setor → Catálogo" de novo) e havia dois caminhos:

1. *Manter* — igual à Hospitalidade, que usa o mesmo `goBack`. Clicar em "Formato" no stepper leva
   a uma ação válida; não é bug.
2. *Limpar `modo` no `goBack`* — duas linhas, o stepper encolheria de volta, mas mudaria a
   Hospitalidade junto.

Ficou o caminho 1: consistência entre os dois setores vale mais que a perfeição local.

**Testes (Playwright, 48 verificações):** A&B abre no catálogo com o botão no topo e a ordem
botão → separador → busca → grade; busca escopada ("reservatório" e "manutenção" → 0, "buffet" → 3
via tag, vazio → os 5 de `ab`); PNG e PDF de arte pronta; fluxo completo do gerador com export;
Voltar do Formato ao catálogo; card do topo idêntico ao da Hospitalidade a menos de cor e texto;
Hospitalidade, Acqua Park e Operacional sem regressão. `node --check` nos 5 módulos alterados.

---

### 3.13 Palavra nunca é partida — reversão da 3.9

A correção da 3.9 resolvia o fiapo fatiando a palavra por caractere. Numa arte impressa isso é
pior que o problema: "Strogo/noff" lê como erro de gráfica, e a equipe do resort não tem como
revisar cada placa. Regra nova: **quebra só em espaço; palavra nunca é partida — nem por
caractere, nem por sílaba, nem com hífen.**

Para não reabrir o bug da 3.9, o encolhimento passou a distinguir **dois motivos**:

| Motivo | Regra |
|---|---|
| **Altura** — texto longo, linhas não cabem empilhadas | corpo desce livremente até `minSize`, como sempre (a carta depende disso) |
| **Palavra longa** — texto cabe em altura, mas uma palavra sozinha é mais larga que a área | corpo desce só até **60 % do tamanho natural** do bloco; se ainda não couber, `fits: false` com a palavra em `palavraLonga` |

"Tamanho natural" é o primeiro corpo em que a altura cabe — **não** o `maxSize` do bloco. A
diferença importa: um texto que já cai a 50 % por altura e cabe nesse 50 % não deve ser bloqueado
por um piso calculado sobre um corpo que ele nunca usaria. Foi a interpretação apresentada e
aprovada antes de codar.

**Como o motor sabe qual palavra estourou:** com quebra só por espaço, qualquer linha mais larga
que a área é, por construção, uma palavra só. `fitFontSize` guarda a linha mais larga do último
tamanho testado e a devolve. `renderCanvas` passa `palavraLonga` adiante; `previewPanel` grava no
estado ao lado de `fits`.

**Poka-Yoke nos quatro pontos** que já bloqueavam por `fits` (banner da prévia, hint do Continuar
em Texto, alerta em Prévia, alerta em Download): a mensagem passa a nomear o termo — *"A palavra
'X' é muito longa para este formato. Reduza o texto ou escolha outro modelo."* — montada uma vez
em `motivoNaoCoube()` (`common.js`) para que a pessoa leia a mesma coisa em qualquer tela. Quando
o estouro é de altura, o texto antigo continua.

**Testes (Playwright):** direto no `renderCanvas` — palavra média cabe encolhendo, gigante bloqueia
nomeada inteira, carta de 14 frases continua cabendo por altura, carta + palavra de 138
caracteres bloqueia, estouro de altura puro reporta sem palavra, A&B com prato real e com ES cabe.
Na interface: Acqua Park e Hospitalidade com os quatro pontos de bloqueio e a liberação ao
corrigir. Um detalhe que o teste ensinou: em A4 a 300 DPI (~1870 px úteis) uma palavra de 46
letras em Satisfy **cabe** — só bloqueia acima de ~100 caracteres. O piso está fazendo o que deve.

---

### 3.14 Biblioteca de pratos: 406 → 424 entradas

Arquivo novo (`biblioteca_pratos_bebidas_loucas_pratagy_pt_es_att1.docx`), copiado por cima de
`assets/docx/biblioteca_ab.docx` e da duplicata da raiz, mantendo os nomes.

**Estrutura mudou** — e de um jeito diferente do descrito no pedido, o que foi reportado antes de
adaptar: as categorias são parágrafos comuns (`1. Carnes, aves…`), **não** Heading, então o mammoth
emite `<p>`; as tabelas de pratos têm **três** colunas (`#`, PT, ES), não duas; e há uma tabela de
resumo no início (`#`, Categoria, Total) sem pratos. O parser anda o documento em ordem, usa o
último título `N. …` visto como categoria da tabela seguinte e ignora tabelas cujo cabeçalho não
tem "Nome em Português". A coluna "Origem/status" não existe mais: o selo "sugestão" do
autocomplete virou código morto e foi removido.

**Diferença, medida direto no XML antes de trocar (relatório aprovado):**

- 406 → 423 linhas; 389 em comum, 32 adicionadas, 17 removidas, 31 traduções alteradas
- 14 → 12 categorias: `Pratos principais – proteínas` fundiu em `Carnes, aves, peixes e frutos do
  mar`; `Petiscos e caldos` fundiu em `Petiscos, lanches e ações rápidas`
- 2 pratos repetidos no arquivo (`Caldo de camarão`, `Cachorro-quente`) → **deduplicação por PT
  normalizado, primeira ocorrência fica** → 421 únicas
- **3 itens ORIGINAL dos cardápios de 2025** haviam saído (Filé de peixe, Coxinha frita, Costelinha
  ao barbecue) → **mesclados de volta** com a tradução da versão anterior, em `LEGADOS` no módulo,
  com `origem: 'legado'` → **424**
- Traduções migraram do espanhol da Espanha para o rio-platense (`patata`→`papa`,
  `empanizado`→`rebozado`, `Palomitas`→`Pochoclo`, `cacahuete`→`Maní`…). Todas aceitas.

> **Acentuação em espanhol: mantida de propósito.** O relatório apontou "Pure de papas" e "Pernil
> suino" sem acento. Caixa e um ponto final solto foram corrigidos no documento; **os acentos não**
> — a tradutora do resort validou os termos assim. Sessões futuras: não "corrigir".

**Busca da biblioteca ganhou multi-termo.** Era substring simples, e "costelinha barbecue" (sem o
"ao") não achava "Costelinha ao barbecue". Agora cada palavra digitada precisa aparecer no item, em
qualquer ordem — a mesma regra do catálogo. Para um termo só, o comportamento é idêntico.

**Cache:** `DOCX_VERSION_TAG` `biblioteca_ab-v1` → `v2`. Na primeira visita o app descarta o
IndexedDB antigo e reprocessa; confirmado no teste (`meta.docxVersion = biblioteca_ab-v2`,
424 registros no store).

**Contagens (mesmo `searchLibrary` do app, sem limite):** camarão 15 — o relatório dizia 16
porque contava a linha duplicada de "Caldo de camarão" —, pizza 9, tapioca 1, empanado 3; "filé de
peixe" 4, "coxinha frita" 1, "costelinha barbecue" 2 (o legado **e** um "Costelinha barbecue" novo
do arquivo — o legado pode ser aposentado quando a cozinha confirmar). O autocomplete mostra no
máximo 8.

---

### 3.15 "Operacional" volta a ser "Manutenção"

Terceiro nome do mesmo setor: "Manutenção" (original, ID `manutencao`) → "Institucionais Gerais"
(3.7, ID mantido) → "Operacional" (3.11, ID `operacional`) → **"Manutenção"** (agora, ID
`manutencao`).

**A decisão da 3.11 foi revista.** Lá o argumento era que "Operacional" descrevia melhor um
catálogo que tinha crescido além da manutenção predial. O que pesou agora é outro critério, que o
projeto sempre colocou na frente: **o nome que a equipe usa no dia a dia**. Ninguém no resort
procura "arte operacional"; procura "a placa da manutenção". Não é indecisão — é a interface
seguindo o vocabulário de quem a usa.

**O que mudou**

| Onde | Antes | Agora |
|---|---|---|
| Interface (card, catálogo, selo do modal, meta description) | Operacional / `OPER` | **Manutenção** / `MANUT` |
| ID do setor, categoria do catálogo, ícone, descrição, placeholder | `operacional` | `manutencao` |
| `assets/catalogo/operacional/` (22 PNG) e `thumbs/operacional/` (22 JPG) | — | `…/manutencao/` |
| Pasta de trabalho na raiz (22 originais) + `.vercelignore` | `Operacional/` | `Manutencao/` |

Regra mantida: **interface com acento, código em ASCII** (`manutencao`), como todos os caminhos de
`assets/catalogo/` desde a 3.7. Os 66 arquivos foram movidos com `git mv` e o Git os registra
como rename (`R`), não como remoção + adição — o histórico de cada PNG continua acessível.

**Por que é seguro:** a 3.11 já verificou que nenhum cache é indexado por ID de setor —
`localStorage`/`sessionStorage` não são usados e o único IndexedDB é a biblioteca de pratos,
versionada pela própria tag. O estado é em memória e zera a cada reload. Renomear o ID é uma
troca de string, sem migração.

**Sobre o `tipo: 'manutencao'` do motor de Canvas:** continua sendo outro namespace (o
renderizador de texto livre, hoje sem setor que o use). O ID do setor voltou a coincidir com ele
por acaso histórico, não por dependência — os dois já coincidiam antes da 3.11.

**Verificação:** `grep -ri operacional` em código, HTML, config e README devolve zero (as menções
que restam estão só neste histórico, onde pertencem); `node --check` nos 5 módulos; Playwright com
62 verificações — os 4 setores abrindo, "Manutenção" com ç e ã no card, no catálogo e no selo,
22 cards com as 22 miniaturas carregadas de `thumbs/manutencao/`, busca ("poço" → 2, "tapioca" →
0), PNG e PDF, e o fluxo completo de A&B, Hospitalidade e Acqua Park sem regressão.

---

### 3.16 Impressão em lote: várias placas do A&B numa folha A4

As placas de buffet saem às dezenas e o sistema só exportava uma por vez. Agora o passo
**Download** do A&B tem um terceiro cartão, **"Impressão em lote"**, que abre um modal: quantas
placas por folha, o máximo do formato explícito, um diagrama da folha em SVG (retângulos, não
miniaturas) e o botão que gera o PDF. Só no gerador do A&B (`permiteLote: true` em `models.js`);
o catálogo de artes prontas e os outros setores não mudam.

**Grade por formato** — calculada, não tabelada. Para cada formato o código testa a folha A4 em
pé e deitada, com a placa sempre em pé, e fica com a que rende mais (empate → em pé). Margem de
10 mm; calha de 3 mm entre placas.

| Formato | Folha | Grade | Por folha |
|---|---|---|---|
| 8×5 cm | A4 em pé | 2 × 5 | **10** |
| 8×10 cm | A4 em pé | 2 × 2 | **4** |
| 10×15 cm | **A4 deitada** | 2 × 1 | **2** |

O 10×15 foi o caso que justificou a regra: em pé, duas colunas dão 200 mm numa área útil de 190
(só com margem de 5 mm, que impressoras comuns não respeitam) e 1 × 2 dá 300 mm > 297 — não cabe
nem sem margem. Deitada cabe com folga. O PDF já nasce em paisagem e o leitor escolhe a orientação
ao imprimir. Se entrar um formato novo, ele ganha a grade sozinho.

**Calha de 3 mm, e por quê.** A arte-base tem faixas azuis em cima e embaixo e laterais brancas.
Encostadas, duas placas viram uma faixa azul contínua e duas laterais sem fronteira: quem corta
com tesoura não vê onde termina uma. 3 mm de branco marcam o corte e toleram 1–2 mm de tremida
sem comer a vizinha.

**Sem marcas de corte, sem sangria.** É impressão interna, na impressora do resort, não arquivo de
gráfica. Marca de corte seria ruído para quem corta com tesoura.

**Downloads individuais intactos.** PNG e PDF de uma placa continuam exatamente como eram
(`handleExport` não foi tocado; o lote tem o próprio `handleLote`). O PDF individual segue no
tamanho físico da placa, sem folha em volta.

**Detalhes de implementação que valem lembrar**

- A placa da folha é o mesmo canvas da prévia, pixel a pixel o PNG individual — nada é
  renderizado de novo.
- O PNG vira imagem do PDF **uma vez** (mesmo `alias` no jsPDF) e as N placas apontam para ela:
  a folha com 10 pesa o mesmo que a com 3 (107 KB vs 108 KB no teste).
- `fits` é derivado do canvas a cada render, não um flag solto. O teste tentou injetar
  `fits: false` e o app o sobrescreveu na hora — o caminho real é um texto que não cabe, e o
  cartão de lote é desabilitado junto com PNG/PDF.
- Poka-Yoke do campo: acima do máximo corrige na hora com aviso ("15 → 10"); vazio ou zero
  desabilita o botão enquanto digita e, ao sair do campo, volta ao máximo — uma folha cheia é o
  caso comum e ninguém quer uma folha em branco. O modal é montado do zero a cada abertura:
  trocar o formato e reabrir já mostra o novo máximo.
- Nome do arquivo: `pratagy-lote-<formato>-<n>un.pdf`.

**Testes (Playwright, 48 verificações):** grade e posições direto no módulo; os 3 formatos gerados
e inspecionados nos bytes do PDF — `MediaBox` 595.28 × 841.89 pt (A4 exato) para 8×5 e 8×10,
841.89 × 595.28 para o 10×15, uma página, imagem embutida uma vez, N colocações com largura e
altura exatas em pontos e posições (10,10)/(93,10)/(10,63) mm para 3 placas; 15 → 10 com aviso;
vazio/zero; estado limpo ao reabrir; PNG/PDF individuais inalterados (80 × 50 mm, uma colocação em
0,0); arte inválida desabilita os três cartões; Acqua Park e Hospitalidade sem o cartão; catálogos
intactos. Os PDFs foram abertos e conferidos visualmente.

---

### 3.17 Setor RH: Atenção, Talento do Mês e Aniversariantes do Dia

O RH mandava modelos do Canva para o Marketing adaptar — e saía do padrão (fonte, cor, caixa
colada na borda). Este ciclo internaliza três peças no sistema, todas 1080×1440 px.

**Medições (pixel a pixel, via Canvas do Chromium — sem Pillow na máquina):**

| Peça | Medida | Valor (px) |
|---|---|---|
| Atenção | Cartão branco / barra "ATENÇÃO" | x 97–983 · y 77–1252 / x 283–779 · y 187–269 (`#008BCE`) |
| | Intrusões dos megafones no cartão | x ≤ 150 (y 405–555); x ≥ 754 (y ≥ 1131) |
| | **Área segura** | **x 175–905 · y 367–1145** (refinada, ver abaixo) — largura: livre 151–984 espelhada no centro do cartão (540), 24 px de respiro |
| Talento | Quadrado amarelo (cantos) | TL (290,429) · TR (730,368) · BR (790,843) · BL (346,895) |
| | Foto / rotação / centro | **445×474 px, −7,89°, centro (540, 631,5)**; placeholder `#E1CC1B` |
| | Moldura branca (`#E4E5E9`) | topo 45 · laterais 38–40 · **base 76** |
| Aniversariantes | Título "DO DIA" | x 315–765 · y 273–371 |
| | Limitadores | "INFO-313-REV.00" x 37–56; balão azul-claro x ≥ 942; balões de baixo y ≥ 1196; logo y ≥ 1326 |
| | **Área útil dos cards** | **x 140–940 · y 411–1174** (refinada duas vezes, ver 3.17.1 e 3.17.2) |

O Aniversariantes chegou primeiro em 1242×1754 (A4 a 150 DPI, apesar do nome do arquivo); a
versão 1080×1440 foi salva em `_Sistema de Placas - EDIT/RH/` e copiada para `RH/`. As medições
foram refeitas do zero — não escaladas.

**Arquitetura (`js/rh/`, 6 módulos, nada no motor):**

- `templates.js` — os 3 formatos do setor, com `editor` por formato (`'atencao' | 'talento' |
  'aniversariantes'`). O motor lê área segura em mm; `safeAreaMmDePx` converte as medições —
  **o motor não muda uma linha**. Cores das faixas: nome `#FDD945`/`#004F9F`, setor
  `#004F9F`/branco (o amarelo é o "do Mês" da própria arte; o azul, o do título "Talento").
- `cardRenderer.js` — foto (círculo ou quadrado girado; sem foto, placeholder `#004F9F` com
  iniciais `#C0E5FB`), faixas em pílula, e a regra de crescimento aprovada: **cresce em largura
  até 90 % do card → fonte reduz até 20 % → só o nome quebra em 2 linhas → senão, não coube**.
  `janelaDaFoto` guarda o enquadramento em frações da imagem (zoom + centro), então o editor de
  200 px e a arte de 445 px mostram exatamente o mesmo recorte.
- `gridLayout.js` — 1 pessoa centralizada; 2 lado a lado; 3–6 em duas colunas; 7–9 em três;
  linha incompleta centralizada; bloco centralizado na área. Medidas por número de linhas
  (foto 280/200/118 px) escolhidas para o pior caso (nomes em 2 linhas em todas as linhas) ainda
  caber. **Máximo: 9.**
- `render.js` — compõe template + cards e devolve `{ fits, aviso }`, o mesmo contrato do motor.
  Talento: foto recortada no quadrado girado com 6 px de sangria (cobre o anti-aliasing do
  amarelo), faixas **giradas junto com o polaroid** e empilhadas de baixo para cima a partir da
  borda da moldura — setor na tira branca, nome montado sobre a borda da foto, como legenda de
  polaroid. A ponta do "b" de "parabéns" fica por baixo; é fundo decorativo.
- `photoEditor.js` — `<input type=file>`, visor com máscara, arrastar por Pointer Events, zoom
  por roda e slider (1×–4×). Object URL revogada ao carregar.
- `editorRH.js` — tela do Talento (1 colaborador) e do Aniversariantes (quantidade 1–9, uma
  linha por pessoa). Colaboradores são objetos mutáveis em `state.rh` (a foto é um
  `HTMLImageElement`, não serializável); cada mudança faz `setState` com throttle por frame, e a
  guarda de montagem do passo evita recriar os campos.

**Despacho por formato, não por setor.** `modoDeEdicao(setor, formato) = formato.editor ||
setor.tipoTexto`: `edicaoStep` e `previewPanel` ganharam três linhas cada; os setores antigos
continuam despachando por `tipoTexto`. O Atenção é `editor: 'atencao'` → textarea existente +
renderizador `comunicado` do motor com `corCorpo: '#004F9F'` — zero código novo de render, e a
mesma regra de palavra longa da 3.13.

**Poka-Yoke.** `fits` continua derivado do render (a 3.16 provou que injetar `fits: false` não
cola). O compositor nomeia o culpado em `avisoEncaixe` — *"O nome 'X' não cabe no card, mesmo
reduzido e em duas linhas."* — e `motivoNaoCoube` mostra isso na prévia, no Continuar, na Prévia
e no Download. Continuar também exige nome e setor de todos. Quantidade acima de 9 corrige para 9.

**LGPD — sem persistência, por construção.** Nada do RH toca IndexedDB, localStorage ou
sessionStorage; o único banco continua sendo a biblioteca de pratos. Recarregar volta ao passo
Setor com a lista vazia. O teste confirma: stores = `biblioteca_ab, meta`, storages vazios,
nenhum nome ou `data:image` nos registros.

**Decisões registradas:** foto opcional (placeholder com iniciais) para não travar a publicação
quando falta a foto de alguém; faixas do Talento giradas (não havia lugar reto — abaixo do
polaroid está o "parabéns"); máximo 9 com 3 colunas em vez de sempre-2 (foto de 118 px em vez
de 105); Aniversariantes em 1080×1440 como as outras duas.

**Testes (Playwright, 57 verificações):** setor e 3 templates; Atenção com texto azul dentro da
área segura, palavra gigante bloqueando, PNG 1080×1440; Talento com upload (imagem gerada no
teste, 900 px), arraste mudando `cx/cy`, roda e slider mudando o zoom, placeholder e foto
sondados por pixel, nome absurdo bloqueando e nomeando, PNG/PDF, bloqueio no Download por setor
longo; Aniversariantes com 1, 2, 4, 6 e 9 — **centros das fotos sondados por pixel em posições
calculadas no teste**, independentes do código —, 15 → 9, nome absurdo em 1 de 4; reload limpo;
regressão dos 4 setores, catálogos e lote. Suítes anteriores (v5, v6, v7) repetidas: 159 verdes.

#### 3.17.1 Refinamentos visuais (segunda rodada)

Depois da validação em produção, três ajustes — nenhum estrutural. Antes de codar, três premissas
do pedido foram corrigidas com medição: "y 175–905" era o eixo **x**; os números 477/510/1395
eram da versão 1242×1754 do Aniversariantes; e o Aniversariantes **não tem onda** — embaixo, o
que limita são os balões (dourado da direita a partir de y 1202) e o logo (1326).

**Atenção — área simétrica e texto centralizado.** Medições novas: topo da onda verde em
**1243**; megafone inferior direito em x 754–983 · y 1131–1239, entrando na faixa de texto
(x ≤ 905) em **y 1165**. Área nova **y 367–1145**: teto de baixo = megafone − 20; os 98 px que
sobram até a onda são espelhados acima da barra (269 + 98). O problema real, porém, não era a
área: o renderizador `comunicado` do motor **alinha o bloco ao topo** (é o desenho do Acqua Park,
onde o texto continua o título impresso). Um comunicado curto ficava colado no topo com o vazio
embaixo, e mover a área não muda isso. Solução aprovada: o compositor do RH desenha o texto com
`fitFontSize` + `drawTextBlock` do motor — **mesma tipografia e limites do comunicado** (SemiBold,
2,1–5,8 % da largura, entrelinha 1,38, piso de 60 % para palavra longa) — com
`verticalAlign: 'middle'`. Para isso, `engine.js` ganhou **duas palavras `export`** e um
comentário; nenhuma lógica mudou, e cada ramo interno segue definindo o próprio alinhamento (o
teste confirma o comunicado do Acqua Park começando em y 482, no topo da área). A alternativa sem
tocar o motor era o renderizador `manutencao`, já centrado, mas Heavy até 97 px — cartaz, não
comunicado.

**Talento — faixas com cantos de 8 px.** O raio era `min(altura/2, fonte×0,85)` (pílula). O
template declara `raioFaixa: 8` e `desenharFaixa` aceita o raio por parâmetro; sem ele, continua
pílula. Aniversariantes fica em pílula nas duas faixas (confirmado nas referências).

**Aniversariantes — fotos maiores.** Pergunta respondida com medição: a área **já estava no
limite físico** — com 40 px de respiro do título (371) e do balão (1202), o retângulo de largura
total vai de **411 a 1161**, quase o que havia. O conservador era outra coisa: as fotos eram
dimensionadas para o pior caso (nome em duas linhas em todas as linhas). Agora são dimensionadas
para o caso comum e, quando um nome quebra e o bloco estoura, **só as fotos encolhem em passos**
(`ESCALAS_FOTO` 1 → 0,92 → 0,85 → 0,78 → 0,7) até caber; os nomes ficam legíveis. Se nem a 0,7
couber, bloqueia como antes.

| Pessoas | Foto antes | Foto agora (nomes em 1 linha) | Nome em 2 linhas numa linha da grade | Em todas as linhas |
|---|---|---|---|---|
| 1 | 280 | **320** | 320 | 320 |
| 2 | 280 | **320** | 320 | 320 |
| 4 | 200 | **240** | 240* | 204 (0,85) |
| 6 | 118 | **145** | 133 (0,92) | 113 (0,78) |
| 9 | 118 | **145** | 133 (0,92) | 113 (0,78) |

\* No layout de 4 a faixa vai até 320 px: nomes de duas palavras cabem em uma linha com a fonte
reduzida (a regra reduz antes de quebrar); só nomes de três palavras quebram. Valores medidos por
pixel no teste (corda vertical do círculo), não lidos do código.

**Testes (Playwright, 22 verificações novas):** centro do bloco do Atenção medido pela caixa
envolvente do texto (744–748 px para curto e longo, centro da área 756); Acqua Park ancorado ao
topo; canto das faixas sondado a 1 e 3 px (raio 8: vazio/cheio; pílula: vazio/vazio); diâmetro
das fotos para 1/2/4/6/9 e para os casos de duas linhas ("Alexssandro Davis", "Mayrla Leite");
PNGs em 1080×1440. Suítes v5–v8 repetidas (v8 atualizada para a grade nova): 216 verdes.

#### 3.17.2 Aniversariantes: área mais larga para o setor caber

O problema relatado era um caso concreto: **"Departamento Pessoal" não cabia na faixa** do layout
de 9. Isso é largura, não altura — e a 3.17.1 tinha tratado só o eixo Y, porque a pergunta de lá
era sobre o tamanho das fotos.

**Uma premissa corrigida:** o pedido dizia "topo em y 402"; o topo real já era **411** desde a
3.17.1 (402 vinha da versão anterior). 411 é mais baixo que 402, então mantê-lo respeita
"não subir a área" — ficou 411.

**Medições novas (1080×1440):**

| O que limita | Onde |
|---|---|
| Balão azul-claro da direita | x ≥ 942, de y ≈ 792 a ≈ 1200 → **x 940 é o teto lateral** |
| Balão dourado inferior direito | invade a faixa a partir de y **1195** (na largura 800) |
| Balão azul inferior esquerdo | x ≥ 174 a partir de y 1266 (abaixo da área) |
| "INFO-313-REV.00" | x 37–56 (não atrapalha) |
| Logo | y ≥ 1326 |

Varrendo faixas simétricas em torno do centro (540): largura 800 (x 140–940) fica limpa até
y 1194; a partir de 820 (x 130–950) o balão azul-claro corta já em y 792. **800 é o limite
físico da largura.**

**Área: x 169–911 · y 411–1161 → x 140–940 · y 411–1174.** Largura 742 → **800** (+58);
altura 750 → **763** (+13), com 20 px de respiro do balão dourado — o mínimo que o pedido
autorizava.

**"Departamento Pessoal" — a conta.** No layout de 9 (3 colunas) a célula é `largura/3`, o card
`célula − 16` e a faixa 90 % do card. Rodando o `ajustarFaixa` real:

| Área | Célula | Card | Faixa máx | Resultado |
|---|---|---|---|---|
| 742 (antes) | 247 | 231 | 208 | **não cabe** (212 px seria o mínimo, a 16 px) |
| **800 (agora)** | 267 | 251 | **226** | **cabe em 1 linha, 17 px** (faixa de 226 px) |

Cabe com a fonte reduzida a 85 % (17 de 20 px), sem quebrar em duas linhas — então a regra
"só o nome quebra, o setor nunca" **ficou como estava**. O pedido autorizava quebrar o setor em
duas linhas se necessário; não foi necessário, e a alternativa mais simples venceu. Se um dia
aparecer um setor ainda mais longo, o caminho é passar `permiteQuebra: true` na faixa de setor —
uma palavra.

**Fotos: cresceram onde a altura permitiu.** O ganho vertical foi pequeno (+13 px), então os
tamanhos subiram pouco. Com 1 ou 2 pessoas nada mudou: a altura permitiria muito mais, mas com
2 pessoas a célula tem 400 px e o card 384 — 320 já é quase o limite lateral.

| Pessoas | Antes | Agora | Limite pela altura |
|---|---|---|---|
| 1 | 320 | **320** (limite lateral, não vertical) | — |
| 2 | 320 | **320** (idem) | — |
| 4 | 240 | **250** | 256 |
| 6 | 145 | **150** | 151 |
| 9 | 145 | **150** | 151 |

O encolhimento adaptativo para nomes em duas linhas acompanha: 9 pessoas com uma linha da grade
quebrada → 138 (era 133); com todas quebradas → 117 (era 113); 4 pessoas com todas quebradas →
213 (era 204).

**Testes (Playwright, 27 verificações):** diâmetros de 1/2/4/6/9 e dos casos de duas linhas
medidos por pixel; `ajustarFaixa` real confirmando "Departamento Pessoal" em 1 linha a 17 px;
9 e 4 pessoas com esse setor em todos os cards liberando a exportação; nenhum card acima de
y 411. Suítes v5–v8 repetidas (v8 atualizada para a grade nova): 216 verdes.

### 3.18 Encontro Geral: o quarto template do RH

Uma peça 100 % texto com dois campos independentes — o comunicado no miolo e a **data** ao lado
do ícone de calendário que já vem impresso na arte. O horário ("15hOO") e o local ("No Teatro do
Pratagy Resort") são parte do PNG e não se editam.

**O arquivo tinha outro nome.** O pedido apontava `RH/encontro-geral.png`; o arquivo real é
`RH/Encontro Geral - Grupo Pratagy - 1080x1440px.png`, no mesmo padrão dos outros três.

#### Medições (1080×1440)

| Elemento | Caixa | Centro vertical |
|---|---|---|
| Ilustração (megafone e pessoas) | x 58–443 · y 43–**491** (o ponto mais baixo é uma engrenagem em x 377–426) | — |
| Badge "Encontro Geral" | x 480–980 · y 150–378 | — |
| **Vão limpo, 100 % livre na largura inteira** | **y 492–853** | 672,5 |
| Ícone de calendário | x 189–225 · y 864–897 | 880,5 |
| Ícone de relógio | x 482–516 · y 862–898 | 880 |
| Texto "15hOO" | x 531–610 · y 871–891 | 881 |
| Ícone de local | x 666–700 · y 863–899 | 881 |
| "No Teatro do / Pratagy Resort" | x 714–890 · y 854–908 (2 linhas) | 881 |
| Frase "Juntos, fazemos…" | x 190–891 · y 1004–1078 | — |

Espaço bruto entre o calendário e o relógio: **256 px** (x 226–481). Gaps de referência da própria
arte: ícone→texto **14 px**; texto→ícone, separando grupos, **55 px**.

**A medição que decidiu o layout:** a fileira de ícones (x 189–890) e a frase impressa de baixo
(x 190–891) têm **exatamente a mesma largura, 702 px, simétricas no centro (540)**. Essa é a coluna
de conteúdo da peça — a margem lateral do comunicado não foi escolhida, foi lida da arte.

**Tipografia dos irmãos impressos:** "15hOO" mede 80 px e "Pratagy Resort" 177 px; os dois batem em
**Fibra One Heavy (800) a 24 px**, e o bloco de duas linhas de 55 px dá **entrelinha 1,15**. Cor
amostrada: **#004F9F**, a mesma do Atenção. A data usa exatamente esses valores, então ela lê como
parte da arte e não como um texto colado por cima.

| Área | Caixa | Origem |
|---|---|---|
| **Comunicado** | x 189–891 · y 516–829 (702×313) | coluna de conteúdo da arte; 24 px de respiro da engrenagem (491) e da fileira de ícones (854); centro em 672,5, o centro exato do vão |
| **Data** | x 239–443 (204 px) · y 853–909 (56 px) | 239 = 225 + os 14 px de gap ícone→texto da arte; centro em 881, o mesmo dos três ícones e dos dois textos impressos |

#### Arquitetura: nem componente novo, nem modo novo no `cardRenderer`

As duas opções levantadas no pedido foram descartadas, porque **o motor já fazia tudo**:

- `drawTextBlock` já aceita `align: 'left'` (usa `safeAreaPx.x` como origem) e
  `verticalAlign: 'middle'`; `fitFontSize` já dá o auto-shrink, a quebra só por espaço e o
  `palavraLonga` do Poka-Yoke. Os dois já estavam exportados desde a 3.17.1 — **`engine.js` não
  mudou nesta rodada**.
- `cardRenderer.js` existe para desenhar uma *pílula dimensionada pelo texto*: padding derivado do
  corpo, cor de fundo, raio. A data não tem pílula, não tem padding e a caixa dela é fixa (o vão
  entre dois ícones impressos), não derivada do texto. Um `textAlign: 'left'` ali significaria
  quatro flags desligando quase tudo que o módulo faz — no módulo de que Talento e Aniversariantes
  dependem. Risco de regressão por zero reuso. **`cardRenderer.js` também não mudou.**

**O teto de duas linhas não é código.** Com entrelinha 1,15 e piso de 18 px, três linhas medem
62,1 px e a caixa tem 56: não existe terceira linha que caiba. A regra sai da geometria, e
`fitFontSize` bloqueia sozinho a partir daí.

O compositor ganhou `desenharComunicado`, que o Atenção e o Encontro compartilham — mesma
tipografia, mesmo auto-shrink, mesma centralização vertical, cada um com a sua área segura.

#### Casos de data (rodados com o `fitFontSize` real)

| Data | Resultado |
|---|---|
| `05/09` | 24 px · 1 linha |
| `20 de novembro de 2026` | 24 px · 2 linhas |
| `Sábado, 12 de setembro de 2026` | 21 px · 2 linhas ("Sábado, 12 de" / "setembro de 2026") |
| `Segunda-feira, 30 de dezembro de 2026` | 19 px · 2 linhas |
| `Sábado, 12 de setembro de 2026, às 15h em ponto no Teatro` | **bloqueia** |
| `Superextraordinariamentelongapalavra` | **bloqueia**, nomeando a palavra |

**Por que a caixa tem 204 px e não 188.** O respiro perfeitamente consistente com a arte seria
55 px (o gap texto→ícone impresso), o que daria 188 px. Mas a 188 px "Segunda-feira, 30 de dezembro
de 2026" bloqueia — e isso é uma data real, não um caso absurdo. O respiro caiu para 40 px.

Também foi testada a quebra equilibrada do `quebrarEmDuas` contra a quebra gulosa do motor: em
todos os casos reais o resultado é **idêntico**. Ficou a do motor, que já existia.

#### Dois campos, dois critérios

O comunicado pode ficar **em branco** (um Encontro Geral só com a data é legítimo); a data, não.
Quem libera o Continuar é `prontoEncontro`. O `maxlength` do comunicado é **400**, não 600 como no
Atenção: a área tem 313 px de altura contra 778, e a medição mostrou capacidade de ~476 caracteres
em texto corrido e ~425 no pior caso com quatro parágrafos (cada quebra custa uma linha inteira).
O Poka-Yoke continua sendo a rede de segurança; o limite do campo só evita digitar 600 para
descobrir o bloqueio no fim.

**Um remendo de microcópia.** O aviso genérico de encaixe mandava "Abrevie o texto ou reduza a
quantidade de pessoas" — correto para os cards, sem sentido para uma data. A ação genérica virou
"Abrevie o conteúdo para liberar a exportação", e o conselho sobre quantidade de pessoas foi para
dentro do aviso do Aniversariantes, onde ele é verdade.

#### Testes

**Suíte v10, 60 verificações.** A caixa da data é medida **por diferença** contra a mesma arte com
a data vazia: a fileira de ícones já tem tinta azul impressa, e procurar azul numa janela pegaria
o "15hOO". O diff isola exatamente os pixels que a data acrescentou — e é assim que o teste prova
que ela nunca alcança x 482 (o relógio) nem sobe acima de y 829 (a área do comunicado). Verificado
também: alinhamento à esquerda em x 239, centro vertical em 881, uma linha para data curta e duas
para longa, bloqueio da data absurda com aviso que fala de data e não de pessoas, comunicado vazio
liberando, comunicado de 400 caracteres cabendo dentro da área.

Suítes v5–v9 repetidas: **243 verdes**. As v8 e v9 precisaram de ajuste — não por regressão, mas
porque procuravam o template por **índice** (`FORMATOS_RH[1]`) e cravavam "3 formatos". Passaram a
buscar por `id`, para não quebrarem de novo no próximo template.

### 3.19 Seis peças de comunicado puro no RH

Comunicado, Comunicado Importante, Dica do Pratagynho, Fique por Dentro, Seus Benefícios e Você
Sabia — as seis que o RH editava no Canva. Todas são o Atenção com outra arte: texto livre,
auto-shrink, Poka-Yoke, Fibra One SemiBold, centralizado. O setor passou de 4 para **10
templates**; `templates.js` e a grade de formatos aceitaram os seis sem ajuste estrutural.

**Nomenclatura.** O arquivo veio como "Dica Prataginho", mas a arte diz **"Dica do Pratagynho"**
(com Y). O `id` segue a grafia ASCII pedida (`dica-prataginho`); o nome na interface segue a arte.
Todos os PNGs são 1080×1440 a 300 DPI (lido do chunk `pHYs`), o mesmo `BASE` das peças de RH
anteriores — nenhuma conversão nova.

#### Medições

O predicado de "fundo limpo" mudou em relação ao Encontro Geral: **saturação ≤ 22 e canal mínimo
≥ 195**. A saturação é quem separa fundo de objeto — todo elemento dessas artes (megafone vermelho,
prancheta azul, coração verde, "?" amarelo, badges) é saturado. O piso de brilho deixa passar as
**sombras difusas** dos badges 3D, que são cinza-claro e não atrapalham leitura; com o corte
anterior (215) a sombra do selo do Comunicado Importante (`#d6dada`, mínimo 214) roubava ~100 px
do topo. Os overlays das seis áreas foram conferidos a olho antes de codar.

| id | Área (x) | Área (y) | Altura | Fecha em cima | Fecha embaixo |
|---|---|---|---|---|---|
| `comunicado` | 175–905 | 301–1172 | 871 | megafone sup. dir. (y 276) | sombra do megafone inf. dir. (y 1197) |
| `comunicado-importante` | 175–905 | 424–926 | 502 | sombra do selo vermelho (y 399) | megafone vermelho (y 951) |
| `dica-prataginho` | 175–905 | 446–1229 | 783 | rabo do balão amarelo (y 421) | halo do "?" inf. dir. (y 1254) |
| `fique-por-dentro` | 175–905 | 304–977 | 673 | título + velocímetro (y 279) | prancheta azul (y 1002) |
| `seus-beneficios` | 175–905 | 367–1070 | 703 | badge verde (y 342) | halo do coração inf. esq. (y 1095) |
| `voce-sabia` | 175–905 | 414–1007 | 593 | canto arredondado do cartão (y 389) | "?" amarelo inf. dir. (y 1032) |

Cada `y` é o vão limpo medido menos 24 px de respiro em cima e embaixo, como no Atenção e no
Encontro. **A largura é 730 px (x 175–905) nas seis, a mesma do Atenção** — larguras de 601 a 881
foram testadas em cada arte e 730 cabe em todas; só o vão vertical varia.

**Alinhamento: centralizado nas seis.** As artes vêm vazias, então não há evidência direta de
alinhamento nelas. O que há é a **assimetria natural do vão** (até onde o fundo vai para cada
lado, sem forçar simetria): comunicado −1,5 px, comunicado-importante 0, dica −12, fique 0,
benefícios −19, você sabia +19,5. Nenhuma passa de 2 % da largura; nenhuma pede texto à esquerda.
`alinhamento` ficou como propriedade por template para que mudar qualquer uma seja uma palavra.

**Cor: `#004F9F` nas seis, incluindo o Comunicado Importante.** O cartão dele é `#f2f7f9` — o
vermelho é o selo e o megafone, não o fundo do texto. Contraste medido do azul sobre cada fundo:
7,36:1 a 7,62:1.

#### Limite de caracteres por uma regra só

Em vez de seis números estimados, uma régua: **o corpo não cai abaixo de 32 px** no arranjo mais
caro (3 parágrafos — cada quebra custa uma linha inteira), arredondado para baixo no múltiplo
de 50. A régua se confere sozinha: **o Atenção, com os 600 caracteres já aprovados, renderiza a
33 px.** Ela reproduz o número que existia em vez de inventar outro.

| peça | limite a 32 px | `maxCaracteres` | capacidade física | corpo no limite (medido) |
|---|---|---|---|---|
| comunicado | 735 | **700** | 1417 | 33 px / 19 linhas |
| comunicado-importante | 385 | **350** | 803 | 36 px / 10 linhas |
| dica-prataginho | 620 | **600** | 1177 | 35 px / 16 linhas |
| fique-por-dentro | 577 | **550** | 1114 | 32 px / 14 linhas |
| seus-beneficios | 577 | **550** | 1136 | 33 px / 15 linhas |
| voce-sabia | 478 | **450** | 875 | 33 px / 12 linhas |

O limite vive no template (`maxCaracteres`) e `bodyTextoLivre` o lê com fallback para a constante
de `CAMPO_TEXTO`. Nenhum formato antigo declara a propriedade — o Atenção segue em 600, o
Encontro em 400. O Poka-Yoke continua derivando do render; o `maxlength` só evita digitar 900
caracteres para descobrir o bloqueio no fim.

#### Arquitetura: `editor: 'texto'`, não `'comunicado'`

As seis declaram `editor: 'texto'`, um id novo que `render.js` despacha para o mesmo
`renderAtencao`. Não foi reaproveitado `'atencao'` (nomearia mal seis peças que não são o Atenção)
e **não pode ser `'comunicado'`**: `modoDeEdicao` cai no `tipoTexto` do setor quando o formato não
declara `editor`, e `'comunicado'` já é o `tipoTexto` do Acqua Park. Pôr `'comunicado'` em
`EDITORES_RH` faria o Acqua Park ser desenhado pelo compositor do RH — centralizado na vertical,
em vez de ancorado no topo como o desenho dele exige. A suíte verifica exatamente isso.

`engine.js`, `cardRenderer.js`, `photoEditor.js` e os quatro templates anteriores não mudaram.
A descrição do card do setor foi atualizada ("Comunicados e avisos internos, mais Talento do Mês e
Aniversariantes do Dia com foto"), porque 4 → 10 templates a deixou incompleta.

#### Testes

**Suíte v11, 117 verificações.** A tinta do texto é medida por diferença contra a arte vazia
(várias dessas artes já têm azul impresso). Por peça: textarea sem foto, colaborador ou data;
`maxlength` igual ao `maxCaracteres`; texto curto, médio e no limite do campo cabendo e ficando
dentro da área declarada (lida de `computeSafeAreaPx`, não copiada); centro horizontal em 539,5;
corpo ≥ 30 px no limite; palavra enorme bloqueando e nomeada; 1900 caracteres (injetados no
estado) bloqueando; PNG 1080×1440. Regressão dos quatro templates anteriores, dos quatro setores e
dos catálogos; e a prova de que o Acqua Park segue no motor, ancorado no topo (tinta em y 482–705
numa área que vai até 1133).

Suítes v5–v10 repetidas: **303 verdes**. A v10 (Encontro) cravava "4 formatos" e a lista de 4;
virou contagem dinâmica, como as v8 e v9 na rodada anterior.

### 3.20 Rodada 2A do RH: três peças de card e o Plantão de Gestores

Quatro templates: Destaque Administrativo, Destaque Operacional e Sejam Bem Vindos (a grade de
cards circulares do Aniversariantes, com outra arte) e G&G Gestores de Plantão (compositor novo:
foto no círculo impresso, nome e setor na faixa impressa, data e tipo ao lado dos ícones). O setor
foi de 10 para **14 templates**.

**Nomenclatura.** Dois desvios nos arquivos: `Destaque do Mês -  Grupo Pratagy` (espaço duplo) e
`G&G - Plantão Gestores` (sem "Grupo Pratagy"). Mais importante: **o arquivo "Destaque do Mês" diz
"Colaborador Destaque Operacional"** — o nome e o id (`destaque-operacional`) seguem a arte.

#### Grupo A — cards

**Os dois Destaques são a mesma arte com outro título.** Diff pixel a pixel: 65.502 pixels
diferentes, todos dentro de x 178–902 · y 180–421; o "parabéns" manuscrito, o mar e o rodapé são
byte-idênticos. Uma área serve para os dois, calculada do título mais baixo (Operacional, y 421) e
do "parabéns" (y 1005), com 24 px de respiro. É foto de fundo inteiro, sem placeholder: o card vai
sobre o mar.

| Peça | Card | Máx. | Área | Por quê |
|---|---|---|---|---|
| Destaque ADM / Operacional | círculo | **1** | x 140–940 · y 445–981 | título singular, "parabéns" para uma pessoa; o card de 1 (461 px) fica centrado com folga |
| Sejam Bem Vindos | círculo | **4** | x 160–920 · y 503–1116 | ver abaixo |

**Bem Vindos: o teto vem da arte, não do código.** O vão entre os dois textos impressos (o de
boas-vindas termina em y 486; "Mais uma vez, seja bem-vindo(a)!" começa em 1133) tem **646 px**,
contra 763 do Aniversariantes. Rodando o `distribuir` real com os degraus de foto da grade
(`ESCALAS_FOTO` até 0,7): com 24 px de respiro só 1–2 cabem; com **16 px**, 3–4 cabem com foto de
175 px; 5+ precisariam de 623 px, que a arte não tem. Ficou máximo 4 com respiro 16 — a menor
concessão que destrava 3–4 — **sem tocar na grade compartilhada**. Para mais gente, o caminho
certo é o designer liberar o texto de baixo, não um degrau de foto de 105 px.

**Cores: as três artes usam `#f7a600`**, não o `#FDD945` do Talento/Aniversariantes. O
"DESTAQUE", o "Vindos" e o "Sejam" são todos `#f7a600`; o azul é o `#004F9F` de sempre. A pílula
segue a arte em que está: `cores` por template, lidas em `desenharCard` com fallback para `CORES`.
Contraste do azul sobre `#f7a600`: 4,0:1 (texto grande em Heavy). O teste confirma que o
Aniversariantes não ganhou um pixel de `#f7a600`.

**Grupo A precisou de código?** Dois ajustes pequenos, ambos com fallback para o comportamento
atual: (1) o campo "Quantas pessoas?" some quando o template só aceita uma (mostrar "De 1 a 1" é
ruído), e o texto de ajuda descreve a distribuição só até o máximo da peça — o do Aniversariantes
continua idêntico, palavra por palavra; (2) `cores` por template. Fora isso, cadastro e medição.
Ao trocar de um template cheio (9 no Aniversariantes) para um de máximo menor, a lista é cortada
no máximo do destino — antes, os 9 seriam desenhados num template de 1.

#### Grupo B — Gestores de Plantão

Tudo medido no PNG e **calibrado no exemplo preenchido do RH** (Mario Cesar / Alimentos & Bebidas /
05/09 e 06/09 / Fim de Semana): a largura do "Mario Cesar" impresso bate com Heavy 48 px, a do
"Alimentos & Bebidas" com Regular 32, a do "05/09 e 06/09" com Heavy 32.

| Elemento | Medida |
|---|---|
| Círculo branco | centro (540, 617) · diâmetro 384; anel até raio 207 na cor da faixa (os dois são uma forma só) |
| Faixa azul-clara | x 248–830 · y 800–919 · `#4cc2f1` · cantos ~21 px |
| Ícone calendário / relógio | centro y 1044 / 1127; x 375–413 |
| Palmeira direita | x ≥ 877 na linha do relógio — limite direito dos textos: 861 |
| Fundo | `#0652a2` → `#0c5bab` |

Nada é desenhado além da foto e dos textos: círculo, anel, faixa e ícones já estão na arte. A foto
usa `desenharFoto(forma: 'circulo')` do `cardRenderer`, diâmetro 388 (4 px de sangria sobre o
anel, como no Talento). Nome (Heavy 48 → piso 34, `#004F9F`) e setor (Regular 32 → piso 24)
centrados na faixa; data e tipo (Heavy 32 → piso 24, branco) à esquerda, a 28 px do ícone. Cada
campo é uma linha só, e o teto de uma linha sai da geometria como na data do Encontro: a caixa é
mais baixa que duas linhas no piso (nome 56 < 78; setor 38 < 55; data e tipo 40 < 55).

**O tipo é um `<select>` nativo no formulário**, não um controle sobre o canvas — nada neste
sistema é sobreposto à prévia. Só existem três strings (`TIPOS_PLANTAO`); começa vazio para o RH
escolher de propósito; o compositor confere o valor de novo e um valor forjado no estado não
desenha nem libera. "Noturno e Fim de Semana", a opção mais longa, mede 410 px a 32 e cabe nos
420 da caixa: o tipo nunca encolhe, então as três opções têm o mesmo corpo.

**Uma diferença entre o exemplo e o PNG em branco:** o exemplo tem um subtítulo "Noturno e Fim de
Semana" sob o "PLANTÃO". Ele **não existe no PNG em branco** nem na especificação, e não foi
inventado. Se deve existir sempre, é o designer quem o põe na arte; se deve variar, é um campo a
mais.

Estado: o gestor em `rh.colaboradores[0]` (como o Talento), a data em `rh.data` (como o Encontro),
`rh.tipoPlantao` novo. A tela de edição reaproveita a linha de colaborador (com dica própria — a
dica dos cards fala em nome quebrando em duas linhas, o que aqui não acontece), o `photoEditor`
sem mudança, o campo de data e o select.

#### Um bug pré-existente que a rodada encontrou

`previaStep.js` escapava nome e setor e depois `linha()` escapava de novo: "Alimentos & Bebidas"
aparecia como `Alimentos &amp; Bebidas` no resumo da prévia, e com duas ou mais pessoas o `<br>`
entre elas aparecia como texto. Estava assim desde a 3.17 — nenhum teste lia a prévia com "&" ou
com mais de uma pessoa. Corrigido: `linha` escapa uma vez, e as pessoas se separam por quebra de
linha (o `<dd>` já era `whitespace-pre-wrap`, que era a intenção).

#### Testes

**Suíte v12, 79 verificações.** Lista de 14 na ordem; Destaques sem campo de quantidade, card
dentro da área e centrado, pílulas em `#f7a600` (18.384 pixels) e zero `#FDD945`; Bem Vindos com
1, 2, 3 e 4 entre os dois textos impressos, 9 corrigido para 4; troca Aniversariantes(9) →
Destaque cortando a lista para 1. Plantão: select com placeholder e exatamente as três opções,
Poka-Yoke em ordem (sem data → sem tipo → libera), nome e setor dentro das caixas da faixa e
centrados, data e tipo a x 441 e centrados nas linhas dos ícones, foto recortada exatamente no
círculo (346–733 × 423–810), os três tipos terminando antes da palmeira (x1 575 / 682 / 849),
tipo forjado bloqueando sem desenhar, nome/setor/data longos encolhendo e absurdos bloqueando
com o culpado nomeado, prévia sem `&amp;`, PNG 1080×1440. Regressão: Aniversariantes com a
ajuda intacta, 9 pessoas e prévia sem `<br>`; Talento, Atenção, Encontro, Comunicado; os quatro
setores e os catálogos. Suítes v5–v11 repetidas.

### 3.21 Correções em templates publicados: Plantão, Bem Vindos e Destaques

Quatro frentes sobre peças da 3.20, todas pedidas com o relatório antes do código: (1) o RH
corrigiu a arte do Plantão; (2) o nome estava alto na faixa; (3) o Bem Vindos precisava de 8
pessoas e de pílulas verdes; (4) os Destaques precisavam de 8 pessoas.

#### Plantão: a arte corrigida e a re-medição

O diff entre o PNG novo e o publicado tem **3.889 pixels, todos em x 334–414 · y 1023–1146**: os
dois ícones andaram exatamente 40 px para a esquerda. Círculo, anel, faixa, palmeiras e onda são
byte-idênticos, então nada mais mudou de lugar.

| Elemento | 3.20 | 3.21 |
|---|---|---|
| Círculo branco / anel | centro (540, 617) · ⌀ 384 / raio até 207 | igual |
| Faixa azul-clara | x 248–830 · y **800**–919 | x 248–830 · y **790**–919 (130 px) |
| Ícone calendário / relógio | x 375–413 / 376–413 | x **335–373** / **336–373** (centros y 1044 / 1127, iguais) |
| Início do texto (ícone + 28) | x 441 | x **401** |
| Caixa de data e tipo | x 441–861 (420) | x **401–861 (460)** |
| Palmeira direita / onda | x ≥ 877 / y 1238 | igual |

A faixa não mudou — eu é que a tinha medido errado: a janela de busca começava em y 800 e cortou
os 10 px de cima. "Noturno e Fim de Semana" (410 px) fica com 50 px de folga na caixa, em vez
de 10.

**O nome desceu na faixa.** Na 3.20 as maiúsculas do nome começavam 28 px abaixo do topo da faixa
e o setor terminava 14 px acima da base — o bloco estava alto. No exemplo preenchido do RH, as
maiúsculas do "Mario Cesar" começam ~41 px abaixo do topo e o vão nome→setor é ~12. A decisão foi
**casar com o exemplo**: nome 46 px Heavy (era 48; piso 34) na caixa y 826–878 e setor 32 Regular
na caixa y 878–915. Medido no canvas: maiúsculas em y 828 (38 px do topo), setor de 880 a 904,
descendentes do "Departamento Pessoal" em 911 — 8 px da base da faixa, nada cortado. As caixas
continuam menores que duas linhas no piso (52 < 78; 37 < 55), então o "uma linha só" segue
saindo da geometria, sem regra à parte.

#### Bem Vindos e Destaques: 8 pessoas pedem outra grade

A grade da 3.17 põe 7–9 pessoas em **três linhas**. O vão do Bem Vindos tem 613 px (os dois
textos impressos são o limite — não há como estender), e três linhas de cards precisam de 758,
ou 623 mesmo com fotos de 105 px. A referência do RH para 8 pessoas resolve com **4 colunas × 2
linhas** — e é isso que entrou: um modo **"duas linhas"** em `gridLayout.js`, ligado por
template (`grade: 'duasLinhas'`). Nele, colunas = ⌈n/2⌉, a foto é limitada pela largura da célula
(com 14 px de folga para a pílula) e as fontes vêm do número de colunas. **Quem não declara o
flag — o Aniversariantes — passa pelos mesmos caminhos de antes**: o teste confere os três tiers
antigos, as escalas e as colunas por n, valor a valor.

As fontes de 3 e 4 colunas saíram de simulação com as funções reais de medição, nos nomes e
setores mais longos da referência ("Alexssandro Davis", "Luciciley de Souza", "Departamento
Pessoal"): o maior par em que todos cabem na pílula da célula. Com 4 colunas o card tem 174 px
(Bem Vindos) ou 184 (Destaques) e a pílula 157/166 — "Alexssandro" sozinho só cabe a 14 px. 18/14
é **exatamente o tamanho das pílulas da referência de 8 pessoas** (na escala de 1080), então é o
que o RH já aceita — mas é pequeno, e foi avisado antes de entrar. A alternativa (a grade de três
linhas nos Destaques, onde caberia) daria fontes maiores e fotos menores, e duas formas de "8" na
mesma família; a consistência com a referência pesou mais.

| n | colunas × linhas | Bem Vindos (760×613): foto · fontes | Destaques (800×750): foto · fontes |
|---|---|---|---|
| 1 | 1×1 | 320 · 40/30 | 320 · 40/30 |
| 2 | 2×1 | 320 · 40/30 | 320 · 40/30 |
| 3–4 | 2×2 | 175 (escala 0,7) · 32/24 — como na 3.20 | 250 · 32/24 |
| 5–6 | 3×2 | 156 (0,7) · 26/20 | 237 · 26/20 |
| 7–8 | 4×2 | 160 · 18/14 | 170 · 18/14 |

Os Destaques cresceram de y 445–981 para **445–1195**: o "parabéns" manuscrito (y 1005–1230) é
decorativo e pode ficar sob os cards; o limite real são as ondas verdes, cuja crista mais alta,
medida coluna a coluna em x 250–800, está em y 1219 (as palmeiras são verde-oliva e ficaram fora
do predicado). 24 px de respiro → 1195. O teste confere que nenhum pixel é desenhado abaixo de
1195 com 1 a 8 pessoas. Com 4 pessoas o bloco mede exatamente 750 px — zero de folga, mas cabe.

**Verde fixo nas pílulas do Bem Vindos.** Todas as pílulas de nome, de todas as pessoas, no mesmo
verde — não existe mapa setor → cor nem sobrescrita por pessoa (o teste põe 4 setores diferentes
e confere as 4 células). O verde é o da onda da própria arte: moda de 31 amostras ao longo da
crista (y 1244–1271), **`#8dc139`** (mediana `#91c43f`; o token `status.green` do Tailwind,
`#8FB82A`, é indistinguível a olho). A referência do RH usa texto branco nessas pílulas, mas
branco sobre `#8dc139` dá **2,1:1** — reprova no mínimo de 3:1 para texto grande —, então o texto
ficou no `#004F9F` das outras pílulas de nome (3,8:1). A pílula do setor não mudou.

O que mudou de código fora do `gridLayout`: `render.js` passa `formato.grade` (duas linhas);
`editorRH.js` descreve a distribuição do modo de duas linhas no texto de ajuda; `templates.js`.
Motor, `cardRenderer`, setores e os outros dez templates do RH: intactos.

#### Testes

**Suíte v13, 182 verificações.** `gridLayout` sem o flag idêntico à 3.17 (colunas por n, os três
tiers, escalas; `distribuir` sem `colunas` nas medidas cai em `colunasPara`); com o flag, 3
colunas → 237 · 26/20 e 4 colunas → 170/160 · 18/14. Destaques e Bem Vindos de 1 a 8: libera,
dentro da área, colunas e linhas contadas nas projeções da máscara de diferença contra a arte pura
(4×2 com 7–8, 3×2 com 5–6, 2×2 com 3–4), cor da pílula presente em cada coluna, nenhuma tinta
abaixo de y 1195 nos Destaques, 8 com os nomes/setores mais longos da referência cabendo, nome
absurdo bloqueando com o culpado nomeado, 9 corrigido para 8, PNG 1080×1440. Plantão: asset
servido é a arte corrigida (1.560.824 bytes), ícones em x 335–373 no canvas, nome com maiúsculas
a 38 px do topo da faixa e setor não cortado, data e tipo a x 402 (gap de 29 px do ícone), os
três tipos terminando antes da palmeira (x1 535 / 642 / 809), Poka-Yoke em ordem, tipo forjado,
nome/setor/data longos e absurdos. Aniversariantes com 2, 4, 6, 8 e 9: 2×1, 2×2, 2×3, 3×3, 3×3,
`#FDD945` presente e nem `#f7a600` nem `#8dc139` na área. Os outros nove templates do RH, os
quatro setores e os catálogos. Suítes v5–v12 repetidas (a v12 atualizada para a nova
especificação: máximos, verde, x 401 e caixas da faixa).

Duas armadilhas de medição desta rodada, para não repetir: a "arte vazia" lida do canvas **não é
vazia** — o editor abre com uma pessoa em branco e o placeholder azul já está no centro, então a
referência limpa tem de ser a própria imagem desenhada num canvas à parte; e linhas incompletas
são centralizadas, então contar colunas na projeção da área inteira funde as colunas — conta-se
na primeira linha, que está sempre completa.

---

## 4. Bugs que eu mesmo introduzi

Registro porque são os que mais ensinam sobre o código:

| Bug | Causa | Correção |
|---|---|---|
| Guia da área segura vazando para o PNG exportado | O guia era desenhado no canvas de exportação | Canvas overlay separado, nunca exportado |
| Tela de Edição em branco ao voltar da Prévia | `dataset.sig` sobrevivia à troca de `innerHTML` de outra etapa | Marcador único `data-edicao-root` |
| Logo 404 depois da correção do deploy | Padrão sem barra inicial no `.vercelignore` casa em qualquer profundidade | Todos os padrões ancorados com `/` |
| Medição da área segura errada | Suavização por percentil descartava as linhas onde o sol invade | Interseção estrita, depois varredura por faixas verticais |
| `toTitleCase` em texto todo maiúsculo | "CAMARÃO ALHO E ÓLEO" virava "CAMARÃO ALHO e ÓLEO" | Minusculizar antes quando a entrada é toda maiúscula |
| `downloadStep.js` quebrado por um `\n` | Um escape virou quebra de linha real dentro de uma string | Corrigido; passei a rodar `node --check` em todos os módulos |
| `&amp;` e `<br>` literais no resumo da prévia do RH | Nome e setor escapados duas vezes (na montagem e em `linha()`) | Escapar uma vez; pessoas separadas por quebra de linha num `<dd>` `pre-wrap` (3.20) |

A primeira tentativa de correção da tela em branco usou `[data-continue]` como marcador de
presença — e **falhou**, porque a tela de Prévia também tem esse atributo.

---

## 5. Decisões técnicas que valem lembrar

**IDs internos ≠ nomes de interface.** As chaves `manutencao` e `governanca` indexam caminhos de
assets e o cache já gravado no navegador dos usuários. Renomeá-las quebraria tudo isso sem ganho.

**Medida física, não percentual.** Todas as áreas seguras estão em milímetros. As imagens-base
são 300 DPI, então a conversão mm↔px é exata.

**Margens laterais sempre simétricas.** A medição bruta de espaço livre costuma ser assimétrica,
mas usar esses valores como caixa de texto joga o texto para fora do centro óptico da arte.

**Busca insensível a acento, caixa e pontuação.** O índice guarda duas versões de cada texto —
a normalizada e uma sem pontuação nenhuma. Assim `caixa dagua` encontra `caixa d'água` e
`checkout` encontra `check-out`.

**Estado de busca fora do estado global.** Qualquer `setState` dispara um render completo, o que
recriaria o campo e faria o cursor saltar a cada letra. A grade é atualizada por manipulação
direta do DOM.

**PDF do catálogo sem passar por Canvas.** O jsPDF embute o PNG diretamente. O Regulamento da
Academia tem 7087×14173 px — rasterizar isso em Canvas estouraria a memória do navegador.

---

## 6. Estado atual

### Estrutura

```
index.html                  Página principal
server.js                   Servidor estático local (sem dependências)
vercel.json                 Configuração do deploy
.vercelignore               Pastas de trabalho fora do deploy

css/
  fonts.css                 @font-face da Fibra One (400/600/700/800)
  satisfy-embedded.css      Satisfy em Base64 (GERADO — veja tools/)
  styles.css                Estilos e animações auxiliares

js/
  main.js                   Bootstrap
  state.js                  Estado central e ordem dinâmica dos passos
  utils.js                  Normalização, slugify, Title Case, debounce
  data/
    models.js               Setores, formatos e áreas seguras
    catalogData.js          Catálogo de artes prontas
    docxLibrary.js          Biblioteca de pratos + cache IndexedDB
  canvas/
    engine.js               Motor de renderização
    export.js               Exportação PNG/PDF
    lote.js                 Folha A4 com várias placas (grade + PDF)
  ui/
    confetti.js             Confete da exportação
    loteModal.js            Modal da impressão em lote
  rh/                       Setor RH: templates, card, grade, compositor, editor de foto, tela
                            (14 templates: Atenção, Encontro Geral, Talento, Aniversariantes,
                            6 comunicados puros — 3.19 —, Destaque ADM/Operacional,
                            Bem Vindos e Gestores de Plantão — 3.20; grade de duas
                            linhas e ajustes — 3.21)
    previewPanel.js         Prévia ao vivo
    stepper.js, common.js, icons.js
    steps/                  Uma tela por etapa do fluxo

assets/
  images/{ab,governanca,acquapark}/       Modelos do gerador
  images/rh/                              Templates do RH (14 peças, 1080×1440)
  catalogo/{ab,manutencao,hospitalidade}/ Artes prontas (300 DPI)
  catalogo/thumbs/                        Miniaturas
  fonts/                                  Fibra One e Satisfy
  logo/                                   Logo do cabeçalho
  docx/                                   Biblioteca de pratos PT/ES
```

### Números

- **35 artes prontas** no catálogo — 22 operacionais, 8 de hospitalidade, 5 de A&B
- **35 miniaturas** geradas (~1,4 MB)
- **5 módulos**, 28 arquivos JavaScript
- **424 pratos** na biblioteca A&B (12 categorias; 3 legados dos cardápios de 2025)

### Commits desta fase

| Hash | Descrição |
|---|---|
| `2874335` | Confete ao concluir qualquer exportação |
| `3b397f0` | Quebra palavras maiores que a largura da área segura |
| `562f263` | Separa catálogo por setor e simplifica o comunicado do Acqua Park |
| `368cc94` | Catálogo de artes prontas, Acqua Park e renomeação dos módulos |
| `e7c9ca3` | Remove a nota sobre o bloqueio dos campos |
| `10aa3fb` | Trava nome e tradução na biblioteca; alarga a caixa da Governança |
| `d13205a` | Ancora a carta no topo e sobe a base da caixa para 78% |
| `914f3de` | Renomeia Placa para Arte, header, Governança e margens em mm |
| `4a74b16` | Ancora padrões do `.vercelignore` na raiz |
| `37365e2` | Publica o site estático completo na Vercel |

---

## 7. Como rodar

```bash
node server.js
```

Depois abra http://localhost:5173 no Chrome ou Edge. Para outra porta: `node server.js 8080`.

O servidor existe porque o navegador bloqueia o carregamento de arquivos locais (o `.docx` da
biblioteca, as imagens dos modelos) quando a página é aberta como `file://`.

---

## 8. Em aberto

**Duplicação de 27 MB no repositório.** As pastas de trabalho `Manutencao/`, `A&B/Artes Prontas/`,
`Hospitalidade/` e `AcquaPark/` estão versionadas, e as cópias em `assets/` são byte a byte idênticas. Diferente
das pastas de PSD, aqui não há valor extra nos originais além do nome do arquivo — que o campo
`arquivoOriginal` já registra. Removê-las do Git com `git rm -r --cached` economizaria o espaço
sem apagá-las do seu computador. **Fica a seu critério.**

**Rotina de migração de cache: considerada e descartada.** Ao renomear o ID do setor de
`manutencao` para `operacional`, a hipótese era que usuários com o sistema já aberto pudessem
carregar cache indexado pelo ID antigo. Investiguei antes de escrever a rotina e **não há nada a
limpar**:

- `localStorage` e `sessionStorage` não são usados em lugar nenhum do código
- O único IndexedDB é o banco `pratagy-placas`, que guarda a biblioteca de pratos e é versionado
  pela própria tag `biblioteca_ab-v*` — não tem relação com o ID do setor
- O estado da aplicação é em memória e zera a cada reload

O que pode ficar defasado é o **cache HTTP** dos PNGs em `/assets/catalogo/institucional/`, e isso
o JavaScript não consegue limpar (não há Service Worker nem Cache API no projeto) — aquelas URLs
simplesmente param de ser pedidas. Uma rotina versionada rodaria, não acharia nada e gravaria a
flag: código defensivo que vira bug latente. **Decisão: não implementar.** Se um dia o app passar a
persistir algo indexado por setor, este parágrafo é o lembrete de que a migração vira necessária.

**Legados da biblioteca.** `Filé de peixe`, `Coxinha frita` e `Costelinha ao barbecue` estão em
`LEGADOS` (`docxLibrary.js`) porque saíram do `.docx` novo sem confirmação da cozinha. O arquivo
novo já traz um "Costelinha barbecue" quase igual. Quando a cozinha bater o martelo, apague da
lista os que saíram do cardápio e suba a `DOCX_VERSION_TAG`.

**Material de impressão não confirmado.** Os 35 itens carregam `PVC Adesivado` como padrão
sugerido e `materialConfirmado: false`. Quando o Marketing confirmar o material de um item,
ajuste o valor e marque `materialConfirmado: true` para o aviso de "sugestão" sumir daquele item.

**Cache do navegador.** Quem já tinha o sistema aberto pode receber o JavaScript antigo. Um
Ctrl+F5 resolve.

---

*Documento gerado por Claude Opus 5 a pedido de Gabriel Nascimento.*
