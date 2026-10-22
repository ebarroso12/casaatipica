# Ficha de inscrição completa (formulário em etapas, estilo Jotform)

Quando o usuário pede "um formulário completo", "ficha de inscrição", "cadastro com tudo" ou
"estilo Jotform", faça uma página própria `ficha/index.html` (independente da página principal),
e não um pop-up. Exemplo funcionando: `assets/exemplo-impacto-rosa/ficha/index.html`; tabela:
`assets/exemplo-impacto-rosa/sql/fichas.sql`; teste: `scripts/testar_ficha.js`.

## Visual (o que agradou)
- Estilo Jotform: **fundo claro**, faixa de topo com a cor da marca (degradê vinho), logo, selo em
  âmbar com data/hora do evento, título "Ficha de inscrição *Nome*", e um **cartão branco central**
  com cantos arredondados e sombra suave.
- Barra de progresso em segmentos + "Etapa 1 de 5 · Nome da etapa".
- Opções como **cartões grandes de tocar** (rádio/caixa estilizados, borda e fundo da cor da marca
  quando marcados), contador − / + para números pequenos (filhos), botões "← Voltar" e "Próximo →"
  e, na última etapa, "Enviar ficha".
- Rodapé curto: "Seus dados ficam guardados com sigilo…" + nome/local.
- Tela final "Ficha enviada!" com o nome (ou como gosta de ser chamada), data do evento e botões
  "Entrar no grupo do WhatsApp" e "Voltar para a página".
- `meta robots noindex`, favicon e og da página principal (`../favicon.ico`, `../icons/…`), `og:url`
  absoluto terminando em `/ficha/`.
- Título da etapa recebe foco (acessibilidade) → `[tabindex="-1"]:focus { outline: none; }` senão
  aparece uma caixa âmbar em volta do título (aconteceu).

## Etapas usadas (Impacto Rosa — adapte ao público)
1. **Sobre você**: nome completo* (exige sobrenome), como gosta de ser chamada, data de
   nascimento* (calcula e mostra a idade na hora), sexo* (feminino/masculino/prefiro não informar).
2. **Família e contato**: estado civil* (solteira, casada, união estável, divorciada, viúva, outro),
   filhos* (contador 0–30), profissão, WhatsApp* com máscara `(16) 99999-9999` (salvo `55`+dígitos),
   e-mail (validado se preenchido).
3. **Fé**: religião (Evangélica, Católica, Espírita, Sem religião, Outra + "qual?"), igreja.
4. **Cuidado e bem-estar (opcional)**: quadro emocional (ansiedade, depressão, pânico, luto,
   estresse, nenhum, outro + qual; "Nenhum" desmarca os outros), toma medicação (sim/não + quais),
   condição física (boa / limitações leves / importantes + observação — útil para atividade física),
   patologia (sim/não + quais), sofrimento (texto), situação familiar que incomoda (texto).
5. **Confirmar**: resumo das respostas (saúde aparece só como "Respondido (sigiloso)"),
   consentimento geral obrigatório, campo-armadilha anti-robô.
Campos que dependem de resposta ("Qual?", "Quais medicações?") só aparecem quando fazem sentido.

## LGPD — dados sensíveis (obrigatório)
- Saúde física/emocional, religião e vida familiar são **dados sensíveis** (LGPD art. 11).
- Etapa de saúde **opcional** e **bloqueada** (campos desabilitados, aparência apagada) até a
  pessoa marcar um **consentimento específico** ("Autorizo… guardar as informações de saúde… de
  forma sigilosa, apenas para o meu acolhimento"). Sem marcar, o front não envia nenhum campo de
  saúde.
- O banco garante isso de novo: `constraint saude_exige_consentimento` recusa qualquer campo de
  saúde com `consentimento_saude = false`.
- RLS: o site (chave pública) **só insere**; ler/alterar/apagar só pelo painel do Supabase.
  Recomende ao usuário restringir quem tem acesso ao projeto (Settings → Team).
- **Sem plano B pelo WhatsApp** na ficha (diferente do pop-up de leads): dado sigiloso não deve
  ir para conversa. Se o envio falhar, mostrar "Não conseguimos enviar… toque em Enviar ficha de
  novo" e manter tudo preenchido. Consequência: no link do Claude (artefato) a ficha não envia
  — mostre a ficha pelo endereço publicado.

## Banco (Supabase)
- Mesma lógica de `leads-supabase.md`: perguntar o projeto, `list_tables`, `apply_migration`
  com `fichas.sql` (troque prefixo da tabela e o `evento` default), mesma chave `sb_publishable_…`.
- Testar sem gravar: bloco `DO` com `set local role anon` e `raise exception` no fim (modelo no
  fim do `fichas.sql`) — completo com consentimento ENTRA, saúde sem consentimento é RECUSADO,
  só básico ENTRA, leitura BLOQUEADA, e nada fica salvo.
- Teste no navegador **simulando** o Supabase: `node scripts/testar_ficha.js PASTA_PRINTS`
  (201 e 500, 320/390/1280 px, validação, máscara, idade, bloqueio da saúde, JSON enviado).
  Cuidado ao escrever seletores: `#t1` é o título (h2) da etapa; a etapa é `section:has(#t1)`.
- O usuário faz um envio real de teste; confira com `select` (sem mostrar dados de saúde
  na conversa — só se existem: `(sofrimento is not null) as tem_dados_saude`).
- `delete` pelo `execute_sql` **trava** (timeout de 60 s esperando confirmação). Peça ao usuário
  para apagar o teste no Table Editor: marcar a linha → **Delete 1 row**.
- O usuário se confunde entre `…_leads` (pop-up) e `…_fichas` (ficha). Diga sempre qual tabela,
  quantas linhas tem cada uma, e mande o link direto da tabela (o Table Editor mostra um número
  na URL: `/editor/25587?schema=public` — peça para salvar nos favoritos).
- Para ver: clique duplo na linha abre a ficha inteira; **Export → CSV** baixa tudo.

## Ligar a ficha à página principal e à divulgação
- Botão de verdade **"Ficha de inscrição"** (classe `btn btn-ficha`, borda âmbar, ícone de
  prancheta `#i-form`) junto dos botões do topo — o usuário pediu botão, link sublinhado não basta.
- Cartão na chamada final ("Chegou a sua vez"): QR code da ficha (imagem `assets/img/qr-ficha.png`,
  fundo branco) + "Conte um pouco sobre você" + botão "Preencher ficha" (texto curto: "Preencher
  minha ficha" quebrou em duas linhas no celular).
- Link também na tela "Cadastro feito!" do pop-up.
- Use `SITE_URLficha/` no `src` (o montar troca pelo endereço absoluto; funciona também no artefato).
- QR codes: `qr.py` para cada link + `folha_qr.py` para a folha com os 4 (presença, grupo, ficha,
  página). Mensagem pronta para mandar a ficha no WhatsApp para quem já confirmou.
