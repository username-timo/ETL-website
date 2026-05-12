(function () {
  function decodeHtml(value) {
    const text = String(value || '');
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function parseAmount(value) {
    const number = Number.parseFloat(value);
    return Number.isFinite(number) ? number : 0;
  }

  function fmtNumber(value) {
    return Math.round(parseAmount(value)).toLocaleString();
  }

  function fmtMoney(value) {
    return 'UGX ' + fmtNumber(value);
  }

  function createReference(type) {
    const yr = new Date().getFullYear();
    const now = new Date();
    const stamp = [
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
      String(now.getHours()).padStart(2, '0'),
      String(now.getMinutes()).padStart(2, '0'),
      String(now.getSeconds()).padStart(2, '0')
    ].join('');
    const random = Math.random().toString(36).slice(2, 5).toUpperCase();
    return `ETL/${type}/${yr}/${stamp}-${random}`;
  }

  async function readResponseError(response) {
    try {
      const json = await response.json();
      return json.message || json.details || JSON.stringify(json);
    } catch {
      try {
        return await response.text();
      } catch {
        return response.statusText || 'Request failed';
      }
    }
  }

  function requireText(id, label, missing) {
    const el = document.getElementById(id);
    if (!el || !String(el.value || '').trim()) {
      if (el) el.classList.add('required-empty');
      missing.push(label);
      return '';
    }
    el.classList.remove('required-empty');
    return el.value.trim();
  }

  function sanitizeItems(rows, selectors) {
    const items = [];
    let subtotal = 0;

    rows.forEach((row, index) => {
      const desc = row.querySelector(selectors.desc)?.value.trim() || '';
      const unit = row.querySelector(selectors.unit)?.value.trim() || '';
      const qty = parseAmount(row.querySelector(selectors.qty)?.value);
      const price = parseAmount(row.querySelector(selectors.price)?.value);
      const total = qty * price;

      if (desc) {
        items.push({ i: index + 1, desc, unit, qty, price, total });
        subtotal += total;
      }
    });

    return { items, subtotal };
  }

  window.ETLUtils = {
    decodeHtml,
    escapeHtml,
    parseAmount,
    fmtNumber,
    fmtMoney,
    createReference,
    readResponseError,
    requireText,
    sanitizeItems
  };
})();
