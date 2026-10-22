# Casa Atípica

Página do projeto **Casa Atípica** (acolhimento para mães de filhos com autismo) e **triagem de acolhimento**:
20 perguntas simples que pontuam as áreas social, espiritual, emocional, mental e de aprendizagem sobre o TEA,
definem a prioridade de acolhimento e geram, para a equipe, um resumo e CIDs a investigar (por regras, sem custo;
parecer por IA opcional). Cada mãe entra na fila de espera e passa a ativa ou inativa.

- Página: `index.html` (gerada a partir de `src/`, `assets/` por `scripts/montar_pagina.py`)
- Triagem: `triagem/index.html`
- Servidor: `supabase/functions/triagem/` (pontuação em `pontuacao.js`, parecer da IA em `index.ts`)
- Banco: `sql/casa_atipica.sql` (Supabase crmclinica, espaço separado `casa_atipica`: tabelas `triagem` e `paciente`;
  listas `fila_espera`, `pacientes_ativos`, `pacientes_inativos`)

Os CIDs são hipóteses para avaliação de médico ou psicólogo, nunca diagnóstico, e a mãe não os vê.

Detalhes, regras e passo a passo: [docs/COMANDO-PARA-O-CLAUDE.md](docs/COMANDO-PARA-O-CLAUDE.md).
