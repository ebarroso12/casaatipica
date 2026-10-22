#!/bin/bash
# Instala as ferramentas da skill pagina-evento nas sessões do Claude na nuvem:
# montar/testar a página, ícones, carrossel (Playwright), QR code conferido, logo vetorizada e
# transcrição de áudios do WhatsApp. Só instala o que faltar (seguro rodar várias vezes).
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

falta_py() { ! python3 -c "import $1" >/dev/null 2>&1; }

pacotes=()
falta_py PIL && pacotes+=(pillow)
falta_py numpy && pacotes+=(numpy)
falta_py potrace && pacotes+=(potracer)
falta_py qrcode && pacotes+=("qrcode[pil]")
falta_py cv2 && pacotes+=(opencv-python-headless)
falta_py faster_whisper && pacotes+=(faster-whisper)
if [ ${#pacotes[@]} -gt 0 ]; then
  pip install -q "${pacotes[@]}"
fi

# Playwright para o Node (o Chromium já vem na máquina em /opt/pw-browsers).
if ! node -e "require('playwright')" >/dev/null 2>&1; then
  PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install -g playwright >/dev/null 2>&1
fi

# Scripts da skill encontram o Chromium e o Playwright global.
if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
  [ -x /opt/pw-browsers/chromium ] && echo 'export CHROMIUM_PATH=/opt/pw-browsers/chromium' >> "$CLAUDE_ENV_FILE"
  echo "export NODE_PATH=\"$(npm root -g)\"" >> "$CLAUDE_ENV_FILE"
fi
