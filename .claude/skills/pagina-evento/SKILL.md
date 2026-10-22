---
name: pagina-evento
description: Monta e publica landing pages de eventos, igrejas, ministérios, projetos sociais e instituições (encontros, cultos, conferências, campanhas, casas de acolhimento, ONGs, projetos como "Casa Atípica") no estilo escuro cinematográfico do Impacto Rosa/Legendários: página única com contagem regressiva, WhatsApp 24h, grupo, galeria que abre, local com mapa, agenda, pop-up de cadastro e ficha de inscrição completa estilo Jotform salvos no Supabase (com LGPD), QR codes, emblema na aba, prévia no WhatsApp, carrossel do Instagram e publicação no GitHub Pages com subdomínio (DNS Hostinger/Vercel). Use sempre que pedirem página, site, landing page, formulário/ficha de inscrição, cadastro, QR code ou divulgação — mesmo que digam só "faz igual ao Impacto Rosa", "faz o projeto X", "formulário estilo Jotform" ou mandem flyers, fotos e áudios.
---

# Página de evento / projeto (estilo Impacto Rosa / Legendários)

Esta skill transforma flyers, fotos, áudios e links num site de uma página pronto para divulgar,
com captação de cadastros, ficha de inscrição completa, QR codes e materiais do Instagram — e
coloca tudo no ar num endereço próprio. Nasceu de um projeto real (Impacto Rosa, Casa de Oração
Franca, out/2026) e guarda o que deu certo e o que o usuário corrigiu. O exemplo completo e
funcionando está em `assets/exemplo-impacto-rosa/` (no ar em
https://impactorosa.mentorawaniaarantes.com.br).

**Fale sempre em português do Brasil, em linguagem de leigo, com explicações detalhadas.** O
usuário típico é líder de igreja/ministério/projeto: quer ver a página aberta no celular, não
código. Entregue links que abrem e imagens, não caminhos de arquivo.

## Ferramentas
- Node + Playwright com o Chromium da máquina (`CHROMIUM_PATH`, padrão `/opt/pw-browsers/chromium`).
- Python 3 com `pillow numpy potracer "qrcode[pil]" opencv-python-headless` (+ `faster-whisper` e
  `ffmpeg` para áudios do WhatsApp).
- Conectores: Supabase (cadastros e fichas), Vercel (quando o site principal do domínio roda lá).
- Num projeto novo, copie `assets/projeto-base/.claude/` para a raiz do repositório: instala sozinho
  essas ferramentas a cada sessão na nuvem (só o que faltar) e grava `CHROMIUM_PATH`/`NODE_PATH`.

| Script (`scripts/`) | Para quê |
|---|---|
| `montar_pagina.py --url URL [--nome N --artefato saida.html]` | Gera o `index.html` final com tudo embutido (e a versão para o link do Claude) |
| `testar_pagina.js index.html "LINK_WA" pasta/` | Testa a página em 320/390/1280 px (rolagem, imagens, WhatsApp, pop-up, contagem, erros) e tira prints |
| `testar_ficha.js pasta/ [ficha/index.html] [tabela]` | Testa a ficha em etapas simulando o Supabase |
| `gerar_icones.js …` | Emblema da aba em todos os tamanhos + og-image 1200×630 |
| `qr.py LINK saida.png` | QR code conferido por leitura |
| `folha_qr.py saida.png "TÍTULO" "arq|rótulo|sub" …` | Folha com vários QR para imprimir/stories |
| `gerar_carrossel.js carrossel/carrossel.html` | Artes 1080×1350 do Instagram |
| `vetorizar_logo.py` | Logo chapada em foto → SVG nítido |

## Antes de começar: leia
- `references/licoes-e-preferencias.md` — **obrigatório**. Preferências e erros reais (logo
  esticada, halo na logo, nome do evento trocado, overlay bloqueando cliques, Pages travado…).
- Os outros `references/` só na etapa correspondente:
  `leads-supabase.md`, `ficha-inscricao.md`, `carrossel-instagram.md`, `publicacao-e-dominio.md`.

## Fluxo de trabalho

### 0. Repositório
Cada projeto num repositório próprio (ex.: `Impactorosapagina`, `casaatipica`). Se o repositório
não estiver na sessão, procure com `list_repos` e anexe com `add_repo`; se não existir, peça ao
usuário para criar um vazio no GitHub (github.com/new) e passe o nome. Copie a skill para
`.claude/skills/pagina-evento/` do novo repositório também — ela viaja junto com o projeto.

### 1. Reunir os dados
Extraia tudo do que o usuário mandar (flyers, prints, áudios, links). Áudio do WhatsApp:
transcreva (ver lições). Monte uma ficha com:
- **Nome exato** do evento/projeto (como o usuário chama — vai em todo lugar), organização.
- Evento: data, dia da semana, horário de início e fim (para a agenda), entrada gratuita/paga.
  Projeto/instituição sem data: troque a contagem regressiva por números, horários de
  atendimento ou "próximo encontro".
- Local completo com CEP; links Google Maps e Waze.
- Quem ministra/idealizou/coordena (nome, título exato que o usuário quer), frases, redes.
- Atrações/serviços, público, dinâmica, paleta de roupa, o que levar.
- WhatsApp de atendimento (+ mensagem pronta), link do grupo, Instagram, site.
- Fotos utilizáveis, logo do projeto e do local.
Pesquise fontes oficiais (site; Instagram costuma bloquear — peça as legendas). Não invente
números nem cargos; avise quais textos você escreveu para o usuário ajustar. Se houver site
modelo, baixe e estude antes de desenhar.

### 2. Montar o projeto
Estrutura: `references/publicacao-e-dominio.md` §1. Copie `assets/exemplo-impacto-rosa/src|css|js`
(e `scripts/montar_pagina.py` para `scripts/`) como ponto de partida e adapte:
- `src/index.html` usa `../assets/img/…`, `../icons/…` e `SITE_URL` (trocado no montar).
- Cores em tokens no topo do CSS (`--rose`, `--amber`…): troque pela identidade tirada do
  flyer/logo. Fundo escuro cinematográfico + cor da marca + âmbar de acento.

Seções (ordem que funcionou; corte o que não se aplica):
1. Faixa animada no topo (data, local, lema, "Atendimento 24h · número", grupo) — duas metades iguais.
2. Cabeçalho fixo: logo + nome + Instagram.
3. Topo: foto escurecida, selo, nome gigante, lema, data, endereço, **contagem regressiva**,
   botões "Quero participar", "Fale com a equipe · 24h", **"Ficha de inscrição"**, "Entrar no grupo",
   "Adicionar à agenda", link "Cadastre-se…" (abre o pop-up).
4. Faixa de números reais.
5. Atração especial com foto + cartões (programação, comunhão, paleta do dia).
6. O movimento/projeto: história + 3 pilares.
7. Galeria em mosaico que **abre em tela cheia** (setas, teclado, deslizar).
8. Arte/frase de destaque.
9. Quem ministra/idealizou: foto, frase, título, bio, botões.
10. Lema/símbolo com a logo.
11. Local: logo do local (sem brilho), endereço, Maps/Waze, horários, redes.
12. Chamada final "Chegou a sua vez" + agenda + grupo + **cartão com QR da ficha**.
13. Contato: WhatsApp 24h, Instagram, Como chegar, Grupo.
14. Rodapé + botão flutuante do WhatsApp "24h" + pop-up de cadastro + visualizador de fotos.

Logos chapadas em foto → `vetorizar_logo.py`. Logos 3D/brilhantes → imagem recortada.

### 3. Cadastro rápido (pop-up de leads)
`references/leads-supabase.md`: perguntar onde guardar, tabela com
`assets/exemplo-impacto-rosa/sql/leads.sql`, chave pública, testes, plano B pelo WhatsApp.

### 4. Ficha de inscrição completa (formulário estilo Jotform)
`references/ficha-inscricao.md`: página `ficha/index.html` em 5 etapas, tabela com
`sql/fichas.sql`, **LGPD para dados sensíveis** (consentimento específico + trava no banco),
teste com `testar_ficha.js`, botão e QR na página principal.

### 5. Ícones, prévia, agenda, QR codes
`gerar_icones.js` (emblema + og-image) e o comando do `favicon.ico` que ele imprime. Agenda:
Google + `.ics` (ver `carrossel-instagram.md` § Agenda). QR: `qr.py` por link + `folha_qr.py`.

### 6. Montar, testar e mostrar
```
python3 scripts/montar_pagina.py --url https://ENDERECO/
python3 scripts/montar_pagina.py --url https://ENDERECO/ --nome "Projeto" --artefato /scratchpad/x.html
node .claude/skills/pagina-evento/scripts/testar_pagina.js index.html "LINK_WA_OFICIAL_COMPLETO" prints/
node .claude/skills/pagina-evento/scripts/testar_ficha.js prints/
```
O link do WhatsApp passado ao teste tem que ser o **completo, com `?text=`** (senão acusa
"waDiferentes"). Corrija o que o teste apontar e **olhe os prints** (320/390/1280 px). Publique a
versão artefato com a ferramenta Artifact já na primeira entrega e republique no mesmo link a cada
mudança (no link do Claude o pop-up cai no plano B e a ficha não envia — avise).

### 7. Carrossel do Instagram
`references/carrossel-instagram.md`: artes, QR, .zip e legenda.

### 8. Publicar
`references/publicacao-e-dominio.md`: GitHub Pages (usuário ativa), `main` só com autorização,
subdomínio via CNAME no DNS de quem manda (Hostinger mesmo com site na Vercel), arquivo `CNAME`
só depois do DNS responder, `--url` com o endereço novo, conferir no ar, "Enforce HTTPS".
Depois de cada push, **confirme no ar** (trecho novo no HTML com `?v=$RANDOM`); se o Pages travar,
o próximo push útil destrava.

### 9. Documentar no repositório
`README.md` e `docs/COMANDO-PARA-O-CLAUDE.md` (dados oficiais, regras, tabelas do Supabase com
link, QR codes, como trocar a data, como publicar). Atualize a cada mudança — é o que permite
outra sessão continuar sem perguntar tudo de novo.

## Ao terminar cada rodada
Resuma em português, em tópicos curtos: o que mudou, o que foi testado (com resultado), o link
para abrir (e imagens com SendUserFile quando for visual), e o que falta do lado do usuário com
passo a passo exato e links diretos.

## Instalar a skill para todos os projetos
- Na sessão: `cp -r .claude/skills/pagina-evento ~/.claude/skills/` (vale só enquanto a máquina
  existir).
- Permanente na conta: empacotar (`.skill` = zip da pasta) e mandar com SendUserFile → o usuário
  clica **"Save skill"**. Ao atualizar, gere e mande de novo.
- Em cada repositório novo: copiar a pasta para `.claude/skills/pagina-evento/` e o
  `assets/projeto-base/.claude/` (hook que instala as ferramentas).
