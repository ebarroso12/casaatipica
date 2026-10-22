# Pop-up de cadastro (leads) salvo no Supabase

## Onde guardar
Página estática não tem banco próprio. Com o conector do Supabase disponível:
1. `list_projects` e **pergunte ao usuário** onde criar (projeto existente relacionado ou novo —
   projeto novo pode gerar cobrança). Caso real: tabela própria `impacto_rosa_leads` dentro do
   projeto do app da igreja ("selaah"), sem tocar nas tabelas do app.
2. `list_tables` para não colidir com nomes existentes.
3. `apply_migration` com `assets/exemplo-impacto-rosa/sql/leads.sql` (renomeie a tabela).
4. `get_project_url` + `get_publishable_keys` → use a chave `sb_publishable_…` no front.
   É pública por design: com RLS ela só consegue inserir.
5. Teste com curl usando a chave pública (ver fim do SQL): insert 201; ler/apagar 401; sem
   consentimento 401; e-mail inválido 400. CORS: `OPTIONS` com `Origin:` do site → `*`.
6. `get_advisors(security)`: a tabela nova não pode aparecer nos avisos. Avisos antigos de
   outras tabelas não são escopo — mencione sem mexer.

## Armadilhas reais
- **Apagar o registro de teste**: `execute_sql` com `delete` costuma ficar esperando uma
  confirmação que não chega (cancela ou dá timeout). Não insista; peça ao usuário para apagar
  pelo Table Editor, ou deixe (marcado com `origem = 'teste'`). Por isso: nos testes de
  navegador, **simule** a resposta (`page.route(... fulfill 201)`) em vez de gravar de verdade.
- **Link do Claude (artefato)**: o navegador bloqueia `fetch` para o Supabase (CSP). O pop-up
  precisa de plano B: se o envio falhar, mostrar botão "Enviar meus dados pelo WhatsApp" com os
  dados já escritos na mensagem. Avise o usuário que os cadastros só vão para o banco no site
  publicado.
- **Nome de variável**: o script da contagem regressiva e o do pop-up usavam `var campos` no
  mesmo escopo → o pop-up sobrescreveu e a contagem parou após 2,5 s. Use nomes distintos
  (`entradas` no pop-up) e teste que a contagem continua andando com o pop-up aberto.

## Comportamento do pop-up (o que agradou)
- Abre sozinho ~2,5 s após a primeira visita; não volta para quem fechou ou se cadastrou
  (`localStorage`, sempre dentro de try/catch); link "Cadastre-se…" no topo reabre.
- Campos: nome completo (exige nome e sobrenome), WhatsApp com máscara `(16) 99999-9999`
  (salvo como `55` + dígitos), e-mail, Instagram (aceita colar o link do perfil e limpa para
  `usuario`; opcional), caixa de consentimento LGPD obrigatória, campo-armadilha anti-robô.
- Mensagens de erro claras ("Escreva seu nome completo…"), foco preso no diálogo, Esc fecha,
  clique fora fecha.
- Depois de cadastrar: "Cadastro feito!" com o primeiro nome + botões "Entrar no grupo do
  WhatsApp" e "Confirmar presença".
- Para ver os cadastros: Supabase → projeto → Table Editor → tabela → Export → CSV.
