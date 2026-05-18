(function () {
  const DASHBOARD_THEME_KEY = 'etl-dashboard-theme';

  function getSavedDashboardTheme() {
    try {
      return localStorage.getItem(DASHBOARD_THEME_KEY) === 'dark' ? 'dark' : 'light';
    } catch (err) {
      return 'light';
    }
  }

  function refreshDashboardThemeButton(theme) {
    const button = document.getElementById('dashboard-theme-toggle');
    if (!button) return;
    const isDark = theme === 'dark';
    button.setAttribute('aria-pressed', String(isDark));
    button.setAttribute('aria-label', isDark ? 'Switch dashboard to light mode' : 'Switch dashboard to dark mode');
    button.title = isDark ? 'Switch dashboard to light mode' : 'Switch dashboard to dark mode';
  }

  function setDashboardTheme(theme) {
    const nextTheme = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-dashboard-theme', nextTheme);
    try {
      localStorage.setItem(DASHBOARD_THEME_KEY, nextTheme);
    } catch (err) {
      // If storage is unavailable, the visible theme still changes for this page load.
    }
    refreshDashboardThemeButton(nextTheme);
  }

  function toggleDashboardTheme() {
    const currentTheme = document.documentElement.getAttribute('data-dashboard-theme') === 'dark' ? 'dark' : 'light';
    setDashboardTheme(currentTheme === 'dark' ? 'light' : 'dark');
  }

  setDashboardTheme(getSavedDashboardTheme());
  document.addEventListener('DOMContentLoaded', () => {
    refreshDashboardThemeButton(getSavedDashboardTheme());
  });

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
    setDashboardTheme,
    toggleDashboardTheme,
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
  window.toggleDashboardTheme = toggleDashboardTheme;
})();
