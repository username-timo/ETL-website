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

  function invoiceStatus(invoice) {
    const paid = (invoice.invoice_payments || []).reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const total = Number(invoice.total) || 0;
    const balance = Math.max(0, total - paid);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = invoice.due_date ? new Date(invoice.due_date) : null;
    const daysOverdue = due && due < today ? Math.floor((today - due) / 86400000) : 0;
    let state;
    if (total - paid <= 0.009) state = 'paid';
    else if (paid > 0) state = due && due < today ? 'overdue' : 'partial';
    else state = due && due < today ? 'overdue' : 'unpaid';
    return { paid, balance, state, daysOverdue };
  }

  function fmtShort(value) {
    const n = Number(value) || 0;
    if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
    return Math.round(n).toLocaleString();
  }

  function formatShortDate(value) {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
  }

  function formatLongDate(value) {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function fmtMoney(value) {
    return 'UGX ' + Math.round(Number(value) || 0).toLocaleString();
  }

  function requestRowClass(record) {
    if (record.status === 'approved') return 'row-approved';
    if (record.status === 'pending_approval' || record.status === 'pending') return 'row-pending';
    return '';
  }

  function lpoRowClass(record) {
    if (record.status === 'approved') return 'row-approved';
    if (record.status === 'pending_approval') return 'row-pending';
    return '';
  }

  function renderRequestAction(record) {
    const id = escapeJs(record.id);
    if (record.status === 'pending_approval') {
      return '<span style="font-size:11px;color:var(--warning);font-weight:700;">⏳ Awaiting Approval</span>';
    }
    if (record.status === 'rejected') {
      return '<span style="font-size:11px;color:var(--danger);font-weight:700;">❌ Rejected</span>';
    }
    return `<button class="action-btn gold" onclick="openGeneratorById('${id}')">📋 Generate Quotation</button>`;
  }

  function renderRequestStatusSelect(record, role) {
    const mg = role === 'management';
    const status = record.status;
    return `<select class="status-select" onchange="updateStatus('${escapeJs(record.id)}', this.value)">
      ${mg ? `<option value="pending_approval" ${selected(status, 'pending_approval')}>⏳ Pending Approval</option><option value="approved" ${selected(status, 'approved')}>✅ Approved</option>` : ''}
      <option value="in_progress" ${selected(status, 'in_progress')}>🔄 In Progress</option>
      <option value="responded" ${selected(status, 'responded')}>📤 Responded</option>
      ${mg ? `<option value="rejected" ${selected(status, 'rejected')}>❌ Rejected</option>` : ''}
      <option value="closed" ${selected(status, 'closed')}>🔒 Closed</option>
    </select>`;
  }

  function renderRequestRows(records, options) {
    const opts = options || {};
    const role = opts.role || '';
    const fmtDate = opts.fmtDate || function (value) { return value || '—'; };
    return records.map((record) => {
      const id = escapeJs(record.id);
      const statusClass = safeClass(record.status);
      return `
        <tr data-id="${escapeHtml(record.id)}" class="${requestRowClass(record)}">
          <td><strong>${escapeHtml(record.client_name || '—')}</strong></td>
          <td>${escapeHtml(record.contact_person || '—')}</td>
          <td>${escapeHtml(record.project_title || '—')}</td>
          <td>${escapeHtml(record.client_email || '—')}</td>
          <td>${fmtDate(record.created_at)}</td>
          <td><span class="badge badge-${statusClass}" id="req-badge-${escapeHtml(record.id)}">${escapeHtml(record.status || '—')}</span></td>
          <td>
            <button class="action-btn" onclick="showRequestById('${id}')">View</button>
            ${renderRequestAction(record)}
            ${renderRequestStatusSelect(record, role)}
          </td>
        </tr>`;
    }).join('');
  }

  function renderRequestTable(records, options) {
    return `
      <table>
        <thead><tr>
          <th>Organisation</th><th>Contact</th><th>Project</th>
          <th>Email</th><th>Date</th><th>Status</th><th>Actions</th>
        </tr></thead>
        <tbody>${renderRequestRows(records, options)}</tbody>
      </table>`;
  }

  function renderLpoStatusSelect(record, role) {
    const mg = role === 'management';
    const status = record.status;
    const isApproved = status === 'approved';
    const disabled = !isApproved && !mg;
    const disabledStyle = disabled ? 'opacity:0.5;cursor:not-allowed;' : '';
    return `<select class="status-select" onchange="updateLPOStatus('${escapeJs(record.id)}', this.value)" ${disabled ? 'disabled' : ''} style="${disabledStyle}">
      ${mg ? `<option value="pending_approval" ${selected(status, 'pending_approval')}>⏳ Pending Approval</option><option value="approved" ${selected(status, 'approved')}>✅ Approved</option>` : ''}
      <option value="active" ${selected(status, 'active')} ${disabledOption(isApproved)}>📋 Active</option>
      <option value="issued" ${selected(status, 'issued')} ${disabledOption(isApproved)}>📤 Issued</option>
      <option value="delivered" ${selected(status, 'delivered')} ${disabledOption(isApproved)}>✅ Delivered</option>
      <option value="paid" ${selected(status, 'paid')} ${disabledOption(isApproved)}>💰 Paid</option>
      <option value="disputed" ${selected(status, 'disputed')} ${disabledOption(isApproved)}>⚠️ Disputed</option>
      <option value="closed" ${selected(status, 'closed')} ${disabledOption(isApproved)}>🔒 Closed</option>
    </select>`;
  }

  function renderLpoActions(record) {
    const id = escapeJs(record.id);
    const waiting = record.status === 'approved'
      ? ''
      : '<span style="font-size:11px;color:var(--gold);font-weight:700;">⏳ Awaiting Approval</span>';
    const copy = record.status === 'approved' && record.direction === 'outward' && record.unique_link
      ? `<button class="action-btn gold" onclick="copyLink('${escapeJs(record.unique_link)}')">Copy Link</button>`
      : '';
    const stock = record.status === 'approved' && record.direction === 'inward'
      ? `<button class="action-btn" onclick="checkStockById('${id}')" style="background:var(--light-bg);color:var(--secondary);border-color:var(--secondary)">📦 Check Stock</button>`
      : '';
    return `<button class="action-btn" onclick="showLPOById('${id}')">View</button>${waiting}${copy}${stock}`;
  }

  function renderLpoRows(records, options) {
    const opts = options || {};
    const role = opts.role || '';
    const fmtDate = opts.fmtDate || function (value) { return value || '—'; };
    return records.map((record) => {
      const statusClass = safeClass(record.status);
      const directionClass = safeClass(record.direction);
      return `
        <tr data-lpo-id="${escapeHtml(record.id)}" class="${lpoRowClass(record)}">
          <td><strong>${escapeHtml(record.lpo_number || '—')}</strong></td>
          <td>${escapeHtml(record.entity_name || '—')}</td>
          <td><span class="badge badge-${directionClass}">${escapeHtml(record.direction || '—')}</span></td>
          <td>${escapeHtml(record.entity_email || '—')}</td>
          <td>${fmtTotal(record.total)}</td>
          <td>${fmtDate(record.created_at)}</td>
          <td><span class="badge badge-lpo-${statusClass}" id="lpo-status-${escapeHtml(record.id)}">${escapeHtml(record.status || '—')}</span></td>
          <td><div class="lpo-actions">
            ${renderLpoActions(record)}
            ${renderLpoStatusSelect(record, role)}
          </div></td>
        </tr>`;
    }).join('');
  }

  function renderLpoTable(records, options) {
    return `
      <table>
        <thead><tr>
          <th>LPO Number</th><th>Entity</th><th>Direction</th>
          <th>Email</th><th>Total</th><th>Date</th><th>Status</th><th>Actions</th>
        </tr></thead>
        <tbody>${renderLpoRows(records, options)}</tbody>
      </table>`;
  }

  function filterInvoices(records, options) {
    const opts = options || {};
    const filter = opts.filter || 'all';
    const search = String(opts.search || '').trim().toLowerCase();
    const now = Date.now();
    return records.filter((invoice) => {
      if (filter === 'last30' && new Date(invoice.created_at).getTime() < now - 30 * 86400000) return false;
      if (filter === 'last90' && new Date(invoice.created_at).getTime() < now - 90 * 86400000) return false;
      if (filter === 'last365' && new Date(invoice.created_at).getTime() < now - 365 * 86400000) return false;

      const status = invoiceStatus(invoice);
      if (filter === 'outstanding' && status.balance <= 0.009) return false;
      if (filter === 'overdue' && status.state !== 'overdue') return false;
      if (filter === 'aged90' && !(status.state === 'overdue' && status.daysOverdue > 90)) return false;

      if (search) {
        const haystack = `${invoice.invoice_number || ''} ${invoice.client_name || ''}`.toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      return true;
    });
  }

  function renderInvoiceRows(records) {
    const badgeMap = { paid: 'badge-paid', partial: 'badge-partial', unpaid: 'badge-unpaid', overdue: 'badge-overdue' };
    const labelMap = { paid: 'Paid', partial: 'Partial', unpaid: 'Unpaid', overdue: 'Overdue' };
    return records.map((invoice) => {
      const status = invoiceStatus(invoice);
      const payCount = (invoice.invoice_payments || []).length;
      const viewUrl = invoice.unique_link ? `/ETL-Invoice-View.html?inv=${encodeURIComponent(invoice.unique_link)}` : '';
      const rowOnClick = viewUrl ? `onclick="window.open('${escapeJs(viewUrl)}','_blank')"` : '';
      return `
        <tr class="inv-row" ${rowOnClick} title="${viewUrl ? 'Click to open invoice view' : ''}">
          <td><strong>${escapeHtml(invoice.invoice_number || '—')}</strong></td>
          <td>${escapeHtml(invoice.client_name || '—')}</td>
          <td class="num">${fmtShort(invoice.total)}</td>
          <td class="num">${fmtShort(status.paid)}</td>
          <td class="num"><strong>${fmtShort(status.balance)}</strong></td>
          <td>${formatShortDate(invoice.due_date)}</td>
          <td><span class="badge ${badgeMap[status.state]}">${labelMap[status.state]}</span></td>
          <td style="white-space:nowrap;" onclick="event.stopPropagation()">
            ${status.state !== 'paid' ? `<button class="btn-sm btn-sm-primary" onclick="openPaymentModal('${escapeJs(invoice.id)}')">+ Pay</button>` : ''}
            ${payCount > 0 ? `<button class="btn-sm btn-sm-secondary" onclick="openHistoryModal('${escapeJs(invoice.id)}')" style="margin-left:4px;">${payCount} ${payCount === 1 ? 'Payment' : 'Payments'}</button>` : ''}
          </td>
        </tr>`;
    }).join('');
  }

  function renderInvoiceTable(records, options) {
    const rows = filterInvoices(records, options);
    if (rows.length === 0) {
      return '<div class="empty-state"><div class="icon">🧾</div><p>No invoices match the current filter.</p></div>';
    }
    return `
      <table class="inv-list-table">
        <thead>
          <tr>
            <th>Invoice #</th>
            <th>Client</th>
            <th class="num">Total (UGX)</th>
            <th class="num">Paid (UGX)</th>
            <th class="num">Balance (UGX)</th>
            <th>Due</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>${renderInvoiceRows(rows)}</tbody>
      </table>`;
  }

  function renderPaymentSummary(invoice) {
    const status = invoiceStatus(invoice);
    return `
      <div><strong>${escapeHtml(invoice.invoice_number || '')}</strong> - ${escapeHtml(invoice.client_name || '')}</div>
      <div>Total: ${fmtMoney(invoice.total)} &middot; Paid: ${fmtMoney(status.paid)} &middot; <strong>Balance: ${fmtMoney(status.balance)}</strong></div>`;
  }

  function renderPaymentHistoryTitle(invoice) {
    return `Payments - ${invoice.invoice_number || ''}`;
  }

  function renderPaymentHistory(invoice) {
    const payments = [...(invoice.invoice_payments || [])].sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date));
    const total = Number(invoice.total) || 0;
    const paid = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const balance = Math.max(0, total - paid);
    const paymentRows = payments.length === 0
      ? '<div class="inv-list-empty">No payments recorded yet.</div>'
      : `<ul class="payment-history">${payments.map((payment) => `
          <li>
            <div style="flex:1;">
              <div class="ph-date">${formatLongDate(payment.payment_date)}</div>
              ${payment.note ? `<div class="ph-note">${escapeHtml(payment.note)}</div>` : ''}
              <div class="ph-meta">Recorded ${formatLongDate(payment.created_at)}</div>
            </div>
            <div class="ph-amount">${fmtMoney(payment.amount)}</div>
          </li>`).join('')}</ul>`;

    return `
      <div class="pm-summary">
        <div><strong>${escapeHtml(invoice.client_name || '')}</strong></div>
        <div>Total: ${fmtMoney(total)} &middot; Paid: ${fmtMoney(paid)} &middot; Balance: ${fmtMoney(balance)}</div>
      </div>
      ${paymentRows}`;
  }

  function summarizeReceivables(invoices) {
    return invoices.reduce((summary, invoice) => {
      const status = invoiceStatus(invoice);
      if (status.balance <= 0.009) return summary;
      summary.outstanding += status.balance;
      if (status.state === 'overdue') {
        summary.overdueCount += 1;
        summary.overdueAmount += status.balance;
        if (status.daysOverdue > 90) summary.aging90 += status.balance;
      }
      return summary;
    }, { outstanding: 0, overdueCount: 0, overdueAmount: 0, aging90: 0 });
  }

  window.ETLDashboard = {
    renderRequestTable,
    renderLpoTable,
    renderInvoiceTable,
    renderPaymentSummary,
    renderPaymentHistoryTitle,
    renderPaymentHistory,
    summarizeReceivables,
    invoiceStatus,
    fmtShort
  };
})();
