(function () {
  function invalidRecipient(to) {
    return !to || !String(to).includes('@');
  }

  async function send(to, subject, body, options) {
    const opts = options || {};
    if (invalidRecipient(to)) {
      return { ok: false, error: opts.invalidMessage || 'No valid recipient email address was entered.' };
    }

    const payload = {
      to,
      subject,
      body,
      flow: opts.flow || 'internal_ops',
      context: opts.context || 'email'
    };
    if (opts.turnstileToken) payload.turnstileToken = opts.turnstileToken;

    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error(await ETLUtils.readResponseError(res));

      let data = {};
      try {
        data = await res.json();
      } catch {}

      return { ok: true, messageId: data.messageId || '' };
    } catch (error) {
      console.warn('Email error:', error);
      return { ok: false, error: error.message || 'Email request failed.' };
    }
  }

  window.ETLEmail = {
    send
  };
})();
