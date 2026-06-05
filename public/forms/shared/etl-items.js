(function () {
  const DEFAULT_SELECTORS = {
    list: '#items-list',
    desc: '.i-desc',
    unit: '.i-unit',
    qty: '.i-qty',
    price: '.i-price',
    total: '.row-total'
  };

  function attrsToString(attrs) {
    return Object.entries(attrs || {})
      .filter(([, value]) => value !== undefined && value !== null && value !== false)
      .map(([key, value]) => `${key}="${ETLUtils.escapeHtml(value)}"`)
      .join(' ');
  }

  function createRowHtml(options, values) {
    const opts = options || {};
    const item = values || {};
    const autocomplete = opts.autocomplete !== false;
    const desc = ETLUtils.escapeHtml(item.desc || '');
    const unit = ETLUtils.escapeHtml(item.unit || '');
    const qty = item.qty ?? 1;
    const price = item.price ?? 0;
    const total = ETLUtils.fmtNumber((Number(qty) || 0) * (Number(price) || 0));
    const priceAttrs = attrsToString(opts.priceAttrs);
    const descPlaceholder = ETLUtils.escapeHtml(opts.descPlaceholder || 'Search inventory or type...');
    const unitPlaceholder = ETLUtils.escapeHtml(opts.unitPlaceholder || 'Unit');
    const descEvents = autocomplete
      ? 'oninput="showAC(this)" onkeydown="handleACKey(event,this)" onblur="hideAC(this)" autocomplete="off"'
      : '';
    const autocompleteList = autocomplete ? '<div class="autocomplete-list"></div>' : '';

    return `
      <td class="item-description-cell"><div class="desc-wrap"><input type="text" class="i-desc" name="item_desc[]" aria-label="Line item description" value="${desc}" placeholder="${descPlaceholder}" ${descEvents}>${autocompleteList}</div></td>
      <td class="commercial-only"><input type="text" class="i-unit" name="item_unit[]" aria-label="Line item unit" value="${unit}" placeholder="${unitPlaceholder}"></td>
      <td class="item-quantity-cell"><input type="number" class="i-qty" name="item_qty[]" aria-label="Line item quantity" value="${ETLUtils.escapeHtml(qty)}" min="0" oninput="recalc(this)"></td>
      <td class="commercial-only"><input type="number" class="i-price" name="item_price[]" aria-label="Line item unit price" value="${ETLUtils.escapeHtml(price)}" min="0" oninput="recalc(this)" ${priceAttrs}></td>
      <td class="commercial-only"><span class="row-total">${total}</span></td>
      <td class="item-remove-cell"><button class="btn-rm" onclick="removeRow(this)" title="Remove">&times;</button></td>
    `;
  }

  function createController(options) {
    const opts = options || {};
    const selectors = { ...DEFAULT_SELECTORS, ...(opts.selectors || {}) };

    function getList() {
      return document.querySelector(selectors.list);
    }

    function getRows() {
      return Array.from(document.querySelectorAll(`${selectors.list} tr`));
    }

    function rowTotal(row) {
      const qty = ETLUtils.parseAmount(row.querySelector(selectors.qty)?.value);
      const price = ETLUtils.parseAmount(row.querySelector(selectors.price)?.value);
      return qty * price;
    }

    function updateRow(row) {
      const totalEl = row.querySelector(selectors.total);
      if (totalEl) totalEl.innerText = ETLUtils.fmtNumber(rowTotal(row));
    }

    function updateTotals() {
      const subtotal = getRows().reduce((sum, row) => sum + rowTotal(row), 0);
      if (typeof opts.onTotals === 'function') opts.onTotals(subtotal);
      return subtotal;
    }

    function recalc(el) {
      const row = el.closest('tr');
      if (row) updateRow(row);
      updateTotals();
    }

    function addRow(values) {
      const tr = document.createElement('tr');
      tr.innerHTML = createRowHtml(opts, values);
      getList().appendChild(tr);
      updateTotals();
      return tr;
    }

    function clearRow(row) {
      row.querySelector(selectors.desc).value = '';
      row.querySelector(selectors.unit).value = '';
      row.querySelector(selectors.qty).value = '1';
      row.querySelector(selectors.price).value = '0';
      const totalEl = row.querySelector(selectors.total);
      if (totalEl) totalEl.innerText = '0';
    }

    function removeRow(btn) {
      const rows = getRows();
      if (rows.length > 1) {
        btn.closest('tr').remove();
        updateTotals();
        return;
      }

      const row = btn.closest('tr');
      if (row) clearRow(row);
      updateTotals();
    }

    return {
      addRow,
      recalc,
      removeRow,
      updateTotals
    };
  }

  window.ETLItems = {
    createController,
    createRowHtml
  };
})();
