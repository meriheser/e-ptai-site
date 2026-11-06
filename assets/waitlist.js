// Waitlist form. The key below is Supabase's publishable key: it is meant for browsers and can only call join_waitlist().
(function () {
  var URL = 'https://nsviocxatqzjnbelvjvh.supabase.co/rest/v1/rpc/join_waitlist';
  var KEY = 'sb_publishable_pWoVaYv9kNSAcyG9-_rpVg_zhUPV3i4';
  var CONSENT_VERSION = 'wl-2026-11';
  var form = document.querySelector('.wl-form');
  if (!form) return;
  var msg = form.querySelector('.wl-msg'), btn = form.querySelector('.wl-btn'), mail = form.elements.email;
  function say(text, ok) { msg.textContent = text; msg.classList.toggle('good', !!ok); }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (btn.disabled) return;
    if (form.elements.website.value) { say(form.dataset.ok, true); return; }
    var value = mail.value.trim();
    if (!mail.checkValidity() || !value) { say(form.dataset.bad); mail.focus(); return; }
    if (!form.elements.consent.checked) { say(form.dataset.need); form.elements.consent.focus(); return; }
    btn.disabled = true;
    say('');
    fetch(URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: KEY },
      body: JSON.stringify({ p_email: value, p_locale: form.dataset.locale, p_consent_version: CONSENT_VERSION })
    }).then(function (r) {
      if (r.ok) { say(form.dataset.ok, true); form.reset(); return; }
      return r.json().catch(function () { return {}; }).then(function (b) {
        say(b && b.message === 'invalid_email' ? form.dataset.bad : form.dataset.err);
      });
    }).catch(function () { say(form.dataset.err); }).then(function () { btn.disabled = false; });
  });
})();
