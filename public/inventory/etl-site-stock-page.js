// Site stock page controller extracted from ETL-Site-Stock.html.
const SUPABASE_URL = window.ETLConfig.SUPABASE_URL;
const SUPABASE_KEY = window.ETLConfig.SUPABASE_ANON_KEY;
let SESSION_TOKEN = '';
let currentSite = null;
let currentEngineer = '';
let siteStock = [];
let allItems = [];

function esc(value) {
  if(window.ETLUtils && window.ETLUtils.escapeHtml) return window.ETLUtils.escapeHtml(value);
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escJs(value) {
  return String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/[\r\n]+/g, ' ');
}

function escJsAttr(value) {
  return esc(escJs(value));
}

function safeClass(value) {
  return String(value || '').replace(/[^a-z0-9_-]/gi, '');
}

async function api(table, opts = {}) {
  const { method = 'GET', filter = '', body = null } = opts;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${filter}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SESSION_TOKEN}`,
      'Prefer': method === 'POST' ? 'return=minimal' : undefined
    },
    body: body ? JSON.stringify(body) : undefined
  });
  if(method === 'GET') return res.json();
  return res;
}

async function recordSiteConsumption(payload) {
  return api('site_consumption', {
    method: 'POST',
    body: payload
  });
}

async function updateSiteStock(siteStockId, quantity) {
  return api(`site_stock?id=eq.${siteStockId}`, {
    method: 'PATCH',
    body: { quantity }
  });
}

async function fetchStoreStock(itemId) {
  const rows = await api(`inventory_items?id=eq.${itemId}&select=current_stock`);
  return rows[0] || null;
}

async function updateStoreStock(itemId, quantity) {
  return api(`inventory_items?id=eq.${itemId}`, {
    method: 'PATCH',
    body: { current_stock: quantity }
  });
}

async function recordStoreMovement(payload) {
  return api('stock_movements', {
    method: 'POST',
    body: payload
  });
}

async function refreshSiteViews() {
  await loadSiteStock();
  await loadHistory();
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-GB', {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'});
}

// Load sites for login dropdown
async function loadSites() {
  const sites = await api('project_sites', { filter: '?status=eq.active&order=name.asc' });
  const sel = document.getElementById('login-site');
  sel.innerHTML = '<option value="">-- Select your site --</option>' +
    sites.map(s => `<option value="${esc(s.id)}" data-name="${esc(s.name)}">${esc(s.name)} - ${esc(s.location)}</option>`).join('');
}

async function loadAllItems() {
  allItems = await api('inventory_items', { filter: '?order=name.asc&select=id,name,unit,current_stock' });
}

function doLogin() {
  const siteEl = document.getElementById('login-site');
  const name = document.getElementById('login-name').value.trim();

  if(!siteEl.value) { alert('Please select your site.'); return; }
  if(!name) { alert('Please enter your name.'); return; }

  currentSite = { id: siteEl.value, name: siteEl.options[siteEl.selectedIndex].dataset.name };
  currentEngineer = name;

  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app').style.display = 'block';
  document.getElementById('nav-site-name').innerText = currentSite.name;
  document.getElementById('nav-engineer-name').innerText = name;

  loadSiteStock();
  loadHistory();
  populateItemSelects();
}

function doLogout() {
  etlAuth.signOut();
}

function switchTab(tab, btn) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  ['stock','log','history'].forEach(t => {
    document.getElementById(`tab-${t}`).style.display = t === tab ? '' : 'none';
  });
  if(tab === 'history') loadHistory();
}

async function loadSiteStock() {
  document.getElementById('stock-list').innerHTML = '<div class="loading">Loading...</div>';
  const data = await api('site_stock', { filter: `?site_id=eq.${currentSite.id}&order=item_name.asc` });
  siteStock = data;

  document.getElementById('stat-items').innerText = data.length;

  const low = data.filter(i => i.quantity <= 2);
  if(low.length) {
    document.getElementById('low-stock-warning').style.display = 'block';
    document.getElementById('low-stock-text').innerText = `Low stock on site: ${low.map(i => i.item_name).join(', ')}`;
  } else {
    document.getElementById('low-stock-warning').style.display = 'none';
  }

  if(!data.length) {
    document.getElementById('stock-list').innerHTML = '<div class="empty-state">No stock transferred to this site yet.<br>Contact the storekeeper to transfer materials.</div>';
    return;
  }

  document.getElementById('stock-list').innerHTML = data.map(item => `
    <div class="stock-item">
      <div class="stock-item-top">
        <div class="stock-item-name">${esc(item.item_name)}</div>
        <div class="stock-item-qty">${esc(item.quantity)} <span style="font-size:12px;font-weight:400;color:var(--text-muted)">${esc(item.unit)}</span></div>
      </div>
      <div class="stock-item-actions">
        <button class="action-btn use" onclick="quickLog('${escJsAttr(item.item_id)}','${escJsAttr(item.item_name)}','${escJsAttr(item.unit)}','consumed')">Use</button>
        <button class="action-btn return" onclick="quickLog('${escJsAttr(item.item_id)}','${escJsAttr(item.item_name)}','${escJsAttr(item.unit)}','returned')">Return</button>
      </div>
    </div>`).join('');
  return;

  document.getElementById('stock-list').innerHTML = data.map(item => `
    <div class="stock-item">
      <div class="stock-item-top">
        <div class="stock-item-name">${item.item_name}</div>
        <div class="stock-item-qty">${item.quantity} <span style="font-size:12px;font-weight:400;color:var(--text-muted)">${item.unit}</span></div>
      </div>
      <div class="stock-item-actions">
        <button class="action-btn use" onclick="quickLog('${item.item_id}','${item.item_name}','${item.unit}','consumed')">📤 Use</button>
        <button class="action-btn return" onclick="quickLog('${item.item_id}','${item.item_name}','${item.unit}','returned')">📥 Return</button>
      </div>
    </div>`).join('');
}

function quickLog(itemId, itemName, unit, type) {
  // Switch to log tab and pre-fill
  document.querySelectorAll('.tab-btn')[1].click();
  document.getElementById('log-item').value = itemId;
  document.getElementById('log-qty').focus();
}

function populateItemSelects() {
  const opts = allItems.map(i => `<option value="${esc(i.id)}" data-name="${esc(i.name)}" data-unit="${esc(i.unit)}">${esc(i.name)} (${esc(i.unit)})</option>`).join('');
  document.getElementById('log-item').innerHTML = opts;
  document.getElementById('req-item').innerHTML = opts;
}

async function submitLog(type) {
  const itemEl = document.getElementById('log-item');
  const itemId = itemEl.value;
  const itemName = itemEl.options[itemEl.selectedIndex].dataset.name;
  const unit = itemEl.options[itemEl.selectedIndex].dataset.unit;
  const qty = parseFloat(document.getElementById('log-qty').value);
  const notes = document.getElementById('log-notes').value.trim();

  if(!itemId || !qty || qty <= 0) { alert('Please select an item and enter a valid quantity.'); return; }

  // Check site stock for consumed
  if(type === 'consumed') {
    const siteItem = siteStock.find(s => s.item_id === itemId);
    if(!siteItem || qty > siteItem.quantity) {
      alert(`⚠️ Insufficient stock on site!\n\nAvailable: ${siteItem ? siteItem.quantity : 0} ${unit}`);
      return;
    }
  }

  try {
    await recordSiteConsumption({
      site_id: currentSite.id,
      site_name: currentSite.name,
      item_id: itemId,
      item_name: itemName,
      unit,
      quantity: qty,
      movement_type: type,
      recorded_by: currentEngineer,
      notes
    });

    const siteItem = siteStock.find(s => s.item_id === itemId);
    if(siteItem) {
      const newQty = type === 'consumed' ? siteItem.quantity - qty : siteItem.quantity + qty;
      await updateSiteStock(siteItem.id, newQty);

      if(type === 'returned') {
        const storeItem = await fetchStoreStock(itemId);
        if(storeItem) {
          await updateStoreStock(itemId, storeItem.current_stock + qty);
          await recordStoreMovement({
            item_id: itemId,
            item_name: itemName,
            movement_type: 'in',
            quantity: qty,
            project: currentSite.name,
            notes: `Returned from site by ${currentEngineer}`
          });
        }
      }
    }

    document.getElementById('log-qty').value = '';
    document.getElementById('log-notes').value = '';
    await refreshSiteViews();

    const label = type === 'consumed' ? 'Usage recorded' : 'Return recorded';
    alert(`✅ ${label}!\n\n${itemName}: ${qty} ${unit}\n${type === 'returned' ? 'Stock returned to main store.' : ''}`);

  } catch(e) { alert('Error: ' + e.message); }
}

async function submitRequest() {
  const itemEl = document.getElementById('req-item');
  const itemName = itemEl.options[itemEl.selectedIndex].dataset.name;
  const unit = itemEl.options[itemEl.selectedIndex].dataset.unit;
  const qty = parseFloat(document.getElementById('req-qty').value);
  const notes = document.getElementById('req-notes').value.trim();

  if(!qty || qty <= 0) { alert('Please enter a quantity needed.'); return; }

  try {
    await recordSiteConsumption({
      site_id: currentSite.id,
      site_name: currentSite.name,
      item_id: itemEl.value,
      item_name: itemName,
      unit,
      quantity: qty,
      movement_type: 'requested',
      recorded_by: currentEngineer,
      notes: notes || `Requested for ${currentSite.name}`
    });

    document.getElementById('req-qty').value = '';
    document.getElementById('req-notes').value = '';
    alert(`✅ Request sent!\n\n${itemName}: ${qty} ${unit} requested\nThe storekeeper will arrange transfer.`);
  } catch(e) { alert('Error: ' + e.message); }
}

async function loadHistory() {
  document.getElementById('history-list').innerHTML = '<div class="loading">Loading...</div>';
  const data = await api('site_consumption', {
    filter: `?site_id=eq.${currentSite.id}&order=created_at.desc&limit=50`
  });

  // Update today stats
  const today = new Date().toDateString();
  const todayUsed = data.filter(m => new Date(m.created_at).toDateString() === today && m.movement_type === 'consumed').length;
  const todayReturns = data.filter(m => new Date(m.created_at).toDateString() === today && m.movement_type === 'returned').length;
  document.getElementById('stat-today').innerText = todayUsed;
  document.getElementById('stat-returns').innerText = todayReturns;

  if(!data.length) {
    document.getElementById('history-list').innerHTML = '<div class="empty-state">No activity recorded yet.</div>';
    return;
  }

  const typeMap = {
    consumed: { label: '📤 Used', cls: 'badge-consumed' },
    returned: { label: '📥 Returned', cls: 'badge-returned' },
    received: { label: '📦 Received', cls: 'badge-received' },
    requested: { label: '📋 Requested', cls: 'badge-received' },
  };

  document.getElementById('history-list').innerHTML = data.map(m => {
    const t = typeMap[m.movement_type] || { label: m.movement_type, cls: 'badge-received' };
    const meta = `${fmtDate(m.created_at)} - ${m.recorded_by || 'Unknown'}${m.notes ? ' - ' + m.notes : ''}`;
    return `<div class="history-item">
      <span class="history-badge ${safeClass(t.cls)}">${esc(t.label)}</span>
      <div class="history-info">
        <div class="history-name">${esc(m.item_name)}</div>
        <div class="history-meta">${esc(meta)}</div>
      </div>
      <div class="history-qty">${esc(m.quantity)} <span style="font-size:11px;color:var(--text-muted)">${esc(m.unit)}</span></div>
    </div>`;
  }).join('');
  return;

  document.getElementById('history-list').innerHTML = data.map(m => {
    const t = typeMap[m.movement_type] || { label: m.movement_type, cls: 'badge-received' };
    return `<div class="history-item">
      <span class="history-badge ${t.cls}">${t.label}</span>
      <div class="history-info">
        <div class="history-name">${m.item_name}</div>
        <div class="history-meta">${fmtDate(m.created_at)} · ${m.recorded_by || 'Unknown'} ${m.notes ? '· ' + m.notes : ''}</div>
      </div>
      <div class="history-qty">${m.quantity} <span style="font-size:11px;color:var(--text-muted)">${m.unit}</span></div>
    </div>`;
  }).join('');
}

// Init — gated behind Supabase Auth
etlAuth.init({ redirectIfNoSession: '/ETL-Dashboard.html' }).then(async () => {
  const sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  const { data: { session } } = await sbClient.auth.getSession();
  SESSION_TOKEN = session ? session.access_token : '';
  loadSites();
  loadAllItems();
});
