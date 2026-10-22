-- Casa Atípica · triagem de acolhimento de mães atípicas
-- Projeto Supabase: crmclinica (umvpwqqjzpxwuxdnnxzy). Tabela com prefixo casaatipica_ para não
-- se misturar com as tabelas da clínica.
--
-- Dados de saúde = dados sensíveis (LGPD art. 11). Por isso:
--   * RLS ligado e NENHUMA política: a chave pública do site não lê nem grava nada aqui.
--   * Só a função `triagem` (com a chave de serviço, que fica no servidor) insere e atualiza.
--   * A equipe vê pelo painel do Supabase (Table Editor), com acesso restrito ao time.
--   * Consentimento geral e de saúde são obrigatórios (o banco recusa sem eles).

create table if not exists public.casaatipica_triagens (
  id uuid primary key default gen_random_uuid(),
  criado_em timestamptz not null default now(),
  protocolo text not null unique default upper(substr(md5(gen_random_uuid()::text), 1, 6)),

  -- Dados da mãe
  nome text not null check (char_length(nome) between 3 and 120),
  como_chamar text check (char_length(como_chamar) <= 60),
  data_nascimento date,
  idade int check (idade between 10 and 120),
  whatsapp text not null check (whatsapp ~ '^55[0-9]{10,11}$'),
  email text check (char_length(email) <= 160),
  cidade text check (char_length(cidade) <= 100),
  bairro text check (char_length(bairro) <= 100),
  estado_civil text,
  filhos int check (filhos between 0 and 30),
  beneficios text[],
  religiao text check (char_length(religiao) <= 60),
  igreja text check (char_length(igreja) <= 120),

  -- Filho(a) com autismo
  filho_nome text check (char_length(filho_nome) <= 120),
  filho_idade int check (filho_idade between 0 and 80),

  -- Respostas (ids q1..q20, valores da página) e relato livre
  respostas jsonb not null,
  medicacoes text check (char_length(medicacoes) <= 300),
  relato text check (char_length(relato) <= 3000),

  -- Pontuação calculada no servidor (supabase/functions/triagem/pontuacao.js)
  pontos jsonb not null,               -- pontos por pergunta e por área
  pontuacao_total int not null check (pontuacao_total between 0 and 100),
  phq2 int not null,                   -- ≥ 3: rastreio positivo para depressão
  gad2 int not null,                   -- ≥ 3: rastreio positivo para ansiedade
  alerta_risco boolean not null,       -- pergunta 17 (pensamentos de morte / se machucar)
  prioridade_regra text not null check (prioridade_regra in ('urgente', 'alta', 'media', 'baixa')),
  motivos_regra text[] not null,
  cids_regra jsonb not null,           -- CIDs a investigar pela regra (não é diagnóstico)

  -- Parecer da IA (só para a equipe; a mãe não vê)
  parecer_status text not null default 'pendente' check (parecer_status in ('pendente', 'ok', 'erro', 'sem_chave')),
  parecer_ia jsonb,
  resumo_ia text,
  prioridade_ia text check (prioridade_ia in ('urgente', 'alta', 'media', 'baixa')),
  prioridade_final text not null check (prioridade_final in ('urgente', 'alta', 'media', 'baixa')),

  -- Acompanhamento da equipe
  status_atendimento text not null default 'nova'
    check (status_atendimento in ('nova', 'em_contato', 'acolhida', 'encaminhada', 'lista_espera', 'arquivada')),
  observacoes_equipe text,

  -- LGPD
  consentimento boolean not null check (consentimento),
  consentimento_saude boolean not null check (consentimento_saude),
  origem text
);

comment on table public.casaatipica_triagens is
  'Casa Atípica: triagem de acolhimento de mães atípicas. Dados sensíveis (LGPD). Só a função triagem grava; ninguém lê pela chave pública. CIDs são hipóteses para avaliação profissional, não diagnóstico.';

create index if not exists casaatipica_triagens_fila_idx
  on public.casaatipica_triagens (prioridade_final, criado_em);

alter table public.casaatipica_triagens enable row level security;
revoke all on public.casaatipica_triagens from anon, authenticated;

-- Fila de atendimento para a equipe: mais urgente primeiro, depois a mais antiga.
create or replace view public.casaatipica_fila
with (security_invoker = true) as
select
  protocolo,
  criado_em,
  case prioridade_final when 'urgente' then 'P1 · Urgente (24h)' when 'alta' then 'P2 · Alta (7 dias)'
    when 'media' then 'P3 · Média (30 dias)' else 'P4 · Baixa' end as prioridade,
  alerta_risco,
  nome,
  whatsapp,
  cidade,
  pontuacao_total,
  resumo_ia,
  (select string_agg(c->>'codigo' || ' ' || (c->>'nome'), ' | ')
     from jsonb_array_elements(coalesce(parecer_ia->'cids_hipotese', cids_regra)) c) as cids_a_investigar,
  status_atendimento,
  parecer_status
from public.casaatipica_triagens
order by array_position(array['urgente', 'alta', 'media', 'baixa'], prioridade_final), criado_em;

revoke all on public.casaatipica_fila from anon, authenticated;
