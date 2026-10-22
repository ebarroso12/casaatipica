// Gera o emblema da aba (favicon), os ícones de atalho e a imagem de prévia do WhatsApp/Instagram.
//
// Uso (na raiz do projeto da página):
//   node gerar_icones.js --logo assets/img/logo.svg --foto assets/img/hero.jpg \
//     --fundo "#2a1220" --cor-logo "#f4a7bb" --rotulo "Reunião de Mulheres" \
//     --titulo "Impacto" --titulo2 "Rosa" --data "Sábado · 07/11 · 15h" \
//     --selo "Entrada gratuita" --local "Casa de Oração · Av. Alagoas, 1163 · Franca-SP"
//
// Gera: icons/favicon.svg, icons/favicon-{16,32,48,64}.png, icons/icon-192.png, icons/icon-512.png,
//       icons/apple-touch-icon.png (180) e icons/og-image.jpg (1200x630).
// Depois rode o comando Python impresso no fim para criar o favicon.ico.
//
// Por que desenhar cada tamanho: reduzir uma imagem grande para 16 px deixa a logo borrada.
// Aqui o SVG é renderizado direto em cada tamanho, com a logo ocupando ~86% do quadrado.
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : d; };
const logo = arg('logo'); if (!logo) { console.error('Informe --logo caminho.svg'); process.exit(1); }
const foto = arg('foto');
const fundo = arg('fundo', '#2a1220'), corLogo = arg('cor-logo', '#f4a7bb');
const corTexto = arg('cor-destaque', '#ec9db2'), corRotulo = arg('cor-rotulo', '#f5a524');

const svgOriginal = fs.readFileSync(logo, 'utf8');
const vb = svgOriginal.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
const paths = [...svgOriginal.matchAll(/ d="([^"]+)"/g)].map(m => m[1]);
const [W, H] = [parseFloat(vb[1]), parseFloat(vb[2])];
const alt = 86, esc = alt / Math.max(W, H), x = (100 - W * esc) / 2, y = (100 - H * esc) / 2;
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="${fundo}"/>` +
  `<g transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${esc.toFixed(5)})">` +
  paths.map(d => `<path fill="${corLogo}" fill-rule="evenodd" d="${d}"/>`).join('') + '</g></svg>\n';
fs.mkdirSync('icons', { recursive: true });
fs.writeFileSync('icons/favicon.svg', favicon);
const uri = (f, t) => `data:${t};base64,${fs.readFileSync(f).toString('base64')}`;
const favUri = 'data:image/svg+xml;base64,' + Buffer.from(favicon).toString('base64');

(async () => {
  const b = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  for (const [s, nome] of [[16, 'favicon-16'], [32, 'favicon-32'], [48, 'favicon-48'], [64, 'favicon-64'], [180, 'apple-touch-icon'], [192, 'icon-192'], [512, 'icon-512']]) {
    const p = await b.newPage({ viewport: { width: s, height: s } });
    await p.setContent(`<body style="margin:0;background:transparent"><img src="${favUri}" style="width:${s}px;height:${s}px;display:block"></body>`);
    await p.waitForTimeout(120);
    await p.screenshot({ path: `icons/${nome}.png`, omitBackground: true });
    await p.close();
  }
  if (foto) {
    const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
    const logoUri = uri(logo, 'image/svg+xml'), fotoUri = uri(foto, 'image/jpeg');
    await p.setContent(`<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,500&family=Montserrat:wght@600;700;800&display=swap">
<body style="margin:0;width:1200px;height:630px;position:relative;overflow:hidden;font-family:Montserrat,sans-serif;background:#160b10">
 <div style="position:absolute;inset:0;background:url(${fotoUri}) center 30%/cover"></div>
 <div style="position:absolute;inset:0;background:linear-gradient(90deg,rgba(22,11,16,.96) 0%,rgba(22,11,16,.86) 50%,rgba(22,11,16,.25) 100%)"></div>
 <div style="position:absolute;left:70px;top:56px;bottom:56px;display:flex;flex-direction:column;justify-content:center;gap:12px;color:#f7eef1">
  <img src="${logoUri}" style="height:84px;width:auto;align-self:flex-start">
  <div style="font-size:18px;letter-spacing:.3em;text-transform:uppercase;color:${corRotulo};font-weight:700">${arg('rotulo', '')}</div>
  <div style="font-family:'Cormorant Garamond',serif;font-size:112px;line-height:.85;font-weight:700;text-transform:uppercase;color:#fff">${arg('titulo', '')}<br><i style="font-weight:500;text-transform:none;color:${corTexto}">${arg('titulo2', '')}</i></div>
  <div style="font-size:30px;font-weight:700;margin-top:8px">${arg('data', '')}</div>
  <div style="display:flex;gap:14px;align-items:center;margin-top:4px">
   ${arg('selo') ? `<span style="background:linear-gradient(90deg,#f5a524,#f26b1d);color:#160b10;font-weight:800;font-size:18px;letter-spacing:.14em;text-transform:uppercase;padding:9px 18px;border-radius:999px">${arg('selo')}</span>` : ''}
   <span style="font-size:19px;color:#c8b1ba">${arg('local', '')}</span>
  </div>
 </div></body>`);
    await p.waitForLoadState('networkidle').catch(() => {});
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: 'icons/og-image.jpg', type: 'jpeg', quality: 85 });
  }
  await b.close();
  console.log('Ícones prontos em icons/. Agora rode:');
  console.log(`python3 -c "from PIL import Image; i=[Image.open('icons/favicon-%d.png'%s) for s in (48,16,32,64)]; i[0].save('favicon.ico', sizes=[(16,16),(32,32),(48,48),(64,64)], append_images=i[1:])"`);
})();
