(function () {
  function escapeHtml(value) {
    if (window.ETLUtils && window.ETLUtils.escapeHtml) return window.ETLUtils.escapeHtml(value);
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function escapeJs(value) {
    return String(value ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  }

  function safeClass(value) {
    return String(value || '').replace(/[^a-z0-9_-]/gi, '');
  }

  function selected(current, value) {
    return current === value ? 'selected' : '';
  }

  function disabledOption(enabled) {
    return enabled ? '' : 'disabled';
  }

  function fmtTotal(value) {
    return 'UGX ' + (Number(value) || 0).toLocaleString();
  }

  function fmtMoney(value) {
    return 'UGX ' + Math.round(Number(value) || 0).toLocaleString();
  }

  function fmtShort(value) {
    const n = Number(value) || 0;
    if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
    return Math.round(n).toLocaleString();
  }

  function formatShortDate(value) {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
  }

  function formatLongDate(value) {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function isWithinDays(dateValue, days) {
    if (!dateValue) return false;
    return new Date(dateValue).getTime() >= Date.now() - (days * 86400000);
  }

  function fallback(value) {
    return value || '-';
  }

  function decodeText(value) {
    if (window.ETLUtils && window.ETLUtils.decodeHtml) return window.ETLUtils.decodeHtml(value);
    return value;
  }

  window.ETLDashboard = Object.assign(window.ETLDashboard || {}, {
    escapeHtml,
    escapeJs,
    safeClass,
    selected,
    disabledOption,
    fmtTotal,
    fmtMoney,
    fmtShort,
    formatShortDate,
    formatLongDate,
    isWithinDays,
    fallback,
    decodeText
  });
})();
