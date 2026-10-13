// Шоу для событий — плееры, появление при скролле, липкое меню, форма заявки.
// Без JS всё видно сразу, у <video> работают обычные controls, кнопки «Обсудить» открывают письмо.

document.documentElement.classList.add('js');

var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Свой плеер: постер + жёлтая Play, нативные controls только после старта
var players = document.querySelectorAll('.corp-player');

players.forEach(function (player) {
  var video = player.querySelector('video');
  var play = player.querySelector('.corp-player__play');

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
      // от +60px, когда номер внизу экрана, до −60px, когда вверху
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

// Форма заявки. Как и на главной (BOOKING_ENDPOINT в ../main.js пуст), заявка уходит письмом через mailto.
var BOOKING_EMAILS = ['vic.torr.live@gmail.com', 'guguchkin@gmail.com'];

var booking = document.getElementById('booking');
var privacy = document.getElementById('privacy');

if (booking && booking.showModal) {
  var form = document.getElementById('booking-form');
  var error = form.querySelector('.form__error');

  var showError = function (text) {
    error.textContent = text;
    error.hidden = !text;
  };

  document.querySelectorAll('[data-booking]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      showError('');
      // Кнопка «Обсудить Feel Alive» сразу отмечает Feel Alive и т. д.
      var radio = form.querySelector('input[name="show"][value="' + link.dataset.booking + '"]');
      if (radio) radio.checked = true;
      booking.showModal();
      form.querySelector('input[name="phone"]').focus();
    });
  });

  document.querySelectorAll('[data-privacy]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      privacy.showModal();
    });
  });

  [booking, privacy].forEach(function (dialog) {
    dialog.querySelector('[data-close]').addEventListener('click', function () { dialog.close(); });
    // клик по затемнению вокруг окна
    dialog.addEventListener('click', function (e) { if (e.target === dialog) dialog.close(); });
  });

  form.addEventListener('input', function () { showError(''); });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var data = {};
    ['phone', 'telegram', 'email', 'message'].forEach(function (n) { data[n] = form.elements[n].value.trim(); });
    var show = form.querySelector('input[name="show"]:checked');

    if (!data.phone && !data.telegram && !data.email) {
      showError('Укажите телефон, Telegram или почту.');
      return;
    }

    var body = 'Шоу: ' + (show ? show.value : '—') +
      '\nТелефон: ' + data.phone + '\nTelegram: ' + data.telegram + '\nПочта: ' + data.email + '\n\n' + data.message;
    window.location.href = 'mailto:' + BOOKING_EMAILS.join(',') +
      '?subject=' + encodeURIComponent('Vic Torr для событий' + (show ? ' — ' + show.value : '') + ': обсудить дату') +
      '&body=' + encodeURIComponent(body);
  });
}
