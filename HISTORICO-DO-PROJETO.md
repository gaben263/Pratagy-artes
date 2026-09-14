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
| **Alimentos & Bebidas** | Gera a identificação de pratos a partir da biblioteca oficial (`.docx`), com tradução em espanhol — ou baixa uma das 5 artes prontas |
| **Operacional** | Catálogo buscável de 22 avisos e sinalizações prontos para baixar |
| **Hospitalidade** | 8 artes prontas (cartões de hóspede, check-out, QR Code) + gerador da carta de boas-vindas manuscrita |
| **Acqua Park** | Gera comunicados 1080×1440 px (WhatsApp) sobre fundo azul ou branco |

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
  ui/
    confetti.js             Confete da exportação
    previewPanel.js         Prévia ao vivo
    stepper.js, common.js, icons.js
    steps/                  Uma tela por etapa do fluxo (inclui modoStep.js)

assets/
  images/{ab,governanca,acquapark}/       Modelos do gerador
  catalogo/{ab,operacional,hospitalidade}/ Artes prontas (300 DPI)
  catalogo/thumbs/                        Miniaturas
  fonts/                                  Fibra One e Satisfy
  logo/                                   Logo do cabeçalho
  docx/                                   Biblioteca de pratos PT/ES
```

### Números

- **35 artes prontas** no catálogo — 22 operacionais, 8 de hospitalidade, 5 de A&B
- **35 miniaturas** geradas (~1,4 MB)
- **4 módulos**, 21 arquivos JavaScript

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

**Duplicação de 27 MB no repositório.** As pastas de trabalho `Operacional/`, `A&B/Artes Prontas/`,
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
  pela própria tag `biblioteca_ab-v1` — não tem relação com o ID do setor
- O estado da aplicação é em memória e zera a cada reload

O que pode ficar defasado é o **cache HTTP** dos PNGs em `/assets/catalogo/institucional/`, e isso
o JavaScript não consegue limpar (não há Service Worker nem Cache API no projeto) — aquelas URLs
simplesmente param de ser pedidas. Uma rotina versionada rodaria, não acharia nada e gravaria a
flag: código defensivo que vira bug latente. **Decisão: não implementar.** Se um dia o app passar a
persistir algo indexado por setor, este parágrafo é o lembrete de que a migração vira necessária.

**Material de impressão não confirmado.** Os 35 itens carregam `PVC Adesivado` como padrão
sugerido e `materialConfirmado: false`. Quando o Marketing confirmar o material de um item,
ajuste o valor e marque `materialConfirmado: true` para o aviso de "sugestão" sumir daquele item.

**Cache do navegador.** Quem já tinha o sistema aberto pode receber o JavaScript antigo. Um
Ctrl+F5 resolve.

---

*Documento gerado por Claude Opus 5 a pedido de Gabriel Nascimento.*
