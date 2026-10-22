"""Transforma uma logo de cor chapada (numa foto/print com fundo claro) em SVG nítido.

Funciona bem para logos de uma cor só sobre fundo mais claro (ex.: águia rosa sobre rosa-claro).
Não serve para logos com degradê, brilho ou foto (ex.: chama dourada 3D): nesses casos use a
imagem original recortada.

Uso:
  pip install potracer pillow numpy
  python3 vetorizar_logo.py entrada.png saida.svg --box 380,40,850,690 --limiar 170 --cor "#c9707e"

--box     recorte x1,y1,x2,y2 em pixels (deixe só a logo, sem texto em volta)
--limiar  0-255 no canal verde: pixels mais escuros que isso viram logo (veja o histograma abaixo)
--canal   r, g ou b (padrão g; para logos vermelhas/escuras sobre claro, g separa melhor)
--escuro  use quando a logo é MAIS CLARA que o fundo

Dica: rode primeiro com --histograma para escolher o limiar: a logo e o fundo aparecem como
dois picos; o limiar fica no vale entre eles.
"""
import argparse

import numpy as np
import potrace
from PIL import Image, ImageFilter


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("entrada"); p.add_argument("saida")
    p.add_argument("--box", help="x1,y1,x2,y2")
    p.add_argument("--limiar", type=int, default=170)
    p.add_argument("--canal", default="g", choices="rgb")
    p.add_argument("--cor", default="#c9707e")
    p.add_argument("--escuro", action="store_true", help="logo mais clara que o fundo")
    p.add_argument("--histograma", action="store_true")
    a = p.parse_args()

    im = Image.open(a.entrada).convert("RGB")
    if a.box:
        im = im.crop(tuple(int(v) for v in a.box.split(",")))
    # Amplia 3x e suaviza levemente: o contorno sai liso em vez de serrilhado.
    big = im.resize((im.width * 3, im.height * 3), Image.LANCZOS).filter(ImageFilter.GaussianBlur(1.2))
    canal = np.array(big)[..., "rgb".index(a.canal)]

    if a.histograma:
        h, borda = np.histogram(canal, bins=26, range=(0, 256))
        for n, b in zip(h, borda): print(f"{int(b):3d} {'#' * int(60 * n / h.max())}")
        return

    mask = canal > a.limiar if a.escuro else canal < a.limiar
    ys, xs = np.where(mask)
    mask = np.pad(mask[ys.min():ys.max() + 1, xs.min():xs.max() + 1], 8)
    # Atenção: o potracer trata False como forma; por isso o ~ (sem ele o SVG sai invertido,
    # com um retângulo cheio e a logo vazada).
    curvas = potrace.Bitmap(~mask).trace(turdsize=40, opttolerance=0.4)
    H, W = mask.shape
    f = lambda v: f"{v:.1f}".rstrip("0").rstrip(".")
    partes = []
    for c in curvas:
        s = c.start_point; d = [f"M{f(s.x)} {f(s.y)}"]
        for seg in c.segments:
            if seg.is_corner:
                d.append(f"L{f(seg.c.x)} {f(seg.c.y)}L{f(seg.end_point.x)} {f(seg.end_point.y)}")
            else:
                d.append(f"C{f(seg.c1.x)} {f(seg.c1.y)} {f(seg.c2.x)} {f(seg.c2.y)} {f(seg.end_point.x)} {f(seg.end_point.y)}")
        partes.append("".join(d) + "Z")
    with open(a.saida, "w") as out:
        out.write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}"><path fill="{a.cor}" '
                  f'fill-rule="evenodd" d="{"".join(partes)}"/></svg>\n')
    print(f"{a.saida}: {len(curvas)} contornos, {W}x{H}")


if __name__ == "__main__":
    main()
