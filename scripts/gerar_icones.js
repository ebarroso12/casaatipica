// Casa Atípica — emblema da aba, ícones de atalho e imagem de prévia (WhatsApp/Instagram).
//
// Uso (na raiz do repositório):  node scripts/gerar_icones.js
// (Playwright instalado globalmente: defina NODE_PATH="$(npm root -g)" antes.)
//
// A logo da Casa Atípica é um traço (infinito), não uma forma cheia; por isso este script
// substitui o gerar_icones.js da skill, que só sabe preencher formas.
const fs = require('fs');
const { chromium } = require('playwright');

const INFINITO = 'M32 20C24 8 6 8 6 20s18 12 26 0 26-12 26 0-18 12-26 0Z';
const grad = '<defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#5fd0dc"/><stop offset="1" stop-color="#f6b93b"/></linearGradient></defs>';
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${grad}` +
  '<rect width="100" height="100" rx="22" fill="#0b2a33"/>' +
  `<g transform="translate(7 22) scale(1.34)"><path d="${INFINITO}" fill="none" stroke="url(#g)" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></g></svg>\n`;

fs.mkdirSync('icons', { recursive: true });
fs.writeFileSync('icons/favicon.svg', favicon);
const favUri = 'data:image/svg+xml;base64,' + Buffer.from(favicon).toString('base64');
const logoUri = 'data:image/svg+xml;base64,' + fs.readFileSync('assets/img/logo.svg').toString('base64');

(async () => {
  const b = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  for (const [s, nome] of [[16, 'favicon-16'], [32, 'favicon-32'], [48, 'favicon-48'], [64, 'favicon-64'], [180, 'apple-touch-icon'], [192, 'icon-192'], [512, 'icon-512']]) {
    const p = await b.newPage({ viewport: { width: s, height: s } });
    await p.setContent(`<body style="margin:0;background:transparent"><img src="${favUri}" style="width:${s}px;height:${s}px;display:block"></body>`);
    await p.waitForTimeout(120);
    await p.screenshot({ path: `icons/${nome}.png`, omitBackground: true });
    await p.close();
  }
  const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
  await p.setContent(`<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,500&family=Montserrat:wght@600;700;800&display=swap">
<body style="margin:0;width:1200px;height:630px;position:relative;overflow:hidden;font-family:Montserrat,sans-serif;
 background:radial-gradient(circle at 15% 20%,rgba(95,208,220,.35),transparent 45%),radial-gradient(circle at 90% 85%,rgba(246,185,59,.28),transparent 45%),linear-gradient(160deg,#0b2a33,#071419 70%)">
 <img src="${logoUri}" style="position:absolute;right:-60px;top:110px;width:560px;opacity:.18">
 <div style="position:absolute;left:80px;top:60px;bottom:60px;display:flex;flex-direction:column;justify-content:center;gap:14px;color:#eef7f8">
  <img src="${logoUri}" style="height:70px;width:auto;align-self:flex-start">
  <div style="font-size:19px;letter-spacing:.3em;text-transform:uppercase;color:#f6b93b;font-weight:700">Acolhimento para mães atípicas</div>
  <div style="font-family:'Cormorant Garamond',serif;font-size:124px;line-height:.85;font-weight:700;text-transform:uppercase;color:#fff">Casa<br><i style="font-weight:500;text-transform:none;color:#7fd8e2">Atípica</i></div>
  <div style="font-size:30px;font-weight:700;margin-top:10px">Quem cuida também precisa ser cuidada.</div>
  <div style="display:flex;gap:14px;align-items:center;margin-top:6px">
   <span style="background:linear-gradient(90deg,#f6b93b,#f28c28);color:#071419;font-weight:800;font-size:18px;letter-spacing:.14em;text-transform:uppercase;padding:9px 18px;border-radius:999px">Triagem aberta</span>
   <span style="font-size:20px;color:#a9c3c8">Gratuita · Sigilosa · 20 perguntas</span>
  </div>
 </div></body>`);
  await p.waitForLoadState('networkidle').catch(() => {});
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: 'icons/og-image.jpg', type: 'jpeg', quality: 85 });
  await b.close();
  console.log('Ícones prontos em icons/.');
})();
