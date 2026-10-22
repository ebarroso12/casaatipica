# Lições aprendidas e preferências do usuário (Impacto Rosa, out/2026)

Leia antes de mostrar a primeira versão. Cada item veio de uma correção real.

## Comunicação
- **Responder sempre em português do Brasil**, inclusive nas mensagens curtas entre passos.
  O usuário reclamou quando houve mensagens em inglês.
- Explicações detalhadas, mas em linguagem de leigo: "lista de DNS", "cadeado (HTTPS)",
  "prévia do link no WhatsApp". Evite jargão sem tradução.
- **Entregue algo que se abre**: arquivo no repositório não é "página" para o usuário. Publique
  o link do Claude (Artifact) logo na primeira versão, e depois o endereço real. A primeira
  entrega só em código gerou: "quero uma página e não este lixo".
- Quando o usuário pedir "ideias" ou disser "me fale antes de fazer", **liste as ideias e
  espere a resposta**. Quando ele disser "faça", faça tudo e teste.
- Áudios do WhatsApp (.ogg): transcreva com faster-whisper (modelo `medium`, idioma `pt`);
  converta antes com `ffmpeg -ac 1 -ar 16000 -f f32le` e passe o array (a leitura direta do .ogg
  falhou por versão do PyAV). Confira nomes próprios ("Dantz" × "Dantes") com o usuário.

## Conteúdo
- Use **o nome que o usuário dá ao evento** em todo lugar (página, prévia, mensagem do
  WhatsApp, agenda, carrossel, legenda). Caso real: "Culto" → "Reunião de Mulheres" teve de ser
  trocado em ~30 lugares; mantenha os termos num lugar só (docs) e faça busca global ao trocar.
  "Cultos da igreja" (horários da igreja) é outra coisa e fica.
- Não invente dados. Pesquise nas fontes oficiais (site da igreja, site do ministrante — se o
  site é React, renderize com Playwright para ler o texto) e cite as fontes. Textos que você
  escrever, avise que são seus para o usuário ajustar.
- Palavras ditas no áudio/mensagem podem estar erradas ("Pilares" era "Pilates"). Na dúvida
  sobre algo que vai a público, pergunte.
- Datas: confira o dia da semana; depois que o evento passa, a página troca sozinha o texto da
  data por "confirme a próxima data com a equipe" (não anunciar evento antigo).

## Visual
- Estilo aprovado: página única **escura e cinematográfica** (como legendariosfranca.com.br),
  fundo vinho quase preto, cor principal da marca (rosa) e **âmbar/laranja labareda** como
  acento em: faixa animada do topo, números da contagem, selo, etiquetas, ícones.
- **Logos: nunca esticar, nunca pôr halo/brilho em volta.** "A logo você deixa assim."
  Toda `img` com `height: auto` (sem isso a altura dos atributos width/height fica fixa e a
  imagem estica no celular — aconteceu com a logo da águia).
- Fotos do Instagram/WhatsApp chegam com ícones da interface (som, perfil) e textos de flyer
  antigo; recorte antes de usar e não use flyers com data passada.
- Números/medidas em cartões pequenos: `white-space: nowrap` + tamanho com `clamp()` (o "m²"
  quebrou de linha no celular).
- Âncoras do menu com `scroll-margin-top` para o título não ficar atrás do cabeçalho fixo.
- `[hidden] { display: none !important; }` — sem isso um overlay com `display:flex` fica
  invisível mas bloqueando cliques na página inteira (aconteceu com o visualizador de fotos).
- Fonte Cormorant: "Wâ" parece com acento deslocado por causa do kerning — é da fonte, não bug.

## WhatsApp, grupo e QR
- Um link oficial com mensagem pronta (`wa.me/55…?text=…` codificado), aplicado a todos os
  botões `.js-whatsapp` por um único lugar no JS. **Links do grupo não podem ter `.js-whatsapp`**
  (o script trocaria o endereço).
- Botão flutuante com selo "24h": some quando os botões do topo ou o rodapé estão visíveis e,
  no celular, enquanto a pessoa rola para baixo (não cobrir texto); volta ao rolar para cima.
- QR codes: gere com `scripts/qr.py` (ele relê e confere). Se a mensagem pronta mudar, **gere
  o QR de novo** — o antigo continua com o texto velho.

## Pedidos que voltam sempre
- "Me mostra os QR codes", "cadê o link", "onde fica a tabela": **mande a imagem/link direto**
  (SendUserFile com exibição render; link completo da tabela no Supabase), não só o caminho.
- "Botão" quer dizer botão de verdade (estilo `.btn`), não link sublinhado.
- Quando o usuário diz "não chegou" algo no banco, primeiro **confira você mesmo** (`select`) e
  depois oriente onde olhar — quase sempre é a tabela errada ou a tela sem atualizar (F5).
- "Veja você mesmo": faça a verificação com as ferramentas antes de pedir algo ao usuário.

## Processo
- Teste antes de publicar com `scripts/testar_pagina.js` em 320/390/1280 px e olhe os prints.
  Testes de verdade pegaram: overlay bloqueando cliques, variável sobrescrita, imagem esticada,
  "m²" quebrando, ticker com metades diferentes (a faixa animada precisa das duas metades
  idênticas para girar sem emenda).
- Ao terminar cada mudança: montar → testar → commit → push na branch **e** na `main` (depois de
  autorizado) → **confirmar no ar** buscando um trecho novo no HTML publicado → republicar o
  artefato no mesmo link. Só então dizer que está pronto.
- Se o push for recusado, alguém (o próprio usuário) mexeu no repositório: `git fetch`, veja o
  que é, junte com merge — nunca sobrescreva.
