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

  function decode(s) { return (s||'').replace(/&#x2F;/g,'/').replace(/&amp;/g,'&').replace(/&#x27;/g,"'"); }

  function fmtDate(d) {
    if(!d) return '—';
    return new Date(d).toLocaleDateString('en-GB', {day:'numeric', month:'short', year:'numeric'});
  }


  function escapeHtml(value) {
    return String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function isWithinDays(dateValue, days) {
    if (!dateValue) return false;
    return new Date(dateValue).getTime() >= Date.now() - (days * 86400000);
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

  function filterRequests(data) {
    const filter = window._reqFilter || 'all';
    if (filter === 'last30') return data.filter(r => isWithinDays(r.created_at, 30));
    return data;
  }

  function renderReqFilterBanner() {
    const labels = { all: '', last30: 'Last 30 days' };
    updateFilterLabel('req-filter-label', labels[window._reqFilter || 'all'] || '');
  }

  function renderRequestsTable(data) {
    const body = document.getElementById('requests-body');
    const filtered = filterRequests(data || []);
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

  function filterLPOs(data) {
    const filter = window._lpoFilter || 'all';
    if (filter === 'outward') return data.filter(l => l.direction === 'outward');
    if (filter === 'last30') return data.filter(l => isWithinDays(l.created_at, 30));
    return data;
  }

  function renderLPOFilterBanner() {
    const labels = { all: '', outward: 'Outward only', last30: 'Last 30 days' };
    updateFilterLabel('lpo-filter-label', labels[window._lpoFilter || 'all'] || '');
  }

  function renderLPOTable(data) {
    const body = document.getElementById('lpos-body');
    const filtered = filterLPOs(data || []);
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
      const res = await fetch(`${SUPABASE_URL}/rest/v1/lpos?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SESSION_TOKEN}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ status })
      });
      if(res.ok) {
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
      } else {
        alert('Could not update LPO status. Please try again.');
      }
    } catch(e) {
      alert('Network error: ' + e.message);
    }
  }

  async function updateStatus(id, status) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/quotations?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SESSION_TOKEN}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ status })
      });
      if(res.ok) {
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
      } else {
        alert('Could not update status. Please try again.');
      }
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
      // Fetch pending quotation requests
      const [resQ, resL] = await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/quotations?status=in.(pending_approval,pending)&order=created_at.desc`, {
          headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SESSION_TOKEN}` }
        }),
        fetch(`${SUPABASE_URL}/rest/v1/lpos?status=eq.pending_approval&order=created_at.desc`, {
          headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SESSION_TOKEN}` }
        })
      ]);
      const data  = await resQ.json();
      const lpos  = await resL.json();

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
      let html = '';

      if(data.length) {
        const rows = data.map((r,i) => `
          <tr>
            <td><strong>${r.client_name || '—'}</strong></td>
            <td>${r.contact_person || '—'}</td>
            <td>${r.project_title || '—'}</td>
            <td>${r.client_email || '—'}</td>
            <td>${r.estimated_budget || '—'}</td>
            <td>${fmtDate(r.created_at)}</td>
            <td>
              <button class="action-btn" onclick="showRequest(${i},'approval')">View</button>
              <button class="action-btn approve" onclick="doApprove(${i})">✅ Approve</button>
              <button class="action-btn reject" onclick="doReject(${i})">❌ Reject</button>
            </td>
          </tr>`).join('');
        html += '<div style="margin-bottom:24px;"><h3 style="font-family:Barlow Condensed,sans-serif;font-size:16px;font-weight:800;color:var(--primary);text-transform:uppercase;padding:0 4px 8px;border-bottom:2px solid var(--border);margin-bottom:12px;">⏳ Pending Quotation Requests (' + data.length + ')</h3><table><thead><tr><th>Organisation</th><th>Contact</th><th>Project</th><th>Email</th><th>Budget</th><th>Date</th><th>Actions</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
      }

      if(lpos.length) {
        const lpoRows = lpos.map((l,i) => `
          <tr class="row-pending">
            <td data-label="LPO Number"><strong>${decode(l.lpo_number) || '—'}</strong></td>
            <td data-label="Entity">${l.entity_name || '—'}</td>
            <td data-label="Direction"><span class="badge badge-${l.direction}">${l.direction}</span></td>
            <td data-label="Email">${l.entity_email || '—'}</td>
            <td data-label="Total">UGX ${(l.total||0).toLocaleString()}</td>
            <td data-label="Date">${fmtDate(l.created_at)}</td>
            <td data-label="Actions">
              <button class="action-btn" onclick="showLPOById('${l.id}')">View</button>
              <button class="action-btn approve" onclick="approveLPO('${l.id}')">✅ Approve</button>
              <button class="action-btn reject" onclick="rejectLPO('${l.id}')">❌ Reject</button>
            </td>
          </tr>`).join('');
        html += '<div><h3 style="font-family:Barlow Condensed,sans-serif;font-size:16px;font-weight:800;color:var(--primary);text-transform:uppercase;padding:0 4px 8px;border-bottom:2px solid var(--border);margin-bottom:12px;">⏳ Pending LPOs (' + lpos.length + ')</h3><table><thead><tr><th>LPO Number</th><th>Entity</th><th>Direction</th><th>Email</th><th>Total</th><th>Date</th><th>Actions</th></tr></thead><tbody>' + lpoRows + '</tbody></table></div>';
        window._lpoData = [...(window._lpoData||[]), ...lpos];
      }

      document.getElementById('approvals-body').innerHTML = html;
    } catch(e) {
      document.getElementById('approvals-body').innerHTML = '<div class="empty-state"><p>Error: ' + e.message + '</p></div>';
    }
  }

  async function rejectLPO(id) {
    const reason = prompt('Enter rejection reason (optional):');
    if(reason === null) return;
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/lpos?id=eq.${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SESSION_TOKEN}`, 'Prefer': 'return=minimal' },
        body: JSON.stringify({ status: 'rejected', notes: reason || 'Rejected by management' })
      });
      if(!res.ok) {
        alert('Could not reject LPO: ' + await ETLUtils.readResponseError(res));
        return;
      }
      alert('LPO has been rejected.');
      loadApprovals();
      loadLPOs();
    } catch(e) { alert('Error: ' + e.message); }
  }

  async function approveLPO(id) {
    if(!confirm('Approve this LPO?')) return;
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/lpos?id=eq.${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SESSION_TOKEN}`, 'Prefer': 'return=minimal' },
        body: JSON.stringify({ status: 'approved' })
      });
      if(!res.ok) {
        alert('Could not approve LPO: ' + await ETLUtils.readResponseError(res));
        return;
      }
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
    const res = await fetch(`${SUPABASE_URL}/rest/v1/quotations?id=eq.${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SESSION_TOKEN}`, 'Prefer': 'return=minimal' },
      body: JSON.stringify({ status: 'approved', approved_by: approver, approved_at: new Date().toISOString() })
    });
    if(res.ok) {

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
    } else { alert('Could not update. Please try again.'); }
  }

  async function rejectRequest(id, email, name, project) {
    const reason = prompt(`Enter reason for rejecting ${name}'s request (this will be sent to the client):`);
    if(!reason) return;
    const res = await fetch(`${SUPABASE_URL}/rest/v1/quotations?id=eq.${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SESSION_TOKEN}`, 'Prefer': 'return=minimal' },
      body: JSON.stringify({ status: 'rejected', rejection_reason: reason, approved_by: 'Management' })
    });
    if(res.ok) {
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
    } else { alert('Could not update. Please try again.'); }
  }

  // ─── STOCK CHECK ───
  async function checkStock(i, directRecord) {
    const l = directRecord || window._lpoData[i];
    if(!l.items || !l.items.length) { alert('No items found in this LPO to check against inventory.'); return; }

    // Load inventory
    const res = await fetch(`${SUPABASE_URL}/rest/v1/inventory_items?select=name,current_stock,unit`, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SESSION_TOKEN}` }
    });
    const inventory = await res.json();
    document.getElementById('modal-content').innerHTML = ETLDashboard.renderStockCheck(l, inventory);
    document.getElementById('detail-modal').classList.add('open');
    return;

    // Check each LPO item against inventory
    let html = '<div class="stock-check-list">';
    let allInStock = true;
    let outOfStock = [];

    l.items.forEach(item => {
      const inv = inventory.find(i => i.name.toLowerCase().includes(item.desc.toLowerCase()) || item.desc.toLowerCase().includes(i.name.toLowerCase()));
      let statusHtml = '';
      if(inv) {
        if(inv.current_stock >= item.qty) {
          statusHtml = `<span style="color:var(--success);font-weight:700;">✅ In Stock (${Math.round(inv.current_stock).toLocaleString()} ${inv.unit})</span>`;
        } else if(inv.current_stock > 0) {
          statusHtml = `<span style="color:var(--warning);font-weight:700;">⚠️ Low (${Math.round(inv.current_stock).toLocaleString()} / ${item.qty} needed)</span>`;
          allInStock = false;
          outOfStock.push(item.desc);
        } else {
          statusHtml = `<span style="color:var(--danger);font-weight:700;">❌ Out of Stock</span>`;
          allInStock = false;
          outOfStock.push(item.desc);
        }
      } else {
        statusHtml = `<span style="color:var(--text-muted);font-weight:700;">⚠️ Not in Inventory</span>`;
        allInStock = false;
        outOfStock.push(item.desc);
      }
      html += `<div class="stock-check-item">
        <span><strong>${item.desc}</strong> — ${item.qty} ${item.unit}</span>
        ${statusHtml}
      </div>`;
    });

    html += '</div>';

    if(allInStock) {
      html += `<div style="padding:16px;border-top:1px solid var(--border);display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
        <p style="font-size:13px;color:var(--success);font-weight:600;flex:1;">✅ All items are in stock. You can proceed.</p>
        <button class="modal-btn primary" onclick="window.open('ETL-Invoice.html?lpo_id=${l.id}','_blank');closeModal()">🧾 Generate Invoice</button>
      </div>`;
    } else {
      html += `<div style="padding:16px;border-top:1px solid var(--border);">
        <p style="font-size:13px;color:var(--warning);font-weight:600;margin-bottom:12px;">⚠️ Some items are not in stock. Generate a supplier LPO first, then invoice when ready.</p>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <button class="modal-btn primary" onclick="window.open('ETL-LPO-System.html','_blank');closeModal()">📦 Generate Supplier LPO</button>
          <button class="modal-btn" style="background:var(--gold);color:#fff;" onclick="window.open('ETL-Invoice.html?lpo_id=${l.id}','_blank');closeModal()">🧾 Generate Invoice Anyway</button>
        </div>
      </div>`;
    }

    document.getElementById('modal-content').innerHTML = `
      <h2>📦 Stock Check — ${l.lpo_number}</h2>
      <p style="font-size:13px;color:var(--text-muted);margin-bottom:16px;">Client: <strong>${l.entity_name}</strong> | Checking ${l.items.length} item(s) against inventory</p>
      ${html}
      <div style="padding:0 16px 16px;">
        <button class="modal-btn secondary" onclick="closeModal()" style="margin-top:8px;">Close</button>
      </div>`;
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
      const res = await fetch(`${SUPABASE_URL}/rest/v1/quotations?order=created_at.desc`, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SESSION_TOKEN}` }
      });
      const data = await res.json();

      document.getElementById('stat-total-req').innerText = data.length;
      fetch(`${SUPABASE_URL}/rest/v1/lpos?status=eq.pending_approval&select=id`, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SESSION_TOKEN}` }
      }).then(r => r.json()).then(lpoPending => {
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
      const res = await fetch(`${SUPABASE_URL}/rest/v1/lpos?order=created_at.desc`, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SESSION_TOKEN}` }
      });
      const data = await res.json();

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
      const url = `${SUPABASE_URL}/rest/v1/invoices?select=id,invoice_number,client_name,total,due_date,invoice_date,created_at,unique_link,invoice_payments(amount,payment_date,note,recorded_by,created_at)&order=created_at.desc`;
      const res = await fetch(url, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SESSION_TOKEN}` }
      });
      if (!res.ok) throw new Error(await res.text());
      INVOICES_CACHE = await res.json();
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
      const res = await fetch(`${SUPABASE_URL}/rest/v1/invoice_payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SESSION_TOKEN}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          invoice_id: PAYMENT_MODAL_INVOICE_ID,
          amount,
          payment_date: payDate,
          note: note || null
        })
      });
      if (!res.ok) {
        alert('Could not save payment: ' + await ETLUtils.readResponseError(res));
        return;
      }
      closePaymentModal();
      await loadInvoiceList();
      await loadReceivables();
    } catch (e) {
      alert('Network error: ' + e.message);
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
    return;
    document.getElementById('modal-content').innerHTML = `
      <h2>📋 Quotation Request</h2>
      <div class="modal-grid">
        <div class="modal-field"><label>Organisation</label><p>${r.client_name || '—'}</p></div>
        <div class="modal-field"><label>Contact Person</label><p>${r.contact_person || '—'}</p></div>
        <div class="modal-field"><label>Email</label><p>${r.client_email || '—'}</p></div>
        <div class="modal-field"><label>Phone</label><p>${r.client_phone || '—'}</p></div>
        <div class="modal-field"><label>Project Title</label><p>${r.project_title || '—'}</p></div>
        <div class="modal-field"><label>Location</label><p>${r.project_location || '—'}</p></div>
        <div class="modal-field"><label>Budget</label><p>${r.estimated_budget || '—'}</p></div>
        <div class="modal-field"><label>Timeline</label><p>${r.timeline || '—'}</p></div>
        <div class="modal-field full"><label>Services Needed</label><p>${r.services_category || '—'}</p></div>
        <div class="modal-field full"><label>Description</label><p>${r.project_description || '—'}</p></div>
        <div class="modal-field"><label>Status</label><p><span class="badge badge-${r.status}">${r.status}</span></p></div>
        <div class="modal-field"><label>Submitted</label><p>${fmtDate(r.created_at)}</p></div>
        ${r.approved_by ? `<div class="modal-field"><label>Reviewed By</label><p>${r.approved_by}</p></div>` : ''}
        ${r.rejection_reason ? `<div class="modal-field full"><label>Rejection Reason</label><p style="color:var(--danger)">${r.rejection_reason}</p></div>` : ''}
      </div>
      <div style="display:flex;gap:10px;margin-top:20px;flex-wrap:wrap;">
        ${r.status === 'approved' ? '<button class="modal-btn primary" onclick="openGeneratorFromModal()">📋 Generate Quotation</button>' : ''}
        ${r.status === 'pending_approval' && currentRole === 'management' ? '<button class=\"modal-btn green\" onclick=\"doApproveById(\'' + r.id + '\',\'' + r.client_email + '\',\'' + r.client_name + '\',\'' + r.project_title + '\')\">✅ Approve</button><button class=\"modal-btn danger\" onclick=\"doRejectById(\'' + r.id + '\',\'' + r.client_email + '\',\'' + r.client_name + '\',\'' + r.project_title + '\')\">❌ Reject</button>' : ''}
        <button class="modal-btn secondary" onclick="closeModal()">Close</button>
      </div>`;
    document.getElementById('detail-modal').classList.add('open');
  }

  // ─── Bootstrap: Supabase Auth ───
  async function load30DayStats() {
    // ISO cutoff 30 days ago (UTC midnight-ish is fine for PostgREST gte)
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const headers = { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SESSION_TOKEN}` };
    const countFetch = async (table, extra='') => {
      try {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=id&created_at=gte.${since}${extra}`, { headers });
        if (!r.ok) return null;
        const rows = await r.json();
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
      const r = await fetch(`${SUPABASE_URL}/rest/v1/invoices?select=id,total&created_at=gte.${since}`, { headers });
      if (r.ok) {
        const rows = await r.json();
        const count = rows.length;
        const sum   = rows.reduce((s,row) => s + (Number(row.total) || 0), 0);
        document.getElementById('stat-30-inv').innerText = count;
        document.getElementById('stat-30-amount').innerText = ETLDashboard.fmtShort(sum);
      } else {
        document.getElementById('stat-30-inv').innerText = '—';
        document.getElementById('stat-30-amount').innerText = '—';
      }
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
      const url = `${SUPABASE_URL}/rest/v1/invoices?select=id,total,due_date,invoice_payments(amount)`;
      const r = await fetch(url, { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SESSION_TOKEN}` } });
      if (!r.ok) { setAll('—'); return; }
      const rows = await r.json();
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
    const sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data: { session } } = await sbClient.auth.getSession();
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
