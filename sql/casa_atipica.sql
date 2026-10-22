-- Casa Atípica · triagem de acolhimento de mães atípicas
-- Projeto Supabase: crmclinica (umvpwqqjzpxwuxdnnxzy), schema SEPARADO `casa_atipica` (sem custo extra).
-- O schema não é exposto na API: a chave pública não enxerga nada. Só a função `triagem` grava,
-- por conexão direta ao banco. A equipe vê pelo Table Editor escolhendo o schema casa_atipica.
--
-- Dados de saúde = dados sensíveis (LGPD art. 11). Por isso:
--   * RLS ligado, nenhuma política, schema fora da API: a chave pública não lê nem grava nada aqui.
--   * A equipe vê pelo painel do Supabase (Table Editor), com acesso restrito ao time.
--   * Consentimento geral e de saúde são obrigatórios (o banco recusa sem eles).

create schema if not exists casa_atipica;
revoke all on schema casa_atipica from public, anon, authenticated;

create table if not exists casa_atipica.triagem (
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
  resumo_regra text,                   -- resumo por regras, sem IA e sem custo
  cids_regra jsonb not null,           -- CIDs a investigar pela regra (não é diagnóstico)

  -- Parecer da IA (só para a equipe; a mãe não vê)
  parecer_status text not null default 'pendente' check (parecer_status in ('pendente', 'ok', 'erro', 'sem_chave')),
  parecer_ia jsonb,
  resumo_ia text,
  prioridade_ia text check (prioridade_ia in ('urgente', 'alta', 'media', 'baixa')),
  prioridade_final text not null check (prioridade_final in ('urgente', 'alta', 'media', 'baixa')),

  observacoes_equipe text,

  -- LGPD
  consentimento boolean not null check (consentimento),
  consentimento_saude boolean not null check (consentimento_saude),
  origem text
);

create index if not exists triagem_fila_idx on casa_atipica.triagem (prioridade_final, criado_em);
alter table casa_atipica.triagem enable row level security;
revoke all on casa_atipica.triagem from public, anon, authenticated;

-- Pacientes (mães): fila de espera, ativa ou inativa. A triagem cria/atualiza a paciente sozinha.
create table if not exists casa_atipica.paciente (
  id uuid primary key default gen_random_uuid(),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  nome text not null,
  como_chamar text,
  whatsapp text not null unique check (whatsapp ~ '^55[0-9]{10,11}$'),
  cidade text,
  situacao text not null default 'fila_espera' check (situacao in ('fila_espera', 'ativo', 'inativo')),
  prioridade text not null check (prioridade in ('urgente', 'alta', 'media', 'baixa')),
  ultima_triagem_id uuid references casa_atipica.triagem(id) on delete set null,
  entrou_na_fila_em timestamptz not null default now(),
  inicio_acolhimento date,
  fim_acolhimento date,
  motivo_inativo text,
  responsavel text,
  observacoes text,
  constraint inativo_tem_motivo check (situacao <> 'inativo' or motivo_inativo is not null)
);
create index if not exists paciente_situacao_idx on casa_atipica.paciente (situacao, prioridade, entrou_na_fila_em);
alter table casa_atipica.paciente enable row level security;
revoke all on casa_atipica.paciente from public, anon, authenticated;

-- Datas automáticas ao mudar de situação.
create or replace function casa_atipica.paciente_datas() returns trigger
language plpgsql set search_path = casa_atipica, pg_temp as $$
begin
  new.atualizado_em := now();
  if tg_op = 'UPDATE' and new.situacao is distinct from old.situacao then
    if new.situacao = 'ativo' and new.inicio_acolhimento is null then new.inicio_acolhimento := current_date; end if;
    if new.situacao = 'inativo' and new.fim_acolhimento is null then new.fim_acolhimento := current_date; end if;
    if new.situacao = 'fila_espera' then new.entrou_na_fila_em := now(); end if;
  end if;
  return new;
