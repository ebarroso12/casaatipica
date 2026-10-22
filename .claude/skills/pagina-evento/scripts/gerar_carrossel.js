// Gera os PNGs do carrossel do Instagram (1080x1350) a partir de um HTML com várias <section class="slide">.
// Cada slide vira um arquivo: use data-arquivo="01-capa" no <section>; sem ele, vira slide-01.png, slide-02.png...
//
// Uso: node gerar_carrossel.js carrossel/carrossel.html [pasta-de-saida]
// Precisa do Playwright. Em ambiente com Chromium fora do padrão: CHROMIUM_PATH=/opt/pw-browsers/chromium
const path = require('path');
const { chromium } = require('playwright');

const html = path.resolve(process.argv[2] || 'carrossel/carrossel.html');
const saida = path.resolve(process.argv[3] || path.dirname(html));

(async () => {
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const page = await browser.newPage({ viewport: { width: 1200, height: 1500 } });
  await page.goto('file://' + html);
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready); // sem isso a fonte do título pode sair a reserva
  const slides = await page.$$('section.slide');
  for (let i = 0; i < slides.length; i++) {
    const nome = (await slides[i].getAttribute('data-arquivo')) || `slide-${String(i + 1).padStart(2, '0')}`;
    await slides[i].screenshot({ path: path.join(saida, nome + '.png') });
    console.log(nome + '.png');
  }
  await browser.close();
})();
