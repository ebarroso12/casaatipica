"""Monta uma folha (PNG) com vários QR codes lado a lado, com título e legenda — para imprimir na
recepção ou postar nos stories. Gere antes cada QR com qr.py (que confere a leitura).

Uso:
  python3 folha_qr.py saida.png "TÍTULO · data · hora" \
      "qr-whatsapp.png|Confirmar presença|WhatsApp 24h" \
      "qr-grupo.png|Entrar no grupo|Grupo do WhatsApp" \
      "qr-ficha.png|Ficha de inscrição|Formulário completo" \
      "qr-site.png|Página do evento|site.com.br" [--fundo "#1a0c13"] [--destaque "#f5a524"] [--cor "#7a1f45"]
"""
import argparse
import glob

from PIL import Image, ImageDraw, ImageFont


def fonte(tam, negrito=False):
    nomes = glob.glob('/usr/share/fonts/**/DejaVuSans%s.ttf' % ('-Bold' if negrito else ''), recursive=True)
    return ImageFont.truetype(nomes[0], tam) if nomes else ImageFont.load_default()


def quebra(texto, largura=24):
    linhas, atual = [], ''
    for parte in texto.replace('.', '. ').split():
        if len(atual) + len(parte) > largura and atual:
            linhas.append(atual); atual = ''
        atual += ('' if not atual or atual.endswith('.') else ' ') + parte
    return linhas + ([atual] if atual else [])


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument('saida'); p.add_argument('titulo'); p.add_argument('itens', nargs='+')
    p.add_argument('--fundo', default='#1a0c13'); p.add_argument('--destaque', default='#f5a524')
    p.add_argument('--cor', default='#7a1f45')
    a = p.parse_args()
    n = len(a.itens); W, H = 40 + n * 390, 740
    img = Image.new('RGB', (W, H), a.fundo); d = ImageDraw.Draw(img)
    d.text((W / 2, 60), a.titulo, fill=a.destaque, font=fonte(34, True), anchor='mm')
    for i, item in enumerate(a.itens):
        arq, rotulo, sub = (item.split('|') + ['', ''])[:3]
        x = 40 + i * 390
        d.rounded_rectangle((x, 120, x + 360, 700), 24, fill='#ffffff')
        qr = Image.open(arq).convert('RGB').resize((320, 320), Image.NEAREST)
        img.paste(qr, (x + 20, 145))
        d.text((x + 180, 505), rotulo, fill=a.cor, font=fonte(30, True), anchor='mm')
        for k, linha in enumerate(quebra(sub)[:3]):
            d.text((x + 180, 553 + k * 30), linha, fill='#555555', font=fonte(21), anchor='mm')
        d.text((x + 180, 660), 'Aponte a câmera do celular', fill=a.cor, font=fonte(20), anchor='mm')
    img.save(a.saida)
    try:
        import cv2
        for i, item in enumerate(a.itens):
            x = 40 + i * 390
            recorte = cv2.imread(a.saida)[140:470, x + 15:x + 345]
            ok = cv2.QRCodeDetector().detectAndDecode(cv2.resize(recorte, None, fx=2, fy=2))[0]
            print(('ok   ' if ok else 'FALHA') + ' ' + item.split('|')[1] + (' → ' + ok[:70] if ok else ''))
    except ImportError:
        print('folha gerada (instale opencv-python-headless para conferir a leitura)')


if __name__ == '__main__':
    main()
