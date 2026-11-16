// Inquiry form: lazy-loads Turnstile, submits with fetch, and shows errors
// inline in an aria-live region. Without JS the form still posts normally and
// the server returns a plain error page with the email fallback.
(function () {
  var form = document.getElementById('inquiry-form');
  if (!form) return;
  var status = document.getElementById('form-status');
  var holder = document.getElementById('turnstile');
  var button = form.querySelector('button[type="submit"]');
  var loaded = false;

  function loadTurnstile() {
    if (loaded) return;
    loaded = true;
    window.onTurnstileLoad = function () {
      window.turnstile.render(holder, { sitekey: holder.dataset.sitekey });
    };
    var s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onTurnstileLoad';
    s.async = true;
    document.head.appendChild(s);
  }

  // Load the widget only when the contact section approaches the viewport,
  // or as soon as someone starts filling in the form.
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      if (entries.some(function (e) { return e.isIntersecting; })) { loadTurnstile(); io.disconnect(); }
    }, { rootMargin: '600px' });
    io.observe(form);
  } else {
    loadTurnstile();
  }
  form.addEventListener('focusin', loadTurnstile, { once: true });

  function show(msg) { status.textContent = msg; }

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    show('');
    if (!form.checkValidity()) {
      var bad = form.querySelector(':invalid');
      var label = bad && form.querySelector('label[for="' + bad.id + '"]');
      show((label ? label.textContent.trim() : 'A field') + ' needs a valid entry.');
      if (bad) bad.focus();
      return;
    }
    var data = new FormData(form);
    if (!data.get('cf-turnstile-response')) { show(form.dataset.errorTurnstile); return; }

    var original = button.textContent;
    button.disabled = true;
    button.textContent = form.dataset.sending;

    fetch(form.action, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
      .then(function (r) { return r.json().catch(function () { return { ok: false }; }); })
      .then(function (j) {
        if (j && j.ok) { window.location.assign('/thanks'); return; }
        throw new Error('failed');
      })
      .catch(function () {
        show(form.dataset.errorGeneric);
        if (window.turnstile) window.turnstile.reset(holder);
        button.disabled = false;
        button.textContent = original;
      });
  });
})();
