/**
 * etl-inventory-autocomplete.js
 * Shared inventory autocomplete for ETL HTML tools.
 *
 * Used by:
 *   - ETL-Quotation-generator.html
 *   - ETL-LPO-Outward.html
 *   - ETL-Invoice.html
 *
 * Requires on the page before this script:
 *   - window.ETLConfig or legacy SUPABASE_URL/SUPABASE_KEY globals
 *   - SESSION_TOKEN (let — must be set before calling loadInventoryItems())
 *   - recalc(el)    (function — called after a row is filled)
 *
 * Usage:
 *   1. Add <script src="/etl-inventory-autocomplete.js"></script> AFTER the
 *      variables above are declared but BEFORE your auth init block.
 *   2. On each description input use:
 *        oninput="showAC(this)"
 *        onkeydown="handleACKey(event,this)"
 *        onblur="hideAC(this)"
 *        autocomplete="off"
 *   3. Wrap each description input in:
 *        <div class="desc-wrap">
 *          <input ... />
 *          <div class="autocomplete-list"></div>
 *        </div>
 *   4. Call loadInventoryItems() once SESSION_TOKEN is available (inside your
 *      etlAuth.init().then(...) block).
 */

// ── State ──────────────────────────────────────────────────────────────────
let inventoryItems = [];

// ── Load ───────────────────────────────────────────────────────────────────
async function loadInventoryItems() {
  try {
    const cfg = window.ETLConfig || {};
    const supabaseUrl = cfg.SUPABASE_URL || window.SUPABASE_URL;
    const supabaseKey = cfg.SUPABASE_ANON_KEY || window.SUPABASE_KEY || window.SUPABASE_ANON_KEY;
    const bearer = window.SESSION_TOKEN || supabaseKey;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase public config');
    }

    const res = await fetch(
      `${supabaseUrl}/rest/v1/inventory_items?select=name,unit,unit_cost,category&order=name.asc`,
      { headers: { apikey: supabaseKey, Authorization: `Bearer ${bearer}` } }
    );
    const data = await res.json();
    if (Array.isArray(data)) inventoryItems = data;
  } catch (e) {
    console.warn('[ETL autocomplete] Could not load inventory items:', e);
  }
}

// ── Show dropdown ──────────────────────────────────────────────────────────
function showAC(input) {
  const wrap = input.closest('.desc-wrap');
  const list = wrap.querySelector('.autocomplete-list');
  const val  = input.value.trim().toLowerCase();

  if (!val) { list.classList.remove('show'); return; }

  const matches = inventoryItems.filter(i =>
    i.name.toLowerCase().includes(val)
  );

  if (!matches.length) {
    list.innerHTML = '<div class="ac-no-results">No items found</div>';
    list.classList.add('show');
    return;
  }

  list.innerHTML = matches.map(i =>
    `<div class="ac-item" tabindex="0"
      data-name="${i.name.replace(/"/g, '&quot;')}"
      data-unit="${i.unit || ''}"
      data-cost="${i.unit_cost || 0}">${i.name}</div>`
  ).join('');

  list.querySelectorAll('.ac-item').forEach(item => {
    item.addEventListener('mousedown', function (e) {
      e.preventDefault();
      _fillRow(input, wrap, list, this.dataset.name, this.dataset.unit, this.dataset.cost);
    });
    item.addEventListener('touchstart', function (e) {
      e.preventDefault();
      _fillRow(input, wrap, list, this.dataset.name, this.dataset.unit, this.dataset.cost);
    });
  });

  list.classList.add('show');
}

// ── Hide dropdown ──────────────────────────────────────────────────────────
function hideAC(input) {
  const wrap = input.closest('.desc-wrap');
  if (wrap) {
    setTimeout(() => {
      wrap.querySelector('.autocomplete-list').classList.remove('show');
    }, 200);
  }
}

// ── Keyboard navigation ────────────────────────────────────────────────────
function handleACKey(e, input) {
  const wrap    = input.closest('.desc-wrap');
  const list    = wrap.querySelector('.autocomplete-list');
  const items   = list.querySelectorAll('.ac-item');
  const current = list.querySelector('.highlighted');

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (!current) {
      items[0] && items[0].classList.add('highlighted');
    } else {
      current.classList.remove('highlighted');
      (current.nextElementSibling || items[0]).classList.add('highlighted');
    }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (current) {
      current.classList.remove('highlighted');
      (current.previousElementSibling || items[items.length - 1]).classList.add('highlighted');
    }
  } else if (e.key === 'Enter') {
    e.preventDefault();
    const hi = list.querySelector('.highlighted');
    if (hi) hi.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
  } else if (e.key === 'Escape') {
    list.classList.remove('show');
  }
}

// ── Fill row after selection ───────────────────────────────────────────────
function _fillRow(input, wrap, list, name, unit, cost) {
  const row     = wrap.closest('tr');
  input.value   = name;
  const unitEl  = row.querySelector('.i-unit');
  const priceEl = row.querySelector('.i-price');
  if (unitEl)  unitEl.value  = unit;
  if (priceEl) { priceEl.value = cost; recalc(priceEl); }
  list.classList.remove('show');
  list.innerHTML = '';
}

// ── Close all dropdowns when clicking outside ──────────────────────────────
document.addEventListener('mousedown', function (e) {
  if (!e.target.closest('.desc-wrap')) {
    document.querySelectorAll('.autocomplete-list.show')
      .forEach(l => l.classList.remove('show'));
  }
});
