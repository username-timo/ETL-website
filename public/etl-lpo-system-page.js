// LPO system page controller extracted from ETL-LPO-System.html.
  let currentMode = 'outward';

  const today = new Date();
  document.getElementById('date-issue').value = today.toISOString().split('T')[0];
  const del = new Date(today); del.setDate(del.getDate() + 14);
  document.getElementById('date-delivery').value = del.toISOString().split('T')[0];

  function fmt(n) { return Math.round(n).toLocaleString(); }

  function setLpoReference(ref) {
    document.getElementById('lpo-ref').value = ref;
    document.getElementById('lpo-badge-display').innerText = decode(ref);
  }

  function setMode(mode) {
    currentMode = mode;
    const isOut = mode === 'outward';

    // Toggle buttons
    document.getElementById('btn-outward').className = 'mode-btn ' + (isOut ? 'active-outward' : '');
    document.getElementById('btn-inward').className  = 'mode-btn ' + (!isOut ? 'active-inward'  : '');

    // Page header
    const hdr = document.getElementById('page-header');
    hdr.className = isOut ? 'page-header outward-header' : 'page-header inward-header';
    document.getElementById('header-title').innerText = isOut ? 'Outward LPO — ETL to Supplier' : 'Inward LPO — Client to ETL';
    document.getElementById('header-sub').innerText   = isOut ? 'Issue a Local Purchase Order to a supplier or vendor' : 'Record an LPO received from a client awarding ETL a contract';

    // LPO ref prefix
    setLpoReference(ETLUtils.createReference(isOut ? 'LPO' : 'INLPO'));

    // Card styling
    ['card1','card2','card3','card4'].forEach(id => {
      const c = document.getElementById(id);
      c.className = 'form-card ' + (isOut ? 'outward-card' : 'inward-card');
    });
    ['card1-num','card2-num','card3-num','card4-num'].forEach(id => {
      document.getElementById(id).className = isOut ? 'form-card-num-out' : 'form-card-num-in';
    });

    // Labels
    document.getElementById('card1-title').innerText  = isOut ? 'Supplier / Vendor Details' : 'Client / Issuer Details';
    document.getElementById('card1-sub').innerText    = isOut ? 'Details of the company supplying goods or services to ETL' : 'Details of the client issuing ETL this purchase order';
    document.getElementById('entity-label').innerText = isOut ? 'Supplier / Vendor Name *' : 'Client Name *';
    document.getElementById('entity-tin-label').innerText = isOut ? 'Supplier TIN (if available)' : 'Client TIN Number';

    // Generate button
    document.getElementById('btn-generate').className = isOut ? 'btn-generate-out' : 'btn-generate-in';

    // Mode hint
    document.getElementById('mode-hint').innerText = isOut
      ? 'Use Outward when ETL is purchasing goods or services from a supplier.'
      : 'Use Inward when a client has awarded ETL a contract and issued an LPO to ETL.';
  }

  const lpoItems = ETLItems.createController({
    onTotals(sub) {
    document.getElementById('subtotal-display').innerText = 'UGX ' + fmt(sub);
    document.getElementById('grand-display').innerText    = 'UGX ' + fmt(sub);
    }
  });

  function recalc(el) { lpoItems.recalc(el); }
  function updateTotals() { lpoItems.updateTotals(); }
  function addRow() { lpoItems.addRow(); }
  function removeRow(btn) { lpoItems.removeRow(btn); }

  function fmtDate(val) {
    if(!val) return '—';
    try { return new Date(val).toLocaleDateString('en-GB', {day:'numeric',month:'long',year:'numeric'}); }
    catch(e) { return val; }
  }

  async function generateLPO() {
    const isOut = currentMode === 'outward';
    const missing = [];
    const eName = ETLUtils.requireText('entity-name', isOut ? 'Supplier name' : 'Client name', missing);
    ETLUtils.requireText('entity-email', 'Entity email', missing);
    ETLUtils.requireText('lpo-ref', 'LPO number', missing);
    const issueDate = ETLUtils.requireText('date-issue', 'Issue date', missing);
    const deliveryDate = ETLUtils.requireText('date-delivery', 'Delivery date', missing);
    ETLUtils.requireText('project-name', 'Project / contract title', missing);

    if(missing.length) {
      alert('Please complete these required fields before generating:\n\n- ' + missing.join('\n- '));
      return;
    }
    if(new Date(deliveryDate) < new Date(issueDate)) {
      alert('The delivery date cannot be earlier than the issue date.');
      return;
    }

    const rows = document.querySelectorAll('#items-list tr');
    const { items, subtotal: grand } = ETLUtils.sanitizeItems(rows, {
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

    // Public submitters must pass Turnstile before we save + notify
    if(IS_ANON && TURNSTILE_ENABLED) {
      if(!TURNSTILE_TOKEN) {
        setTurnstileMessage('Please complete the security check before submitting your LPO.', true);
        alert('Please complete the security check before submitting your LPO.');
        return;
      }
    }

    // Header
    document.getElementById('doc-hdr').className      = 'doc-header ' + (isOut ? 'doc-header-out' : 'doc-header-in');
    document.getElementById('p-direction-badge').innerText = isOut ? 'OUTWARD LPO' : 'INWARD LPO';

    document.getElementById('p-lpo-ref').innerText   = decode(document.getElementById('lpo-ref').value);
    document.getElementById('p-date-i').innerText    = fmtDate(issueDate);
    document.getElementById('p-date-d').innerText    = fmtDate(deliveryDate);
    document.getElementById('p-project').innerText   = document.getElementById('project-name').value || '-';
    document.getElementById('p-delivery-loc').innerText = document.getElementById('delivery-location').value || '-';
    document.getElementById('p-pay-terms').innerText = document.getElementById('pay-terms').value;

    // Parties
    document.getElementById('p-entity-label').innerText   = isOut ? 'VENDOR / SUPPLIER DETAILS:' : 'CLIENT / ISSUER DETAILS:';
    document.getElementById('p-entity-label').className   = 'doc-party-label ' + (isOut ? 'label-out' : 'label-in');
    document.getElementById('p-entity-name').innerText    = eName;
    document.getElementById('p-entity-contact').innerText = document.getElementById('entity-contact').value;
    document.getElementById('p-entity-address').innerText = document.getElementById('entity-address').value;
    document.getElementById('p-entity-contact2').innerText= document.getElementById('entity-contact2').value;
    const tin = document.getElementById('entity-tin').value;
    document.getElementById('p-entity-tin').innerText = tin ? 'TIN: ' + tin : '';

    document.getElementById('p-preparer-sig').innerText = 'Prepared By: ' + (document.getElementById('preparer').value || 'ETL Logistics');

    const totalRow = document.getElementById('p-total-row');
    totalRow.className = 'doc-total-row ' + (isOut ? 'doc-total-out' : 'doc-total-in');

    const notes = document.getElementById('special-notes').value.trim();
    if(notes) {
      document.getElementById('p-notes-block').style.display = 'block';
      document.getElementById('p-notes-text').innerText = notes;
    } else {
      document.getElementById('p-notes-block').style.display = 'none';
    }

    const tbody = document.getElementById('p-items-body');
    tbody.innerHTML = items.map((item, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${ETLUtils.escapeHtml(item.desc)}</td>
        <td>${ETLUtils.escapeHtml(item.unit)}</td>
        <td>${item.qty}</td>
        <td style="text-align:right;">${fmt(item.price)}</td>
        <td>${fmt(item.total)}</td>
      </tr>`).join('');

    document.getElementById('p-grand-total').innerText = fmt(grand);

    document.getElementById('form-section').style.display    = 'none';
    document.getElementById('preview-section').style.display = 'block';
    window.scrollTo(0, 0);
    await saveLPOToSupabase(items, grand);
  }


  // ── SUPABASE CONFIG ──
const { SUPABASE_URL, SITE_BASE_URL, DASHBOARD_URL } = window.ETLConfig;
  function decode(s) { return (s||'').replace(/&#x2F;/g,'/').replace(/&amp;/g,'&').replace(/&#x27;/g,"'").replace(/&quot;/g,'"'); }

  
  // ─── Brevo Email Helper ───
  async function sendEmail(to, subject, body, opts) {
    opts = opts || {};
    const result = await ETLEmail.send(to, subject, body, {
      ...opts,
      flow: opts.flow || 'internal_ops',
      context: opts.context || 'lpo-system'
    });
    return result.ok;
  }

const SUPABASE_KEY = window.ETLConfig.SUPABASE_ANON_KEY;
  let SESSION_TOKEN = '';
  let IS_ANON = false;
  let TURNSTILE_ENABLED = false;
  let TURNSTILE_SITE_KEY = '';
  let TURNSTILE_TOKEN = '';
  let TURNSTILE_WIDGET_ID = null;

  function setTurnstileMessage(message, isError) {
    const el = document.getElementById('turnstile-msg');
    if(!el) return;
    el.textContent = message || '';
    el.style.color = isError ? '#c53030' : '#64748b';
    el.style.fontWeight = isError ? '700' : '400';
  }

  function resetTurnstileWidget() {
    TURNSTILE_TOKEN = '';
    if(TURNSTILE_ENABLED && window.turnstile && TURNSTILE_WIDGET_ID !== null) {
      window.turnstile.reset(TURNSTILE_WIDGET_ID);
    }
  }

  function renderTurnstileWidget() {
    if(!TURNSTILE_ENABLED || !TURNSTILE_SITE_KEY) return;
    const wrap = document.getElementById('turnstile-wrap');
    if(!wrap || !window.turnstile || TURNSTILE_WIDGET_ID !== null) return;

    wrap.style.display = 'block';
    TURNSTILE_WIDGET_ID = window.turnstile.render('#turnstile-widget', {
      sitekey: TURNSTILE_SITE_KEY,
      theme: 'light',
      callback: function(token) {
        TURNSTILE_TOKEN = token || '';
        setTurnstileMessage('Security check complete.', false);
      },
      'expired-callback': function() {
        TURNSTILE_TOKEN = '';
        setTurnstileMessage('Security check expired. Please confirm again.', true);
      },
      'error-callback': function() {
        TURNSTILE_TOKEN = '';
        setTurnstileMessage('Could not load security check. Refresh and try again.', true);
      }
    });
  }

  function waitForTurnstile() {
    if(window.turnstile && window.turnstile.render) {
      renderTurnstileWidget();
      return;
    }
    setTimeout(waitForTurnstile, 150);
  }

  async function saveLPOToSupabase(items, grand) {
    const uniqueLink = crypto.randomUUID();

    const payload = {
      lpo_number:      decode(document.getElementById('lpo-ref').value),
      direction:       currentMode,
      entity_name:     document.getElementById('entity-name').value.trim(),
      entity_contact:  document.getElementById('entity-contact').value.trim(),
      entity_email:    document.getElementById('entity-email').value.trim(),
      entity_phone:    document.getElementById('entity-contact2').value.trim(),
      entity_address:  document.getElementById('entity-address').value.trim(),
      issue_date:      document.getElementById('date-issue').value,
      delivery_date:   document.getElementById('date-delivery').value,
      items:           items,
      total:           grand,
      notes:           document.getElementById('special-notes').value.trim(),
      project_name:    document.getElementById('project-name').value.trim(),
      delivery_location: document.getElementById('delivery-location').value.trim(),
      status:          'pending_approval',
      unique_link:     uniqueLink
    };

    // When anonymous (public client), we pass the Turnstile token through to the
    // email endpoint. The /rest/v1/lpos call uses the anon key. RLS restricts
    // anonymous INSERT to inward + pending_approval.
    const bearer = SESSION_TOKEN || SUPABASE_KEY;
    const tsToken = (IS_ANON && TURNSTILE_ENABLED) ? TURNSTILE_TOKEN : '';

    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/lpos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${bearer}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(payload)
      });

      if(!res.ok) {
        alert('Could not save LPO: ' + await ETLUtils.readResponseError(res));
        resetTurnstileWidget();
        return false;
      }

      const link = SITE_BASE_URL + '/ETL-LPO-View.html?lpo=' + uniqueLink;
      const isOut = currentMode === 'outward';
      const cleanLpoNum = payload.lpo_number.replace(/&#x2F;/g, '/').replace(/&amp;/g, '&').replace(/&#x27;/g, "'");
      const emailOpts = IS_ANON
        ? { flow: 'public_lpo_submit', context: 'public-lpo-submit', turnstileToken: tsToken }
        : { flow: 'internal_ops', context: 'lpo-system' };
      const emailSent = await sendEmail('timookui@gmail.com', `New ${isOut ? 'Outward' : 'Inward'} LPO Pending Approval - ${cleanLpoNum} | ${payload.entity_name}`, `A new ${isOut ? 'Outward' : 'Inward'} LPO has been submitted and requires your approval.

LPO Number: ${cleanLpoNum}
Direction: ${isOut ? 'OUTWARD (ETL -> Supplier)' : 'INWARD (Client -> ETL)'}
Entity: ${payload.entity_name}
Email: ${payload.entity_email}
Phone: ${payload.entity_phone}
Issue Date: ${payload.issue_date}
Delivery Date: ${payload.delivery_date}
Total: UGX ${payload.total.toLocaleString()}
Notes: ${payload.notes || 'None'}

LPO View Link:
${link}

Dashboard:
${DASHBOARD_URL}`, emailOpts);
      if (!emailSent) console.warn('LPO saved, but notification email could not be sent.');

      setTimeout(() => {
        if(isOut) {
          prompt('LPO saved successfully!\n\nShare this link with the supplier so they can view their LPO:', link);
        } else {
          prompt('Inward LPO recorded successfully!\n\nLPO Reference: ' + cleanLpoNum + '\n\nClient view link:', link);
        }
      }, 500);
      return true;
    } catch(e) {
      alert('Network error saving LPO: ' + e.message);
      resetTurnstileWidget();
      return false;
    }
  }

  function exportPDF() {
    const btns = document.querySelectorAll('.preview-controls button');
    btns.forEach(b => b.style.display = 'none');

    const opt = {
      margin: 0.3,
      filename: `ETL_LPO_${decode(document.getElementById('lpo-ref').value)}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 3 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(document.getElementById('lpo-document')).save().then(() => {
      btns.forEach(b => b.style.display = '');
    });
  }

  // Auto-fill from quotation if opened from quotation view
  async function prefillFromQuotation() {
    const params = new URLSearchParams(window.location.search);
    const qLink = params.get('from_quotation');
    if(!qLink) return;

    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/quotations_generated?unique_link=eq.${qLink}&limit=1`, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SESSION_TOKEN || SUPABASE_KEY}` }
      });
      const data = await res.json();
      if(!data || !data.length) return;
      const q = data[0];

      // Section 1 — Client details
      document.getElementById('entity-name').value    = q.client_name    || '';
      document.getElementById('entity-contact').value = q.contact_person || '';
      document.getElementById('entity-contact2').value = q.client_phone || '';
      document.getElementById('entity-email').value    = q.client_email  || '';
      document.getElementById('entity-address').value = q.client_address || '';
      document.getElementById('project-name').value   = q.project_title  || '';
      document.getElementById('delivery-location').value = q.project_location || '';

      // Auto-generate LPO reference and dates
      const today = new Date();
      setLpoReference(ETLUtils.createReference('INLPO'));
      document.getElementById('date-issue').value = today.toISOString().split('T')[0];
      // Default delivery 30 days from now
      const delivery = new Date(today); delivery.setDate(delivery.getDate() + 30);
      document.getElementById('date-delivery').value = delivery.toISOString().split('T')[0];

            // Section 3 — Pre-fill items from quotation
      const qItems = q.items || [];
      if(qItems.length) {
        const tbody = document.getElementById('items-list');
        tbody.innerHTML = '';
        qItems.forEach(item => {
          const desc  = item.desc  || item.description || item.name || '';
          const unit  = item.unit  || '';
          const qty   = item.qty   || item.quantity || 1;
          const price = item.price || item.unit_price || item.unitPrice || 0;
          lpoItems.addRow({ desc, unit, qty, price });
        });
        updateTotals();
      }
      // dummy to avoid syntax issue

      // Show success notice
      const notice = document.createElement('div');
      notice.style.cssText = 'background:#e6f7ef;border:1px solid #0f7a4a;color:#0f7a4a;padding:12px 18px;border-radius:8px;font-size:13px;font-weight:700;margin-bottom:16px;';
      notice.innerText = '✅ Client details and items pre-filled from your quotation. Please review and submit.';
      document.querySelector('.form-card') && document.querySelector('.form-card').prepend(notice);

    } catch(e) { console.warn('Could not pre-fill from quotation:', e); }
  }

  // Load inventory for autocomplete
  let inventoryItems = [];
  async function loadInventoryItems() {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/inventory_items?select=name,unit,unit_cost,category&order=name.asc`, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SESSION_TOKEN}` }
      });
      inventoryItems = await res.json();
    } catch(e) { console.warn('Could not load inventory:', e); }
  }

  // Page access model:
  //   • Authenticated staff  → full features (inventory autocomplete, quote prefill, internal notify email)
  //   • Anonymous public     → inward-only submit + Turnstile + rate-limited public email flow
  // We do NOT use etlAuth.init() here because this page is deliberately public.
  (async function bootstrap() {
    const params = new URLSearchParams(window.location.search);
    const forcePublic = params.get('public') === '1';
    const sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data: { session } } = await sbClient.auth.getSession();
    SESSION_TOKEN = !forcePublic && session ? session.access_token : '';
    IS_ANON = forcePublic || !session;

   
  

    if(IS_ANON) {
      // Public clients can only submit inward LPOs.
      setMode('inward');
      // Render Turnstile for the public submitter when configured.
      try {
        const res = await fetch('/api/send-email');
        if(!res.ok) return;
        const cfg = await res.json();
        TURNSTILE_ENABLED = !!cfg.turnstileEnabled;
        TURNSTILE_SITE_KEY = cfg.turnstileSiteKey || '';
        if(TURNSTILE_ENABLED && TURNSTILE_SITE_KEY) waitForTurnstile();
      } catch(e) { console.warn('Turnstile config fetch failed:', e); }
    } else {
      // Authenticated staff start from outward LPOs.
      setMode('outward');
      // Staff-only features
      loadInventoryItems();
    }

    // Quote prefill works for both (quote link is unguessable UUID via anon SELECT)
    prefillFromQuotation();
  })();

  // Close dropdowns when clicking outside
  document.addEventListener('mousedown', function(e) {
    if(!e.target.closest('.desc-wrap')) {
      document.querySelectorAll('.autocomplete-list.show').forEach(l => l.classList.remove('show'));
    }
  });

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
    // Attach events to each item
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
    const unitEl = row.querySelector('.i-unit');
    const priceEl = row.querySelector('.i-price');
    if(unitEl) unitEl.value = unit;
    if(priceEl) {
      priceEl.value = cost;
      recalc(priceEl);
    }
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
