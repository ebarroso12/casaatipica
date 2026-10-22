-- Tabela de cadastros (leads) do pop-up de uma página de evento.
-- Troque "evento_leads" pelo nome do evento (ex.: impacto_rosa_leads) e o default de "evento".
-- O site usa a chave PÚBLICA (publishable/anon): ela só consegue INSERIR.
-- Ler, alterar e apagar fica só para o painel do Supabase.
create table public.evento_leads (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  nome          text not null check (char_length(btrim(nome)) between 3 and 120),
  whatsapp      text not null check (whatsapp ~ '^[0-9]{10,13}$'),            -- só dígitos, com 55
  email         text not null check (char_length(email) <= 160 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  instagram     text check (instagram is null or instagram ~ '^[A-Za-z0-9._]{1,30}$'),  -- sem @
  consentimento boolean not null check (consentimento),                         -- LGPD
  evento        text not null default 'evento-aaaa-mm-dd' check (char_length(evento) <= 60),
  origem        text not null default 'pagina' check (char_length(origem) <= 60)
);

comment on table public.evento_leads is 'Leads do pop-up da página do evento. Inserção pública; leitura só pelo painel.';

alter table public.evento_leads enable row level security;

revoke all on public.evento_leads from anon, authenticated;
grant insert on public.evento_leads to anon, authenticated;

create policy "Site pode cadastrar leads"
  on public.evento_leads for insert to anon, authenticated
  with check (consentimento);

create index evento_leads_created_at_idx on public.evento_leads (created_at desc);

-- Teste com a chave pública (troque URL/KEY):
--   POST válido  -> 201
--   GET (ler)    -> 401 permission denied
--   DELETE       -> 401 permission denied
--   sem consentimento -> 401 ; e-mail inválido -> 400
-- Marque o teste com "origem":"teste" para achar e apagar depois pelo painel.
