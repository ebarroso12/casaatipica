// Bateria de testes da página antes de publicar. Roda em celular pequeno, celular comum e computador.
//
// Uso: node testar_pagina.js index.html "https://wa.me/55DDDNUMERO?text=..." [pasta-prints]
//
// Confere:
//  - erros de JavaScript na página
//  - rolagem lateral (nada pode passar da largura da tela)
//  - imagens deformadas (esticadas/achatadas fora da proporção original)
//  - todos os links de WhatsApp de atendimento iguais ao link oficial
//  - contagem regressiva andando (e continuando a andar depois do pop-up abrir)
//  - pop-up de cadastro abre sozinho e fecha com Esc
// E salva prints de cada largura para conferir o visual.
const path = require('path');
const { chromium } = require('playwright');

const arquivo = path.resolve(process.argv[2] || 'index.html');
const waOficial = process.argv[3];
const prints = process.argv[4];

(async () => {
  const b = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  let falhou = false;
  for (const vp of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 1280, height: 800 }]) {
    const ctx = await b.newContext({ viewport: vp });
    // Simula a gravação do cadastro para não criar linhas falsas no banco.
    await ctx.route('**/rest/v1/**', r => r.fulfill({ status: 201, headers: { 'access-control-allow-origin': '*' }, body: '' }));
    const p = await ctx.newPage(); const erros = [];
    p.on('pageerror', e => erros.push(e.message));
    await p.goto('file://' + arquivo);
    await p.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
    const cd1 = await p.$eval('#cd-s', e => e.textContent).catch(() => null);
    await p.waitForTimeout(3500);
    const cd2 = await p.$eval('#cd-s', e => e.textContent).catch(() => null);
    const r = await p.evaluate((wa) => ({
      rolagemLateral: document.documentElement.scrollWidth > innerWidth,
      deformadas: [...document.images].filter(i => i.naturalWidth && i.offsetWidth && getComputedStyle(i).objectFit === 'fill'
        && Math.abs(i.naturalWidth / i.naturalHeight - i.offsetWidth / i.offsetHeight) > 0.02).map(i => i.alt.slice(0, 40)),
      waDiferentes: wa ? [...document.querySelectorAll('a.js-whatsapp')].filter(a => a.href !== wa).length : 'não informado',
      popupAbriu: !!document.getElementById('lead') && !document.getElementById('lead').hidden,
    }), waOficial);
    if (r.popupAbriu) { await p.keyboard.press('Escape'); r.popupFechouComEsc = await p.$eval('#lead', e => e.hidden); }
    r.contagemAndando = cd1 === null ? 'sem contagem' : cd1 !== cd2;
    r.erros = erros;
    const ok = !r.rolagemLateral && !r.deformadas.length && !erros.length && (r.waDiferentes === 0 || r.waDiferentes === 'não informado') && r.contagemAndando !== false;
    falhou = falhou || !ok;
    console.log(`${ok ? 'OK  ' : 'FALHA'} ${vp.width}px`, JSON.stringify(r));
    if (prints) {
      await p.addStyleTag({ content: '.nav{position:static!important}.float{display:none!important}' });
      await p.screenshot({ path: path.join(prints, `pagina-${vp.width}.png`), fullPage: true });
    }
    await ctx.close();
  }
  await b.close();
  process.exit(falhou ? 1 : 0);
})();
