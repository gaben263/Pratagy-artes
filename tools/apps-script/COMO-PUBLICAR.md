# Planilha de pratos provisórios: como publicar

A planilha recebe os pratos que a equipe do A&B cadastra de última hora no
Sistema de Artes. Um código pequeno (`provisorios.gs`) fica dentro dela e faz a
ponte com o sistema. Isso é feito uma vez só, em uns 5 minutos, e não tem custo.

## 1. Colar o código na planilha

1. Abra a planilha no Google Planilhas, com a conta que vai ser dona dela.
2. Menu **Extensões → Apps Script**. Abre uma aba nova com um editor de código.
3. Apague o que estiver escrito no arquivo `Código.gs` e cole todo o conteúdo de
   `tools/apps-script/provisorios.gs`.
4. Clique no ícone de disquete (**Salvar**). Se pedir um nome para o projeto,
   use "Pratos provisórios A&B".

## 2. Publicar como App da Web

1. No canto superior direito, **Implantar → Nova implantação**.
2. Na engrenagem ao lado de "Selecione o tipo", escolha **App da Web**.
3. Preencha:
   - **Descrição:** Sistema de Artes
   - **Executar como:** Eu (a sua conta)
   - **Quem pode acessar:** Qualquer pessoa
4. Clique em **Implantar**.
5. O Google pede autorização: **Autorizar acesso** e escolha a sua conta. Vai
   aparecer o aviso "O Google não verificou este app". É normal, porque o app é
   seu: clique em **Avançado → Acessar Pratos provisórios A&B (não seguro)** e
   depois em **Permitir**.
6. Copie a **URL do app da Web** (termina em `/exec`) e mande para o Claude
   ligar no sistema.

## 3. Fechar a planilha

Com o código publicado, a planilha **não precisa** mais do link "qualquer pessoa
pode editar": o código grava com a sua conta. Em **Compartilhar → Acesso
geral**, troque para **Restrito**. Assim ninguém apaga ou altera os pratos sem
querer.

A primeira vez que um prato for cadastrado, o código cria sozinho a aba
**Provisórios** com o cabeçalho.

## Rotina de revisão

1. Abra a planilha e **copie** as linhas novas.
2. Cole para o Claude incluir os pratos na biblioteca oficial.
3. **Só depois que a atualização for publicada**, apague as linhas da planilha.

Se as linhas forem apagadas antes, os pratos somem da busca de todos os
computadores até a biblioteca oficial ir ao ar.

## Se um dia o código mudar

Cole o código novo, salve e vá em **Implantar → Gerenciar implantações →
lápis (editar) → Versão: Nova versão → Implantar**. A URL continua a mesma.

## Segurança

A URL `/exec` fica no código do site, que é público. Quem a tiver consegue
acrescentar linhas na planilha, mas não consegue ler nada além dos nomes dos
pratos, apagar ou editar. O código limita o tamanho de cada campo, impede
fórmulas e ignora pratos repetidos. Se aparecer algo estranho na planilha, é só
apagar a linha.
