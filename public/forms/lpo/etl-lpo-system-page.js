// LPO system page controller extracted from ETL-LPO-System.html.
  const { SUPABASE_URL, SITE_BASE_URL, DASHBOARD_URL } = window.ETLConfig;
  const SUPABASE_KEY = window.ETLConfig.SUPABASE_ANON_KEY;
  const fmt = ETLUtils.fmtNumber;
  const decode = ETLUtils.decodeHtml;

  let currentMode = 'outward';
  let SESSION_TOKEN = '';
  let IS_ANON = false;

  const today = new Date();
  document.getElementById('date-issue').value = today.toISOString().split('T')[0];
  const del = new Date(today); del.setDate(del.getDate() + 14);
  document.getElementById('date-delivery').value = del.toISOString().split('T')[0];

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

    configureInventoryAutocomplete(!isOut && !IS_ANON && !!SESSION_TOKEN);
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

  async function generateLPO() {
    const isOut = currentMode === 'outward';
    const required = ETLSubmit.validateRequired([
      { id: 'entity-name', label: isOut ? 'Supplier name' : 'Client name', key: 'eName' },
      { id: 'entity-email', label: 'Entity email', key: 'entityEmail' },
      { id: 'lpo-ref', label: 'LPO number', key: 'lpoRef' },
      { id: 'date-issue', label: 'Issue date', key: 'issueDate' },
      { id: 'date-delivery', label: 'Delivery date', key: 'deliveryDate' },
      { id: 'project-name', label: 'Project / contract title', key: 'projectName' }
    ]);
    if (!required.ok) {
      ETLSubmit.alertMissing(required.missing);
      return;
    }
    const { eName, issueDate, deliveryDate } = required.values;

    if(!ETLSubmit.validateDateOrder(issueDate, deliveryDate, 'The delivery date cannot be earlier than the issue date.')) return;

    const itemResult = ETLSubmit.collectItems({ rows: '#items-list tr' });
    if(!itemResult.ok) return;
    const { items, subtotal: grand } = itemResult;

    // Public submitters must pass Turnstile before we save + notify
    if(IS_ANON && ETLLpoTurnstile.isEnabled()) {
      if(!ETLLpoTurnstile.hasPassed()) {
        ETLLpoTurnstile.setMessage('Please complete the security check before submitting your LPO.', true);
        alert('Please complete the security check before submitting your LPO.');
        return;
      }
    }

    // Header
    document.getElementById('doc-hdr').className      = 'doc-header ' + (isOut ? 'doc-header-out' : 'doc-header-in');
    ETLPreview.setTexts({
      'p-direction-badge': isOut ? 'OUTWARD LPO' : 'INWARD LPO',
      'p-lpo-ref': decode(document.getElementById('lpo-ref').value),
      'p-date-i': ETLPreview.formatDate(issueDate),
      'p-date-d': ETLPreview.formatDate(deliveryDate),
      'p-project': document.getElementById('project-name').value || '-',
      'p-delivery-loc': document.getElementById('delivery-location').value || '-',
      'p-pay-terms': document.getElementById('pay-terms').value,
      'p-grand-total': fmt(grand)
    });

    // Parties
    document.getElementById('p-entity-label').className   = 'doc-party-label ' + (isOut ? 'label-out' : 'label-in');
    const tin = document.getElementById('entity-tin').value;
    ETLPreview.setTexts({
      'p-entity-label': isOut ? 'VENDOR / SUPPLIER DETAILS:' : 'CLIENT / ISSUER DETAILS:',
      'p-entity-name': eName,
      'p-entity-contact': document.getElementById('entity-contact').value,
      'p-entity-address': document.getElementById('entity-address').value,
      'p-entity-contact2': document.getElementById('entity-contact2').value,
      'p-entity-tin': tin ? 'TIN: ' + tin : ''
    });

    document.getElementById('p-preparer-sig').innerText = 'Prepared By: ' + (document.getElementById('preparer').value || 'ETL Logistics');

    const totalRow = document.getElementById('p-total-row');
    totalRow.className = 'doc-total-row ' + (isOut ? 'doc-total-out' : 'doc-total-in');

    ETLPreview.renderNotes({
      wrapId: 'p-notes-block',
      textId: 'p-notes-text',
      value: document.getElementById('special-notes').value
    });

    ETLPreview.renderItemRows('p-items-body', items, {
      priceFormatter: fmt,
      totalFormatter: fmt,
      alignTotal: false
    });
    ETLPreview.showPreview('form-section', 'preview-section');
    await saveLPOToSupabase(items, grand);
  }
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


  ETLLpoInventory.init({
    getSessionToken: () => SESSION_TOKEN,
    getSupabaseUrl: () => SUPABASE_URL,
    getSupabaseKey: () => SUPABASE_KEY,
    recalc
  });

  function configureInventoryAutocomplete(enabled) {
    ETLLpoInventory.configure(enabled);
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
    const tsToken = IS_ANON ? ETLLpoTurnstile.getToken() : '';

    try {
      const saveResult = await ETLSubmit.sendJson(`${SUPABASE_URL}/rest/v1/lpos`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${bearer}`,
          'Prefer': 'return=minimal'
        },
        payload,
        errorPrefix: 'Could not save LPO',
        networkPrefix: 'Network error saving LPO'
      });

      if(!saveResult.ok) {
        alert(saveResult.message);
        ETLLpoTurnstile.reset();
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
        const shareToEtl = IS_ANON;
        ETLShare.openSharePanel({
          link,
          clientName: shareToEtl ? 'ETL team' : payload.entity_name,
          phone: shareToEtl ? '+256704545163' : payload.entity_phone,
          label: 'official ETL LPO',
          title: isOut ? 'LPO Saved' : 'LPO Submitted',
          message: isOut
            ? 'The LPO view link is ready. You can copy it or share it directly via WhatsApp.'
            : 'The inward LPO has been submitted. You can copy the link or share it directly via WhatsApp.',
          whatsAppMessage: shareToEtl
            ? `Hello ETL, I have submitted an inward LPO for approval.\n\nLPO Reference: ${cleanLpoNum}\nEntity: ${payload.entity_name}\nTotal: UGX ${payload.total.toLocaleString()}\n\nView link:\n${link}`
            : undefined
        });
      }, 500);
      return true;
    } catch(e) {
      alert('Network error saving LPO: ' + e.message);
      ETLLpoTurnstile.reset();
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

  // Page access model:
  //   • Authenticated staff  → full features (inventory autocomplete, quote prefill, internal notify email)
  //   • Anonymous public     → inward-only submit + Turnstile + rate-limited public email flow
  // We do NOT use etlAuth.init() here because this page is deliberately public.
  (async function bootstrap() {
    const params = new URLSearchParams(window.location.search);
    const forcePublic = params.get('public') === '1';
    const requestedMode = params.get('mode') === 'inward' || params.has('from_quotation') ? 'inward' : 'outward';
    const sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data: { session } } = await sbClient.auth.getSession();
    SESSION_TOKEN = !forcePublic && session ? session.access_token : '';
    window.SESSION_TOKEN = SESSION_TOKEN;
    IS_ANON = forcePublic || !session;

    if(IS_ANON) {
      // Public clients can only submit inward LPOs.
      setMode('inward');
      // Render Turnstile for the public submitter when configured.
      try {
        const res = await fetch('/api/send-email');
        if(!res.ok) return;
        const cfg = await res.json();
        ETLLpoTurnstile.configure(!!cfg.turnstileEnabled, cfg.turnstileSiteKey || '');
      } catch(e) { console.warn('Turnstile config fetch failed:', e); }
    } else {
      setMode(requestedMode);
    }

    // Quote prefill works for both (quote link is unguessable UUID via anon SELECT)
    prefillFromQuotation();
  })();
