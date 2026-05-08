// Dashboard page controller extracted from ETL-Dashboard.html.
const { SUPABASE_URL, SITE_BASE_URL, DASHBOARD_URL } = window.ETLConfig;
  
  // ─── Brevo Email Helper ───
  async function sendEmail(to, subject, body) {
    const result = await ETLEmail.send(to, subject, body, {
      flow: 'internal_ops',
      context: 'dashboard'
    });
    return result.ok;
  }

const SUPABASE_KEY = window.ETLConfig.SUPABASE_ANON_KEY;

  function fmtDate(d) {
    if(!d) return '—';
    return new Date(d).toLocaleDateString('en-GB', {day:'numeric', month:'short', year:'numeric'});
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


  function copyLink(uniqueLink) {
    const url = SITE_BASE_URL + '/ETL-LPO-View.html?lpo=' + uniqueLink;
    prompt('✅ LPO link ready!\n\nShare this link with the supplier so they can view their LPO:', url);
  }

  async function updateLPOStatus(id, status) {
    try {
      await ETLDashboardApi.updateLpo(id, { status }, SESSION_TOKEN);
        const badge = document.getElementById(`lpo-status-${id}`);
        if(badge) {
          const labels = {
            active:'📋 Active', issued:'📤 Issued', delivered:'✅ Delivered',
            paid:'💰 Paid', disputed:'⚠️ Disputed', closed:'🔒 Closed'
          };
          badge.className = `badge badge-lpo-${status}`;
          badge.innerText = labels[status] || status;
        }
        // Update stats
        loadLPOs();
    } catch(e) {
      alert('Network error: ' + e.message);
    }
  }

  async function updateStatus(id, status) {
    try {
      await ETLDashboardApi.updateQuotation(id, { status }, SESSION_TOKEN);
        // Update badge
        const badge = document.getElementById(`req-badge-${id}`);
        if(badge) {
          const labels = { pending_approval:'⏳ Pending Approval', approved:'✅ Approved', in_progress:'🔄 In Progress', responded:'📤 Responded', rejected:'❌ Rejected', closed:'🔒 Closed' };
          badge.className = `badge badge-${status}`;
          badge.innerText = labels[status] || status;
        }
        // If status changed to approved, notify ETL staff
        if(status === 'approved') {
          const r = window._reqData && window._reqData.find(x => x.id === id);
          const name    = r ? r.client_name    : 'Client';
          const email   = r ? r.client_email   : '';
          const project = r ? r.project_title  : 'Project';
          // Notify ETL staff
          const emailSent = await sendEmail('tokui@usiu.ac.ke', `✅ Action Required: Generate Quotation — ${name} | ${project}`, `A quotation request has been approved and is ready for you to generate.\n\nCLIENT DETAILS:\nName: ${name}\nEmail: ${email}\nProject: ${project}\n\nLog in to the ETL Dashboard and click Generate Quotation to proceed.\n\nDashboard: ${DASHBOARD_URL}`);
          if (!emailSent) console.warn('Quotation approval saved, but staff notification email could not be sent.');

        }
        // Reload to reflect new button states
        loadRequests();
    } catch(e) {
      alert('Network error: ' + e.message);
    }
  }

  function openGeneratorFromModal() {
    openGenerator(null, window._currentRequest);
  }

  function openGenerator(i, directRecord) {
    // If called from a request row, pass the data via URL params
    const r = directRecord || (i !== undefined && i !== null && window._reqData) ? (directRecord || window._reqData[i]) : null;
    if(r) {
      const params = new URLSearchParams({
        client_name:    r.client_name    || '',
        contact_person: r.contact_person || '',
        client_email:   r.client_email   || '',
        client_phone:   r.client_phone   || '',
        client_address: r.client_address || '',
        project_title:  r.project_title  || '',
        project_location: r.project_location || '',
        project_description: r.project_description || '',
        services_category:   r.services_category   || '',
        project_duration:    r.project_duration     || '',
        ref_id: r.id || ''
      });
      window.open('ETL-Quotation-generator.html?' + params.toString(), '_blank');
    } else {
      window.open('ETL-Quotation-generator.html', '_blank');
    }
  }

  function closeModal() {
    document.getElementById('detail-modal').classList.remove('open');
  }

  function blockActionUntilApproval(actionName) {
    if(currentRole === 'staff') {
      alert(`⏳ ${actionName} is not available until the LPO is approved by Management.\n\nPlease ask your manager to review and approve this LPO first.`);
      return false;
    }
    return true;
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

  async function rejectLPO(id) {
    const reason = prompt('Enter rejection reason (optional):');
    if(reason === null) return;
    try {
      await ETLDashboardApi.updateLpo(id, { status: 'rejected', notes: reason || 'Rejected by management' }, SESSION_TOKEN);
      alert('LPO has been rejected.');
      loadApprovals();
      loadLPOs();
    } catch(e) { alert('Error: ' + e.message); }
  }

  async function approveLPO(id) {
    if(!confirm('Approve this LPO?')) return;
    try {
      await ETLDashboardApi.updateLpo(id, { status: 'approved' }, SESSION_TOKEN);
      alert('LPO approved successfully!');
      loadApprovals();
      loadLPOs();
    } catch(e) { alert('Error: ' + e.message); }
  }

  function doApprove(i) {
    const r = window._approvalData[i];
    approveRequest(r.id, r.client_email, r.client_name, r.project_title);
  }
  function doReject(i) {
    const r = window._approvalData[i];
    rejectRequest(r.id, r.client_email, r.client_name, r.project_title);
  }
  function doApproveById(id, email, name, project) {
    approveRequest(id, email, name, project);
    closeModal();
  }
  function doRejectById(id, email, name, project) {
    rejectRequest(id, email, name, project);
    closeModal();
  }

  async function approveRequest(id, email, name, project) {
    if(!confirm(`Approve quotation request from ${name} for ${project}?`)) return;
    const approver = currentRole === 'management' ? 'Management' : 'ETL Staff';
    try {
      await ETLDashboardApi.updateQuotation(id, { status: 'approved', approved_by: approver, approved_at: new Date().toISOString() }, SESSION_TOKEN);

      // Email 1 → ETL Staff: Action required + confirmation
      const emailSent = await sendEmail('tokui@usiu.ac.ke', `✅ Action Required: Generate Quotation — ${name} | ${project}`, `A quotation request has been approved by ${approver} and is ready for you to generate.

CLIENT DETAILS:
Name: ${name}
Email: ${email}
Project: ${project}

Please log in to the ETL Dashboard and click Generate Quotation to proceed.\n\nDashboard: ${DASHBOARD_URL}`);
      if (!emailSent) console.warn('Quotation approval saved, but staff notification email could not be sent.');

      alert(emailSent ? '✅ Request approved! ETL staff have been notified to generate the quotation.' : '✅ Request approved! Email notification could not be sent automatically.');
      loadApprovals();
      loadRequests();
    } catch(e) { alert('Could not update: ' + e.message); }
  }

  async function rejectRequest(id, email, name, project) {
    const reason = prompt(`Enter reason for rejecting ${name}'s request (this will be sent to the client):`);
    if(!reason) return;
    try {
      await ETLDashboardApi.updateQuotation(id, { status: 'rejected', rejection_reason: reason, approved_by: 'Management' }, SESSION_TOKEN);
      // Notify client via EmailJS
      const emailSent = await sendEmail(email, `Re: Your Quotation Request — ${project}`, `Dear ${name},

Thank you for reaching out to Engineering Trade Links Co. Ltd.

After reviewing your quotation request for "${project}", we regret that we are unable to proceed at this time.

Reason: ${reason}

We encourage you to reach out again in the future. We appreciate your interest in our services.

Kind regards,
Engineering Trade Links Co. Ltd
+256 776 566 522
tradelinks.ltd@gmail.com`);
      if (!emailSent) console.warn('Quotation rejected, but client email could not be sent.');
      alert(emailSent ? 'Request rejected and client has been notified by email.' : 'Request rejected, but the client email could not be sent automatically.');
      loadApprovals();
      loadRequests();
    } catch(e) { alert('Could not update: ' + e.message); }
  }

  // ─── STOCK CHECK ───
  async function checkStock(i, directRecord) {
    const l = directRecord || window._lpoData[i];
    if(!l.items || !l.items.length) { alert('No items found in this LPO to check against inventory.'); return; }

    const inventory = await ETLDashboardApi.fetchInventoryStock(SESSION_TOKEN);
    document.getElementById('modal-content').innerHTML = ETLDashboard.renderStockCheck(l, inventory);
    document.getElementById('detail-modal').classList.add('open');
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
      const sel = document.getElementById('inv-list-filter');
      const lab = document.getElementById('inv-filter-label');
      const labels = {
        all: '',
        outstanding: 'Outstanding only',
        overdue: 'Overdue only',
        aged90: 'Aged 90+ days',
        last30: 'Last 30 days',
        last90: 'Last 90 days',
        last365: 'Last 12 months'
      };
      if (sel) {
        sel.value = filter || 'all';
        INV_FILTER = sel.value;
      }
      if (lab) {
        if (labels[INV_FILTER]) { lab.style.display = ''; lab.innerText = '• ' + labels[INV_FILTER]; }
        else { lab.style.display = 'none'; lab.innerText = ''; }
      }
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

  function openGeneratorById(id) {
    const record = (window._reqData || []).find(r => r.id === id);
    if (record) openGenerator(null, record);
  }

  function showLPOById(id) {
    const record = (window._lpoData || []).find(l => l.id === id);
    if (record) showLPO(null, record);
  }

  function checkStockById(id) {
    const record = (window._lpoData || []).find(l => l.id === id);
    if (record) checkStock(null, record);
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

  // ─── INVOICE LIST + PAYMENT TRACKING ───
  let INVOICES_CACHE = [];
  let INV_FILTER = 'all';
  let PAYMENT_MODAL_INVOICE_ID = null;

  function onInvFilterChange() {
    INV_FILTER = document.getElementById('inv-list-filter').value;
    const labels = {
      all: '',
      outstanding: 'Outstanding only',
      overdue: 'Overdue only',
      aged90: 'Aged 90+ days',
      last30: 'Last 30 days',
      last90: 'Last 90 days',
      last365: 'Last 12 months'
    };
    const lab = document.getElementById('inv-filter-label');
    if (lab) {
      if (labels[INV_FILTER]) { lab.style.display = ''; lab.innerText = '• ' + labels[INV_FILTER]; }
      else { lab.style.display = 'none'; lab.innerText = ''; }
    }
    renderInvoiceList();
  }

  async function loadInvoiceList() {
    const body = document.getElementById('inv-list-body');
    if (!body) return;
    body.innerHTML = '<div class="loading-state">Loading invoices…</div>';
    try {
      INVOICES_CACHE = await ETLDashboardApi.fetchInvoicesWithPayments(SESSION_TOKEN);
      renderInvoiceList();
    } catch (e) {
      body.innerHTML = `<div class="inv-list-empty">Could not load invoices: ${e.message}</div>`;
    }
  }

  function invoiceStatus(inv) {
    return ETLDashboard.invoiceStatus(inv);
  }

  function fmtShort(n) {
    return ETLDashboard.fmtShort(n);
  }

  function renderInvoiceList() {
    const body = document.getElementById('inv-list-body');
    if (!body) return;
    const q = (document.getElementById('inv-list-search').value || '').trim().toLowerCase();
    INV_FILTER = document.getElementById('inv-list-filter').value;
    body.innerHTML = ETLDashboard.renderInvoiceTable(INVOICES_CACHE, { filter: INV_FILTER, search: q });
  }

  function openPaymentModal(invoiceId) {
    const inv = INVOICES_CACHE.find(i => i.id === invoiceId);
    if (!inv) return;
    const s = invoiceStatus(inv);
    PAYMENT_MODAL_INVOICE_ID = invoiceId;
    document.getElementById('pm-summary').innerHTML = ETLDashboard.renderPaymentSummary(inv);
    document.getElementById('pm-amount').value = '';
    document.getElementById('pm-amount').setAttribute('max', s.balance);
    document.getElementById('pm-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('pm-note').value = '';
    document.getElementById('payment-modal').classList.add('show');
    setTimeout(() => document.getElementById('pm-amount').focus(), 50);
  }

  function closePaymentModal() {
    document.getElementById('payment-modal').classList.remove('show');
    PAYMENT_MODAL_INVOICE_ID = null;
  }

  async function recordPayment() {
    if (!PAYMENT_MODAL_INVOICE_ID) return;
    const amount = parseFloat(document.getElementById('pm-amount').value);
    const payDate = document.getElementById('pm-date').value;
    const note = document.getElementById('pm-note').value.trim();
    if (!amount || amount <= 0) { alert('Enter a positive amount.'); return; }
    if (!payDate) { alert('Enter a payment date.'); return; }
    const invoice = INVOICES_CACHE.find(inv => inv.id === PAYMENT_MODAL_INVOICE_ID);
    if (invoice) {
      const status = invoiceStatus(invoice);
      if (amount > status.balance + 0.009) {
        alert('Payment exceeds the remaining balance of ' + ETLUtils.fmtMoney(status.balance) + '.');
        return;
      }
    }
    try {
      await ETLDashboardApi.createInvoicePayment({
        invoice_id: PAYMENT_MODAL_INVOICE_ID,
        amount,
        payment_date: payDate,
        note: note || null
      }, SESSION_TOKEN);
      closePaymentModal();
      await loadInvoiceList();
      await loadReceivables();
    } catch (e) {
      alert('Could not save payment: ' + e.message);
    }
  }

  function openHistoryModal(invoiceId) {
    const inv = INVOICES_CACHE.find(i => i.id === invoiceId);
    if (!inv) return;
    document.getElementById('hm-title').innerText = ETLDashboard.renderPaymentHistoryTitle(inv);
    document.getElementById('hm-body').innerHTML = ETLDashboard.renderPaymentHistory(inv);
    document.getElementById('history-modal').classList.add('show');
  }

  function closeHistoryModal() {
    document.getElementById('history-modal').classList.remove('show');
  }

  // Close payment/history modals when clicking backdrop
  document.addEventListener('click', (e) => {
    if (e.target.classList && e.target.classList.contains('modal-backdrop')) {
      e.target.classList.remove('show');
    }
  });

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

  // ─── Receivables (outstanding + overdue + aging) ───
  async function loadReceivables() {
    const ids = ['stat-outstanding','stat-overdue-count','stat-overdue-amount','stat-aging-90'];
    const setAll = v => ids.forEach(id => document.getElementById(id).innerText = v);
    try {
      const rows = await ETLDashboardApi.fetchReceivableInvoices(SESSION_TOKEN);
      const totals = ETLDashboard.summarizeReceivables(rows);
      document.getElementById('stat-outstanding').innerText    = ETLDashboard.fmtShort(totals.outstanding);
      document.getElementById('stat-overdue-count').innerText  = totals.overdueCount;
      document.getElementById('stat-overdue-amount').innerText = ETLDashboard.fmtShort(totals.overdueAmount);
      document.getElementById('stat-aging-90').innerText       = ETLDashboard.fmtShort(totals.aging90);
    } catch {
      setAll('—');
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
