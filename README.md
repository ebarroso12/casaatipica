# Casa Atípica

Página do projeto **Casa Atípica** (acolhimento para mães de filhos com autismo) e **triagem de acolhimento**:
20 perguntas simples que pontuam as áreas social, espiritual, emocional, mental e de aprendizagem sobre o TEA,
definem a prioridade de acolhimento e geram, para a equipe, um parecer por IA com resumo e CIDs a investigar.

- Página: `index.html` (gerada a partir de `src/`, `assets/` por `scripts/montar_pagina.py`)
- Triagem: `triagem/index.html`
- Servidor: `supabase/functions/triagem/` (pontuação em `pontuacao.js`, parecer da IA em `index.ts`)
- Banco: `sql/triagens.sql` (Supabase, tabela `casaatipica_triagens`, visão `casaatipica_fila`)

Os CIDs são hipóteses para avaliação de médico ou psicólogo, nunca diagnóstico, e a mãe não os vê.

Detalhes, regras e passo a passo: [docs/COMANDO-PARA-O-CLAUDE.md](docs/COMANDO-PARA-O-CLAUDE.md).
