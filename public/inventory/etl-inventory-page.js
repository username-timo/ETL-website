// Inventory page controller extracted from ETL-Inventory.html.
const SUPABASE_URL = window.ETLConfig.SUPABASE_URL;
const SUPABASE_KEY = window.ETLConfig.SUPABASE_ANON_KEY;
let SESSION_TOKEN = '';

let allItems = [];

function fmtDate(d) {
  if(!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', {day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'});
}

function fmt(n) { return Math.round(n||0).toLocaleString(); }

async function api(table, opts = {}) {
  const { method = 'GET', filter = '', body = null } = opts;
  const url = `${SUPABASE_URL}/rest/v1/${table}${filter}`;
  const res = await fetch(url, {
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

function switchTab(tab, btn) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('tab-stock').style.display = tab === 'stock' ? '' : 'none';
  document.getElementById('tab-movements').style.display = tab === 'movements' ? '' : 'none';
  if(tab === 'movements') loadMovements();
}

function stockStatus(item) {
  if(item.current_stock <= 0) return 'out';
  if(item.current_stock <= item.min_stock) return 'low';
  return 'ok';
}

function stockBarPct(item) {
  if(!item.min_stock) return 100;
  return Math.min(100, (item.current_stock / (item.min_stock * 3)) * 100);
}

async function loadInventory() {
  document.getElementById('stock-body').innerHTML = '<div class="loading-state">Loading...</div>';
  try {
    const data = await api('inventory_items', { filter: '?order=category.asc,name.asc' });
    allItems = data;
    renderInventory(data);
    updateStats(data);
    populateItemSelects(data);
  } catch(e) {
    document.getElementById('stock-body').innerHTML = '<div class="empty-state"><p>Error loading inventory: ' + e.message + '</p></div>';
  }
}

function renderInventory(data) {
  if(!data.length) {
    document.getElementById('stock-body').innerHTML = '<div class="empty-state"><p>No items in inventory yet. Click "+ New Item" to add one.</p></div>';
    return;
  }

  let rows = data.map(item => {
    const status = stockStatus(item);
    const pct = stockBarPct(item);
    const barClass = status === 'ok' ? 'stock-ok' : status === 'low' ? 'stock-low' : 'stock-out';
    const badgeClass = status === 'ok' ? 'badge-ok' : status === 'low' ? 'badge-low' : 'badge-out';
    const badgeText = status === 'ok' ? '✅ OK' : status === 'low' ? '⚠️ Low' : '❌ Out';
    const value = item.current_stock * (item.unit_cost || 0);

    return `<tr>
      <td><strong>${item.name}</strong></td>
      <td>${item.category}</td>
      <td>
        <div class="stock-bar-wrap"><div class="stock-bar ${barClass}" style="width:${pct}%"></div></div>
        <strong>${fmt(item.current_stock)}</strong> ${item.unit}
      </td>
      <td>${fmt(item.min_stock)} ${item.unit}</td>
      <td>UGX ${fmt(item.unit_cost)}</td>
      <td>UGX ${fmt(value)}</td>
      <td><span class="badge ${badgeClass}">${badgeText}</span></td>
      <td>
        <button class="action-btn green" onclick="openStockInFor('${item.id}','${item.name}')">+ In</button>
        <button class="action-btn danger" onclick="openStockOutFor('${item.id}','${item.name}')">- Out</button>
        <button class="action-btn" onclick="openAdjust(${JSON.stringify(item).replace(/"/g,'&quot;')})">⚙️</button>
      </td>
    </tr>`;
  }).join('');

  document.getElementById('stock-body').innerHTML = `
    <table>
      <thead><tr>
        <th>Item</th><th>Category</th><th>Stock</th><th>Min Level</th>
        <th>Unit Cost</th><th>Stock Value</th><th>Status</th><th>Actions</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function updateStats(data) {
  const low = data.filter(i => stockStatus(i) !== 'ok').length;
  const value = data.reduce((s, i) => s + (i.current_stock * (i.unit_cost||0)), 0);
  document.getElementById('stat-total').innerText = data.length;
  document.getElementById('stat-low').innerText = low;
  document.getElementById('stat-value').innerText = (value/1000000).toFixed(1) + 'M';

  // Low stock alert
  const lowItems = data.filter(i => stockStatus(i) !== 'ok');
  if(lowItems.length) {
    document.getElementById('low-stock-alert').style.display = 'flex';
    document.getElementById('low-stock-msg').innerText =
      `${lowItems.length} item(s) need restocking: ${lowItems.map(i => i.name).join(', ')}`;
  } else {
    document.getElementById('low-stock-alert').style.display = 'none';
  }
}

async function loadMovements() {
  document.getElementById('movements-body').innerHTML = '<div class="loading-state">Loading...</div>';
  try {
    const data = await api('stock_movements', { filter: '?order=created_at.desc&limit=100' });

    // Count today's movements for stats
    const today = new Date().toDateString();
    const todayCount = data.filter(m => new Date(m.created_at).toDateString() === today).length;
    document.getElementById('stat-movements').innerText = todayCount;

    if(!data.length) {
      document.getElementById('movements-body').innerHTML = '<div class="empty-state"><p>No stock movements recorded yet.</p></div>';
      return;
    }

    let rows = data.map(m => {
      const typeClass = m.movement_type === 'in' ? 'badge-in' : m.movement_type === 'out' ? 'badge-out-mv' : 'badge-adjust';
      const typeText = m.movement_type === 'in' ? '📥 IN' : m.movement_type === 'out' ? '📤 OUT' : '⚙️ ADJUST';
      return `<tr>
        <td>${fmtDate(m.created_at)}</td>
        <td><strong>${m.item_name || '—'}</strong></td>
        <td><span class="badge ${typeClass}">${typeText}</span></td>
        <td><strong>${m.movement_type === 'out' ? '-' : '+'}${fmt(m.quantity)}</strong></td>
        <td>${m.project || '—'}</td>
        <td>${m.lpo_number || '—'}</td>
        <td>${m.notes || '—'}</td>
        <td>${m.recorded_by || 'ETL Store'}</td>
      </tr>`;
    }).join('');

    document.getElementById('movements-body').innerHTML = `
      <table>
        <thead><tr>
          <th>Date/Time</th><th>Item</th><th>Type</th><th>Qty</th>
          <th>Project</th><th>LPO</th><th>Notes</th><th>Recorded By</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
  } catch(e) {
    document.getElementById('movements-body').innerHTML = '<div class="empty-state"><p>Error: ' + e.message + '</p></div>';
  }
}

function filterItems() {
  const search = document.getElementById('search-input').value.toLowerCase();
  const cat = document.getElementById('cat-filter').value;
  const status = document.getElementById('status-filter').value;

  let filtered = allItems.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(search) || item.category.toLowerCase().includes(search);
    const matchCat = !cat || item.category === cat;
    const matchStatus = !status || (status === 'low' ? stockStatus(item) !== 'ok' : stockStatus(item) === 'ok');
    return matchSearch && matchCat && matchStatus;
  });

  renderInventory(filtered);
}

