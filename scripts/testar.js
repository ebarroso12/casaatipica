// Casa Atípica — testes antes de publicar (página principal + triagem), em 320, 390 e 1280 px.
//
// Uso (na raiz):  NODE_PATH="$(npm root -g)" node scripts/testar.js [pasta-prints]
//
// Página: erros de JavaScript, rolagem lateral, imagens deformadas, links de WhatsApp iguais.
// Triagem: validação, máscara, idade, aviso de apoio na pergunta 17, envio completo SIMULADO
// (nada é gravado no banco) e o JSON que seria enviado à função `triagem`.
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const prints = process.argv[2] || 'prints';
fs.mkdirSync(prints, { recursive: true });
const url = (f) => 'file:///' + path.resolve(f).replace(/\\/g, '/');

(async () => {
  const b = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  let falhou = false;
  const ok = (cond, msg) => { console.log((cond ? '  ok   ' : '  FALHA ') + msg); if (!cond) falhou = true; };

  for (const vp of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 1280, height: 800 }]) {
    console.log(`\n== ${vp.width}px ==`);
    const ctx = await b.newContext({ viewport: vp });

    // ---------- Página principal ----------
    const p = await ctx.newPage(); const erros = [];
    p.on('pageerror', (e) => erros.push(e.message));
    await p.goto(url('index.html'));
    await p.waitForTimeout(600);
    const r = await p.evaluate(() => {
      const largura = document.documentElement.scrollWidth - window.innerWidth;
      const deformadas = [...document.images].filter((i) => i.naturalWidth && i.getBoundingClientRect().width > 0 &&
        Math.abs((i.getBoundingClientRect().width / i.getBoundingClientRect().height) - (i.naturalWidth / i.naturalHeight)) > 0.05 &&
        getComputedStyle(i).objectFit !== 'cover').map((i) => i.alt || i.src.slice(0, 40));
      const was = [...new Set([...document.querySelectorAll('.js-whatsapp')].map((a) => a.href))];
      return { largura, deformadas, was, triagem: [...document.querySelectorAll('a[href*="triagem/"]')].length };
    });
    ok(!erros.length, 'página sem erros de JavaScript ' + erros.join(' | '));
    ok(r.largura <= 0, `página sem rolagem lateral (${r.largura}px)`);
    ok(!r.deformadas.length, 'imagens sem deformação ' + r.deformadas.join(', '));
    ok(r.was.length === 1, 'um só link de WhatsApp: ' + r.was[0]);
    ok(r.triagem >= 3, `botões da triagem (${r.triagem})`);
    await p.screenshot({ path: `${prints}/pagina-${vp.width}.png`, fullPage: true });
    await p.close();

    // ---------- Triagem ----------
    let enviado = null;
    await ctx.route('**/functions/v1/triagem', (rt) => {
      enviado = JSON.parse(rt.request().postData());
      rt.fulfill({ status: 200, headers: { 'access-control-allow-origin': '*', 'content-type': 'application/json' }, body: '{"ok":true,"protocolo":"TESTE1"}' });
    });
    const t = await ctx.newPage(); const errosT = [];
    t.on('pageerror', (e) => errosT.push(e.message));
    await t.goto(url('triagem/index.html'));
    const prox = () => t.click('#proximo');
    const etapa = () => t.textContent('#num-etapa');

    await prox();
    ok(await etapa() === '1' && await t.locator('.erro-campo').count() === 2, 'etapa 1 exige os dois consentimentos');
    await t.check('#f-consent'); await t.check('#f-consent-saude'); await prox();

    await prox();
    ok(await etapa() === '2' && await t.locator('.erro-campo').count() >= 5, 'etapa 2 recusa campos vazios');
    await t.fill('#f-nome', 'Maria Teste da Silva'); await t.fill('#f-chamar', 'Mari');
    await t.fill('#f-nasc', '1990-05-10');
    ok((await t.textContent('#idade')).includes('anos'), 'idade calculada: ' + await t.textContent('#idade'));
    await t.fill('#f-zap', '16991234567');
    ok(await t.inputValue('#f-zap') === '(16) 99123-4567', 'máscara do WhatsApp: ' + await t.inputValue('#f-zap'));
    await t.fill('#f-cidade', 'Franca'); await t.check('input[name="estado_civil"][value="casada"]');
    await t.check('input[name="beneficios"][value="bpc"]'); await t.check('input[name="beneficios"][value="nenhum"]');
    ok(!(await t.isChecked('input[name="beneficios"][value="bpc"]')), '"Nenhum" benefício desmarca os outros');
    await t.click('#filhos-mais');
    if (vp.width === 390) await t.screenshot({ path: `${prints}/triagem-dados-390.png`, fullPage: true });
    await prox();

    ok(await etapa() === '3', 'avançou para o filho(a)');
    await prox();
    ok(await t.locator('.erro-campo').count() === 6, 'etapa 3 exige idade e as perguntas 1 a 5');
    await t.fill('#f-filho-idade', '6');
    for (const [q, v] of [['q1', 'investigacao'], ['q2', 'bastante'], ['q3', 'fila'], ['q4', 'perdida'], ['q5', 'nao']]) await t.check(`input[name="${q}"][value="${v}"]`);
    await prox();
    for (const [q, v] of [['q6', 'quase_ninguem'], ['q7', 'de_1_2'], ['q8', 'parou'], ['q9', 'as_vezes'], ['q10', 'muitas']]) await t.check(`input[name="${q}"][value="${v}"]`);
    await prox();
    ok(await etapa() === '5', 'avançou para "Como você está"');
    for (const q of ['q11', 'q12', 'q13', 'q14', 'q15', 'q16']) await t.check(`input[name="${q}"][value="metade"]`);
    await t.check('input[name="q17"][value="alguns"]');
    ok(await t.isVisible('#apoio-risco'), 'pergunta 17 mostra o aviso de apoio (CVV 188)');
    await t.check('input[name="q17"][value="nenhum"]');
    ok(!(await t.isVisible('#apoio-risco')), 'aviso some com "Nenhum dia"');
    await t.check('input[name="q17"][value="alguns"]');
    await t.check('input[name="q18"][value="parou"]');
    ok(await t.isVisible('#c-medicacoes'), 'campo de remédios aparece');
    await t.fill('#f-medicacoes', 'sertralina');
    if (vp.width === 390) await t.screenshot({ path: `${prints}/triagem-emocional-390.png`, fullPage: true });
    await prox();
    await t.check('input[name="q19"][value="fortalece_pouco"]');
    for (const v of ['aprender_autismo', 'crises', 'saude_emocional']) await t.check(`input[name="q20"][value="${v}"]`);
    await t.fill('#f-relato', 'Estou muito cansada e sozinha.');
    await prox();
    ok(await etapa() === '7' && (await t.textContent('#resumo')).includes('Maria Teste da Silva'), 'resumo final com os dados');
    const larg = await t.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    ok(larg <= 0, `triagem sem rolagem lateral (${larg}px)`);
    await prox();
    await t.waitForSelector('#sucesso:not([hidden])');
    ok((await t.textContent('#protocolo')) === 'TESTE1', 'tela final com protocolo');
    ok(await t.isVisible('#sucesso-risco'), 'tela final reforça o CVV quando há risco');
    ok(enviado && enviado.whatsapp === '5516991234567' && enviado.respostas.q20.length === 3 &&
      Object.keys(enviado.respostas).length === 20 && enviado.filho_idade === 6 && enviado.consentimento_saude === true,
      'JSON enviado completo (20 respostas, WhatsApp com 55, idade do filho)');
    ok(!errosT.length, 'triagem sem erros de JavaScript ' + errosT.join(' | '));
    if (vp.width === 390) {
      await t.screenshot({ path: `${prints}/triagem-final-390.png`, fullPage: true });
      fs.writeFileSync(`${prints}/triagem-json-enviado.json`, JSON.stringify(enviado, null, 2));
    }
    await ctx.close();
  }
  await b.close();
  console.log(falhou ? '\nHÁ FALHAS' : '\nTUDO CERTO');
  process.exit(falhou ? 1 : 0);
})();
