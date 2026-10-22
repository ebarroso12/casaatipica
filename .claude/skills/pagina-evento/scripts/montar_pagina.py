"""Monta a página final do Impacto Rosa.

Lê o código-fonte em src/index.html, assets/css/styles.css e assets/js/main.js e gera:

  index.html      página completa, com CSS, JS e fotos embutidos (como no site do
                  Legendários). É o arquivo que o GitHub Pages e a Hostinger publicam,
                  e também pode ser colado num bloco de "HTML personalizado".

Uso:
  python3 scripts/montar_pagina.py                       # gera index.html na raiz
  python3 scripts/montar_pagina.py --url https://impactorosa.com.br/
  python3 scripts/montar_pagina.py --artefato saida.html # versão para o link do Claude

--url é o endereço público do site. Ele vai nas tags de prévia (WhatsApp, Instagram,
Facebook), que exigem endereço completo para mostrar a imagem.
"""
import argparse
import base64
import re
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
URL_PADRAO = "https://impactorosa.mentorawaniaarantes.com.br/"


def data_uri(caminho: Path, cache: dict) -> str:
    if caminho not in cache:
        tipo = "image/svg+xml" if caminho.suffix == ".svg" else "image/jpeg"
        cache[caminho] = f"data:{tipo};base64,{base64.b64encode(caminho.read_bytes()).decode()}"
    return cache[caminho]


def montar(url: str, artefato: bool) -> str:
    html = (RAIZ / "src/index.html").read_text(encoding="utf-8")
    css = (RAIZ / "assets/css/styles.css").read_text(encoding="utf-8")
    js = (RAIZ / "assets/js/main.js").read_text(encoding="utf-8")
    cache: dict = {}

    # Fotos do CSS (fundo do topo) e do HTML viram dados embutidos.
    css = re.sub(r'url\("\.\./img/([^"]+)"\)',
                 lambda m: f'url("{data_uri(RAIZ / "assets/img" / m.group(1), cache)}")', css)
    html = re.sub(r'src="\.\./assets/img/([^"]+)"',
                  lambda m: f'src="{data_uri(RAIZ / "assets/img" / m.group(1), cache)}"', html)

    html = html.replace('<link rel="stylesheet" href="../assets/css/styles.css">', f"<style>\n{css}</style>")
    html = html.replace('<script src="../assets/js/main.js" defer></script>', f"<script>\n{js}</script>")
    # Ícones da aba e prévia: arquivos na raiz do site.
    html = html.replace('href="../favicon.ico"', 'href="favicon.ico"').replace('href="../icons/', 'href="icons/')
    html = html.replace('href="../agenda/', 'href="agenda/')
    html = html.replace("SITE_URL", url)

    if artefato:
        # O link do Claude monta o <head> sozinho: entra só título, fontes, estilo e conteúdo.
        head = re.search(r"<head>(.*?)</head>", html, re.S).group(1)
        body = re.search(r"<body>(.*?)</body>", html, re.S).group(1)
        manter = re.findall(r'<title>.*?</title>|<meta name="claude:viewport-fit-sides"[^>]*>|'
                            r'<link rel="(?:preconnect|stylesheet)"[^>]*>|<style>.*?</style>|'
                            r'<script type="application/ld\+json">.*?</script>', head, re.S)
        manter[0] = "<title>Impacto Rosa</title>"  # nome curto do link
        # O link do Claude não deixa baixar arquivos: fica só o atalho do Google Agenda.
        body = re.sub(r'\s*<a class="js-ics"[^>]*>.*?</a>', "", body)
        html = "\n".join(manter) + "\n" + body

    assert "../assets" not in html, "sobrou caminho de arquivo sem embutir"
    return html


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--url", default=URL_PADRAO, help="endereço público do site, terminando em /")
    p.add_argument("--artefato", metavar="ARQUIVO", help="gera a versão para o link do Claude")
    a = p.parse_args()
    url = a.url if a.url.endswith("/") else a.url + "/"
    destino = Path(a.artefato) if a.artefato else RAIZ / "index.html"
    destino.write_text(montar(url, bool(a.artefato)), encoding="utf-8")
    print(f"{destino} ({destino.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