function populateItemSelects(data) {
  const inSel = document.getElementById('in-item');
  const outSel = document.getElementById('out-item');
  const opts = data.map(i => `<option value="${i.id}" data-name="${i.name}" data-supplier="${i.supplier||''}" data-cost="${i.unit_cost||0}">${i.name} (${fmt(i.current_stock)} ${i.unit})</option>`).join('');
  inSel.innerHTML = opts;
  outSel.innerHTML = opts;
}

// MODALS
function openStockIn() {
  document.getElementById('in-qty').value = '';
  document.getElementById('in-lpo').value = '';
  document.getElementById('in-notes').value = '';
  document.getElementById('stock-in-modal').classList.add('open');
}

function openStockInFor(id, name) {
  openStockIn();
  document.getElementById('in-item').value = id;
}

function openStockOut() {
  document.getElementById('out-qty').value = '';
  document.getElementById('out-project').value = '';
  document.getElementById('out-issued').value = '';
  document.getElementById('out-notes').value = '';
  document.getElementById('stock-out-modal').classList.add('open');
}

function openStockOutFor(id, name) {
  openStockOut();
  document.getElementById('out-item').value = id;
}

function openAddItem() {
  document.getElementById('new-name').value = '';
  document.getElementById('new-stock').value = '0';
  document.getElementById('new-min').value = '0';
  document.getElementById('new-cost').value = '0';
  document.getElementById('new-supplier').value = '';
  document.getElementById('add-item-modal').classList.add('open');
}

function openAdjust(item) {
  document.getElementById('adjust-id').value = item.id;
  document.getElementById('adjust-name').value = item.name;
  document.getElementById('adjust-current').value = fmt(item.current_stock) + ' ' + item.unit;
  document.getElementById('adjust-new').value = item.current_stock;
  document.getElementById('adjust-min').value = item.min_stock;
  document.getElementById('adjust-cost').value = item.unit_cost;
  document.getElementById('adjust-reason').value = '';
  document.getElementById('adjust-modal').classList.add('open');
}

function closeModal(id) { document.getElementById(id).classList.remove('open'); }

