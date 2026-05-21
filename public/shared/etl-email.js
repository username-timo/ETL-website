(function () {
  function invalidRecipient(to) {
    return !to || !String(to).includes('@');
  }

  async function getSessionToken() {
    try {
      if (!window.etlAuth || !window.etlAuth.getClient) return '';
      const client = window.etlAuth.getClient();
      const { data } = await client.auth.getSession();
      return data && data.session ? data.session.access_token : '';
    } catch (error) {
      console.warn('Could not read auth session for email request:', error);
      return '';
    }
  }

  async function send(to, subject, body, options) {
    const opts = options || {};
    const flow = opts.flow || 'internal_ops';
    if (invalidRecipient(to)) {
      return { ok: false, error: opts.invalidMessage || 'No valid recipient email address was entered.' };
    }

    const payload = {
      to,
      subject,
      body,
      flow,
      context: opts.context || 'email'
    };
    if (opts.turnstileToken) payload.turnstileToken = opts.turnstileToken;

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (flow === 'internal_ops') {
        const token = opts.authToken || await getSessionToken();
        if (!token) {
          return { ok: false, error: 'Please sign in again before sending this internal email.' };
        }
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers,
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