end $$;
create or replace trigger paciente_datas before insert or update on casa_atipica.paciente
  for each row execute function casa_atipica.paciente_datas();

-- Cada triagem cria a paciente na fila de espera (ou atualiza a que já existe pelo WhatsApp).
create or replace function casa_atipica.triagem_para_paciente() returns trigger
language plpgsql set search_path = casa_atipica, pg_temp as $$
begin
  insert into paciente (nome, como_chamar, whatsapp, cidade, prioridade, ultima_triagem_id)
  values (new.nome, new.como_chamar, new.whatsapp, new.cidade, new.prioridade_final, new.id)
  on conflict (whatsapp) do update set
    nome = excluded.nome,
    como_chamar = coalesce(excluded.como_chamar, paciente.como_chamar),
    cidade = coalesce(excluded.cidade, paciente.cidade),
    prioridade = excluded.prioridade,
    ultima_triagem_id = excluded.ultima_triagem_id;
  return new;
end $$;
create or replace trigger triagem_para_paciente after insert on casa_atipica.triagem
  for each row execute function casa_atipica.triagem_para_paciente();

-- Se o parecer da IA subir a prioridade, a paciente acompanha.
create or replace function casa_atipica.triagem_prioridade() returns trigger
language plpgsql set search_path = casa_atipica, pg_temp as $$
begin
  update paciente set prioridade = new.prioridade_final where ultima_triagem_id = new.id;
  return new;
end $$;
create or replace trigger triagem_prioridade after update of prioridade_final on casa_atipica.triagem
  for each row when (new.prioridade_final is distinct from old.prioridade_final)
  execute function casa_atipica.triagem_prioridade();

-- Três listas para a equipe.
create or replace view casa_atipica.fila_espera with (security_invoker = true) as
select
  row_number() over (order by array_position(array['urgente', 'alta', 'media', 'baixa'], p.prioridade), p.entrou_na_fila_em) as posicao,
  case p.prioridade when 'urgente' then 'P1 · Urgente (24h)' when 'alta' then 'P2 · Alta (7 dias)'
    when 'media' then 'P3 · Média (30 dias)' else 'P4 · Baixa' end as prioridade,
  t.alerta_risco, p.nome, p.whatsapp, p.cidade, p.entrou_na_fila_em,
  current_date - p.entrou_na_fila_em::date as dias_na_fila,
  t.pontuacao_total, coalesce(t.resumo_ia, t.resumo_regra) as resumo,
  (select string_agg(c->>'codigo' || ' ' || (c->>'nome'), ' | ')
     from jsonb_array_elements(coalesce(t.parecer_ia->'cids_hipotese', t.cids_regra)) c) as cids_a_investigar,
  t.protocolo, p.id as paciente_id
from casa_atipica.paciente p
left join casa_atipica.triagem t on t.id = p.ultima_triagem_id
where p.situacao = 'fila_espera'
order by posicao;

create or replace view casa_atipica.pacientes_ativos with (security_invoker = true) as
select p.nome, p.como_chamar, p.whatsapp, p.cidade, p.prioridade, p.inicio_acolhimento,
  current_date - p.inicio_acolhimento as dias_em_acolhimento, p.responsavel, p.observacoes, p.id as paciente_id
from casa_atipica.paciente p where p.situacao = 'ativo'
order by p.inicio_acolhimento;

create or replace view casa_atipica.pacientes_inativos with (security_invoker = true) as
select p.nome, p.whatsapp, p.cidade, p.inicio_acolhimento, p.fim_acolhimento, p.motivo_inativo, p.observacoes, p.id as paciente_id
from casa_atipica.paciente p where p.situacao = 'inativo'
order by p.fim_acolhimento desc nulls last;

revoke all on casa_atipica.fila_espera, casa_atipica.pacientes_ativos, casa_atipica.pacientes_inativos from public, anon, authenticated;
revoke all on function casa_atipica.paciente_datas(), casa_atipica.triagem_para_paciente(), casa_atipica.triagem_prioridade() from public, anon, authenticated;
