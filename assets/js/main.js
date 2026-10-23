/*
 * Casa Atípica — WhatsApp, galeria que abre e botão flutuante.
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
  if (lb) {
    var lbImg = document.getElementById('lb-img');
    var lbCap = document.getElementById('lb-cap');
    var atual = 0;
    var ultimoFoco = null;
    var mostrar = function (i) {
      atual = (i + tiles.length) % tiles.length;
      var img = tiles[atual].querySelector('img');
      lbImg.src = img.src;
      lbImg.alt = img.alt;
      lbCap.textContent = tiles[atual].getAttribute('data-caption') + ' · ' + (atual + 1) + ' de ' + tiles.length;
    };
    var abrir = function (i) {
      ultimoFoco = document.activeElement;
      mostrar(i);
      lb.hidden = false;
      document.body.style.overflow = 'hidden';
      lb.querySelector('.lb-close').focus();
    };
    var fechar = function () {
      lb.hidden = true;
      document.body.style.overflow = '';
      if (ultimoFoco) ultimoFoco.focus();
    };
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
