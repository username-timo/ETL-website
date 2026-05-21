(function () {
  let invoicesCache = [];
  let invoiceFilter = 'all';
  let paymentModalInvoiceId = null;
  let getSessionToken = () => '';
  let backdropListenerReady = false;

  const invoiceFilterLabels = {
    all: '',
    outstanding: 'Outstanding only',
    overdue: 'Overdue only',
    aged90: 'Aged 90+ days',
    last30: 'Last 30 days',
    last90: 'Last 90 days',
    last365: 'Last 12 months'
  };

  function sessionToken() {
    return typeof getSessionToken === 'function' ? getSessionToken() : '';
  }

  function setInvoiceFilterLabel() {
    const lab = document.getElementById('inv-filter-label');
    if (!lab) return;
    const label = invoiceFilterLabels[invoiceFilter] || '';
    if (label) {
      lab.style.display = '';
      lab.innerText = '• ' + label;
    } else {
      lab.style.display = 'none';
      lab.innerText = '';
    }
  }

  function setFilter(filter) {
    invoiceFilter = filter || 'all';
    const sel = document.getElementById('inv-list-filter');
    if (sel) sel.value = invoiceFilter;
    setInvoiceFilterLabel();
  }

  function onInvFilterChange() {
    const sel = document.getElementById('inv-list-filter');
    invoiceFilter = sel ? sel.value : 'all';
    setInvoiceFilterLabel();
    renderInvoiceList();
  }

  async function loadInvoiceList() {
    const body = document.getElementById('inv-list-body');
    if (!body) return;
    body.innerHTML = '<div class="loading-state">Loading invoices…</div>';
    try {
      invoicesCache = await ETLDashboardApi.fetchInvoicesWithPayments(sessionToken());
      renderInvoiceList();
    } catch (e) {
      body.innerHTML = `<div class="inv-list-empty">Could not load invoices: ${ETLDashboard.escapeHtml(e.message)}</div>`;
    }
  }

  function invoiceStatus(invoice) {
    return ETLDashboard.invoiceStatus(invoice);
  }

  function renderInvoiceList() {
    const body = document.getElementById('inv-list-body');
    if (!body) return;
    const q = (document.getElementById('inv-list-search')?.value || '').trim().toLowerCase();
    const sel = document.getElementById('inv-list-filter');
    invoiceFilter = sel ? sel.value : invoiceFilter;
    body.innerHTML = ETLDashboard.renderInvoiceTable(invoicesCache, { filter: invoiceFilter, search: q });
  }

  function openPaymentModal(invoiceId) {
    const inv = invoicesCache.find(i => i.id === invoiceId);
    if (!inv) return;
    const status = invoiceStatus(inv);
    paymentModalInvoiceId = invoiceId;
    document.getElementById('pm-summary').innerHTML = ETLDashboard.renderPaymentSummary(inv);
    document.getElementById('pm-amount').value = '';
    document.getElementById('pm-amount').setAttribute('max', status.balance);
    document.getElementById('pm-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('pm-note').value = '';
    document.getElementById('payment-modal').classList.add('show');
    setTimeout(() => document.getElementById('pm-amount').focus(), 50);
  }

  function closePaymentModal() {
    document.getElementById('payment-modal').classList.remove('show');
    paymentModalInvoiceId = null;
  }

  async function recordPayment() {
    if (!paymentModalInvoiceId) return;
    const amount = parseFloat(document.getElementById('pm-amount').value);
    const payDate = document.getElementById('pm-date').value;
    const note = document.getElementById('pm-note').value.trim();
    if (!amount || amount <= 0) { alert('Enter a positive amount.'); return; }
    if (!payDate) { alert('Enter a payment date.'); return; }
    const invoice = invoicesCache.find(inv => inv.id === paymentModalInvoiceId);
    if (invoice) {
      const status = invoiceStatus(invoice);
      if (amount > status.balance + 0.009) {
        alert('Payment exceeds the remaining balance of ' + ETLUtils.fmtMoney(status.balance) + '.');
        return;
      }
    }
    try {
      await ETLDashboardApi.createInvoicePayment({
        invoice_id: paymentModalInvoiceId,
        amount,
        payment_date: payDate,
        note: note || null
      }, sessionToken());
      closePaymentModal();
      await loadInvoiceList();
      await loadReceivables();
    } catch (e) {
      alert('Could not save payment: ' + e.message);
    }
  }

  function openHistoryModal(invoiceId) {
    const inv = invoicesCache.find(i => i.id === invoiceId);
    if (!inv) return;
    document.getElementById('hm-title').innerText = ETLDashboard.renderPaymentHistoryTitle(inv);
    document.getElementById('hm-body').innerHTML = ETLDashboard.renderPaymentHistory(inv);
    document.getElementById('history-modal').classList.add('show');
  }

  function closeHistoryModal() {
    document.getElementById('history-modal').classList.remove('show');
  }

  async function loadReceivables() {
    const ids = ['stat-outstanding', 'stat-overdue-count', 'stat-overdue-amount', 'stat-aging-90'];
    const setAll = value => ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerText = value;
    });
    try {
      const rows = await ETLDashboardApi.fetchReceivableInvoices(sessionToken());
      const totals = ETLDashboard.summarizeReceivables(rows);
      document.getElementById('stat-outstanding').innerText = ETLDashboard.fmtShort(totals.outstanding);
      document.getElementById('stat-overdue-count').innerText = totals.overdueCount;
      document.getElementById('stat-overdue-amount').innerText = ETLDashboard.fmtShort(totals.overdueAmount);
      document.getElementById('stat-aging-90').innerText = ETLDashboard.fmtShort(totals.aging90);
    } catch {
      setAll('—');
    }
  }

  function bindBackdropClose() {
    if (backdropListenerReady) return;
    backdropListenerReady = true;
    document.addEventListener('click', (e) => {
      if (e.target.classList && e.target.classList.contains('modal-backdrop')) {
        e.target.classList.remove('show');
      }
    });
  }

  function init(options) {
    getSessionToken = options && options.getSessionToken ? options.getSessionToken : getSessionToken;
    bindBackdropClose();
  }

  window.ETLDashboardPayments = {
    init,
    setFilter,
    loadInvoiceList,
    loadReceivables,
    renderInvoiceList,
    onInvFilterChange,
    openPaymentModal,
    closePaymentModal,
    recordPayment,
    openHistoryModal,
    closeHistoryModal
  };

  window.loadInvoiceList = loadInvoiceList;
  window.loadReceivables = loadReceivables;
  window.renderInvoiceList = renderInvoiceList;
  window.onInvFilterChange = onInvFilterChange;
  window.openPaymentModal = openPaymentModal;
  window.closePaymentModal = closePaymentModal;
  window.recordPayment = recordPayment;
  window.openHistoryModal = openHistoryModal;
  window.closeHistoryModal = closeHistoryModal;
})();
