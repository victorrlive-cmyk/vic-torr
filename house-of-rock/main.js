// House of Rock — свой плеер: постер + жёлтая Play, нативные controls только после старта.
// Без JS кнопки остаются скрытыми, а у <video> работают обычные controls.

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

// Форма «Обсудить дату». Пока нет Worker'а (как и на главной, BOOKING_ENDPOINT в ../main.js пуст),
// заявка уходит письмом через mailto — сразу всем адресатам из списка.
// TODO: добавить почту Prosvet и поправить подсказку в форме (index.html, .form__hint)
var BOOKING_EMAILS = ['vic.torr.live@gmail.com', 'guguchkin@gmail.com', 'Kichigin.kiril@yandex.ru'];

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
      booking.showModal();
      form.querySelector('input').focus();
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

    if (!data.phone && !data.telegram && !data.email) {
      showError('Укажите телефон, Telegram или почту.');
      return;
    }

    var body = 'Телефон: ' + data.phone + '\nTelegram: ' + data.telegram + '\nПочта: ' + data.email + '\n\n' + data.message;
    window.location.href = 'mailto:' + BOOKING_EMAILS.join(',') +
      '?subject=' + encodeURIComponent('House of Rock — Vic Torr + Prosvet: обсудить дату') +
      '&body=' + encodeURIComponent(body);
  });
}
