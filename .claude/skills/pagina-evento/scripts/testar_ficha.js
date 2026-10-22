// Testa a ficha de inscrição (formulário em etapas) sem gravar no banco: simula o Supabase (201 e 500),
// passa por todas as etapas em 320/390/1280 px, confere validação, máscara do WhatsApp, idade, bloqueio
// da parte de saúde sem consentimento e o JSON enviado. Adapte os seletores se mudar os campos.
// Uso: node testar_ficha.js PASTA_DOS_PRINTS [ficha/index.html] [nome_da_tabela]
const { chromium } = require('playwright');
const path = require('path');
const SP = process.argv[2];
const url = 'file://' + path.resolve(process.argv[3] || 'ficha/index.html');
const TABELA = process.argv[4] || 'impacto_rosa_fichas';
require('fs').mkdirSync(path.join(SP, 'ficha'), { recursive: true });
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const falhas = [];
  for (const [w, h] of [[320, 700], [390, 844], [1280, 900]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h } });
    const p = await ctx.newPage();
    const erros = [];
    p.on('pageerror', e => erros.push(e.message));
    p.on('console', m => { if (m.type() === 'error' && !/500|favicon|icons\//.test(m.text())) erros.push(m.text()); });
    let corpo = null, status = w === 390 ? 500 : 201, envios = 0;
    await p.route('**/rest/v1/' + TABELA, async r => { envios++; corpo = JSON.parse(r.request().postData()); await r.fulfill({ status, body: '' }); });
    await p.goto(url);
    await p.screenshot({ path: `${SP}/ficha/${w}-1.png`, fullPage: true });
    // validação vazia
    await p.click('#proximo');
    const nErr = await p.locator('section:has(#t1) .erro-campo').count();
    if (nErr !== 3) falhas.push(`${w}: esperava 3 erros na etapa 1, veio ${nErr}`);
    await p.fill('#f-nome', 'Maria Teste Silva'); await p.fill('#f-chamar', 'Mari');
    await p.fill('#f-nasc', '1985-03-10');
    if (!(await p.textContent('#idade')).includes('anos')) falhas.push(`${w}: idade não calculada`);
    await p.locator('#g-sexo label').first().click();
    await p.click('#proximo');
    await p.locator('#g-civil label', { hasText: 'Casada' }).click();
    await p.click('#filhos-mais'); await p.click('#filhos-mais'); await p.click('#filhos-mais'); await p.click('#filhos-menos');
    await p.fill('#f-prof', 'Professora');
    await p.fill('#f-zap', '16991271838');
    if (await p.inputValue('#f-zap') !== '(16) 99127-1838') falhas.push(`${w}: máscara ${await p.inputValue('#f-zap')}`);
    await p.fill('#f-email', 'errado');
    await p.click('#proximo');
    if (await p.locator('section:has(#t2) .erro-campo').count() !== 1) falhas.push(`${w}: email inválido não barrou`);
    await p.fill('#f-email', 'Maria@Email.com');
    await p.screenshot({ path: `${SP}/ficha/${w}-2.png`, fullPage: true });
    await p.click('#proximo');
    await p.locator('#g-religiao label', { hasText: 'Outra' }).click();
    if (await p.isHidden('#f-religiao-outra')) falhas.push(`${w}: campo religião outra não abriu`);
    await p.fill('#f-religiao-outra', 'Batista'); await p.fill('#f-igreja', 'Casa de Oração');
    await p.click('#proximo');
    // saúde bloqueada
    if (!(await p.locator('#bloco-saude input').first().isDisabled())) falhas.push(`${w}: saúde não bloqueada`);
    await p.screenshot({ path: `${SP}/ficha/${w}-4a.png`, fullPage: true });
    await p.locator('label:has(#f-consent-saude)').click().catch(async () => p.check('#f-consent-saude'));
    if (!(await p.isChecked('#f-consent-saude'))) await p.check('#f-consent-saude');
    await p.locator('#g-emocional label', { hasText: 'Ansiedade' }).click();
    await p.locator('#g-emocional label', { hasText: 'Outro' }).click();
    await p.fill('#f-emocional-outro', 'Insônia');
    await p.locator('#g-medicacao label', { hasText: 'Sim' }).click();
    await p.fill('#f-medicacoes', 'Sertralina');
    await p.locator('#g-fisica label').nth(1).click();
    await p.fill('#f-fisica-obs', 'Joelho');
    await p.locator('#g-patologia label', { hasText: 'Não' }).click();
    await p.fill('#f-sofrimento', 'Luto recente'); await p.fill('#f-familiar', 'Distância do filho');
    await p.screenshot({ path: `${SP}/ficha/${w}-4b.png`, fullPage: true });
    await p.click('#proximo');
    await p.click('#proximo');
    if (await p.locator('section:has(#t5) .erro-campo').count() !== 1) falhas.push(`${w}: consentimento final não barrou`);
    await p.locator('label:has(#f-consent)').click().catch(() => {});
    if (!(await p.isChecked('#f-consent'))) await p.check('#f-consent');
    await p.screenshot({ path: `${SP}/ficha/${w}-5.png`, fullPage: true });
    await p.click('#proximo');
    await p.waitForTimeout(400);
    if (status === 500) {
      if (await p.isHidden('#erro-envio')) falhas.push(`${w}: erro de envio não apareceu`);
      status = 201; await p.click('#proximo'); await p.waitForTimeout(400);
    }
    if (await p.isHidden('#sucesso')) falhas.push(`${w}: sucesso não apareceu`);
    await p.screenshot({ path: `${SP}/ficha/${w}-ok.png`, fullPage: true });
    const sw = await p.evaluate(() => document.documentElement.scrollWidth);
    if (sw > w) falhas.push(`${w}: rolagem horizontal ${sw}`);
    if (erros.length) falhas.push(`${w}: erros JS ${erros.join(' | ')}`);
    if (w === 1280) console.log(JSON.stringify(corpo, null, 1), 'envios', envios);
    await ctx.close();
  }
  // caso sem consentimento de saúde: não envia campos de saúde
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  let corpo; await p.route('**/rest/v1/' + TABELA, async r => { corpo = JSON.parse(r.request().postData()); await r.fulfill({ status: 201 }); });
  await p.goto(url);
  await p.fill('#f-nome', 'Ana Souza'); await p.fill('#f-nasc', '1990-01-01'); await p.locator('#g-sexo label').first().click(); await p.click('#proximo');
  await p.locator('#g-civil label').first().click(); await p.fill('#f-zap', '16999998888'); await p.click('#proximo');
  await p.click('#proximo'); await p.click('#proximo'); await p.check('#f-consent'); await p.click('#proximo'); await p.waitForTimeout(300);
  if (!corpo || corpo.consentimento_saude !== false || 'sofrimento' in corpo) falhas.push('sem saúde: corpo errado ' + JSON.stringify(corpo));
  console.log('mínimo:', JSON.stringify(corpo));
  await b.close();
  console.log(falhas.length ? 'FALHAS:\n' + falhas.join('\n') : 'TUDO OK');
})();
