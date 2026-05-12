(function () {
  function validateRequired(fields) {
    const missing = [];
    const values = {};
    (fields || []).forEach((field) => {
      const value = window.ETLUtils.requireText(field.id, field.label, missing);
      values[field.key || field.id] = value;
    });
    return { ok: missing.length === 0, missing, values };
  }

  function alertMissing(missing, intro) {
    if (!missing || !missing.length) return false;
    alert((intro || 'Please complete these required fields before generating:') + '\n\n- ' + missing.join('\n- '));
    return true;
  }

  function validateDateOrder(startValue, endValue, message) {
    if (new Date(endValue) >= new Date(startValue)) return true;
    alert(message || 'The end date cannot be earlier than the start date.');
    return false;
  }

  function collectItems(options) {
    const opts = options || {};
    const rows = document.querySelectorAll(opts.rows || '#items-list tr');
    const selectors = opts.selectors || {
      desc: '.i-desc',
      unit: '.i-unit',
      qty: '.i-qty',
      price: '.i-price'
    };
    const result = window.ETLUtils.sanitizeItems(rows, selectors);
    const invalidItem = result.items.find((item) => item.qty <= 0 || item.price <= 0 || item.total <= 0);
    if (!result.items.length || invalidItem) {
      alert(opts.message || 'Please add at least one valid line item with a description, positive quantity, and positive unit price.');
      return { ok: false, items: [], subtotal: 0 };
    }
    return { ok: true, items: result.items, subtotal: result.subtotal };
  }

  async function sendJson(url, options) {
    const opts = options || {};
    const method = opts.method || 'POST';
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(opts.headers || {})
        },
        body: JSON.stringify(opts.payload || {})
      });

      if (!response.ok) {
        const error = await window.ETLUtils.readResponseError(response);
        return {
          ok: false,
          response,
          error,
          message: (opts.errorPrefix || 'Request failed') + ': ' + error
        };
      }

      return { ok: true, response, error: '', message: '' };
    } catch (error) {
      return {
        ok: false,
        response: null,
        error: error.message,
        message: (opts.networkPrefix || 'Network error') + ': ' + error.message
      };
    }
  }

  window.ETLSubmit = {
    alertMissing,
    collectItems,
    sendJson,
    validateDateOrder,
    validateRequired
  };
})();
