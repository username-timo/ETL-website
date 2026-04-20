/*
 * ETL Auth helper — shared across all tool pages.
 *
 * What it does:
 *  - Loads the Supabase JS SDK (assumed already loaded via <script> tag)
 *  - Exposes window.etlAuth with:
 *      init({ requireManagement? })   → shows login overlay if not signed in,
 *                                        rejects staff if requireManagement=true
 *      signIn(email, password)        → attempts login
 *      signOut()                      → logs out and reloads
 *      getRole()                      → 'staff' | 'management' | null
 *      getUser()                      → current Supabase user object
 *      fetch(pathOrUrl, options?)     → Supabase REST fetch with session token
 *                                        already attached (drop-in replacement for
 *                                        the old fetch-with-anon-key calls)
 *
 * Usage in an HTML page:
 *   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
 *   <script src="/etl-auth.js"></script>
 *   <script>
 *     etlAuth.init().then(async () => {
 *       // page is authenticated and visible
 *       const role = await etlAuth.getRole();
 *       if (role === 'management') { showApprovalUI(); }
 *       loadData();
 *     });
 *   </script>
 */
(function () {
  const SUPABASE_URL = 'https://stpxnnvwhkueyryliehu.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0cHhubnZ3aGt1ZXlyeWxpZWh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNDIxMTEsImV4cCI6MjA4OTkxODExMX0.BBO4CtgrHdi14Lu8QjzJO6cp68fzYM2aIR8nuL1oR2w';

  let sb = null;           // Supabase client
  let cachedProfile = null; // { id, role, full_name }

  function ensureClient() {
    if (sb) return sb;
    if (!window.supabase || !window.supabase.createClient) {
      throw new Error('Supabase JS SDK not loaded. Add <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script> before etl-auth.js');
    }
    sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return sb;
  }

  function injectStyles() {
    if (document.getElementById('etl-auth-styles')) return;
    const css = `
      #etl-auth-overlay { position: fixed; inset: 0; background: linear-gradient(135deg,#1a3c6e 0%,#0c121e 100%); display: flex; align-items: center; justify-content: center; z-index: 99999; font-family: 'DM Sans', sans-serif; }
      .etl-auth-card { background: #fff; padding: 36px 32px; border-radius: 14px; box-shadow: 0 20px 60px rgba(0,0,0,0.35); min-width: 340px; max-width: 380px; }
      .etl-auth-card img { display: block; margin: 0 auto 14px; width: 64px; height: 64px; object-fit: contain; mix-blend-mode: multiply; }
      .etl-auth-title { text-align: center; font-weight: 800; font-size: 19px; color: #1a3c6e; margin-bottom: 4px; font-family: 'Barlow Condensed', sans-serif; letter-spacing: 0.5px; }
      .etl-auth-sub { text-align: center; font-size: 12px; color: #64748b; margin-bottom: 22px; }
      .etl-auth-field { margin-bottom: 14px; }
      .etl-auth-field label { display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; color: #64748b; margin-bottom: 6px; }
      .etl-auth-field input { width: 100%; padding: 10px 12px; border: 1.5px solid #cfe3f0; border-radius: 7px; font-size: 14px; font-family: inherit; outline: none; box-sizing: border-box; }
      .etl-auth-field input:focus { border-color: #4fa3d1; }
      .etl-auth-btn { width: 100%; padding: 11px; background: #1a3c6e; color: #fff; border: 0; border-radius: 7px; font-weight: 700; font-size: 14px; cursor: pointer; margin-top: 4px; transition: background 0.15s; }
      .etl-auth-btn:hover { background: #2d5fa3; }
      .etl-auth-btn:disabled { opacity: 0.6; cursor: default; }
      .etl-auth-err { color: #b91c1c; font-size: 12px; margin-top: 10px; text-align: center; min-height: 16px; }
      .etl-signout-btn { background: transparent; color: #fff; border: 1.5px solid rgba(255,255,255,0.3); padding: 7px 14px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.7px; cursor: pointer; font-family: inherit; }
      .etl-signout-btn:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.6); }
    `;
    const style = document.createElement('style');
    style.id = 'etl-auth-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function renderLoginOverlay(onSuccess) {
    injectStyles();
    const existing = document.getElementById('etl-auth-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'etl-auth-overlay';
    overlay.innerHTML = `
      <form class="etl-auth-card" id="etl-auth-form" autocomplete="on">
        <img src="/etl-images/etl-logo.png" alt="ETL">
        <div class="etl-auth-title">ETL Operations Portal</div>
        <div class="etl-auth-sub">Engineering Trade Links Co. Ltd</div>
        <div class="etl-auth-field">
          <label for="etl-auth-email">Email</label>
          <input type="email" id="etl-auth-email" autocomplete="username" required>
        </div>
        <div class="etl-auth-field">
          <label for="etl-auth-password">Password</label>
          <input type="password" id="etl-auth-password" autocomplete="current-password" required>
        </div>
        <button type="submit" class="etl-auth-btn" id="etl-auth-submit">Sign In</button>
        <div class="etl-auth-err" id="etl-auth-err"></div>
      </form>
    `;
    document.body.appendChild(overlay);

    const form = document.getElementById('etl-auth-form');
    const errBox = document.getElementById('etl-auth-err');
    const submit = document.getElementById('etl-auth-submit');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errBox.textContent = '';
      submit.disabled = true;
      submit.textContent = 'Signing in…';
      const email = document.getElementById('etl-auth-email').value.trim();
      const password = document.getElementById('etl-auth-password').value;
      try {
        const { error } = await ensureClient().auth.signInWithPassword({ email, password });
        if (error) throw error;
        overlay.remove();
        cachedProfile = null; // force fresh fetch
        await loadProfile();
        if (onSuccess) onSuccess();
      } catch (err) {
        errBox.textContent = err.message || 'Sign in failed. Check your email and password.';
      } finally {
        submit.disabled = false;
        submit.textContent = 'Sign In';
      }
    });

    setTimeout(() => document.getElementById('etl-auth-email').focus(), 100);
  }

  async function loadProfile() {
    if (cachedProfile) return cachedProfile;
    const client = ensureClient();
    const { data: { user } } = await client.auth.getUser();
    if (!user) { cachedProfile = null; return null; }
    const { data, error } = await client
      .from('profiles')
      .select('id, role, full_name')
      .eq('id', user.id)
      .maybeSingle();
    if (error) { console.warn('profile fetch error', error); return null; }
    cachedProfile = data;
    return data;
  }

  function promptForLogin(client, opts) {
    return new Promise((resolve) => {
      renderLoginOverlay(async () => {
        const profile = await loadProfile();
        if (opts.requireManagement && profile && profile.role !== 'management') {
          alert('This page requires Management access. You are signed in as ' + profile.role + '.');
          await client.auth.signOut();
          cachedProfile = null;
          window.location.reload();
          return;
        }
        resolve();
      });
    });
  }

  async function init(opts) {
    opts = opts || {};
    const client = ensureClient();
    let { data: { session } } = await client.auth.getSession();

    if (opts.forceLogin && session) {
      await client.auth.signOut();
      cachedProfile = null;
      session = null;
    }

    if (!session) {
      return promptForLogin(client, opts);
    }

    const profile = await loadProfile();
    if (opts.requireManagement && profile && profile.role !== 'management') {
      alert('This page requires Management access. You are signed in as ' + profile.role + '.');
      await client.auth.signOut();
      cachedProfile = null;
      renderLoginOverlay(() => init(opts));
      return new Promise(() => {}); // never resolves — user is on login screen
    }
  }

  async function signOut() {
    await ensureClient().auth.signOut();
    cachedProfile = null;
    window.location.reload();
  }

  async function getRole() {
    const p = await loadProfile();
    return p ? p.role : null;
  }

  async function getUser() {
    const { data: { user } } = await ensureClient().auth.getUser();
    return user;
  }

  async function getProfile() {
    return await loadProfile();
  }

  // Drop-in replacement for old fetch(`${SUPABASE_URL}/rest/v1/...`, {headers: {apikey, Authorization}})
  // Pass either a path like '/rest/v1/quotation_requests?...' or a full URL; headers attached automatically.
  async function supabaseFetch(pathOrUrl, options) {
    options = options || {};
    const url = pathOrUrl.startsWith('http') ? pathOrUrl : (SUPABASE_URL + pathOrUrl);
    const client = ensureClient();
    const { data: { session } } = await client.auth.getSession();
    const headers = Object.assign({
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': 'Bearer ' + (session ? session.access_token : SUPABASE_ANON_KEY),
      'Content-Type': 'application/json'
    }, options.headers || {});
    return fetch(url, Object.assign({}, options, { headers }));
  }

  // Small helper to inject a styled sign-out button into any nav container
  function renderSignOutButton(containerEl) {
    if (!containerEl) return;
    injectStyles();
    const btn = document.createElement('button');
    btn.className = 'etl-signout-btn';
    btn.type = 'button';
    btn.textContent = '🔓 Sign Out';
    btn.addEventListener('click', signOut);
    containerEl.appendChild(btn);
  }

  window.etlAuth = {
    init,
    signIn: (email, password) => ensureClient().auth.signInWithPassword({ email, password }),
    signOut,
    getRole,
    getUser,
    getProfile,
    fetch: supabaseFetch,
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    renderSignOutButton
  };
})();
