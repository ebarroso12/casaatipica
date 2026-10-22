-- Ficha de inscrição completa do Impacto Rosa (formulário estilo Jotform).
-- Contém dados sensíveis de saúde (LGPD art. 11): o site só INSERE; leitura apenas pelo painel.
create table public.impacto_rosa_fichas (
  id                      uuid primary key default gen_random_uuid(),
  created_at              timestamptz not null default now(),
  -- Sobre você
  nome                    text not null check (char_length(btrim(nome)) between 3 and 120),
  como_chamar             text check (como_chamar is null or char_length(como_chamar) <= 60),
  data_nascimento         date not null check (data_nascimento between date '1900-01-01' and current_date),
  idade                   smallint check (idade between 0 and 120),
  sexo                    text not null check (sexo in ('feminino','masculino','prefiro_nao_informar')),
  estado_civil            text not null check (estado_civil in ('solteira','casada','uniao_estavel','divorciada','viuva','outro')),
  filhos                  smallint not null check (filhos between 0 and 30),
  profissao               text check (profissao is null or char_length(profissao) <= 100),
  whatsapp                text not null check (whatsapp ~ '^[0-9]{10,13}$'),
  email                   text check (email is null or (char_length(email) <= 160 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')),
  -- Fé
  religiao                text check (religiao is null or char_length(religiao) <= 60),
  igreja                  text check (igreja is null or char_length(igreja) <= 120),
  -- Saúde e bem-estar (opcionais, dados sensíveis)
  quadro_emocional        text check (quadro_emocional is null or char_length(quadro_emocional) <= 400),
  toma_medicacao          boolean,
  medicacoes              text check (medicacoes is null or char_length(medicacoes) <= 500),
  condicao_fisica         text check (condicao_fisica is null or condicao_fisica in ('boa','limitacao_leve','limitacao_importante')),
  condicao_fisica_obs     text check (condicao_fisica_obs is null or char_length(condicao_fisica_obs) <= 500),
  tem_patologia           boolean,
  patologias              text check (patologias is null or char_length(patologias) <= 500),
  sofrimento              text check (sofrimento is null or char_length(sofrimento) <= 2000),
  situacao_familiar       text check (situacao_familiar is null or char_length(situacao_familiar) <= 2000),
  -- Consentimentos (LGPD)
  consentimento           boolean not null check (consentimento),
  consentimento_saude     boolean not null default false,
  evento                  text not null default 'reuniao-de-mulheres-2026-11-07' check (char_length(evento) <= 60),
  origem                  text not null default 'ficha' check (char_length(origem) <= 60),
  -- Dado de saúde só entra com o consentimento específico marcado.
  constraint saude_exige_consentimento check (
    consentimento_saude or (
      quadro_emocional is null and toma_medicacao is null and medicacoes is null and
      condicao_fisica is null and condicao_fisica_obs is null and tem_patologia is null and
      patologias is null and sofrimento is null and situacao_familiar is null
    )
  )
);

comment on table public.impacto_rosa_fichas is 'Fichas de inscrição do Impacto Rosa. Contém dados sensíveis de saúde (LGPD). Inserção pública; leitura só pelo painel, por pessoas autorizadas.';

alter table public.impacto_rosa_fichas enable row level security;
revoke all on public.impacto_rosa_fichas from anon, authenticated;
grant insert on public.impacto_rosa_fichas to anon, authenticated;

create policy "Site pode enviar fichas"
  on public.impacto_rosa_fichas for insert to anon, authenticated
  with check (consentimento);

create index impacto_rosa_fichas_created_at_idx on public.impacto_rosa_fichas (created_at desc);
-- Teste sem gravar nada (rode no execute_sql; o raise final desfaz tudo):
-- do $$ begin
--   set local role anon;
--   insert into public.impacto_rosa_fichas (nome, data_nascimento, sexo, estado_civil, filhos, whatsapp, consentimento)
--     values ('Teste Silva', '1990-01-01', 'feminino', 'solteira', 0, '5516999998888', true);           -- deve ENTRAR
--   begin insert into public.impacto_rosa_fichas (nome, data_nascimento, sexo, estado_civil, filhos, whatsapp, consentimento, sofrimento)
--     values ('Teste Silva', '1990-01-01', 'feminino', 'solteira', 0, '5516999998888', true, 'x');     -- deve ser RECUSADO
--     raise notice 'ERRO: saúde sem consentimento entrou'; exception when others then raise notice 'ok: recusado'; end;
--   raise exception 'fim do teste (desfaz tudo)';
-- end $$;
