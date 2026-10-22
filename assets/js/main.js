/*
 * Casa Atípica — WhatsApp e botão flutuante.
 * A página funciona sem JavaScript: todos os links já têm o endereço completo.
 */
(function () {
  'use strict';

  // WhatsApp oficial da equipe: WHATSAPP_TEXTO (o número entra pelo scripts/montar_pagina.py)
  var LINK_WA = 'WHATSAPP_LINK';
  document.querySelectorAll('.js-whatsapp').forEach(function (el) {
    el.setAttribute('href', LINK_WA);
    el.setAttribute('target', '_blank');
    el.setAttribute('rel', 'noopener');
  });

  var ano = document.getElementById('ano');
  if (ano) ano.textContent = new Date().getFullYear();

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
