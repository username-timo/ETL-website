(function () {
  let enabled = false;
  let siteKey = '';
  let token = '';
  let widgetId = null;

  function setMessage(message, isError) {
    const el = document.getElementById('turnstile-msg');
    if (!el) return;
    el.textContent = message || '';
    el.style.color = isError ? '#c53030' : '#64748b';
    el.style.fontWeight = isError ? '700' : '400';
  }

  function reset() {
    token = '';
    if (enabled && window.turnstile && widgetId !== null) {
      window.turnstile.reset(widgetId);
    }
  }

  function render() {
    if (!enabled || !siteKey) return;
    const wrap = document.getElementById('turnstile-wrap');
    if (!wrap || !window.turnstile || widgetId !== null) return;

    wrap.style.display = 'block';
    widgetId = window.turnstile.render('#turnstile-widget', {
      sitekey: siteKey,
      theme: 'light',
      callback: function (newToken) {
        token = newToken || '';
        setMessage('Security check complete.', false);
      },
      'expired-callback': function () {
        token = '';
        setMessage('Security check expired. Please confirm again.', true);
      },
      'error-callback': function () {
        token = '';
        setMessage('Could not load security check. Refresh and try again.', true);
      }
    });
  }

  function waitForWidget() {
    if (window.turnstile && window.turnstile.render) {
      render();
      return;
    }
    setTimeout(waitForWidget, 150);
  }

  function configure(nextEnabled, nextSiteKey) {
    enabled = !!nextEnabled;
    siteKey = nextSiteKey || '';
    if (enabled && siteKey) waitForWidget();
  }

  function hasPassed() {
    return !enabled || !!token;
  }

  window.ETLLpoTurnstile = {
    configure,
    getToken: function () { return token; },
    hasPassed,
    isEnabled: function () { return enabled; },
    reset,
    setMessage
  };
})();