async function submitStockIn() {
  const itemId = document.getElementById('in-item').value;
  const qty = parseFloat(document.getElementById('in-qty').value);
  if(!itemId || !qty || qty <= 0) { alert('Please select an item and enter a valid quantity.'); return; }

  const item = allItems.find(i => i.id === itemId);
  const newStock = (item.current_stock || 0) + qty;
  const cost = parseFloat(document.getElementById('in-cost').value) || item.unit_cost;

  try {
    // Update stock level
    await api(`inventory_items?id=eq.${itemId}`, {
      method: 'PATCH', body: { current_stock: newStock, unit_cost: cost || item.unit_cost }
    });

    // Record movement
    await api('stock_movements', {
      method: 'POST',
      body: {
        item_id: itemId, item_name: item.name, movement_type: 'in',
        quantity: qty, lpo_number: document.getElementById('in-lpo').value,
        notes: document.getElementById('in-notes').value || `Received from ${document.getElementById('in-supplier').value || item.supplier || 'Supplier'}`
      }
    });

    closeModal('stock-in-modal');
    await loadInventory();
    alert(`✅ Stock In recorded!\n\n${item.name}: +${qty} ${item.unit}\nNew stock: ${fmt(newStock)} ${item.unit}`);
  } catch(e) { alert('Error: ' + e.message); }
}

async function submitStockOut() {
  const itemId = document.getElementById('out-item').value;
  const qty = parseFloat(document.getElementById('out-qty').value);
  if(!itemId || !qty || qty <= 0) { alert('Please select an item and enter a valid quantity.'); return; }

  const item = allItems.find(i => i.id === itemId);
  if(qty > item.current_stock) {
    alert(`⚠️ Insufficient stock!\n\nRequested: ${qty} ${item.unit}\nAvailable: ${fmt(item.current_stock)} ${item.unit}`);
    return;
  }

  const newStock = item.current_stock - qty;

  try {
    await api(`inventory_items?id=eq.${itemId}`, {
      method: 'PATCH', body: { current_stock: newStock }
    });

    await api('stock_movements', {
      method: 'POST',
      body: {
        item_id: itemId, item_name: item.name, movement_type: 'out',
        quantity: qty, project: document.getElementById('out-project').value,
        notes: document.getElementById('out-notes').value || `Issued to ${document.getElementById('out-issued').value || 'Site'}`
      }
    });

    closeModal('stock-out-modal');
    await loadInventory();

    let msg = `✅ Stock Out recorded!\n\n${item.name}: -${qty} ${item.unit}\nRemaining: ${fmt(newStock)} ${item.unit}`;
    if(newStock <= item.min_stock) msg += `\n\n⚠️ WARNING: Stock is now below minimum level!`;
    alert(msg);
  } catch(e) { alert('Error: ' + e.message); }
}

async function submitNewItem() {
  const name = document.getElementById('new-name').value.trim();
  const cat = document.getElementById('new-cat').value;
  const unit = document.getElementById('new-unit').value.trim();
  if(!name || !unit) { alert('Please fill in item name and unit.'); return; }

  try {
    await api('inventory_items', {
      method: 'POST',
      body: {
        name, category: cat, unit,
        current_stock: parseFloat(document.getElementById('new-stock').value) || 0,
        min_stock: parseFloat(document.getElementById('new-min').value) || 0,
        unit_cost: parseFloat(document.getElementById('new-cost').value) || 0,
        supplier: document.getElementById('new-supplier').value.trim()
      }
    });
    closeModal('add-item-modal');
    await loadInventory();
    alert(`✅ ${name} added to inventory!`);
  } catch(e) { alert('Error: ' + e.message); }
}

async function submitAdjust() {
  const id = document.getElementById('adjust-id').value;
  const newStock = parseFloat(document.getElementById('adjust-new').value);
  const minStock = parseFloat(document.getElementById('adjust-min').value);
  const cost = parseFloat(document.getElementById('adjust-cost').value);
  const reason = document.getElementById('adjust-reason').value.trim();
  const item = allItems.find(i => i.id === id);

  try {
    await api(`inventory_items?id=eq.${id}`, {
      method: 'PATCH', body: { current_stock: newStock, min_stock: minStock, unit_cost: cost }
    });

    await api('stock_movements', {
      method: 'POST',
      body: {
        item_id: id, item_name: item.name, movement_type: 'adjust',
        quantity: Math.abs(newStock - item.current_stock),
        notes: reason || 'Manual stock adjustment'
      }
    });

    closeModal('adjust-modal');
    await loadInventory();
    alert(`✅ Stock adjusted for ${item.name}`);
  } catch(e) { alert('Error: ' + e.message); }
}

// Initial load — gated behind Supabase Auth
etlAuth.init({
  redirectIfNoSession: '/ETL-Dashboard.html',
  // TODO: when the warehouse_manager role exists in Supabase profiles,
  //       add it here: ['management', 'warehouse_manager']
  allowedRoles: ['management']
}).then(async () => {
  const sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  const { data: { session } } = await sbClient.auth.getSession();
  SESSION_TOKEN = session ? session.access_token : '';
  loadInventory();
  loadMovements();
});
