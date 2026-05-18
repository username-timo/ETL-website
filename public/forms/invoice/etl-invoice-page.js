// Invoice generator page controller extracted from ETL-Invoice.html.
  /* ============================================
     CONFIGURATION
     Anon key is safe for client-side with RLS policies
  ============================================ */
  const { SUPABASE_URL, SITE_BASE_URL, DASHBOARD_URL } = window.ETLConfig;
  const SUPABASE_ANON_KEY = window.ETLConfig.SUPABASE_ANON_KEY;

  let supabaseClient = null;
  let currentSession = null;

  /* ============================================
     UTILITY FUNCTIONS
  ============================================ */
  const decode = ETLUtils.decodeHtml;
  const fmt = ETLUtils.fmtMoney;
  const fmtNum = ETLUtils.fmtNumber;

  /* ============================================
     AUTO-GENERATE INVOICE NUMBER & DATES
  ============================================ */
  (function initForm() {
    const yr = new Date().getFullYear();
    const num = String(Math.floor(Math.random() * 900) + 100);
    document.getElementById('inv-number').value = 'ETL-INV-' + yr + '-' + num;
    
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('inv-date').value = today;
    
    const due = new Date();
    due.setDate(due.getDate() + 30);
    document.getElementById('inv-due').value = due.toISOString().split('T')[0];
  })();

  const invoiceItems = ETLItems.createController({
    selectors: { list: '#inv-items' },
    onTotals(sub) {
    const vatOn = document.getElementById('vat-toggle').checked;
    const vat = vatOn ? sub * 0.18 : 0;
    const total = sub + vat;
    
    document.getElementById('inv-subtotal').innerText = fmt(sub);
    document.getElementById('inv-vat').innerText = fmt(vat);
    document.getElementById('inv-total').innerText = fmt(total);
    document.getElementById('vat-row').style.display = vatOn ? 'flex' : 'none';
    }
  });

  function recalc(el) { invoiceItems.recalc(el); }
  function updateTotals() { invoiceItems.updateTotals(); }
  function addRow() { invoiceItems.addRow(); }
  function removeRow(btn) { invoiceItems.removeRow(btn); }

  /* ============================================
     PREFILL FROM LPO (FIXED)
  ============================================ */
  async function prefillFromLPO() {
    const params = new URLSearchParams(window.location.search);
    const lpoId = params.get('lpo_id');
    
    if (!lpoId) {
      console.log('No lpo_id in URL');
      return;
    }

    if (!currentSession || !currentSession.access_token) {
      console.log('No session yet, will retry later');
      // Wait for session
      setTimeout(() => prefillFromLPO(), 500);
      return;
    }

    try {
      console.log('Fetching LPO:', lpoId);
      const response = await fetch(`${SUPABASE_URL}/rest/v1/lpos?id=eq.${lpoId}&limit=1`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${currentSession.access_token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      if (!data || !data.length) {
        console.warn('No LPO found');
        return;
      }
      
      const l = data[0];
      console.log('LPO data loaded:', l);

      // Fill invoice details
      document.getElementById('inv-lpo-ref').value = decode(l.lpo_number || '');

      // Project name
      if (l.project_name) {
        document.getElementById('inv-project').value = l.project_name;
      } else if (l.notes) {
        document.getElementById('inv-project').value = l.notes;
      }

      // Client details
      document.getElementById('inv-client-name').value = l.entity_name || '';
      document.getElementById('inv-contact').value = l.entity_contact || '';
      document.getElementById('inv-contact2').value = l.entity_phone || '';
      
      // Extract email
      const rawEmail = l.entity_email || '';
      const emailMatch = rawEmail.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
      document.getElementById('inv-client-email').value = emailMatch ? emailMatch[0] : rawEmail;
      document.getElementById('inv-address').value = l.entity_address || '';

      // Fill items
      if (l.items && l.items.length) {
        const tbody = document.getElementById('inv-items');
        tbody.innerHTML = '';
        
        l.items.forEach(item => {
          invoiceItems.addRow({
            desc: item.desc || '',
            unit: item.unit || '',
            qty: item.qty || 1,
            price: item.price || 0
          });
        });
        updateTotals();
      }

      // Show notice
      const notice = document.getElementById('prefill-notice');
      if (notice) {
        notice.style.display = 'block';
        setTimeout(() => {
          notice.style.opacity = '0';
          setTimeout(() => {
            notice.style.display = 'none';
            notice.style.opacity = '';
          }, 1000);
        }, 4000);
      }

    } catch (e) {
      console.error('Prefill error:', e);
      const notice = document.getElementById('prefill-notice');
      if (notice) {
        notice.style.background = 'var(--danger-bg)';
        notice.style.borderColor = 'var(--danger)';
        notice.style.color = 'var(--danger)';
        notice.innerHTML = '⚠️ Could not load LPO data. Please fill in manually.';
        notice.style.display = 'block';
        setTimeout(() => {
          notice.style.display = 'none';
          notice.style.background = '';
          notice.style.borderColor = '';
          notice.style.color = '';
          notice.innerHTML = '✅ Invoice pre-filled from LPO. Review and generate when ready.';
        }, 5000);
      }
    }
  }

  /* ============================================
     GENERATE INVOICE
  ============================================ */
  async function generateInvoice() {
    const required = ETLSubmit.validateRequired([
      { id: 'inv-client-name', label: 'Client name', key: 'clientName' },
      { id: 'inv-number', label: 'Invoice number', key: 'invNum' },
      { id: 'inv-date', label: 'Invoice date', key: 'invDate' },
      { id: 'inv-due', label: 'Due date', key: 'invDue' }
    ]);
    if (!required.ok) {
      ETLSubmit.alertMissing(required.missing);
      return;
    }
    const clientName = required.values.clientName;
    const invNum = decode(required.values.invNum);
    const invDate = required.values.invDate;
    const invDue = required.values.invDue;

    if (!ETLSubmit.validateDateOrder(invDate, invDue, 'The due date cannot be earlier than the invoice date.')) return;
    if (!currentSession || !currentSession.access_token) {
      alert('Your session is not ready. Please refresh and try again.');
      return;
    }

    const itemResult = ETLSubmit.collectItems({
      rows: '#inv-items tr',
      message: 'Please add at least one valid item/service with a description, positive quantity, and positive unit price.'
    });
    if (!itemResult.ok) return;
    const { items, subtotal: sub } = itemResult;

    const vatOn = document.getElementById('vat-toggle').checked;
    const vat = vatOn ? sub * 0.18 : 0;
    const grand = sub + vat;
    const terms = document.getElementById('inv-payment-terms').value;
    const notes = document.getElementById('inv-notes').value.trim();
    const invoiceLink = crypto.randomUUID();
    let invoiceViewLink = '';

    try {
      const saveResult = await ETLSubmit.sendJson(`${SUPABASE_URL}/rest/v1/invoices`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${currentSession.access_token}`,
          'Prefer': 'return=minimal'
        },
        payload: {
          invoice_number: invNum,
          lpo_ref: decode(document.getElementById('inv-lpo-ref').value) || null,
          client_name: clientName,
          client_email: document.getElementById('inv-client-email').value.trim(),
          invoice_date: invDate,
          due_date: invDue,
          subtotal: sub,
          vat: vat,
          total: grand,
          payment_terms: terms,
          notes: notes || null,
          unique_link: invoiceLink,
          items: items
        },
        errorPrefix: 'Could not save invoice',
        networkPrefix: 'Network error saving invoice'
      });

      if (!saveResult.ok) {
        alert(saveResult.message);
        return;
      }
      invoiceViewLink = SITE_BASE_URL + '/ETL-Invoice-View.html?inv=' + invoiceLink;
    } catch (e) {
      alert('Network error saving invoice: ' + e.message);
      return;
    }

    // Fill preview after the database record exists.
    ETLPreview.setTexts({
      'p-inv-number': invNum,
      'p-inv-num2': invNum,
      'p-inv-date': invDate,
      'p-inv-due': invDue,
      'p-due2': invDue,
      'p-lpo-ref': decode(document.getElementById('inv-lpo-ref').value) || '-',
      'p-project': document.getElementById('inv-project').value || '-',
      'p-client-name': clientName,
      'p-contact': document.getElementById('inv-contact').value || '',
      'p-contact2': document.getElementById('inv-contact2').value || '',
      'p-address': document.getElementById('inv-address').value || '',
      'p-payment-terms': terms,
      'p-preparer-name': document.getElementById('inv-preparer').value || ''
    });

    ETLPreview.renderItemRows('p-inv-items', items, {
      priceFormatter: fmtNum,
      totalFormatter: fmtNum,
      alignQty: true
    });

    ETLPreview.setTexts({
      'p-subtotal': fmtNum(sub),
      'p-vat': fmtNum(vat),
      'p-total': 'UGX ' + fmtNum(grand)
    });
    ETLPreview.setDisplay('p-vat-row', vatOn, 'flex');
    ETLPreview.renderNotes({ wrapId: 'p-notes-wrap', textId: 'p-notes', value: notes });
    ETLPreview.showPreview('form-section', 'invoice-preview');

    const clientEmail = document.getElementById('inv-client-email').value.trim();
    const lpoRef = decode(document.getElementById('inv-lpo-ref').value);

    let emailSent = false;
    if (clientEmail) {
      const emailBody = `Dear ${clientName},

Please find your invoice from Engineering Trade Links Co. Ltd.

Invoice Number: ${invNum}
Invoice Date: ${invDate}
Payment Due: ${invDue}
LPO Reference: ${lpoRef || '-'}
Payment Terms: ${terms}

AMOUNT DUE: UGX ${fmtNum(grand)}

Please make payment to:
Bank: Equity Bank Uganda Ltd
Account Name: Engineering Trade Links Co. Ltd

For queries, contact us:
Tel: +256 776 566 522 / +256 704 545 163
Email: tradelinks.ltd@gmail.com

Quality at Service,
Engineering Trade Links Co. Ltd`;

      emailSent = await sendEmail(clientEmail, `Invoice ${invNum} from Engineering Trade Links - UGX ${fmtNum(grand)}`, emailBody + `\n\nView your invoice online:\n${invoiceViewLink}`);
      if (!emailSent) console.warn('Invoice saved, but client email could not be sent.');
    }

    setTimeout(() => {
      const clientPhone = document.getElementById('inv-contact2').value.trim();
      ETLShare.openSharePanel({
        link: invoiceViewLink,
        clientName,
        phone: clientPhone,
        label: 'official ETL invoice',
        title: emailSent ? 'Invoice Sent' : 'Invoice Saved',
        message: clientEmail
          ? (emailSent
            ? `The invoice link was emailed to ${clientEmail}. You can also share it directly via WhatsApp.`
            : `The invoice was saved, but email delivery did not complete. Use WhatsApp or copy the link below.`)
          : 'The invoice was saved. Use WhatsApp or copy the link below to share it with the client.'
      });
    }, 100);
  }

  /* ============================================
     EMAIL HELPER
  ============================================ */
  async function sendEmail(to, subject, body) {
    const result = await ETLEmail.send(to, subject, body, {
      flow: 'internal_ops',
      context: 'invoice'
    });
    return result.ok;
  }

  /* ============================================
     BACK TO FORM & PDF DOWNLOAD
  ============================================ */
  function backToForm() {
    document.getElementById('invoice-preview').style.display = 'none';
    document.getElementById('form-section').style.display = 'block';
    window.scrollTo(0, 0);
  }

  function downloadPDF() {
    const invNum = document.getElementById('inv-number').value.replace(/\//g, '-');
    html2pdf().set({
      margin: 8,
      filename: `ETL_Invoice_${invNum}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).from(document.getElementById('inv-doc')).save();
  }

  /* ============================================
     AUTHENTICATION & INIT
  ============================================ */
  etlAuth.init({ redirectIfNoSession: '/ETL-Dashboard.html' }).then(async () => {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    
    if (error || !session) {
      console.error('Auth error:', error);
      window.location.href = '/ETL-Dashboard.html';
      return;
    }
    
    currentSession = session;
    window.SESSION_TOKEN = session.access_token;
    
    // Load inventory if function exists
    if (typeof loadInventoryItems === 'function') {
      await loadInventoryItems();
    }
    
    // Prefill from LPO after session is ready
    await prefillFromLPO();
  }).catch(err => {
    console.error('Auth init failed:', err);
    window.location.href = '/ETL-Dashboard.html';
  });
