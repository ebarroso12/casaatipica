# Publicação: GitHub Pages, subdomínio e Hostinger/Vercel

## Índice
1. Estrutura do repositório
2. GitHub Pages (o que o usuário faz e o que eu faço)
3. Subdomínio próprio (DNS na Hostinger)
4. Quando o domínio principal está na Vercel
5. Ordem segura para ligar o domínio
6. Como verificar o DNS de verdade
7. Hostinger "Implante de GitHub" (alternativa)

---

## 1. Estrutura do repositório (igual ao site modelo do Legendários Franca)

```
index.html        ← página final, fotos/CSS/JS embutidos (gerada; nunca editar à mão)
favicon.ico       ← emblema da aba (16/32/48/64)
icons/            ← favicon.svg, favicon-32.png, icon-192/512, apple-touch-icon, og-image.jpg
src/index.html    ← código-fonte (caminhos ../assets/…, ../icons/…, SITE_URL)
assets/css, assets/js, assets/img
agenda/*.ics      ← arquivo "adicionar à agenda" para iPhone/Outlook
carrossel/        ← artes do Instagram + LEGENDA.md + carrossel.html
scripts/          ← montar_pagina.py, gerar_carrossel.js
docs/COMANDO-PARA-O-CLAUDE.md ← dados oficiais + passo a passo
previews/         ← prints da página inteira (celular e computador)
CNAME             ← só quando houver domínio próprio (ver seção 5)
```

O `index.html` único com tudo embutido serve para três destinos ao mesmo tempo: GitHub Pages,
Hostinger (importação Git) e colar num bloco "HTML personalizado" de construtores como o Atomicat.

## 2. GitHub Pages

- Ativar o Pages normalmente **não dá** pela API/ferramentas da sessão (sem permissão de
  configuração do repositório). Peça ao usuário, com o link exato:
  `https://github.com/<dono>/<repo>/settings/pages` → **Deploy from a branch** → **main** →
  **/ (root)** → **Save**. O site sai em `https://<dono>.github.io/<repo>/` em 1–2 min.
- O Pages publica a branch **main**. Se a sessão trabalha numa branch própria, criar ou atualizar
  a `main` exige autorização explícita do usuário (pergunte uma vez; depois de autorizado, mantenha
  a `main` igual à branch de trabalho a cada mudança).
- Confirmar no ar: `curl -s -o /dev/null -w "%{http_code}" https://<dono>.github.io/<repo>/` e
  procurar no HTML um trecho que só existe na versão nova (some `?v=$RANDOM` ao endereço para
  fugir do cache). Normalmente entra em 1–2 min.
- **Pages travado**: caso real, dois pushes seguidos e o site ficou 25 min na versão antiga
  (arquivos novos davam 404). Resolveu com o **próximo push de verdade** (ex.: atualizar
  `docs/`), que entrou em 50 s. Não use commit vazio; aproveite para registrar algo útil.
  A API de builds do Pages não é acessível pelo proxy da sessão.

## 3. Subdomínio próprio (ex.: evento.dominio.com.br)

Quem manda no DNS é quem aparece nos **nameservers** do domínio, não quem hospeda o site:
```
curl -s "https://dns.google/resolve?name=DOMINIO&type=NS"
```
- `*.dns-parking.com` → DNS da **Hostinger** (hPanel → Domínios → DOMÍNIO → DNS / Nameservers).
- `*.vercel-dns.com` → DNS da Vercel. `*.ns.cloudflare.com` → Cloudflare. Etc.

Registro a criar (na lista de DNS de quem manda):
| Tipo | Nome | Aponta para | TTL |
|---|---|---|---|
| CNAME | `evento` (só o prefixo; o painel completa o domínio) | `<dono>.github.io` | padrão (14400) |

Peça um **print da lista de registros** depois de salvar. Erro mais comum visto na prática:
o formulário fica preenchido mas o usuário não clicou no botão final "Adicionar registro" — a
lista embaixo continua sem a linha nova. O print resolve em segundos.

## 4. Quando o site principal está na Vercel

Caso real: domínio comprado na Hostinger, `www` aponta (CNAME) para a Vercel, DNS continua na
Hostinger. Consequências:
- Registro criado no painel de DNS da Vercel **não vale** (a Vercel mostra "DNS externo";
  `get_domain_config` retorna `serviceType: external` e os nameservers da Hostinger).
- O subdomínio é criado na **Hostinger**, mesmo que o site principal rode na Vercel.
- Alternativa sem DNS: uma rota/rewrite no projeto da Vercel para servir
  `www.dominio.com.br/evento` → página no GitHub Pages. Mexe na configuração do site principal,
  então só com autorização explícita. Ofereça as duas opções e deixe o usuário escolher.

## 5. Ordem segura para ligar o domínio

1. Usuário cria o CNAME no DNS.
2. **Esperar o DNS responder** (seção 6). Só então:
3. Pôr o arquivo `CNAME` (conteúdo: `evento.dominio.com.br`) na **main**.
   Se o `CNAME` for publicado antes do DNS existir, o GitHub redireciona o endereço
   `*.github.io` para um domínio que ainda não abre → a página sai do ar.
   (Se o usuário criar o `CNAME` sozinho numa branch, junte-o, mas segure na `main`.)
4. Rodar `montar_pagina.py --url https://evento.dominio.com.br/` para a prévia do WhatsApp
   (og:url / og:image) usar o endereço novo; publicar.
5. Conferir: http e https abrem, `*.github.io/<repo>` redireciona para o novo, certificado
   Let's Encrypt emitido (`curl -sv https://... 2>&1 | grep -i "subject:\|expire"`), ícones e
   og-image respondem 200, CORS do Supabase aceita a origem nova.
6. Pedir ao usuário: Settings → Pages → marcar **Enforce HTTPS**.

## 6. Como verificar o DNS de verdade

- Use DNS-over-HTTPS de resolvedores públicos (Google e Cloudflare):
  `curl -s -H "accept: application/dns-json" "https://cloudflare-dns.com/dns-query?name=evento.dominio.com.br&type=CNAME"`
  `Status: 3` = não existe (NXDOMAIN).
- Consultas UDP "diretas" ao nameserver podem ser interceptadas no ambiente (resposta sem flag
  AA = não é o servidor oficial). Não conclua nada com elas; TCP pode estar bloqueado.
- Resposta "não existe" fica em cache até o mínimo da zona (Hostinger: 600 s = 10 min). Se após
  ~20 min não aparecer, o registro não foi salvo — peça o print.
- Número de versão da zona (SOA serial, ex. `2026101501`) sobe quando algo é salvo; ajuda como
  indício, mas o SOA também fica em cache (até 1 h).
- Para esperar sem prender a conversa: rode um laço em segundo plano que consulta a cada minuto
  e termina quando aparecer; quando terminar, siga sozinho com os passos 3–5.

## 7. Hostinger "Implante de GitHub" (alternativa ao Pages)

hPanel → site do domínio → **Implante de GitHub** → repositório → branch **main** → o aviso
"package.json não encontrado" é normal: **Implante como estático**, sem comando de build,
diretório `public_html` → **Implantar**. Depois, a Hostinger costuma atualizar sozinha a cada push.
Ative o SSL em Segurança → SSL.
