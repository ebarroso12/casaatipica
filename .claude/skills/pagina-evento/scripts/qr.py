"""Gera um QR code em PNG e confere a leitura dele na hora.

Uso:
  pip install "qrcode[pil]" opencv-python-headless
  python3 qr.py "https://wa.me/55DDDNUMERO?text=..." saida.png [--cor "#160b10"]

A conferência lê o PNG gerado de volta e compara com o link: se a mensagem pronta do WhatsApp
mudar (ex.: troca de "Culto" por "Reunião"), o QR precisa ser gerado de novo — ele guarda o texto
antigo dentro dele.
"""
import argparse

import qrcode


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("link"); p.add_argument("saida"); p.add_argument("--cor", default="#160b10")
    a = p.parse_args()
    q = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, border=2)
    q.add_data(a.link); q.make(fit=True)
    q.make_image(fill_color=a.cor, back_color="#ffffff").save(a.saida)
    try:
        import cv2
        img = cv2.imread(a.saida)
        img = cv2.resize(img, None, fx=4, fy=4, interpolation=cv2.INTER_NEAREST)
        lido = cv2.QRCodeDetector().detectAndDecode(img)[0]
        print("leitura confere" if lido == a.link else f"ATENÇÃO: leu {lido!r}")
    except ImportError:
        print("gerado (instale opencv-python-headless para conferir a leitura)")


if __name__ == "__main__":
    main()
