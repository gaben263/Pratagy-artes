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
| | **Área segura** | **x 175–905 · y 301–1107** — livre 151–984 × 277–1131, espelhada no centro do cartão (540), 24 px de respiro |
| Talento | Quadrado amarelo (cantos) | TL (290,429) · TR (730,368) · BR (790,843) · BL (346,895) |
| | Foto / rotação / centro | **445×474 px, −7,89°, centro (540, 631,5)**; placeholder `#E1CC1B` |
| | Moldura branca (`#E4E5E9`) | topo 45 · laterais 38–40 · **base 76** |
| Aniversariantes | Título "DO DIA" | x 315–765 · y 273–371 |
| | Limitadores | "INFO-313-REV.00" x 37–56; balão azul-claro x ≥ 942; balões de baixo y ≥ 1196; logo y ≥ 1326 |
| | **Área útil dos cards** | **x 169–911 · y 402–1165** — livre 57–941 × 372–1195, espelhada no centro (540), 30 px de respiro |

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
    previewPanel.js         Prévia ao vivo
    stepper.js, common.js, icons.js
    steps/                  Uma tela por etapa do fluxo

assets/
  images/{ab,governanca,acquapark}/       Modelos do gerador
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
