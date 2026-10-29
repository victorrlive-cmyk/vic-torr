// House of Rock — свой плеер: постер + жёлтая Play, нативные controls только после старта.
// Без JS кнопки остаются скрытыми, а у <video> работают обычные controls, всё видно сразу.

document.documentElement.classList.add('js');

if ('IntersectionObserver' in window) {
  // Появление блоков при скролле
  var revealer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      revealer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -12% 0px' });
  document.querySelectorAll('.reveal').forEach(function (el) { revealer.observe(el); });

  // Липкое меню: подсвечиваем раздел, который сейчас посередине экрана
  var links = {};
  document.querySelectorAll('.hor-nav__link, .hor-nav__more').forEach(function (link) {
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

var players = document.querySelectorAll('.hor-player');

players.forEach(function (player) {
  var video = player.querySelector('video');
  var play = player.querySelector('.hor-player__play');

  video.controls = false;
  play.hidden = false;

  play.addEventListener('click', function () {
    video.controls = true;
    play.hidden = true;
    player.classList.add('is-started');
    var started = video.play();
    if (started) started.catch(function () {});
  });

  // Одновременно звучит только одно видео
  video.addEventListener('play', function () {
    players.forEach(function (other) {
      var v = other.querySelector('video');
      if (v !== video) v.pause();
    });
  });
});

// Политика обработки данных — pop-up, открывается ссылкой в подвале
var privacy = document.getElementById('privacy');

if (privacy && privacy.showModal) {
  document.querySelectorAll('[data-privacy]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      privacy.showModal();
    });
  });

  privacy.querySelector('[data-close]').addEventListener('click', function () { privacy.close(); });
  // клик по затемнению вокруг окна
  privacy.addEventListener('click', function (e) { if (e.target === privacy) privacy.close(); });
}
