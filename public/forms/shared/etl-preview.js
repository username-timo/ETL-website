(function () {
  function getEl(id) {
    return document.getElementById(id);
  }

  function escapeHtml(value) {
    if (window.ETLUtils && window.ETLUtils.escapeHtml) return window.ETLUtils.escapeHtml(value);
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function fmtNumber(value) {
    if (window.ETLUtils && window.ETLUtils.fmtNumber) return window.ETLUtils.fmtNumber(value);
    return Math.round(Number(value) || 0).toLocaleString();
  }

  function formatDate(value) {
    if (!value) return '-';
    try {
      return new Date(value).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (e) {
      return value;
    }
  }

  function setText(id, value, fallback) {
    const el = getEl(id);
    if (!el) return;
    el.innerText = value || fallback || '';
  }

  function setTexts(values) {
    Object.keys(values || {}).forEach((id) => setText(id, values[id]));
  }

  function setDisplay(id, show, displayValue) {
    const el = getEl(id);
    if (!el) return;
    el.style.display = show ? (displayValue ?? '') : 'none';
  }

  function renderItemRows(tbodyId, items, options) {
    const tbody = getEl(tbodyId);
    if (!tbody) return;
    const opts = options || {};
    const priceFormatter = opts.priceFormatter || fmtNumber;
    const totalFormatter = opts.totalFormatter || fmtNumber;
    const alignQty = !!opts.alignQty;
    const alignPrice = opts.alignPrice !== false;
    const alignTotal = opts.alignTotal !== false;

    tbody.innerHTML = (items || []).map((item, index) => `
      <tr>
        <td>${item.i || index + 1}</td>
        <td>${escapeHtml(item.desc)}</td>
        <td>${escapeHtml(item.unit)}</td>
        <td${alignQty ? ' style="text-align:right;"' : ''}>${item.qty}</td>
        <td${alignPrice ? ' style="text-align:right;"' : ''}>${priceFormatter(item.price)}</td>
        <td${alignTotal ? ' style="text-align:right;"' : ''}>${totalFormatter(item.total)}</td>
      </tr>`).join('');
  }

  function showPreview(formId, previewId) {
    const form = getEl(formId || 'form-section');
    const preview = getEl(previewId || 'preview-section');
    if (form) form.style.display = 'none';
    if (preview) preview.style.display = 'block';
    window.scrollTo(0, 0);
  }

  function renderNotes(options) {
    const opts = options || {};
    const notes = String(opts.value || '').trim();
    setDisplay(opts.wrapId, !!notes, opts.displayValue || 'block');
    if (notes && opts.textId) setText(opts.textId, notes);
  }

  window.ETLPreview = {
    escapeHtml,
    fmtNumber,
    formatDate,
    renderItemRows,
    renderNotes,
    setDisplay,
    setText,
    setTexts,
    showPreview
  };
})();
