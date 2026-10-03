// Адрес Cloudflare Worker'а для заявок (см. _handoff/server/booking-worker.js).
// Пока пусто — форма открывает письмо через mailto.
const BOOKING_ENDPOINT = '';

const BOOKING_EMAIL = 'vic.torr.live@gmail.com';

// Плавный скролл «Слушать» → блок платформ
document.querySelectorAll('[data-scroll-to]').forEach((link) => {
  link.addEventListener('click', (e) => {
    const target = document.getElementById(link.dataset.scrollTo);
    if (!target) return;
    e.preventDefault();
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const top = target.getBoundingClientRect().top + window.scrollY - 24;
    window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
    history.replaceState(null, '', '#' + target.id);
  });
});

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
