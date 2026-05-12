(function () {
  const D = window.ETLDashboard || {};
  const {
    escapeHtml,
    escapeJs,
    fmtMoney,
    fmtShort,
    formatShortDate,
    formatLongDate
  } = D;

  const invoiceBadgeClass = {
    paid: 'badge-paid',
    partial: 'badge-partial',
    unpaid: 'badge-unpaid',
    overdue: 'badge-overdue'
  };

  const invoiceStatusLabel = {
    paid: 'Paid',
    partial: 'Partial',
    unpaid: 'Unpaid',
    overdue: 'Overdue'
  };

  function invoiceViewUrl(invoice) {
    return invoice.unique_link ? `/ETL-Invoice-View.html?inv=${encodeURIComponent(invoice.unique_link)}` : '';
  }

  function renderInvoiceActions(invoice, status) {
    const id = escapeJs(invoice.id);
    const payments = invoice.invoice_payments || [];
    const paymentCount = payments.length;
    const payButton = status.state !== 'paid'
      ? `<button class="btn-sm btn-sm-primary" onclick="openPaymentModal('${id}')">+ Pay</button>`
      : '';
    const historyButton = paymentCount > 0
      ? `<button class="btn-sm btn-sm-secondary" onclick="openHistoryModal('${id}')" style="margin-left:4px;">${paymentCount} ${paymentCount === 1 ? 'Payment' : 'Payments'}</button>`
      : '';

    return `${payButton}${historyButton}`;
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
    return records.map((invoice) => {
      const status = invoiceStatus(invoice);
      const viewUrl = invoiceViewUrl(invoice);
      const rowOnClick = viewUrl ? `onclick="window.open('${escapeJs(viewUrl)}','_blank')"` : '';
      return `
        <tr class="inv-row" ${rowOnClick} title="${viewUrl ? 'Click to open invoice view' : ''}">
          <td><strong>${escapeHtml(invoice.invoice_number || '-')}</strong></td>
          <td>${escapeHtml(invoice.client_name || '-')}</td>
          <td class="num">${fmtShort(invoice.total)}</td>
          <td class="num">${fmtShort(status.paid)}</td>
          <td class="num"><strong>${fmtShort(status.balance)}</strong></td>
          <td>${formatShortDate(invoice.due_date)}</td>
          <td><span class="badge ${invoiceBadgeClass[status.state]}">${invoiceStatusLabel[status.state]}</span></td>
          <td style="white-space:nowrap;" onclick="event.stopPropagation()">
            ${renderInvoiceActions(invoice, status)}
          </td>
        </tr>`;
    }).join('');
  }

  function renderInvoiceTable(records, options) {
    const rows = filterInvoices(records, options);
    if (rows.length === 0) {
      return '<div class="empty-state"><div class="icon">Invoice</div><p>No invoices match the current filter.</p></div>';
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

  window.ETLDashboard = Object.assign(window.ETLDashboard || {}, {
    renderInvoiceTable,
    renderPaymentSummary,
    renderPaymentHistoryTitle,
    renderPaymentHistory,
    summarizeReceivables,
    invoiceStatus
  });
})();
