(function () {
  const SUPABASE_URL = 'https://stpxnnvwhkueyryliehu.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0cHhubnZ3aGt1ZXlyeWxpZWh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNDIxMTEsImV4cCI6MjA4OTkxODExMX0.BBO4CtgrHdi14Lu8QjzJO6cp68fzYM2aIR8nuL1oR2w';

  function pageUrl(path) {
    return `${window.location.origin}${path}`;
  }

  window.ETLConfig = Object.freeze({
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    get SITE_BASE_URL() {
      return window.location.origin;
    },
    get DASHBOARD_URL() {
      return pageUrl('/ETL-Dashboard.html');
    },
    pageUrl
  });

  // Transitional aliases keep existing pages working while we refactor gradually.
  window.SUPABASE_URL = window.SUPABASE_URL || SUPABASE_URL;
  window.SUPABASE_KEY = window.SUPABASE_KEY || SUPABASE_ANON_KEY;
  window.SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || SUPABASE_ANON_KEY;
})();
