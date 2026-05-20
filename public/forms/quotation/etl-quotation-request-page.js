// Quotation request page controller extracted from ETL-Quotation-Request.html.
const { SUPABASE_URL, DASHBOARD_URL, SITE_BASE_URL } = window.ETLConfig;
  let TURNSTILE_ENABLED = false;
  let TURNSTILE_SITE_KEY = '';
  let TURNSTILE_TOKEN = '';
  let TURNSTILE_WIDGET_ID = null;
  
  // ─── Brevo Email Helper ───
  async function sendEmail(to, subject, body) {
    const result = await ETLEmail.send(to, subject, body, {
      flow: 'public_quote_request',
      context: 'quotation-request',
      turnstileToken: TURNSTILE_TOKEN
    });
    return result.ok;
  }

  function setTurnstileMessage(message, isError) {
    const el = document.getElementById('turnstile-msg');
    if(!el) return;
    el.textContent = message || '';
    el.classList.toggle('error', !!isError);
  }

  function resetTurnstileWidget() {
    TURNSTILE_TOKEN = '';
    if(TURNSTILE_ENABLED && window.turnstile && TURNSTILE_WIDGET_ID !== null) {
      window.turnstile.reset(TURNSTILE_WIDGET_ID);
    }
  }

  async function submitQuotationPayload(payload) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/quotations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(payload)
    });

    if(res.ok) return { ok: true };
    return { ok: false, error: { message: await ETLUtils.readResponseError(res) } };
  }

  function renderTurnstileWidget() {
    if(!TURNSTILE_ENABLED || !TURNSTILE_SITE_KEY) return;
    const wrap = document.getElementById('turnstile-wrap');
    if(!wrap || !window.turnstile || TURNSTILE_WIDGET_ID !== null) return;

    wrap.style.display = '';
    TURNSTILE_WIDGET_ID = window.turnstile.render('#turnstile-container', {
      sitekey: TURNSTILE_SITE_KEY,
      theme: 'light',
      callback: function(token) {
        TURNSTILE_TOKEN = token || '';
        setTurnstileMessage('', false);
      },
      'expired-callback': function() {
        TURNSTILE_TOKEN = '';
        setTurnstileMessage('Verification expired. Please confirm again.', true);
      },
      'error-callback': function() {
        TURNSTILE_TOKEN = '';
        setTurnstileMessage('Could not load verification. Refresh and try again.', true);
      }
    });
  }

  async function initTurnstile() {
    try {
      const res = await fetch('/api/send-email');
      if(!res.ok) return;
      const data = await res.json();
      TURNSTILE_ENABLED = !!data.turnstileEnabled;
      TURNSTILE_SITE_KEY = data.turnstileSiteKey || '';
      if(!TURNSTILE_ENABLED || !TURNSTILE_SITE_KEY) return;

      const waitForTurnstile = () => {
        if(window.turnstile) renderTurnstileWidget();
        else setTimeout(waitForTurnstile, 150);
      };
      waitForTurnstile();
    } catch(e) {
      console.warn('Turnstile config error:', e);
    }
  }

const SUPABASE_KEY = window.ETLConfig.SUPABASE_ANON_KEY;

  // Checkbox visual toggle
  document.querySelectorAll('.service-check input').forEach(cb => {
    cb.addEventListener('change', () => {
      cb.closest('.service-check').classList.toggle('checked', cb.checked);
    });
  });

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
      button.textContent = selected ? selected.textContent : '— Select Category —';
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
    const select = document.getElementById('p-category');
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

  function generateRef() {
    const yr = new Date().getFullYear();
    const num = String(Math.floor(Math.random() * 900) + 100);
    return `ETL/QR/${yr}/${num}`;
  }

  async function submitRequest() {
    const cName    = document.getElementById('c-name').value.trim();
    const cContact = document.getElementById('c-contact').value.trim();
    const cEmail   = document.getElementById('c-email').value.trim();
    const cPhone   = document.getElementById('c-phone').value.trim();
    const pTitle   = document.getElementById('p-title').value.trim();
    const pDesc    = document.getElementById('p-description').value.trim();

    // Validate
    let valid = true;
    ['c-name','c-contact','c-email','c-phone','p-title','p-description'].forEach(id => {
      const el = document.getElementById(id);
      if(!el.value.trim()) { el.classList.add('required-empty'); valid = false; }
      else el.classList.remove('required-empty');
    });
    if(!valid) { alert('Please fill in all required fields marked with *'); return; }
    if(TURNSTILE_ENABLED && !TURNSTILE_TOKEN) {
      setTurnstileMessage('Please complete the verification before submitting.', true);
      alert('Please complete the verification before submitting your request.');
      return;
    }

    // Get selected services

    const ref = generateRef();
    const btn = document.getElementById('submit-btn');
    btn.disabled = true;
    btn.classList.add('loading');
    btn.querySelector('.spinner').style.display = 'inline-block';

    const payload = {
      client_name:     cName,
      contact_person:  cContact,
      client_email:    cEmail,
      client_phone:    cPhone,
      client_address:  document.getElementById('c-address').value.trim(),
      project_title:   pTitle,
      project_location: document.getElementById('p-location').value.trim(),
          services_category: document.getElementById('p-category').value,
          project_duration:  document.getElementById('p-duration').value.trim(),
      project_description: pDesc,
      estimated_budget: document.getElementById('p-budget').value.trim(),
      reference:       ref,
      status:          'pending_approval'
    };

    try {
      const result = await submitQuotationPayload(payload);

      if(result.ok) {
        // Send email notification to ETL
        const emailSent = await sendEmail('timookui@gmail.com', `🔔 New Request Needs Approval — ${cName} | ${pTitle}`, `A new quotation request has been submitted and requires your approval.

Client: ${cName}
Email: ${cEmail}
Project: ${pTitle}

Dashboard: ${DASHBOARD_URL}`);
        if (!emailSent) console.warn('Quotation request saved, but notification email could not be sent.');

        document.getElementById('request-form').style.display = 'none';
        document.getElementById('success-box').style.display = 'block';
        document.getElementById('success-ref').innerText = `REF: ${ref}`;
        setTimeout(() => {
          ETLShare.openSharePanel({
            link: SITE_BASE_URL + '/ETL-Quotation-Request.html',
            copyValue: `REF: ${ref}`,
            clientName: 'ETL team',
            phone: '+256704545163',
            label: 'ETL quotation request',
            title: 'Request Submitted',
            message: emailSent
              ? 'Your quotation request was submitted. You can also send the reference to ETL via WhatsApp.'
              : 'Your request was saved, but the notification email may not have sent. Please share the reference with ETL via WhatsApp.',
            whatsAppMessage: `Hello ETL, I have submitted a quotation request.\n\nReference: ${ref}\nClient: ${cName}\nPhone: ${cPhone}\nEmail: ${cEmail}\nProject: ${pTitle}\n\nRequest form:\n${SITE_BASE_URL}/ETL-Quotation-Request.html`
          });
        }, 300);
        window.scrollTo(0, 0);
      } else {
        const err = result.error || {};
        alert('Submission failed: ' + (err.message || 'Please try again.'));
        btn.disabled = false;
        btn.classList.remove('loading');
        resetTurnstileWidget();
      }
    } catch(e) {
      alert('Network error. Please check your connection and try again.');
      btn.disabled = false;
      btn.classList.remove('loading');
      resetTurnstileWidget();
    }
  }

  initTurnstile();
