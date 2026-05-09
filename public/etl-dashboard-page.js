// Dashboard page controller extracted from ETL-Dashboard.html.

  function fmtDate(d) {
    return ETLDashboard.formatLongDate(d);
    if(!d) return '—';
  }

  function updateFilterLabel(elId, text) {
    const el = document.getElementById(elId);
    if (!el) return;
    if (text) {
      el.style.display = '';
      el.innerText = '• ' + text;
    } else {
      el.style.display = 'none';
      el.innerText = '';
    }
  }

  window._reqFilter = 'all';
  window._lpoFilter = 'all';

  function renderReqFilterBanner() {
    const labels = { all: '', last30: 'Last 30 days' };
    updateFilterLabel('req-filter-label', labels[window._reqFilter || 'all'] || '');
  }

  function renderRequestsTable(data) {
    const body = document.getElementById('requests-body');
    const filtered = ETLDashboard.filterRequests(data || [], window._reqFilter);
    window._reqViewData = filtered;
    renderReqFilterBanner();

    if (!(data || []).length) {
      body.innerHTML = '<div class="empty-state"><div class="icon">📭</div><p>No quotation requests yet. Share the request form link with clients!</p></div>';
      return;
    }

    if (!filtered.length) {
      body.innerHTML = '<div class="empty-state"><div class="icon">🔗</div><p>No quotation requests match the current dashboard filter.</p></div>';
      return;
    }

    body.innerHTML = ETLDashboard.renderRequestTable(filtered, {
      role: currentRole,
      fmtDate
    });
  }

  function renderLPOFilterBanner() {
    const labels = { all: '', outward: 'Outward only', last30: 'Last 30 days' };
    updateFilterLabel('lpo-filter-label', labels[window._lpoFilter || 'all'] || '');
  }

  function renderLPOTable(data) {
    const body = document.getElementById('lpos-body');
    const filtered = ETLDashboard.filterLpos(data || [], window._lpoFilter);
    window._lpoViewData = filtered;
    renderLPOFilterBanner();

    if (!(data || []).length) {
      body.innerHTML = '<div class="empty-state"><div class="icon">📦</div><p>No LPOs recorded yet.</p></div>';
      return;
    }

    if (!filtered.length) {
      body.innerHTML = '<div class="empty-state"><div class="icon">🔗</div><p>No LPO records match the current dashboard filter.</p></div>';
      return;
    }

    body.innerHTML = ETLDashboard.renderLpoTable(filtered, {
      role: currentRole,
      fmtDate
    });
  }

  function showLPO(i, directRecord) {
    const l = directRecord || window._lpoData[i];
    document.getElementById('modal-content').innerHTML = ETLDashboard.renderLpoDetail(l, {
      role: currentRole,
      fmtDate
    });
    document.getElementById('detail-modal').classList.add('open');
  }


  // ─── AUTH SESSION ───
  let SESSION_TOKEN = '';
  let currentRole = '';

  // ─── APPROVALS ───
  async function loadApprovals() {
    document.getElementById('approvals-body').innerHTML = '<div class="loading-state">Loading...</div>';
    try {
      const { quotations: data, lpos } = await ETLDashboardApi.fetchPendingApprovals(SESSION_TOKEN);

      // Update badge count
      const badge = document.getElementById('approval-count-badge');
      const total = data.length + lpos.length;
      if(total > 0) { badge.style.display = ''; badge.innerText = total; }
      else { badge.style.display = 'none'; }

      if(!data.length && !lpos.length) {
        document.getElementById('approvals-body').innerHTML = '<div class="empty-state"><div class="icon">✅</div><p>No pending approvals. All requests have been reviewed.</p></div>';
        return;
      }

      window._approvalData = data;
      const lpoById = new Map((window._lpoData || []).map(record => [record.id, record]));
      lpos.forEach(record => lpoById.set(record.id, record));
      window._lpoData = Array.from(lpoById.values());
      document.getElementById('approvals-body').innerHTML = ETLDashboard.renderApprovals(data, lpos, { fmtDate });
    } catch(e) {
      document.getElementById('approvals-body').innerHTML = '<div class="empty-state"><p>Error: ' + e.message + '</p></div>';
    }
  }

  // ─── OVERRIDE switchTab to include approvals + invoices ───
  function switchTab(tab, btn, options) {
    options = options || {};
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    if (btn) {
      btn.classList.add('active');
    } else {
      const t = document.querySelector(`.tab-btn[data-tab="${tab}"]`);
      if (t) t.classList.add('active');
    }
    document.getElementById('tab-requests').style.display  = tab === 'requests'  ? '' : 'none';
    document.getElementById('tab-lpos').style.display      = tab === 'lpos'      ? '' : 'none';
    document.getElementById('tab-invoices').style.display  = tab === 'invoices'  ? '' : 'none';
    document.getElementById('tab-approvals').style.display = tab === 'approvals' ? '' : 'none';
    if(tab === 'lpos' && !options.skipLpoLoad)      loadLPOs();
    if(tab === 'invoices' && !options.skipInvoiceLoad)  loadInvoiceList();
    if(tab === 'approvals' && !options.skipApprovalsLoad) loadApprovals();
  }

  // ─── KPI card click-through: switch tab with optional filter preset ───
  async function switchTabByName(tab, filter) {
    if (tab === 'requests') {
      switchTab(tab);
      window._reqFilter = filter || 'all';
      await loadRequests();
      const requestsHeader = document.querySelector('#tab-requests .table-header');
      if (requestsHeader) requestsHeader.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    if (tab === 'lpos') {
      switchTab(tab, null, { skipLpoLoad: true });
      window._lpoFilter = filter || 'all';
      await loadLPOs();
      const lpoHeader = document.querySelector('#tab-lpos .table-header');
      if (lpoHeader) lpoHeader.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    if (tab === 'invoices') {
      switchTab(tab, null, { skipInvoiceLoad: true });
      ETLDashboardPayments.setFilter(filter || 'all');
      await loadInvoiceList();
      const invoiceHeader = document.querySelector('#tab-invoices .table-header');
      if (invoiceHeader) invoiceHeader.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    if (tab === 'approvals') {
      switchTab(tab, null, { skipApprovalsLoad: true });
      await loadApprovals();
      const approvalsHeader = document.querySelector('#tab-approvals .table-header');
      if (approvalsHeader) approvalsHeader.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    switchTab(tab);
    const el = document.getElementById('tab-' + tab);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function showRequestById(id) {
    const record = (window._reqData || []).find(r => r.id === id);
    if (record) showRequest(null, null, record);
  }

  function showLPOById(id) {
    const record = (window._lpoData || []).find(l => l.id === id);
    if (record) showLPO(null, record);
  }

  async function loadRequests() {
    document.getElementById('requests-body').innerHTML = '<div class="loading-state">Loading...</div>';
    try {
      const data = await ETLDashboardApi.fetchQuotations(SESSION_TOKEN);

      document.getElementById('stat-total-req').innerText = data.length;
      ETLDashboardApi.fetchPendingLpoIds(SESSION_TOKEN).then(lpoPending => {
        const qPending = data.filter(r => r.status === 'pending_approval' || r.status === 'pending').length;
        document.getElementById('stat-pending').innerText = qPending + (lpoPending.length || 0);
      }).catch(() => {
        document.getElementById('stat-pending').innerText = data.filter(r => r.status === 'pending_approval' || r.status === 'pending').length;
      });

      window._reqData = data;
      renderRequestsTable(data);
    } catch (e) {
      document.getElementById('requests-body').innerHTML = '<div class="empty-state"><p>Error loading data: ' + e.message + '</p></div>';
    }
  }

  async function loadLPOs() {
    document.getElementById('lpos-body').innerHTML = '<div class="loading-state">Loading...</div>';
    try {
      const data = await ETLDashboardApi.fetchLpos(SESSION_TOKEN);

      document.getElementById('stat-total-lpo').innerText = data.length;
      document.getElementById('stat-outward').innerText = data.filter(l => l.direction === 'outward').length;

      window._lpoData = data;
      renderLPOTable(data);
    } catch (e) {
      document.getElementById('lpos-body').innerHTML = '<div class="empty-state"><p>Error loading data: ' + e.message + '</p></div>';
    }
  }

  // ─── UPDATE showRequest to handle approval context ───
  function showRequest(i, context, directRecord) {
    const data = context === 'approval' ? window._approvalData : window._reqData;
    const r = directRecord || (data ? data[i] : window._reqData[i]);
    if(!r) return;
    window._currentRequest = r; // store for modal buttons
    document.getElementById('modal-content').innerHTML = ETLDashboard.renderRequestDetail(r, {
      role: currentRole,
      fmtDate
    });
    document.getElementById('detail-modal').classList.add('open');
  }

  // ─── Bootstrap: Supabase Auth ───
  async function load30DayStats() {
    // ISO cutoff 30 days ago (UTC midnight-ish is fine for PostgREST gte)
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const countFetch = async (table, extra = '') => {
      try {
        const rows = await ETLDashboardApi.fetchRecentCount(table, since, SESSION_TOKEN, extra);
        return rows.length;
      } catch { return null; }
    };

    // Requests & LPOs: simple counts
    const [reqCount, lpoCount] = await Promise.all([
      countFetch('quotations'),
      countFetch('lpos'),
    ]);
    document.getElementById('stat-30-req').innerText = reqCount ?? '—';
    document.getElementById('stat-30-lpo').innerText = lpoCount ?? '—';

    // Invoices: need the `total` column too, so do a full fetch for 30 days
    try {
      const rows = await ETLDashboardApi.fetchRecentInvoiceTotals(since, SESSION_TOKEN);
      const count = rows.length;
      const sum = rows.reduce((s, row) => s + (Number(row.total) || 0), 0);
      document.getElementById('stat-30-inv').innerText = count;
      document.getElementById('stat-30-amount').innerText = ETLDashboard.fmtShort(sum);
    } catch {
      document.getElementById('stat-30-inv').innerText = '—';
      document.getElementById('stat-30-amount').innerText = '—';
    }
  }

  function initClickableKpis() {
    document.querySelectorAll('.stat-card.clickable').forEach(card => {
      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'button');
      if (!card.getAttribute('aria-label')) {
        const label = card.querySelector('.stat-label')?.innerText?.trim();
        const title = card.getAttribute('title');
        card.setAttribute('aria-label', title || label || 'Open dashboard section');
      }
      if (card.dataset.kpiReady === '1') return;
      card.dataset.kpiReady = '1';
      card.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          card.click();
        }
      });
    });
  }

  initClickableKpis();
  ETLDashboardActions.init({
    getSessionToken: () => SESSION_TOKEN,
    getCurrentRole: () => currentRole,
    loadRequests,
    loadLPOs,
    loadApprovals
  });
  ETLDashboardPayments.init({ getSessionToken: () => SESSION_TOKEN });
  etlAuth.init({ forceLogin: true }).then(async () => {
    const profile = await etlAuth.getProfile();
    const user    = await etlAuth.getUser();

    // Pull the live session token for REST Authorization headers
    const { data: { session } } = await etlAuth.getClient().auth.getSession();
    SESSION_TOKEN = session ? session.access_token : '';

    currentRole = (profile && profile.role) || 'staff';

    // Reveal the UI
    document.getElementById('top-nav').style.display = '';
    document.getElementById('dash-wrap').style.display = '';
    document.getElementById('logout-btn').style.display = '';
    document.querySelector('.top-nav-sub').innerText =
      currentRole === 'management' ? 'Management Access' : 'Staff Access';

    if (currentRole === 'management') {
      document.getElementById('approvals-tab-btn').style.display = '';
    }

    loadRequests();
    loadLPOs();
    load30DayStats();
    loadReceivables();
    if (currentRole === 'management') loadApprovals();
  });
