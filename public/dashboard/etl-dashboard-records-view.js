(function () {
  const D = window.ETLDashboard || {};
  const {
    escapeHtml,
    escapeJs,
    safeClass,
    selected,
    disabledOption,
    fmtTotal,
    formatLongDate,
    isWithinDays,
    fmtMoney,
    fallback,
    decodeText
  } = D;

  const approvalHeadingStyle = 'font-family:Barlow Condensed,sans-serif;font-size:16px;font-weight:800;color:var(--primary);text-transform:uppercase;padding:0 4px 8px;border-bottom:2px solid var(--border);margin-bottom:12px;';

  function renderTable(headers, rows, attrs) {
    return `
      <table${attrs ? ` ${attrs}` : ''}>
        <thead><tr>${headers.map((heading) => `<th>${heading}</th>`).join('')}</tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
  }

  function modalField(label, value, options) {
    const opts = options || {};
    const classes = opts.full ? 'modal-field full' : 'modal-field';
    const text = opts.raw ? value : escapeHtml(fallback(value));
    return `<div class="${classes}"><label>${label}</label><p${opts.style ? ` style="${opts.style}"` : ''}>${text}</p></div>`;
  }

  function optionalModalField(label, value, options) {
    return value ? modalField(label, value, options) : '';
  }

  function renderApprovalSection(title, headers, rows, isFirst) {
    const style = isFirst ? 'margin-bottom:24px;' : '';
    return `<div style="${style}"><h3 style="${approvalHeadingStyle}">${escapeHtml(title)}</h3>${renderTable(headers, rows)}</div>`;
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
      return '<span style="font-size:11px;color:var(--warning);font-weight:700;">Awaiting Approval</span>';
    }
    if (record.status === 'rejected') {
      return '<span style="font-size:11px;color:var(--danger);font-weight:700;">Rejected</span>';
    }
    return `<button class="action-btn gold" onclick="openGeneratorById('${id}')">Generate Quotation</button>`;
  }

  function renderRequestStatusSelect(record, role) {
    const mg = role === 'management';
    const status = record.status;
    return `<select class="status-select" onchange="updateStatus('${escapeJs(record.id)}', this.value)">
      ${mg ? `<option value="pending_approval" ${selected(status, 'pending_approval')}>Pending Approval</option><option value="approved" ${selected(status, 'approved')}>Approved</option>` : ''}
      <option value="in_progress" ${selected(status, 'in_progress')}>In Progress</option>
      <option value="responded" ${selected(status, 'responded')}>Responded</option>
      ${mg ? `<option value="rejected" ${selected(status, 'rejected')}>Rejected</option>` : ''}
      <option value="closed" ${selected(status, 'closed')}>Closed</option>
    </select>`;
  }

  function renderRequestRows(records, options) {
    const opts = options || {};
    const role = opts.role || '';
    const fmtDate = opts.fmtDate || function (value) { return value || '-'; };
    return records.map((record) => {
      const id = escapeJs(record.id);
      const statusClass = safeClass(record.status);
      return `
        <tr data-id="${escapeHtml(record.id)}" class="${requestRowClass(record)}">
          <td><strong>${escapeHtml(fallback(record.client_name))}</strong></td>
          <td>${escapeHtml(fallback(record.contact_person))}</td>
          <td>${escapeHtml(fallback(record.project_title))}</td>
          <td>${escapeHtml(fallback(record.client_email))}</td>
          <td>${fmtDate(record.created_at)}</td>
          <td><span class="badge badge-${statusClass}" id="req-badge-${escapeHtml(record.id)}">${escapeHtml(fallback(record.status))}</span></td>
          <td>
            <button class="action-btn" onclick="showRequestById('${id}')">View</button>
            ${renderRequestAction(record)}
            ${renderRequestStatusSelect(record, role)}
          </td>
        </tr>`;
    }).join('');
  }

  function renderRequestTable(records, options) {
    return renderTable(
      ['Organisation', 'Contact', 'Project', 'Email', 'Date', 'Status', 'Actions'],
      renderRequestRows(records, options)
    );
  }

  function renderLpoStatusSelect(record, role) {
    const mg = role === 'management';
    const status = record.status;
    const isApproved = status === 'approved';
    const disabled = !isApproved && !mg;
    const disabledStyle = disabled ? 'opacity:0.5;cursor:not-allowed;' : '';
    return `<select class="status-select" onchange="updateLPOStatus('${escapeJs(record.id)}', this.value)" ${disabled ? 'disabled' : ''} style="${disabledStyle}">
      ${mg ? `<option value="pending_approval" ${selected(status, 'pending_approval')}>Pending Approval</option><option value="approved" ${selected(status, 'approved')}>Approved</option>` : ''}
      <option value="active" ${selected(status, 'active')} ${disabledOption(isApproved)}>Active</option>
      <option value="issued" ${selected(status, 'issued')} ${disabledOption(isApproved)}>Issued</option>
      <option value="delivered" ${selected(status, 'delivered')} ${disabledOption(isApproved)}>Delivered</option>
      <option value="paid" ${selected(status, 'paid')} ${disabledOption(isApproved)}>Paid</option>
      <option value="disputed" ${selected(status, 'disputed')} ${disabledOption(isApproved)}>Disputed</option>
      <option value="closed" ${selected(status, 'closed')} ${disabledOption(isApproved)}>Closed</option>
    </select>`;
  }

  function renderLpoActions(record) {
    const id = escapeJs(record.id);
    const waiting = record.status === 'approved'
      ? ''
      : '<span style="font-size:11px;color:var(--gold);font-weight:700;">Awaiting Approval</span>';
    const copy = record.status === 'approved' && record.direction === 'outward' && record.unique_link
      ? `<button class="action-btn gold" onclick="copyLink('${escapeJs(record.unique_link)}')">Copy Link</button>`
      : '';
    const stock = record.status === 'approved' && record.direction === 'inward'
      ? `<button class="action-btn" onclick="checkStockById('${id}')" style="background:var(--light-bg);color:var(--secondary);border-color:var(--secondary)">Check Stock</button>`
      : '';
    return `<button class="action-btn" onclick="showLPOById('${id}')">View</button>${waiting}${copy}${stock}`;
  }

  function renderLpoRows(records, options) {
    const opts = options || {};
    const role = opts.role || '';
    const fmtDate = opts.fmtDate || function (value) { return value || '-'; };
    return records.map((record) => {
      const statusClass = safeClass(record.status);
      const directionClass = safeClass(record.direction);
      return `
        <tr data-lpo-id="${escapeHtml(record.id)}" class="${lpoRowClass(record)}">
          <td><strong>${escapeHtml(fallback(record.lpo_number))}</strong></td>
          <td>${escapeHtml(fallback(record.entity_name))}</td>
          <td><span class="badge badge-${directionClass}">${escapeHtml(fallback(record.direction))}</span></td>
          <td>${escapeHtml(fallback(record.entity_email))}</td>
          <td>${fmtTotal(record.total)}</td>
          <td>${fmtDate(record.created_at)}</td>
          <td><span class="badge badge-lpo-${statusClass}" id="lpo-status-${escapeHtml(record.id)}">${escapeHtml(fallback(record.status))}</span></td>
          <td><div class="lpo-actions">
            ${renderLpoActions(record)}
            ${renderLpoStatusSelect(record, role)}
          </div></td>
        </tr>`;
    }).join('');
  }

  function renderLpoTable(records, options) {
    return renderTable(
      ['LPO Number', 'Entity', 'Direction', 'Email', 'Total', 'Date', 'Status', 'Actions'],
      renderLpoRows(records, options)
    );
  }

  function filterRequests(records, filter) {
    const mode = filter || 'all';
    if (mode === 'last30') return records.filter((record) => isWithinDays(record.created_at, 30));
    return records;
  }

  function filterLpos(records, filter) {
    const mode = filter || 'all';
    if (mode === 'outward') return records.filter((record) => record.direction === 'outward');
    if (mode === 'last30') return records.filter((record) => isWithinDays(record.created_at, 30));
    return records;
  }

  function renderApprovalRequestRows(records, options) {
    const fmtDate = (options && options.fmtDate) || formatLongDate;
    return records.map((record, index) => `
      <tr>
        <td><strong>${escapeHtml(fallback(record.client_name))}</strong></td>
        <td>${escapeHtml(fallback(record.contact_person))}</td>
        <td>${escapeHtml(fallback(record.project_title))}</td>
        <td>${escapeHtml(fallback(record.client_email))}</td>
        <td>${escapeHtml(fallback(record.estimated_budget))}</td>
        <td>${fmtDate(record.created_at)}</td>
        <td>
          <button class="action-btn" onclick="showRequest(${index},'approval')">View</button>
          <button class="action-btn approve" onclick="doApprove(${index})">Approve</button>
          <button class="action-btn reject" onclick="doReject(${index})">Reject</button>
        </td>
      </tr>`).join('');
  }

  function renderApprovalLpoRows(records, options) {
    const fmtDate = (options && options.fmtDate) || formatLongDate;
    return records.map((record) => {
      const id = escapeJs(record.id);
      return `
        <tr class="row-pending">
          <td data-label="LPO Number"><strong>${escapeHtml(fallback(decodeText(record.lpo_number)))}</strong></td>
          <td data-label="Entity">${escapeHtml(fallback(record.entity_name))}</td>
          <td data-label="Direction"><span class="badge badge-${safeClass(record.direction)}">${escapeHtml(fallback(record.direction))}</span></td>
          <td data-label="Email">${escapeHtml(fallback(record.entity_email))}</td>
          <td data-label="Total">${fmtMoney(record.total)}</td>
          <td data-label="Date">${fmtDate(record.created_at)}</td>
          <td data-label="Actions">
            <button class="action-btn" onclick="showLPOById('${id}')">View</button>
            <button class="action-btn approve" onclick="approveLPO('${id}')">Approve</button>
            <button class="action-btn reject" onclick="rejectLPO('${id}')">Reject</button>
          </td>
        </tr>`;
    }).join('');
  }

  function renderApprovals(quotations, lpos, options) {
    const sections = [];
    if (quotations.length) {
      sections.push(renderApprovalSection(
        `Pending Quotation Requests (${quotations.length})`,
        ['Organisation', 'Contact', 'Project', 'Email', 'Budget', 'Date', 'Actions'],
        renderApprovalRequestRows(quotations, options),
        true
      ));
    }
    if (lpos.length) {
      sections.push(renderApprovalSection(
        `Pending LPOs (${lpos.length})`,
        ['LPO Number', 'Entity', 'Direction', 'Email', 'Total', 'Date', 'Actions'],
        renderApprovalLpoRows(lpos, options),
        false
      ));
    }
    return sections.join('');
  }

  function renderLpoDetail(record, options) {
    const opts = options || {};
    const role = opts.role || '';
    const fmtDate = opts.fmtDate || formatLongDate;
    const direction = safeClass(record.direction);
    const status = safeClass(record.status);
    const items = (record.items || []).map((item, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(item.desc || '')}</td>
        <td>${escapeHtml(item.unit || '')}</td>
        <td>${escapeHtml(item.qty ?? 0)}</td>
        <td>${fmtMoney(item.price || 0)}</td>
        <td>${fmtMoney(item.total || 0)}</td>
      </tr>`).join('');

    return `
      <h2>LPO Details</h2>
      <div class="modal-grid">
        ${modalField('LPO Number', record.lpo_number)}
        ${modalField('Direction', `<span class="badge badge-${direction}">${escapeHtml(record.direction || '-')}</span>`, { raw: true })}
        ${modalField('Entity Name', record.entity_name)}
        ${modalField('Email', record.entity_email)}
        ${modalField('Issue Date', fmtDate(record.issue_date))}
        ${modalField('Delivery Date', fmtDate(record.delivery_date))}
        ${modalField('Total Amount', `<strong>${fmtMoney(record.total || 0)}</strong>`, { raw: true })}
        ${modalField('Status', `<span class="badge badge-${status}">${escapeHtml(record.status || '-')}</span>`, { raw: true })}
        ${optionalModalField('Project / Contract Title', record.project_name, { full: true })}
        ${optionalModalField('Delivery Location', record.delivery_location)}
        ${optionalModalField('Notes', record.notes, { full: true })}
      </div>
      ${items ? `<table style="width:100%;border-collapse:collapse;font-size:12px;margin-top:8px;"><thead><tr style="background:var(--lighter-bg)"><th style="padding:8px;text-align:left">#</th><th style="padding:8px;text-align:left">Description</th><th style="padding:8px">Unit</th><th style="padding:8px">Qty</th><th style="padding:8px">Price</th><th style="padding:8px">Total</th></tr></thead><tbody>${items}</tbody></table>` : ''}
      <div class="modal-actions">
        <button class="modal-btn secondary" onclick="closeModal()">Close</button>
        ${record.direction === 'outward' && record.unique_link ? `<button class="modal-btn gold" onclick="copyLink('${escapeJs(record.unique_link)}')">Copy Supplier Link</button>` : ''}
        ${record.status === 'pending_approval' && role === 'management'
          ? `<button class="modal-btn green" onclick="approveLPO('${escapeJs(record.id)}');closeModal()">Approve</button>
             <button class="modal-btn danger" onclick="rejectLPO('${escapeJs(record.id)}');closeModal()">Reject</button>`
          : ''}
      </div>`;
  }

  function renderRequestDetail(record, options) {
    const opts = options || {};
    const role = opts.role || '';
    const fmtDate = opts.fmtDate || formatLongDate;
    return `
      <h2>Quotation Request</h2>
      <div class="modal-grid">
        ${modalField('Organisation', record.client_name)}
        ${modalField('Contact Person', record.contact_person)}
        ${modalField('Email', record.client_email)}
        ${modalField('Phone', record.client_phone)}
        ${modalField('Project Title', record.project_title)}
        ${modalField('Location', record.project_location)}
        ${modalField('Budget', record.estimated_budget)}
        ${modalField('Timeline', record.timeline)}
        ${modalField('Services Needed', record.services_category, { full: true })}
        ${modalField('Description', record.project_description, { full: true })}
        ${modalField('Status', `<span class="badge badge-${safeClass(record.status)}">${escapeHtml(fallback(record.status))}</span>`, { raw: true })}
        ${modalField('Submitted', fmtDate(record.created_at))}
        ${optionalModalField('Reviewed By', record.approved_by)}
        ${optionalModalField('Rejection Reason', record.rejection_reason, { full: true, style: 'color:var(--danger)' })}
      </div>
      <div style="display:flex;gap:10px;margin-top:20px;flex-wrap:wrap;">
        ${record.status === 'approved' ? '<button class="modal-btn primary" onclick="openGeneratorFromModal()">Generate Quotation</button>' : ''}
        ${record.status === 'pending_approval' && role === 'management'
          ? `<button class="modal-btn green" onclick="doApproveById('${escapeJs(record.id)}','${escapeJs(record.client_email)}','${escapeJs(record.client_name)}','${escapeJs(record.project_title)}')">Approve</button><button class="modal-btn danger" onclick="doRejectById('${escapeJs(record.id)}','${escapeJs(record.client_email)}','${escapeJs(record.client_name)}','${escapeJs(record.project_title)}')">Reject</button>`
          : ''}
        <button class="modal-btn secondary" onclick="closeModal()">Close</button>
      </div>`;
  }

  function renderStockCheck(record, inventory) {
    let allInStock = true;
    let html = '<div class="stock-check-list">';

    (record.items || []).forEach((item) => {
      const desc = String(item.desc || '');
      const inv = (inventory || []).find((stockItem) => {
        const stockName = String(stockItem.name || '').toLowerCase();
        const itemName = desc.toLowerCase();
        return stockName && itemName && (stockName.includes(itemName) || itemName.includes(stockName));
      });
      let statusHtml = '';
      if (inv) {
        if (Number(inv.current_stock || 0) >= Number(item.qty || 0)) {
          statusHtml = `<span style="color:var(--success);font-weight:700;">In Stock (${Math.round(Number(inv.current_stock) || 0).toLocaleString()} ${escapeHtml(inv.unit || '')})</span>`;
        } else if (Number(inv.current_stock || 0) > 0) {
          statusHtml = `<span style="color:var(--warning);font-weight:700;">Low (${Math.round(Number(inv.current_stock) || 0).toLocaleString()} / ${escapeHtml(item.qty || 0)} needed)</span>`;
          allInStock = false;
        } else {
          statusHtml = '<span style="color:var(--danger);font-weight:700;">Out of Stock</span>';
          allInStock = false;
        }
      } else {
        statusHtml = '<span style="color:var(--text-muted);font-weight:700;">Not in Inventory</span>';
        allInStock = false;
      }
      html += `<div class="stock-check-item">
        <span><strong>${escapeHtml(desc)}</strong> - ${escapeHtml(item.qty || 0)} ${escapeHtml(item.unit || '')}</span>
        ${statusHtml}
      </div>`;
    });

    html += '</div>';
    if (allInStock) {
      html += `<div style="padding:16px;border-top:1px solid var(--border);display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
        <p style="font-size:13px;color:var(--success);font-weight:600;flex:1;">All items are in stock. You can proceed.</p>
        <button class="modal-btn primary" onclick="window.open('ETL-Invoice.html?lpo_id=${escapeJs(record.id)}','_blank');closeModal()">Generate Invoice</button>
      </div>`;
    } else {
      html += `<div style="padding:16px;border-top:1px solid var(--border);">
        <p style="font-size:13px;color:var(--warning);font-weight:600;margin-bottom:12px;">Some items are not in stock. Generate a supplier LPO first, then invoice when ready.</p>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <button class="modal-btn primary" onclick="window.open('ETL-LPO-System.html','_blank');closeModal()">Generate Supplier LPO</button>
          <button class="modal-btn" style="background:var(--gold);color:#fff;" onclick="window.open('ETL-Invoice.html?lpo_id=${escapeJs(record.id)}','_blank');closeModal()">Generate Invoice Anyway</button>
        </div>
      </div>`;
    }

    return `
      <h2>Stock Check - ${escapeHtml(record.lpo_number || '')}</h2>
      <p style="font-size:13px;color:var(--text-muted);margin-bottom:16px;">Client: <strong>${escapeHtml(record.entity_name || '')}</strong> | Checking ${(record.items || []).length} item(s) against inventory</p>
      ${html}
      <div style="padding:0 16px 16px;">
        <button class="modal-btn secondary" onclick="closeModal()" style="margin-top:8px;">Close</button>
      </div>`;
  }

  window.ETLDashboard = Object.assign(window.ETLDashboard || {}, {
    renderRequestTable,
    renderLpoTable,
    filterRequests,
    filterLpos,
    renderApprovals,
    renderLpoDetail,
    renderRequestDetail,
    renderStockCheck
  });
})();
