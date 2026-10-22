/*
 * Impacto Rosa — contagem regressiva, galeria que abre, WhatsApp e botão flutuante.
 * A página funciona sem JavaScript: todos os links já têm o endereço completo.
 */
(function () {
  'use strict';

  // WhatsApp oficial: +55 16 99127-1838, mensagem "Olá! Quero participar da Reunião de Mulheres do Impacto Rosa de 07/11."
  var WHATSAPP_LINK = 'https://wa.me/5516991271838?text=Ol%C3%A1%21%20Quero%20participar%20da%20Reuni%C3%A3o%20de%20Mulheres%20do%20Impacto%20Rosa%20de%2007%2F11.';
  document.querySelectorAll('.js-whatsapp').forEach(function (el) {
    el.setAttribute('href', WHATSAPP_LINK);
    el.setAttribute('target', '_blank');
    el.setAttribute('rel', 'noopener');
  });

  var ano = document.getElementById('ano');
  if (ano) ano.textContent = new Date().getFullYear();

  /* ---------- Contagem regressiva ---------- */
  var cd = document.getElementById('countdown');
  if (cd) {
    var alvo = new Date(cd.getAttribute('data-alvo')).getTime();
    var fim = new Date(cd.getAttribute('data-fim')).getTime();
    var label = document.getElementById('cd-label');
    var row = document.getElementById('cd-row');
    var campos = {
      d: document.getElementById('cd-d'), h: document.getElementById('cd-h'),
      m: document.getElementById('cd-m'), s: document.getElementById('cd-s')
    };
    var pad = function (n) { return String(n).padStart(2, '0'); };
    var tick = function () {
      var agora = Date.now();
      var falta = alvo - agora;
      if (falta <= 0) {
        row.hidden = true;
        label.textContent = agora < fim
          ? 'O Impacto Rosa está acontecendo agora!'
          : 'Próximo encontro em breve · fale com a equipe';
        return;
      }
      campos.d.textContent = pad(Math.floor(falta / 86400000));
      campos.h.textContent = pad(Math.floor(falta % 86400000 / 3600000));
      campos.m.textContent = pad(Math.floor(falta % 3600000 / 60000));
      campos.s.textContent = pad(Math.floor(falta % 60000 / 1000));
      setTimeout(tick, 1000 - (agora % 1000));
    };
    tick();
  }

  /* ---------- Fotos que se revelam ao rolar ---------- */
  var tiles = Array.prototype.slice.call(document.querySelectorAll('.tile'));
  if ('IntersectionObserver' in window) {
    var revela = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var i = tiles.indexOf(e.target);
        setTimeout(function () { e.target.classList.add('is-in'); }, (i % 3) * 140);
        revela.unobserve(e.target);
      });
    }, { threshold: 0.15 });
    tiles.forEach(function (t) { revela.observe(t); });
  } else {
    tiles.forEach(function (t) { t.classList.add('is-in'); });
  }

  /* ---------- Galeria: foto ampliada ---------- */
  var lb = document.getElementById('lightbox');
  var lbImg = document.getElementById('lb-img');
  var lbCap = document.getElementById('lb-cap');
  var atual = 0;
  var ultimoFoco = null;

  function mostrar(i) {
    atual = (i + tiles.length) % tiles.length;
    var t = tiles[atual];
    lbImg.src = t.querySelector('img').src;
    lbImg.alt = t.querySelector('img').alt;
    lbCap.textContent = t.getAttribute('data-caption') + ' · ' + (atual + 1) + ' de ' + tiles.length;
  }
  function abrir(i) {
    ultimoFoco = document.activeElement;
    mostrar(i);
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
    lb.querySelector('.lb-close').focus();
  }
  function fechar() {
    lb.hidden = true;
    document.body.style.overflow = '';
    if (ultimoFoco) ultimoFoco.focus();
  }
  tiles.forEach(function (t, i) { t.addEventListener('click', function () { abrir(i); }); });
  lb.querySelector('.lb-close').addEventListener('click', fechar);
  lb.querySelector('.lb-prev').addEventListener('click', function () { mostrar(atual - 1); });
  lb.querySelector('.lb-next').addEventListener('click', function () { mostrar(atual + 1); });
  lb.addEventListener('click', function (e) { if (e.target === lb) fechar(); });
  document.addEventListener('keydown', function (e) {
    if (lb.hidden) return;
    if (e.key === 'Escape') fechar();
    if (e.key === 'ArrowLeft') mostrar(atual - 1);
    if (e.key === 'ArrowRight') mostrar(atual + 1);
    if (e.key === 'Tab') { // mantém o foco dentro do visualizador
      var focaveis = lb.querySelectorAll('button');
      var primeiro = focaveis[0], ultimo = focaveis[focaveis.length - 1];
      if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus(); }
    }
  });
  // Deslizar o dedo para trocar de foto no celular
  var x0 = null;
  lb.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 50) mostrar(atual + (dx < 0 ? 1 : -1));
    x0 = null;
  });

  /* ---------- Cadastro (pop-up) ----------
   * Salva na tabela impacto_rosa_leads do Supabase (projeto Selah). A chave abaixo é
   * a chave pública: ela só permite CADASTRAR; ler, alterar ou apagar é bloqueado no
   * banco. Se o envio falhar, a pessoa pode mandar os dados pelo WhatsApp. */
  var LEADS_URL = 'https://hymbjpnrwhtngkivrqht.supabase.co/rest/v1/impacto_rosa_leads';
  var LEADS_KEY = 'sb_publishable_xNcKkJczWh0YUUwI2THmDg_VFrhqAuD';
  var LEAD_MEMO = 'impacto-rosa-cadastro-v1'; // lembra quem já fechou ou se cadastrou

  var lead = document.getElementById('lead');
  if (lead) {
    var form = document.getElementById('lead-form');
    var ok = document.getElementById('lead-ok');
    var erro = document.getElementById('lead-error');
    var enviar = document.getElementById('lead-submit');
    var plano = document.getElementById('lead-fallback');
    var entradas = {
      nome: document.getElementById('lead-nome'),
      whatsapp: document.getElementById('lead-whatsapp'),
      email: document.getElementById('lead-email'),
      instagram: document.getElementById('lead-instagram'),
      consent: document.getElementById('lead-consent'),
      site: document.getElementById('lead-site')
    };
    var focoAntes = null;

    var lembrar = function (v) { try { localStorage.setItem(LEAD_MEMO, v); } catch (e) {} };
    var jaViu = function () { try { return !!localStorage.getItem(LEAD_MEMO); } catch (e) { return false; } };

    var abrirLead = function () {
      focoAntes = document.activeElement;
      lead.hidden = false;
      document.body.style.overflow = 'hidden';
      (form.hidden ? ok.querySelector('h2') : entradas.nome).focus();
    };
    var fecharLead = function () {
      lead.hidden = true;
      document.body.style.overflow = '';
      if (!jaViu()) lembrar('fechou');
      if (focoAntes && focoAntes.focus) focoAntes.focus();
    };

    // Máscara do WhatsApp: (16) 99999-9999
    entradas.whatsapp.addEventListener('input', function () {
      var d = entradas.whatsapp.value.replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '').slice(0, 11);
      var m = d.length > 10 ? d.replace(/^(\d{2})(\d{5})(\d{0,4}).*/, '($1) $2-$3')
        : d.length > 6 ? d.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3')
        : d.length > 2 ? d.replace(/^(\d{2})(\d*)/, '($1) $2')
        : d.replace(/^(\d*)/, d ? '($1' : '');
      entradas.whatsapp.value = m;
    });

    var limparInsta = function (v) {
      return v.trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/^@/, '').replace(/[/?#].*$/, '');
    };

    var validar = function () {
      var nome = entradas.nome.value.trim().replace(/\s+/g, ' ');
      var zap = entradas.whatsapp.value.replace(/\D/g, '');
      var email = entradas.email.value.trim().toLowerCase();
      var insta = limparInsta(entradas.instagram.value);
      var falhas = [];
      Object.keys(entradas).forEach(function (k) { entradas[k].removeAttribute('aria-invalid'); });
      if (nome.length < 3 || nome.indexOf(' ') < 0) falhas.push([entradas.nome, 'Escreva seu nome completo (nome e sobrenome).']);
      if (zap.length < 10 || zap.length > 11) falhas.push([entradas.whatsapp, 'Confira o WhatsApp com DDD, por exemplo (16) 99999-9999.']);
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) falhas.push([entradas.email, 'Confira o e-mail, por exemplo voce@email.com.']);
      if (insta && !/^[A-Za-z0-9._]{1,30}$/.test(insta)) falhas.push([entradas.instagram, 'O perfil do Instagram só tem letras, números, ponto e _.']);
      if (!entradas.consent.checked) falhas.push([entradas.consent, 'Marque a autorização para podermos falar com você.']);
      falhas.forEach(function (f) { f[0].setAttribute('aria-invalid', 'true'); });
      return { falhas: falhas, dados: { nome: nome, whatsapp: '55' + zap, email: email, instagram: insta || null, consentimento: true } };
    };

    var mostrarErro = function (msg) { erro.textContent = msg; erro.hidden = false; };

    var concluir = function (nome) {
      lembrar('cadastrou');
      document.getElementById('lead-ok-nome').textContent = nome.split(' ')[0];
      form.hidden = true;
      ok.hidden = false;
      ok.querySelector('h2').focus();
    };

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      erro.hidden = true;
      plano.hidden = true;
      if (entradas.site.value) { concluir(entradas.nome.value.trim() || 'Obrigada'); return; } // robô
      var v = validar();
      if (v.falhas.length) { mostrarErro(v.falhas[0][1]); v.falhas[0][0].focus(); return; }
      enviar.disabled = true;
      enviar.textContent = 'Enviando…';
      fetch(LEADS_URL, {
        method: 'POST',
        headers: { apikey: LEADS_KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify(v.dados)
      }).then(function (r) {
        if (!r.ok) throw new Error('status ' + r.status);
        concluir(v.dados.nome);
      }).catch(function () {
        // Plano B: os dados seguem pelo WhatsApp, já escritos na mensagem.
        var msg = 'Olá! Quero participar da Reunião de Mulheres do Impacto Rosa de 07/11.\n' +
          'Nome: ' + v.dados.nome + '\nWhatsApp: ' + entradas.whatsapp.value + '\nE-mail: ' + v.dados.email +
          (v.dados.instagram ? '\nInstagram: @' + v.dados.instagram : '');
        plano.href = 'https://wa.me/5516991271838?text=' + encodeURIComponent(msg);
        plano.hidden = false;
        mostrarErro('Não conseguimos salvar seu cadastro agora. Envie seus dados pelo WhatsApp com o botão abaixo.');
      }).then(function () {
        enviar.disabled = false;
        enviar.textContent = 'Quero fazer parte';
      });
    });

    lead.addEventListener('click', function (e) { if (e.target === lead) fecharLead(); });
    lead.querySelectorAll('[data-lead-close]').forEach(function (b) { b.addEventListener('click', fecharLead); });
    document.querySelectorAll('[data-lead-open]').forEach(function (b) { b.addEventListener('click', abrirLead); });
    document.addEventListener('keydown', function (e) {
      if (lead.hidden) return;
      if (e.key === 'Escape') fecharLead();
      if (e.key === 'Tab') { // mantém o foco dentro do cadastro
        var f = Array.prototype.filter.call(lead.querySelectorAll('button, a[href], input:not([tabindex="-1"])'),
          function (el) { return el.offsetParent !== null; });
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    });

    // Abre sozinho na tela inicial, só para quem ainda não fechou nem se cadastrou.
    if (!jaViu()) setTimeout(function () { if (lb.hidden) abrirLead(); }, 2500);
  }

  /* ---------- Botão flutuante ----------
   * Some quando os botões do topo ou o rodapé estão na tela (o contato já
   * está visível) e, no celular, enquanto a pessoa rola para baixo lendo,
   * para não encobrir o conteúdo. Volta ao rolar para cima. */
  var flutuante = document.getElementById('float');
  if (flutuante && 'IntersectionObserver' in window) {
    var heroCtas = document.querySelector('.hero-ctas');
    var rodape = document.querySelector('.footer');
    var mobile = window.matchMedia('(max-width: 640px)');
    var visivel = { hero: true, rodape: false };
    var descendo = false, ultimoY = window.scrollY;
    var atualizar = function () {
      flutuante.classList.toggle('is-hidden', visivel.hero || visivel.rodape || (mobile.matches && descendo));
    };
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { visivel[e.target === rodape ? 'rodape' : 'hero'] = e.isIntersecting; });
      atualizar();
    });
    if (heroCtas) obs.observe(heroCtas); else visivel.hero = false;
    if (rodape) obs.observe(rodape);
    window.addEventListener('scroll', function () {
      var y = window.scrollY;
      if (Math.abs(y - ultimoY) < 8) return;
      descendo = y > ultimoY;
      ultimoY = y;
      atualizar();
    }, { passive: true });
  }
})();
