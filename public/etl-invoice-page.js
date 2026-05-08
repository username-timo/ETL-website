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
  function decode(s) {
    if (!s) return '';
    return s.replace(/&#x2F;/g, '/').replace(/&amp;/g, '&').replace(/&#x27;/g, "'").replace(/&quot;/g, '"');
  }

  function fmt(n) {
    return 'UGX ' + Math.round(n || 0).toLocaleString();
  }

  function fmtNum(n) {
    return Math.round(n || 0).toLocaleString();
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

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
    const missing = [];
    const clientName = ETLUtils.requireText('inv-client-name', 'Client name', missing);
    const invNum = decode(ETLUtils.requireText('inv-number', 'Invoice number', missing));
    const invDate = ETLUtils.requireText('inv-date', 'Invoice date', missing);
    const invDue = ETLUtils.requireText('inv-due', 'Due date', missing);

    if (missing.length) {
      alert('Please complete these required fields before generating:\n\n- ' + missing.join('\n- '));
      return;
    }
    if (new Date(invDue) < new Date(invDate)) {
      alert('The due date cannot be earlier than the invoice date.');
      return;
    }
    if (!currentSession || !currentSession.access_token) {
      alert('Your session is not ready. Please refresh and try again.');
      return;
    }

    const rows = document.querySelectorAll('#inv-items tr');
    const { items, subtotal: sub } = ETLUtils.sanitizeItems(rows, {
      desc: '.i-desc',
      unit: '.i-unit',
      qty: '.i-qty',
      price: '.i-price'
    });
    const invalidItem = items.find(item => item.qty <= 0 || item.price <= 0 || item.total <= 0);
    if (!items.length || invalidItem) {
      alert('Please add at least one valid item/service with a description, positive quantity, and positive unit price.');
      return;
    }

    const vatOn = document.getElementById('vat-toggle').checked;
    const vat = vatOn ? sub * 0.18 : 0;
    const grand = sub + vat;
    const terms = document.getElementById('inv-payment-terms').value;
    const notes = document.getElementById('inv-notes').value.trim();
    const invoiceLink = crypto.randomUUID();
    let invoiceViewLink = '';

    try {
      const saveRes = await fetch(`${SUPABASE_URL}/rest/v1/invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${currentSession.access_token}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
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
        })
      });

      if (!saveRes.ok) {
        alert('Could not save invoice: ' + await ETLUtils.readResponseError(saveRes));
        return;
      }
      invoiceViewLink = SITE_BASE_URL + '/ETL-Invoice-View.html?inv=' + invoiceLink;
    } catch (e) {
      alert('Network error saving invoice: ' + e.message);
      return;
    }

    // Fill preview after the database record exists.
    document.getElementById('p-inv-number').innerText = invNum;
    document.getElementById('p-inv-num2').innerText = invNum;
    document.getElementById('p-inv-date').innerText = invDate;
    document.getElementById('p-inv-due').innerText = invDue;
    document.getElementById('p-due2').innerText = invDue;
    document.getElementById('p-lpo-ref').innerText = decode(document.getElementById('inv-lpo-ref').value) || '-';
    document.getElementById('p-project').innerText = document.getElementById('inv-project').value || '-';
    document.getElementById('p-client-name').innerText = clientName;
    document.getElementById('p-contact').innerText = document.getElementById('inv-contact').value || '';
    document.getElementById('p-contact2').innerText = document.getElementById('inv-contact2').value || '';
    document.getElementById('p-address').innerText = document.getElementById('inv-address').value || '';
    document.getElementById('p-payment-terms').innerText = terms;
    document.getElementById('p-preparer-name').innerText = document.getElementById('inv-preparer').value || '';

    document.getElementById('p-inv-items').innerHTML = items.map(it => `
      <tr>
        <td>${it.i}</td>
        <td>${escapeHtml(it.desc)}</td>
        <td>${escapeHtml(it.unit)}</td>
        <td style="text-align: right">${it.qty}</td>
        <td style="text-align: right">${fmtNum(it.price)}</td>
        <td style="text-align: right">${fmtNum(it.total)}</td>
      </tr>
    `).join('');

    document.getElementById('p-subtotal').innerText = fmtNum(sub);
    document.getElementById('p-vat').innerText = fmtNum(vat);
    document.getElementById('p-total').innerText = 'UGX ' + fmtNum(grand);
    document.getElementById('p-vat-row').style.display = vatOn ? 'flex' : 'none';

    if (notes) {
      document.getElementById('p-notes').innerText = notes;
      document.getElementById('p-notes-wrap').style.display = 'block';
    } else {
      document.getElementById('p-notes-wrap').style.display = 'none';
    }

    document.getElementById('form-section').style.display = 'none';
    document.getElementById('invoice-preview').style.display = 'block';
    window.scrollTo(0, 0);

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
      const emailMessage = clientEmail
        ? (emailSent ? 'Sent to: ' + clientEmail : 'Email could not be sent automatically - please share manually with: ' + clientEmail)
        : 'No client email provided - please share manually.';
      alert('Invoice ' + invNum + ' generated!\n\n' + emailMessage);
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
