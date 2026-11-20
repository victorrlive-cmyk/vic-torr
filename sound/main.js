// Звук для брендов — плееры, появление при скролле, липкое меню, pop-up политики.
// Та же логика, что в ../corp/main.js, без формы заявки. Без JS всё видно сразу, у <video> обычные controls.

document.documentElement.classList.add('js');

var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Свой плеер: постер + жёлтая Play, нативные controls только после старта
var players = document.querySelectorAll('.corp-player');

players.forEach(function (player) {
  var video = player.querySelector('video');
  var play = player.querySelector('.corp-player__play');
  if (!video || !play) return;

  video.controls = false;
  play.hidden = false;

  play.addEventListener('click', function () {
    video.controls = true;
    play.hidden = true;
    player.classList.add('is-started');
    var started = video.play();
    if (started) started.catch(function () {});
    goal('video_play', { title: play.getAttribute('aria-label') || '' });
  });

  // Одновременно звучит только одно видео
  video.addEventListener('play', function () {
    players.forEach(function (other) {
      var v = other.querySelector('video');
      if (v && v !== video) v.pause();
    });
  });
});

if ('IntersectionObserver' in window) {
  var revealer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      revealer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -12% 0px' });
  document.querySelectorAll('.reveal').forEach(function (el) { revealer.observe(el); });

  // Липкое меню: подсвечиваем раздел посередине экрана
  var links = {};
  document.querySelectorAll('.corp-nav__link').forEach(function (link) {
    links[link.getAttribute('href').slice(1)] = link;
  });
  var spy = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      var link = links[entry.target.id];
      if (link) link.classList.toggle('is-active', entry.isIntersecting);
    });
  }, { rootMargin: '-50% 0px -50% 0px' });
  Object.keys(links).forEach(function (id) {
    var section = document.getElementById(id);
    if (section) spy.observe(section);
  });
} else {
  document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('is-in'); });
}

// Огромные контурные номера глав чуть уезжают вбок при скролле
var nums = document.querySelectorAll('.corp-head__num');
if (!reduceMotion && nums.length) {
  var ticking = false;
  var drift = function () {
    var vh = window.innerHeight;
    nums.forEach(function (num) {
      var r = num.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      var p = (r.top + r.height / 2) / vh - .5;
      num.style.setProperty('--drift', (p * 120).toFixed(1) + 'px');
    });
    ticking = false;
  };
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; window.requestAnimationFrame(drift); }
  }, { passive: true });
  drift();
}

// Цели Яндекс Метрики с page: 'sound'. Метрика заблокирована — молча ничего.
function goal(name, params) {
  params.page = 'sound';
  try {
    if (window.YM_ID && typeof window.ym === 'function') window.ym(window.YM_ID, 'reachGoal', name, params);
  } catch (err) { /* счётчик не должен ломать сайт */ }
}

document.addEventListener('click', function (e) {
  var el = e.target.closest('a');
  if (!el || el.closest('.privacy')) return;
  var href = el.getAttribute('href') || '';
  var type = '';
  if (href.indexOf('mailto:') === 0) type = 'mail';
  else if (href.indexOf('tel:') === 0) type = 'phone';
  else if (href.indexOf('t.me/') !== -1) type = 'telegram';
  if (type) goal('booking_click', { type: type, show: 'sound', href: href });
});

// Pop-up политики обработки данных
var privacy = document.getElementById('privacy');
if (privacy && privacy.showModal) {
  document.querySelectorAll('[data-privacy]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      privacy.showModal();
    });
  });
  privacy.querySelector('[data-close]').addEventListener('click', function () { privacy.close(); });
  privacy.addEventListener('click', function (e) { if (e.target === privacy) privacy.close(); });
}
