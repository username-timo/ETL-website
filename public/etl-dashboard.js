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

  window.ETLDashboard = {
    renderRequestTable,
    renderLpoTable
  };
})();
