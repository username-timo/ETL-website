(function () {
  let inventoryItems = [];
  let inventoryLoaded = false;
  let autocompleteEnabled = false;
  let getSessionToken = function () { return ''; };
  let getSupabaseUrl = function () { return ''; };
  let getSupabaseKey = function () { return ''; };
  let recalcRow = function () {};

  function init(options) {
    const opts = options || {};
    getSessionToken = opts.getSessionToken || getSessionToken;
    getSupabaseUrl = opts.getSupabaseUrl || getSupabaseUrl;
    getSupabaseKey = opts.getSupabaseKey || getSupabaseKey;
    recalcRow = opts.recalc || recalcRow;
  }

  function configure(enabled) {
    autocompleteEnabled = !!enabled;
    document.querySelectorAll('.i-desc').forEach((input) => {
      input.placeholder = autocompleteEnabled
        ? 'Search inventory or type item...'
        : 'Type item or service description...';
      const list = input.closest('.desc-wrap')?.querySelector('.autocomplete-list');
      if (list) {
        list.classList.remove('show');
        if (!autocompleteEnabled) list.innerHTML = '';
      }
    });
    if (autocompleteEnabled) loadInventoryItems();
  }

  async function loadInventoryItems() {
    const sessionToken = getSessionToken();
    if (inventoryLoaded || !sessionToken) return;
    try {
      const res = await fetch(`${getSupabaseUrl()}/rest/v1/inventory_items?select=name,unit,unit_cost,category&order=name.asc`, {
        headers: { apikey: getSupabaseKey(), Authorization: `Bearer ${sessionToken}` }
      });
      if (!res.ok) throw new Error(await window.ETLUtils.readResponseError(res));
      inventoryItems = await res.json();
      inventoryLoaded = true;
    } catch (e) {
      console.warn('Could not load inventory:', e);
    }
  }

  function show(input) {
    const wrap = input.closest('.desc-wrap');
    const list = wrap.querySelector('.autocomplete-list');
    if (!autocompleteEnabled) {
      list.classList.remove('show');
      return;
    }

    const val = input.value.trim().toLowerCase();
    if (!val) {
      list.classList.remove('show');
      return;
    }

    const matches = inventoryItems.filter((item) => String(item.name || '').toLowerCase().includes(val));
    if (!matches.length) {
      list.innerHTML = '<div class="ac-no-results">No items found</div>';
      list.classList.add('show');
      return;
    }

    list.innerHTML = matches.map((item) =>
      `<div class="ac-item" tabindex="0"
        data-name="${window.ETLUtils.escapeHtml(item.name || '')}"
        data-unit="${window.ETLUtils.escapeHtml(item.unit || '')}"
        data-cost="${window.ETLUtils.escapeHtml(item.unit_cost || 0)}">${window.ETLUtils.escapeHtml(item.name || '')}</div>`
    ).join('');

    list.querySelectorAll('.ac-item').forEach((item) => {
      item.addEventListener('mousedown', function (event) {
        event.preventDefault();
        fillRow(input, wrap, list, this.dataset.name, this.dataset.unit, this.dataset.cost);
      });
      item.addEventListener('touchstart', function (event) {
        event.preventDefault();
        fillRow(input, wrap, list, this.dataset.name, this.dataset.unit, this.dataset.cost);
      });
    });
    list.classList.add('show');
  }

  function fillRow(input, wrap, list, name, unit, cost) {
    const row = wrap.closest('tr');
    input.value = name;
    const unitEl = row.querySelector('.i-unit');
    const priceEl = row.querySelector('.i-price');
    if (unitEl) unitEl.value = unit;
    if (priceEl) {
      priceEl.value = cost;
      recalcRow(priceEl);
    }
    list.classList.remove('show');
    list.innerHTML = '';
  }

  function hide(input) {
    const wrap = input.closest('.desc-wrap');
    if (wrap) {
      setTimeout(() => {
        wrap.querySelector('.autocomplete-list').classList.remove('show');
      }, 200);
    }
  }

  function handleKey(event, input) {
    if (!autocompleteEnabled) return;
    const wrap = input.closest('.desc-wrap');
    const list = wrap.querySelector('.autocomplete-list');
    const items = list.querySelectorAll('.ac-item');
    const current = list.querySelector('.highlighted');
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!current) {
        items[0] && items[0].classList.add('highlighted');
      } else {
        current.classList.remove('highlighted');
        (current.nextElementSibling || items[0]).classList.add('highlighted');
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (current) {
        current.classList.remove('highlighted');
        (current.previousElementSibling || items[items.length - 1]).classList.add('highlighted');
      }
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const highlighted = list.querySelector('.highlighted');
      if (highlighted) highlighted.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    } else if (event.key === 'Escape') {
      list.classList.remove('show');
    }
  }

  document.addEventListener('mousedown', function (event) {
    if (!event.target.closest('.desc-wrap')) {
      document.querySelectorAll('.autocomplete-list.show').forEach((list) => list.classList.remove('show'));
    }
  });

  window.ETLLpoInventory = {
    init,
    configure,
    show,
    hide,
    handleKey
  };

  window.showAC = function (input) { window.ETLLpoInventory.show(input); };
  window.hideAC = function (input) { window.ETLLpoInventory.hide(input); };
  window.handleACKey = function (event, input) { window.ETLLpoInventory.handleKey(event, input); };
})();
