# Casa Atípica · comando para o Claude

Leia antes de mexer no projeto. Use a skill `.claude/skills/pagina-evento` (leia `references/licoes-e-preferencias.md`).
Fale com o usuário em português do Brasil, linguagem de leigo.

## Dados oficiais
- **Nome:** Casa Atípica (sempre assim). Projeto de acolhimento para **mães atípicas** (mães de filhos com TEA).
- **Lema (texto do Claude, a confirmar):** "Quem cuida também precisa ser cuidada."
- **Pilares (texto do Claude, a confirmar):** Aprender · Cuidar · Fortalecer.
- **WhatsApp da equipe:** ainda não informado → `WHATSAPP_NUM` em `scripts/montar_pagina.py` (vazio = o botão abre o WhatsApp para a pessoa escolher o contato).
- **Instagram, endereço, coordenação, logo oficial, fotos:** ainda não informados. A logo atual (infinito turquesa → girassol) foi criada pelo Claude.
- **Cores:** azul-petróleo `#071419`, turquesa `#7fd8e2`/`#1f9fb2`, girassol `#f6b93b`.

## Endereços
- Página: https://ebarroso12.github.io/casaatipica/ (depois que o GitHub Pages for ativado)
- Triagem: https://ebarroso12.github.io/casaatipica/triagem/ (QR em `assets/img/qr-triagem.png`)
- Prévia no Claude: https://claude.ai/artifact/S1qoHmerYU6P5nRNpMrdG6 (lá a triagem não envia; abra pelo endereço real)

## Triagem (o formulário das mães)
- `triagem/index.html`: 7 etapas, 20 perguntas numeradas + dados da mãe e do filho. Linguagem simples.
- Perguntas e pontos: **fonte única** `supabase/functions/triagem/pontuacao.js`. Se mudar uma pergunta, mude o mesmo `value` na página.
  - Áreas e pesos: filho/aprendizagem 25%, social 25%, emocional/mental 40%, espiritual 5%, pedidos 5% → pontuação 0–100.
  - Q11–Q12 = PHQ-2 (depressão, corte 3); Q13–Q14 = GAD-2 (ansiedade, corte 3); Q17 = risco (item 9 do PHQ-9).
  - Prioridade: **urgente** se Q17 > 0; **alta** se total ≥ 60, ou PHQ-2 e GAD-2 ≥ 3, ou esgotamento máximo sem ajuda; **média** se total ≥ 35 ou um rastreio positivo; senão **baixa**.
  - CIDs pela regra (R45.8, F32, F41.1, Z73.0, Z63.6, Z59.6, Z60.5) = **hipóteses a investigar**, nunca diagnóstico. A mãe não vê CID.
- Função `triagem` (Supabase Edge Function, projeto **crmclinica** `umvpwqqjzpxwuxdnnxzy`, `verify_jwt` desligado):
  recalcula os pontos, grava e, em segundo plano, pede ao Claude (`claude-opus-5-5`, saída em JSON) o parecer:
  resumo, perfil, prioridade, áreas, CIDs a investigar, encaminhamentos. A IA só **sobe** a prioridade.
  Nome, WhatsApp e e-mail **não** vão para a IA.
- Sempre grava um **resumo por regras** (`resumo_regra`, grátis). A IA é opcional e paga (centavos por triagem):
  só roda com `ANTHROPIC_API_KEY` em Supabase → Edge Functions → Secrets. Sem a chave: `parecer_status = sem_chave`.
  **O usuário não quer gastar**: não cadastrar a chave nem criar nada pago sem ele pedir.
- Publicar a função de novo: `deploy_edge_function` com `index.ts` **e** `pontuacao.js` (os dois arquivos completos).

## Banco (Supabase · crmclinica, espaço separado `casa_atipica`, sem custo extra)
- Nada de projeto novo no Supabase (custa US$ 10/mês; o usuário recusou). Tudo fica no crmclinica, no schema
  `casa_atipica`, separado das tabelas da clínica e **fora da API**: a função grava por conexão direta (`SUPABASE_DB_URL`).
- SQL completo: `sql/casa_atipica.sql`.
- `casa_atipica.triagem`: cada triagem (respostas, pontos, prioridade, CIDs, resumo, parecer da IA opcional).
- `casa_atipica.paciente`: as mães. `situacao` = `fila_espera` | `ativo` | `inativo` (inativo exige `motivo_inativo`).
  A triagem cria a paciente na fila sozinha (gatilho); nova triagem da mesma mãe (mesmo WhatsApp) atualiza, não duplica.
  Início e fim do acolhimento são preenchidos sozinhos ao mudar a situação.
- Listas: `casa_atipica.fila_espera` (posição por prioridade e tempo de espera), `pacientes_ativos`, `pacientes_inativos`.
- Ver: https://supabase.com/dashboard/project/umvpwqqjzpxwuxdnnxzy/editor → seletor de schema (onde aparece "public")
  → **casa_atipica**. Mudar a situação: tabela `paciente`, clique duplo na célula `situacao`.
- Dados de saúde = sensíveis (LGPD art. 11): consentimento geral + de saúde obrigatórios (o banco recusa sem eles). Restrinja quem acessa o projeto (Settings → Team), porque ele é o mesmo da clínica.
- Apagar teste pelo execute_sql funcionou (22/10/2026) com `delete ... where whatsapp = ... and nome = ...`.

## Montar, testar e publicar
```bash
python scripts/montar_pagina.py                                  # gera index.html
python scripts/montar_pagina.py --artefato build/casa-atipica.html
NODE_PATH="$(npm root -g)" node scripts/gerar_icones.js          # favicon, ícones, og-image
NODE_PATH="$(npm root -g)" node scripts/testar.js prints         # página + triagem, 320/390/1280 px (envio simulado)
python .claude/skills/pagina-evento/scripts/qr.py "URL" assets/img/qr-triagem.png
```
- Mudou o endereço do site? Troque `URL_PADRAO` no montar, as `og:` da triagem e gere o QR de novo.
- Publicação: GitHub Pages pela branch `main` (o usuário ativa em Settings → Pages). Depois de cada push, conferir no ar.
- Republique a prévia do Claude no mesmo link a cada mudança.
