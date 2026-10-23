// Casa Atípica — emblema da aba, ícones de atalho e imagem de prévia (WhatsApp/Instagram).
//
// Uso (na raiz do repositório):  node scripts/gerar_icones.js
// (Playwright instalado globalmente: defina NODE_PATH="$(npm root -g)" antes.)
//
// Usa a logo oficial vetorizada (assets/img/logo-emblema.svg, branca) sobre o verde da camiseta
// e a foto do encontro (assets/img/fotos/encontro.jpg) na prévia.
const fs = require('fs');
const { chromium } = require('playwright');

const VERDE = '#1f4d32';
const emblema = fs.readFileSync('assets/img/logo-emblema.svg', 'utf8');
const vb = emblema.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
const d = emblema.match(/ d="([^"]+)"/)[1];
const [W, H] = [parseFloat(vb[1]), parseFloat(vb[2])];
const esc = 78 / Math.max(W, H), x = (100 - W * esc) / 2, y = (100 - H * esc) / 2;
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="${VERDE}"/>` +
  `<g transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${esc.toFixed(5)})"><path fill="#ffffff" fill-rule="evenodd" d="${d}"/></g></svg>\n`;

fs.mkdirSync('icons', { recursive: true });
fs.writeFileSync('icons/favicon.svg', favicon);
const uri = (f, t) => `data:${t};base64,${fs.readFileSync(f).toString('base64')}`;
const favUri = 'data:image/svg+xml;base64,' + Buffer.from(favicon).toString('base64');
const logoUri = uri('assets/img/logo-emblema.svg', 'image/svg+xml');
const fotoUri = uri('assets/img/fotos/encontro.jpg', 'image/jpeg');

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
<body style="margin:0;width:1200px;height:630px;position:relative;overflow:hidden;font-family:Montserrat,sans-serif;background:#07130c">
 <div style="position:absolute;inset:0;background:url(${fotoUri}) center 40%/cover"></div>
 <div style="position:absolute;inset:0;background:linear-gradient(90deg,rgba(7,19,12,.97) 0%,rgba(7,19,12,.88) 52%,rgba(7,19,12,.35) 100%)"></div>
 <div style="position:absolute;left:76px;top:50px;bottom:50px;display:flex;flex-direction:column;justify-content:center;gap:12px;color:#f1f7f2">
  <img src="${logoUri}" style="height:110px;width:auto;align-self:flex-start">
  <div style="font-size:18px;letter-spacing:.3em;text-transform:uppercase;color:#e9bd55;font-weight:700">Rede de apoio à família atípica</div>
  <div style="font-family:'Cormorant Garamond',serif;font-size:118px;line-height:.85;font-weight:700;text-transform:uppercase;color:#fff">Casa<br><i style="font-weight:500;text-transform:none;color:#9fd9b5">Atípica</i></div>
  <div style="font-size:29px;font-weight:700;margin-top:8px">Quem cuida também precisa ser cuidada.</div>
  <div style="display:flex;gap:14px;align-items:center;margin-top:4px">
   <span style="background:linear-gradient(90deg,#e9bd55,#d8952e);color:#07130c;font-weight:800;font-size:18px;letter-spacing:.14em;text-transform:uppercase;padding:9px 18px;border-radius:999px">Triagem aberta</span>
   <span style="font-size:20px;color:#aec6b5">Gratuita · Sigilosa · 20 perguntas</span>
  </div>
 </div></body>`);
  await p.waitForLoadState('networkidle').catch(() => {});
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: 'icons/og-image.jpg', type: 'jpeg', quality: 85 });
  await b.close();
  console.log('Ícones prontos em icons/.');
})();
