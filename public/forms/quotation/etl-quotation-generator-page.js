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
      window.SESSION_TOKEN = SESSION_TOKEN;
    } catch(e) {
      console.warn('Could not refresh quotation session:', e);
    }
    return SESSION_TOKEN;
  }

  async function saveQuotationToSupabase(ref, preparedTotals) {
    const sessionToken = await ensureSessionToken();
    if (!sessionToken) {
      alert('Your dashboard session is still loading. Please wait a moment, then generate the quotation again.');
      return false;
    }

    const prepared = preparedTotals || {};
    const items = prepared.items || [];
    const sub = Number(prepared.subtotal) || 0;
    const vat = Number(prepared.vat) || 0;
    const grand = Number(prepared.grand) || sub + vat;

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
      const saveResult = await ETLSubmit.sendJson(`${SUPABASE_URL}/rest/v1/quotations_generated`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${sessionToken}`,
          'Prefer': 'return=minimal'
        },
        payload,
        errorPrefix: 'Could not save quotation',
        networkPrefix: 'Network error saving quotation'
      });

      if(!saveResult.ok) {
        console.error('Supabase error:', saveResult.error);
        alert(saveResult.message);
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
        const updateResult = await ETLSubmit.sendJson(`${SUPABASE_URL}/rest/v1/quotations?id=eq.${SOURCE_REQUEST_ID}`, {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${sessionToken}`,
            'Prefer': 'return=minimal'
          },
          payload: { status: 'responded', quotation_link: link, responded_at: new Date().toISOString() },
          errorPrefix: 'Could not update source request status'
        });
        if(!updateResult.ok) {
          console.warn('Could not update source request status:', updateResult.error);
        }
      }
      if(SOURCE_LPO_ID) {
        const updateResult = await ETLSubmit.sendJson(`${SUPABASE_URL}/rest/v1/lpos?id=eq.${SOURCE_LPO_ID}`, {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${sessionToken}`,
            'Prefer': 'return=minimal'
          },
          payload: { status: 'issued' },
          errorPrefix: 'Could not update source procurement request status'
        });
        if(!updateResult.ok) {
          console.warn('Could not update source procurement request status:', updateResult.error);
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
    window.SESSION_TOKEN = SESSION_TOKEN;
    loadInventoryItems();
    await prefillFromLpoRequest();
  });

  // ref_id: the quotations row this quotation was generated from
  let SOURCE_REQUEST_ID = '';
  let SOURCE_LPO_ID = '';

  // Auto-fill from dashboard request if URL params present
  (function() {
    const params = new URLSearchParams(window.location.search);
    SOURCE_REQUEST_ID = params.get('ref_id') || '';
    SOURCE_LPO_ID = params.get('lpo_id') || '';
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

  async function prefillFromLpoRequest() {
    if (!SOURCE_LPO_ID) return;

    try {
      const response = await etlAuth.fetch(`/rest/v1/lpos?id=eq.${encodeURIComponent(SOURCE_LPO_ID)}&select=*&limit=1`);
      if (!response.ok) throw new Error(await ETLUtils.readResponseError(response));

      const [request] = await response.json();
      if (!request) return;

      document.getElementById('c-name').value = request.entity_name || '';
      document.getElementById('c-contact').value = request.entity_contact || '';
      document.getElementById('c-email').value = request.entity_email || '';
      document.getElementById('c-phone').value = request.entity_phone || '';
      document.getElementById('c-address').value = request.entity_address || '';
      document.getElementById('p-title').value = request.project_name || `Procurement Request ${request.lpo_number || ''}`;
      document.getElementById('p-location').value = request.delivery_location || '';
      document.getElementById('p-scope').value = request.notes || `Source and price the requested items under ${request.lpo_number || 'the customer procurement request'}.`;
      document.getElementById('p-cat').value = 'Other';

      const requestedItems = request.items || [];
      if (requestedItems.length) {
        document.getElementById('items-list').innerHTML = '';
        requestedItems.forEach(item => {
          quoteItems.addRow({
            desc: item.desc || item.description || item.name || '',
            unit: item.unit || '',
            qty: item.qty ?? item.quantity ?? 1,
            price: 0
          });
        });
        updateTotals();
      }

      const notice = document.createElement('div');
      notice.style.cssText = 'background:#e6f7ef;border:1px solid #0f7a4a;color:#0f7a4a;padding:12px 18px;border-radius:8px;font-size:13px;font-weight:700;margin-bottom:16px;';
      notice.innerText = 'Customer procurement request loaded. Source the items, confirm units, enter prices, and send the quotation.';
      document.querySelector('.form-section')?.prepend(notice);
    } catch (error) {
      console.warn('Could not load customer procurement request:', error);
      alert('Could not load the customer procurement request. Open it from the dashboard and try again.');
    }
  }

  async function generatePreview() {
    const required = ETLSubmit.validateRequired([
      { id: 'c-name', label: 'Client name', key: 'cName' },
      { id: 'p-title', label: 'Project title', key: 'pTitle' },
      { id: 'p-scope', label: 'Project scope', key: 'pScope' },
      { id: 'q-num', label: 'Quotation number', key: 'ref' },
      { id: 'q-date', label: 'Quotation date', key: 'quoteDate' },
      { id: 'q-expiry', label: 'Valid-until date', key: 'expiryDate' }
    ]);
    if (!required.ok) {
      ETLSubmit.alertMissing(required.missing);
      return;
    }
    const { cName, ref, quoteDate, expiryDate } = required.values;

    if(!ETLSubmit.validateDateOrder(quoteDate, expiryDate, 'The valid-until date cannot be earlier than the quotation date.')) return;

    const itemResult = ETLSubmit.collectItems({ rows: '#items-list tr' });
    if(!itemResult.ok) return;
    const { items, subtotal: sub } = itemResult;

    const formattedExpiry = ETLPreview.formatDate(expiryDate);
    ETLPreview.setTexts({
      'p-qnum': ref,
      'p-date': ETLPreview.formatDate(quoteDate),
      'p-expiry': formattedExpiry,
      'p-category': document.getElementById('p-cat').value || '-',
      'p-location-ref': document.getElementById('p-location').value || '-',
      'p-duration-ref': document.getElementById('p-duration').value || '-',
      'p-payment-ref': document.getElementById('q-payment').value || 'Negotiable',
      'p-terms-payment': document.getElementById('q-payment').value || 'Negotiable',
      'p-client-name': cName,
      'p-contact': document.getElementById('c-contact').value,
      'p-client-address': document.getElementById('c-address').value,
      'p-client-email': document.getElementById('c-email').value,
      'p-client-phone': document.getElementById('c-phone').value,
      'p-proj-title': document.getElementById('p-title').value || '-',
      'p-scope-text': document.getElementById('p-scope').value,
      'p-terms-expiry': formattedExpiry
    });

    ETLPreview.renderItemRows('p-items-body', items);

    const vatChecked = document.getElementById('vat-check').checked;
    const vat   = vatChecked ? sub * 0.18 : 0;
    const grand = sub + vat;

    ETLPreview.setTexts({
      'p-subtotal': ETLUtils.fmtNumber(sub),
      'p-vat-amt': ETLUtils.fmtNumber(vat),
      'p-grand-total': ETLUtils.fmtNumber(grand)
    });
    ETLPreview.setDisplay('p-vat-row', vatChecked);
    ETLPreview.showPreview('form-section', 'preview-section');
    await saveQuotationToSupabase(ref, { items, subtotal: sub, vat, grand });
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
