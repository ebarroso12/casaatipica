# Carrossel do Instagram e materiais de divulgação

## Carrossel (6 artes, 1080×1350)
Fonte: `assets/exemplo-impacto-rosa/carrossel/carrossel.html` (cada `<section class="slide">`
tem `data-arquivo`/id). Gere com `node scripts/gerar_carrossel.js carrossel/carrossel.html`.

Sequência que funcionou:
1. **Capa** — foto do evento escurecida, logo, "Nome do evento", data grande (dia · dia da semana
   · hora), selo "Entrada gratuita", endereço curto, "Arraste →".
2. **Quem ministra** — foto da pessoa à direita com degradê, nome grande, papel ("Idealizadora…"),
   frase dela em destaque.
3. **Atração especial** — ex.: pilates com a personal trainer (foto em tela cheia + nome).
4. **Paleta do dia / como vir vestida** — bolinhas de cor grandes com os nomes das peças.
5. **Comunhão** — "Traga um prato", ícone grande em âmbar.
6. **Local e confirmação** — logo do local, endereço, selo, **dois QR codes** (confirmar
   presença no WhatsApp 24h e entrar no grupo), "Aponte a câmera…".

Rodapé de cada arte: logo + nome do evento + "n / 6" em âmbar.

Cuidados: título não pode encostar na borda (o "IMPACTO" cortou com 210 px; 178 px coube);
rótulos de QR com `white-space: nowrap`. Confira lendo os QR da arte final com OpenCV
(`detectAndDecodeMulti` no PNG do slide). Mande as artes com SendUserFile (exibição render) e um
.zip + `LEGENDA.md` (legenda pronta com data, hora, local, entrada, @ do Instagram, paleta, prato,
WhatsApp, grupo, "link na bio" e hashtags). Não versione o .zip no repositório.

## Folha de QR codes (imprimir / stories)
Gere cada QR com `scripts/qr.py` (confere a leitura) e junte com
`python3 scripts/folha_qr.py carrossel/qr-codes-todos.png "NOME · data · hora" "qr-whatsapp.png|Confirmar presença|WhatsApp 24h" "qr-grupo.png|Entrar no grupo|Grupo do WhatsApp" "qr-ficha.png|Ficha de inscrição|Formulário completo" "qr-site.png|Página do evento|endereco.com.br"`
(ele relê cada QR da folha). Versione os PNG em `carrossel/` para ficarem acessíveis pelo site.

## Prévia do link (og-image 1200×630) e ícones
`node scripts/gerar_icones.js --logo … --foto … --rotulo … --titulo … --titulo2 … --data … --selo … --local …`
Prévia: foto do evento com degradê à esquerda, logo, nome, data e selo. As tags `og:url` e
`og:image` precisam de endereço **absoluto** (por isso `SITE_URL` no src e `--url` no montar).
O WhatsApp guarda a prévia antiga em cache: pode demorar para atualizar.

## Agenda
Botão "Adicionar à agenda": link do Google Agenda (`calendar.google.com/calendar/render?action=TEMPLATE…`,
`ctz=America/Sao_Paulo`) + arquivo `.ics` com dois lembretes (1 dia antes e 2 h antes). No link
do Claude o download do .ics é bloqueado — o montar remove esse botão na versão artefato.
