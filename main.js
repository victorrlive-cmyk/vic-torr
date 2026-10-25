// Адрес Cloudflare Worker'а для заявок (см. _handoff/server/booking-worker.js).
// Пока пусто — форма открывает письмо через mailto.
const BOOKING_ENDPOINT = '';

const BOOKING_EMAIL = 'vic.torr.live@gmail.com';

document.documentElement.classList.add('js');

// Плавный скролл «Слушать» → блок платформ
document.querySelectorAll('[data-scroll-to]').forEach((link) => {
  link.addEventListener('click', (e) => {
    const target = document.getElementById(link.dataset.scrollTo);
    if (!target) return;
    e.preventDefault();
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const nav = document.querySelector('.nav');
    const top = target.getBoundingClientRect().top + window.scrollY - 24 - (nav ? nav.offsetHeight : 0);
    window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
    history.replaceState(null, '', '#' + target.id);
  });
});

// Липкое меню: подсвечиваем раздел, который сейчас посередине экрана.
// «Видео» (#reels) лежит внутри «Музыки» (#listen) — если посередине оба, горит тот, что правее в меню.
if ('IntersectionObserver' in window) {
  const links = {};
  document.querySelectorAll('.nav__link').forEach((link) => {
    links[link.getAttribute('href').slice(1)] = link;
  });
  const visible = new Set();
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) visible.add(entry.target.id);
      else visible.delete(entry.target.id);
    });
    const current = Object.keys(links).filter((id) => visible.has(id)).pop();
    Object.keys(links).forEach((id) => links[id].classList.toggle('is-active', id === current));
  }, { rootMargin: '-50% 0px -50% 0px' });
  Object.keys(links).forEach((id) => {
    const section = document.getElementById(id);
    if (section) spy.observe(section);
  });

  // Появление блоков при скролле
  const revealer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      revealer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -12% 0px' });
  document.querySelectorAll('.reveal').forEach((el) => revealer.observe(el));
} else {
  document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-in'));
}

// Видео Live Show: постер + жёлтая Play, нативные controls только после старта.
// Без JS кнопка скрыта, у <video> работают обычные controls.
document.querySelectorAll('.video').forEach((box) => {
  const video = box.querySelector('video');
  const play = box.querySelector('.video__play');
  if (!video || !play) return;
  video.controls = false;
  play.hidden = false;
  play.addEventListener('click', () => {
    video.controls = true;
    play.hidden = true;
    box.classList.add('is-started');
    video.play().catch(() => {});
  });
});

// Одновременно звучит только одно видео
const videos = document.querySelectorAll('video');
videos.forEach((video) => {
  video.addEventListener('play', () => {
    videos.forEach((other) => { if (other !== video) other.pause(); });
  });
});

// Pop-up «Где слушать»: кнопки и плитки с data-listen открывают прямые ссылки на трек.
// Без JS (или без <dialog>) работает обычный href — BandLink.
const pick = document.getElementById('pick');

if (pick && pick.showModal) {
  const groups = pick.querySelectorAll('[data-release]');
  document.querySelectorAll('[data-listen]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const group = pick.querySelector('[data-release="' + link.dataset.listen + '"]');
      if (!group) return;
      e.preventDefault();
      groups.forEach((g) => { g.hidden = g !== group; });
      pick.setAttribute('aria-label', 'Где слушать «' + group.dataset.title + '»');
      videos.forEach((v) => v.pause());
      pick.showModal();
      document.body.classList.add('no-scroll');
    });
  });
  pick.querySelector('[data-pick-close]').addEventListener('click', () => pick.close());
  // клик по затемнению вокруг окна
  pick.addEventListener('click', (e) => { if (e.target === pick) pick.close(); });
  // стриминг открылся в новой вкладке — окно закрываем, чтобы вернуться на страницу
  pick.querySelectorAll('.platform').forEach((a) => a.addEventListener('click', () => pick.close()));
  pick.addEventListener('close', () => document.body.classList.remove('no-scroll'));
}

// Pop-up «Политика обработки данных»
const privacy = document.getElementById('privacy');

if (privacy && privacy.showModal) {
  const close = () => privacy.close();
  document.querySelectorAll('[data-privacy]').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      privacy.showModal();
      document.body.classList.add('no-scroll');
    });
  });
  privacy.querySelector('[data-privacy-close]').addEventListener('click', close);
  // клик по затемнению вокруг окна
  privacy.addEventListener('click', (e) => { if (e.target === privacy) close(); });
  privacy.addEventListener('close', () => document.body.classList.remove('no-scroll'));
}

// Форма BOOKING
const toggle = document.getElementById('booking-toggle');
const form = document.getElementById('booking-form');
const sent = document.getElementById('booking-sent');

if (toggle && form) {
  const error = form.querySelector('.form__error');
  const submit = form.querySelector('.form__submit');

  const showError = (text) => {
    error.textContent = text;
    error.hidden = !text;
  };

  toggle.addEventListener('click', () => {
    const open = form.hidden;
    form.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    sent.hidden = true;
    showError('');
    if (open) form.querySelector('input').focus();
  });

  form.addEventListener('input', () => showError(''));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(
      ['phone', 'telegram', 'email', 'message'].map((n) => [n, form.elements[n].value.trim()])
    );

    if (!data.phone && !data.telegram && !data.email) {
      showError('Укажите телефон, Telegram или почту.');
      return;
    }

    if (!BOOKING_ENDPOINT) {
      const body = 'Телефон: ' + data.phone + '\nTelegram: ' + data.telegram + '\nПочта: ' + data.email + '\n\n' + data.message;
      window.location.href = 'mailto:' + BOOKING_EMAIL +
        '?subject=' + encodeURIComponent('Booking Vic Torr Live Show') +
        '&body=' + encodeURIComponent(body);
      return;
    }

    submit.disabled = true;
    submit.textContent = 'Отправляем…';
    try {
      const r = await fetch(BOOKING_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, page: location.href }),
      });
      if (!r.ok) throw new Error(r.status);
      form.reset();
      form.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
      sent.hidden = false;
    } catch (err) {
      showError('Не получилось отправить. Напишите на ' + BOOKING_EMAIL + ' или Дмитрию в Telegram.');
    } finally {
      submit.disabled = false;
      submit.textContent = 'Отправить заявку';
    }
  });
}
