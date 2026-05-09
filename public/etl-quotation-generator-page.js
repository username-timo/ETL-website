// Quotation generator page controller extracted from ETL-Quotation-generator.html.

  // ── SUPABASE ──
const { SUPABASE_URL, SITE_BASE_URL } = window.ETLConfig;
  
  // ─── Brevo Email Helper ───
  async function sendEmail(to, subject, body, options = {}) {
    return ETLEmail.send(to, subject, body, {
      ...options,
      flow: options.flow || 'internal_ops',
      context: options.context || 'quotation-delivery',
      invalidMessage: 'No valid client email address was entered.'
    });
  }

const SUPABASE_KEY = window.ETLConfig.SUPABASE_ANON_KEY;
  let SESSION_TOKEN = '';

  async function ensureSessionToken() {
    if (SESSION_TOKEN) return SESSION_TOKEN;
    try {
      const sbClient = etlAuth.getClient();
      const { data: { session } } = await sbClient.auth.getSession();
      SESSION_TOKEN = session ? session.access_token : '';
    } catch(e) {
      console.warn('Could not refresh quotation session:', e);
    }
    return SESSION_TOKEN;
  }

  async function saveQuotationToSupabase(ref) {
    const sessionToken = await ensureSessionToken();
    if (!sessionToken) {
      alert('Your dashboard session is still loading. Please wait a moment, then generate the quotation again.');
      return false;
    }

    const rows = document.querySelectorAll('#items-list tr');
    const { items, subtotal: sub } = ETLUtils.sanitizeItems(rows, {
      desc: '.i-desc',
      unit: '.i-unit',
      qty: '.i-qty',
      price: '.i-price'
    });
    const vat   = document.getElementById('vat-check').checked ? sub * 0.18 : 0;
    const grand = sub + vat;

    const uniqueLink = crypto.randomUUID();
    const payload = {
      ref_id:           SOURCE_REQUEST_ID || null,
      reference:        ref,
      unique_link:      uniqueLink,
      client_name:      document.getElementById('c-name').value.trim(),
      contact_person:   document.getElementById('c-contact').value.trim(),
      client_email:     document.getElementById('c-email').value.trim(),
      client_phone:     document.getElementById('c-phone').value.trim(),
      client_address:   document.getElementById('c-address').value.trim(),
      project_title:    document.getElementById('p-title').value.trim(),
      project_location: document.getElementById('p-location').value.trim(),
      services_category: document.getElementById('p-cat').value.trim(),
      project_duration: document.getElementById('p-duration').value.trim(),
      project_description: document.getElementById('p-scope').value.trim(),
      quote_date:       document.getElementById('q-date').value || null,
      valid_until:      document.getElementById('q-expiry').value || null,
      payment_terms:    document.getElementById('q-payment').value.trim(),
      items:            items,
      subtotal:         sub,
      vat:              vat,
      total:            grand,
      notes:            '',
      status:           'sent'
    };
    const link = SITE_BASE_URL + '/ETL-Quotation-View.html?q=' + uniqueLink;
    const clientName = document.getElementById('c-name').value.trim();
    const clientPhone = document.getElementById('c-phone').value.trim();

    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/quotations_generated`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${sessionToken}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(payload)
      });

      if(!res.ok) {
        const err = await ETLUtils.readResponseError(res);
        console.error('Supabase error:', err);
        alert('Could not save quotation: ' + err);
        return false;
      }

      const cEmail   = document.getElementById('c-email').value.trim();
      const pTitle   = document.getElementById('p-title').value.trim();
      const payTerms = document.getElementById('q-payment').value.trim();
      const subject  = `Your Quotation from Engineering Trade Links - ${pTitle}`;
      const body     = `Dear ${clientName},

Thank you for choosing Engineering Trade Links Co. Ltd.

Please find your official quotation for ${pTitle} at the link below.

Quotation Reference: ${ref}
Payment Terms: ${payTerms}

Click the link below to view, download and print your quotation:`;

      const emailResult = await sendEmail(cEmail, subject, body + '\n\nYour quotation link:\n' + link, {
        context: 'generated-quotation-delivery'
      });

      if(SOURCE_REQUEST_ID) {
        const updateRes = await fetch(`${SUPABASE_URL}/rest/v1/quotations?id=eq.${SOURCE_REQUEST_ID}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${sessionToken}`,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ status: 'responded', quotation_link: link, responded_at: new Date().toISOString() })
        });
        if(!updateRes.ok) {
          console.warn('Could not update source request status:', await ETLUtils.readResponseError(updateRes));
        }
      }

      setTimeout(() => {
        ETLShare.openSharePanel({
          link,
          clientName,
          phone: clientPhone,
          label: 'official ETL quotation',
          title: emailResult.ok ? 'Quotation Sent' : 'Quotation Saved',
          message: emailResult.ok
            ? `The quotation link was emailed to ${cEmail}. You can also share it directly via WhatsApp.`
            : `The quotation was saved, but email delivery did not complete: ${emailResult.error || 'Unknown email error'}. Use WhatsApp or copy the link below.`
        });
      }, 400);
      return true;
    } catch(e) {
      console.error('Network error:', e);
      alert('Network error saving quotation: ' + e.message);
      return false;
    }
  }

  // Load inventory items for autocomplete
  let inventoryItems = [];
  async function loadInventoryItems() {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/inventory_items?order=name.asc&select=name,unit,unit_cost`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SESSION_TOKEN}`
        }
      });
      inventoryItems = await res.json();
    } catch(e) { console.warn('Could not load inventory items:', e); }
  }

  function showAC(input) {
    const wrap = input.closest('.desc-wrap');
    const list = wrap.querySelector('.autocomplete-list');
    const val = input.value.trim().toLowerCase();
    if(!val) { list.classList.remove('show'); return; }
    const matches = inventoryItems.filter(i => i.name.toLowerCase().includes(val));
    if(!matches.length) {
      list.innerHTML = '<div class="ac-no-results">No items found</div>';
      list.classList.add('show');
      return;
    }
    list.innerHTML = matches.map(i =>
      `<div class="ac-item" tabindex="0"
        data-name="${i.name.replace(/"/g,'&quot;')}"
        data-unit="${i.unit}"
        data-cost="${i.unit_cost||0}">${i.name}</div>`
    ).join('');
    list.querySelectorAll('.ac-item').forEach(item => {
      item.addEventListener('mousedown', function(e) {
        e.preventDefault();
        fillRow(input, wrap, list, this.dataset.name, this.dataset.unit, this.dataset.cost);
      });
      item.addEventListener('touchstart', function(e) {
        e.preventDefault();
        fillRow(input, wrap, list, this.dataset.name, this.dataset.unit, this.dataset.cost);
      });
    });
    list.classList.add('show');
  }

  function fillRow(input, wrap, list, name, unit, cost) {
    const row = wrap.closest('tr');
    input.value = name;
    const unitEl  = row.querySelector('.i-unit');
    const priceEl = row.querySelector('.i-price');
    if(unitEl)  unitEl.value  = unit;
    if(priceEl) { priceEl.value = cost; recalc(priceEl); }
    list.classList.remove('show');
    list.innerHTML = '';
  }

  function hideAC(input) {
    const wrap = input.closest('.desc-wrap');
    if(wrap) setTimeout(() => {
      wrap.querySelector('.autocomplete-list').classList.remove('show');
    }, 200);
  }

  function handleACKey(e, input) {
    const wrap = input.closest('.desc-wrap');
    const list = wrap.querySelector('.autocomplete-list');
    const items = list.querySelectorAll('.ac-item');
    const current = list.querySelector('.highlighted');
    if(e.key === 'ArrowDown') {
      e.preventDefault();
      if(!current) { items[0] && items[0].classList.add('highlighted'); }
      else { current.classList.remove('highlighted'); (current.nextElementSibling || items[0]).classList.add('highlighted'); }
    } else if(e.key === 'ArrowUp') {
      e.preventDefault();
      if(current) { current.classList.remove('highlighted'); (current.previousElementSibling || items[items.length-1]).classList.add('highlighted'); }
    } else if(e.key === 'Enter') {
      e.preventDefault();
      const hi = list.querySelector('.highlighted');
      if(hi) hi.dispatchEvent(new MouseEvent('mousedown', {bubbles:true}));
    } else if(e.key === 'Escape') {
      list.classList.remove('show');
    }
  }

  function selectAC() {}

  function setQuotationReference(ref) {
    document.getElementById('q-num').value = ref;
    document.getElementById('q-number-display').innerText = ref;
  }

  // Auto-generate a collision-resistant quotation number.
  (function() {
    setQuotationReference(ETLUtils.createReference('QT'));
  })();

  // Gate data loading on Supabase Auth
  etlAuth.init({ redirectIfNoSession: '/ETL-Dashboard.html' }).then(async () => {
    const sbClient = etlAuth.getClient();
    const { data: { session } } = await sbClient.auth.getSession();
    SESSION_TOKEN = session ? session.access_token : '';
    loadInventoryItems();
  });

  // Close all dropdowns when clicking outside
  document.addEventListener('mousedown', function(e) {
    if(!e.target.closest('.desc-wrap')) {
      document.querySelectorAll('.autocomplete-list.show').forEach(l => l.classList.remove('show'));
    }
  });

  // ref_id: the quotations row this quotation was generated from
  let SOURCE_REQUEST_ID = '';

  // Auto-fill from dashboard request if URL params present
  (function() {
    const params = new URLSearchParams(window.location.search);
    SOURCE_REQUEST_ID = params.get('ref_id') || '';
    if(params.get('client_name')) {
      document.getElementById('c-name').value     = params.get('client_name') || '';
      document.getElementById('c-contact').value  = params.get('contact_person') || '';
      document.getElementById('c-email').value    = params.get('client_email') || '';
      document.getElementById('c-phone').value    = params.get('client_phone') || '';
      document.getElementById('c-address').value  = params.get('client_address') || '';
      document.getElementById('p-title').value    = params.get('project_title') || '';
      document.getElementById('p-location').value = params.get('project_location') || '';
      document.getElementById('p-scope').value    = params.get('project_description') || '';
      // Category - set matching option
      const catSel = document.getElementById('p-cat');
      const catVal = params.get('services_category') || '';
      if(catVal) {
        const catClean = catVal.replace(/&amp;/g,'&').replace(/&#x2F;/g,'/').trim();
        for(let opt of catSel.options) {
          if(opt.value === catClean || opt.text === catClean || opt.text.includes(catClean) || catClean.includes(opt.text)) { opt.selected = true; break; }
        }
      }
      // Duration
      document.getElementById('p-duration').value = params.get('project_duration') || '';
      // Also try p-description key (from request form)
      if(!document.getElementById('p-scope').value) {
        document.getElementById('p-scope').value = params.get('p_description') || '';
      }
      const notice = document.createElement('div');
      notice.style.cssText = 'background:#e6f7ef;border:1px solid #0f7a4a;color:#0f7a4a;padding:12px 18px;border-radius:8px;font-size:13px;font-weight:700;margin-bottom:16px;';
      notice.innerText = '✅ Client details pre-filled from quotation request. Review and complete the line items below.';
      document.querySelector('.form-section') && document.querySelector('.form-section').prepend(notice);
    }
  })();

  // Set today's date as default
  const today = new Date();
  document.getElementById('q-date').value = today.toISOString().split('T')[0];
  const expiry = new Date(today); expiry.setDate(expiry.getDate() + 30);
  document.getElementById('q-expiry').value = expiry.toISOString().split('T')[0];

  function fmt(n) { return 'UGX ' + Math.round(n).toLocaleString(); }

  const quoteItems = ETLItems.createController({
    priceAttrs: {
      title: 'Auto-filled from inventory',
      style: 'background:var(--lighter-bg)'
    },
    onTotals(sub) {
    const vat = document.getElementById('vat-check').checked ? sub * 0.18 : 0;
    const grand = sub + vat;

    document.getElementById('subtotal-display').innerText = fmt(sub);
    document.getElementById('vat-display').innerText      = fmt(vat);
    document.getElementById('grand-display').innerText    = fmt(grand);
    document.getElementById('vat-row').style.display = vat > 0 ? 'flex' : 'none';
    }
  });

  function recalc(el) { quoteItems.recalc(el); }
  function updateTotals() { quoteItems.updateTotals(); }

  function addItem() { quoteItems.addRow(); }
  function removeRow(btn) { quoteItems.removeRow(btn); }

  async function generatePreview() {
    const missing = [];
    const cName = ETLUtils.requireText('c-name', 'Client name', missing);
    ETLUtils.requireText('p-title', 'Project title', missing);
    ETLUtils.requireText('p-scope', 'Project scope', missing);
    const ref = ETLUtils.requireText('q-num', 'Quotation number', missing);
    const quoteDate = ETLUtils.requireText('q-date', 'Quotation date', missing);
    const expiryDate = ETLUtils.requireText('q-expiry', 'Valid-until date', missing);

    if(missing.length) {
      alert('Please complete these required fields before generating:\n\n- ' + missing.join('\n- '));
      return;
    }
    if(new Date(expiryDate) < new Date(quoteDate)) {
      alert('The valid-until date cannot be earlier than the quotation date.');
      return;
    }

    const rows = document.querySelectorAll('#items-list tr');
    const { items, subtotal: sub } = ETLUtils.sanitizeItems(rows, {
      desc: '.i-desc',
      unit: '.i-unit',
      qty: '.i-qty',
      price: '.i-price'
    });
    const invalidItem = items.find(item => item.qty <= 0 || item.price <= 0 || item.total <= 0);
    if(!items.length || invalidItem) {
      alert('Please add at least one valid line item with a description, positive quantity, and positive unit price.');
      return;
    }

    document.getElementById('p-qnum').innerText    = ref;
    document.getElementById('p-date').innerText    = new Date(quoteDate).toLocaleDateString('en-GB', {day:'numeric',month:'long',year:'numeric'});
    document.getElementById('p-expiry').innerText  = new Date(expiryDate).toLocaleDateString('en-GB', {day:'numeric',month:'long',year:'numeric'});

    document.getElementById('p-category').innerText     = document.getElementById('p-cat').value || '-';
    document.getElementById('p-location-ref').innerText = document.getElementById('p-location').value || '-';
    document.getElementById('p-duration-ref').innerText = document.getElementById('p-duration').value || '-';
    document.getElementById('p-payment-ref').innerText   = document.getElementById('q-payment').value || 'Negotiable';
    document.getElementById('p-terms-payment').innerText  = document.getElementById('q-payment').value || 'Negotiable';

    document.getElementById('p-client-name').innerText    = cName;
    document.getElementById('p-contact').innerText        = document.getElementById('c-contact').value;
    document.getElementById('p-client-address').innerText = document.getElementById('c-address').value;
    document.getElementById('p-client-email').innerText   = document.getElementById('c-email').value;
    document.getElementById('p-client-phone').innerText   = document.getElementById('c-phone').value;

    document.getElementById('p-proj-title').innerText  = document.getElementById('p-title').value || '-';
    document.getElementById('p-scope-text').innerText  = document.getElementById('p-scope').value;
    document.getElementById('p-terms-expiry').innerText  = new Date(expiryDate).toLocaleDateString('en-GB', {day:'numeric',month:'long',year:'numeric'});

    const tbody  = document.getElementById('p-items-body');
    tbody.innerHTML = items.map((item, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${ETLUtils.escapeHtml(item.desc)}</td>
        <td>${ETLUtils.escapeHtml(item.unit)}</td>
        <td>${item.qty}</td>
        <td style="text-align:right;">${ETLUtils.fmtNumber(item.price)}</td>
        <td>${ETLUtils.fmtNumber(item.total)}</td>
      </tr>`).join('');

    const vatChecked = document.getElementById('vat-check').checked;
    const vat   = vatChecked ? sub * 0.18 : 0;
    const grand = sub + vat;

    document.getElementById('p-subtotal').innerText   = ETLUtils.fmtNumber(sub);
    document.getElementById('p-vat-row').style.display = vatChecked ? '' : 'none';
    document.getElementById('p-vat-amt').innerText    = ETLUtils.fmtNumber(vat);
    document.getElementById('p-grand-total').innerText = ETLUtils.fmtNumber(grand);

    document.getElementById('form-section').style.display    = 'none';
    document.getElementById('preview-section').style.display = 'block';
    window.scrollTo(0, 0);
    await saveQuotationToSupabase(ref);
  }

  const categoryMediaQuery = window.matchMedia('(max-width: 600px)');
  function closeMobileCategoryPicker(picker) {
    if(picker) picker.classList.remove('open');
  }
  function renderMobileCategoryPicker(select) {
    const existing = select.nextElementSibling?.classList?.contains('mobile-category-picker') ? select.nextElementSibling : null;
    if(existing) existing.remove();

    select.removeAttribute('size');
    select.classList.add('mobile-native-hidden');

    const picker = document.createElement('div');
    picker.className = 'mobile-category-picker';

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'mobile-category-button';

    const menu = document.createElement('div');
    menu.className = 'mobile-category-menu';

    const syncButton = () => {
      const selected = select.options[select.selectedIndex];
      button.textContent = selected ? selected.textContent : '-- Select Category --';
      menu.querySelectorAll('.mobile-category-option').forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.value === select.value);
      });
    };

    Array.from(select.options).forEach(option => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'mobile-category-option';
      item.dataset.value = option.value;
      item.textContent = option.textContent;
      item.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        select.value = option.value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        syncButton();
        closeMobileCategoryPicker(picker);
      });
      menu.appendChild(item);
    });

    button.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      picker.classList.toggle('open');
    });
    select.addEventListener('change', syncButton);
    document.addEventListener('click', event => {
      if(!picker.contains(event.target)) closeMobileCategoryPicker(picker);
    });

    picker.appendChild(button);
    picker.appendChild(menu);
    select.insertAdjacentElement('afterend', picker);
    syncButton();
  }
  function syncMobileCategoryPicker() {
    const select = document.getElementById('p-cat');
    if(!select) return;
    if(categoryMediaQuery.matches) {
      if(!select.nextElementSibling?.classList?.contains('mobile-category-picker')) renderMobileCategoryPicker(select);
    } else {
      select.removeAttribute('size');
      select.classList.remove('mobile-native-hidden');
      const picker = select.nextElementSibling?.classList?.contains('mobile-category-picker') ? select.nextElementSibling : null;
      if(picker) picker.remove();
    }
  }
  syncMobileCategoryPicker();
  if(categoryMediaQuery.addEventListener) categoryMediaQuery.addEventListener('change', syncMobileCategoryPicker);
  else categoryMediaQuery.addListener(syncMobileCategoryPicker);
