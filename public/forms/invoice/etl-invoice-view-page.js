// Invoice view page controller extracted from ETL-Invoice-View.html.
  const SUPABASE_URL = window.ETLConfig.SUPABASE_URL;
  const SUPABASE_KEY = window.ETLConfig.SUPABASE_ANON_KEY;

  function decode(s) { return (s||'').replace(/&#x2F;/g,'/').replace(/&amp;/g,'&').replace(/&#x27;/g,"'"); }
  function fmt(n) { return 'UGX ' + Math.round(n||0).toLocaleString(); }
  function fmtNum(n) { return Math.round(n||0).toLocaleString(); }

  (async function loadInvoice() {
    const params = new URLSearchParams(window.location.search);
    const invLink = params.get('inv');
    if(!invLink) {
      document.getElementById('loading-state').style.display = 'none';
      document.getElementById('error-state').style.display = 'block';
      return;
    }

    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_public_invoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        },
        body: JSON.stringify({ p_unique_link: invLink })
      });
      if(!res.ok) throw new Error(await ETLUtils.readResponseError(res));
      const data = await res.json();

      if(!data || !data.length) {
        document.getElementById('loading-state').style.display = 'none';
        document.getElementById('error-state').style.display = 'block';
        return;
      }

      renderInvoice(data[0]);
    } catch(e) {
      document.getElementById('loading-state').style.display = 'none';
      document.getElementById('error-state').innerHTML = `
        <div class="state-icon">⚠️</div>
        <h2>Connection Error</h2>
        <p>Could not load invoice. Please try again or contact ETL.</p>`;
      document.getElementById('error-state').style.display = 'block';
    }
  })();

  function renderInvoice(inv) {
    const esc = ETLUtils.escapeHtml;
    document.title = `Invoice ${decode(inv.invoice_number)} | ETL`;

    document.getElementById('p-inv-number').innerText = decode(inv.invoice_number);
    document.getElementById('p-ref-num').innerText    = decode(inv.invoice_number);
    document.getElementById('p-inv-date').innerText   = inv.invoice_date || '-';
    document.getElementById('p-inv-due').innerText    = inv.due_date     || '-';
    document.getElementById('p-date').innerText       = inv.invoice_date || '-';
    document.getElementById('p-due').innerText        = inv.due_date     || '-';
    document.getElementById('p-due2').innerText       = inv.due_date     || '-';
    document.getElementById('p-lpo-ref').innerText    = decode(inv.lpo_ref) || '-';
    document.getElementById('p-terms').innerText      = inv.payment_terms || '-';

    document.getElementById('p-client-name').innerText = inv.client_name || '-';
    document.getElementById('p-client-detail').innerText = inv.client_email || '';

    const items = inv.items || [];
    const tbody = document.getElementById('p-items-body');
    tbody.innerHTML = items.map((item, i) => {
      const total = Number(item.total) || ((Number(item.qty) || 0) * (Number(item.price) || 0));
      return `
      <tr>
        <td>${i+1}</td>
        <td>${esc(item.desc || '')}</td>
        <td>${esc(item.unit || '')}</td>
        <td style="text-align:right">${esc(item.qty ?? 0)}</td>
        <td style="text-align:right">${fmtNum(item.price || 0)}</td>
        <td>${fmtNum(total)}</td>
      </tr>`;
    }).join('');

    document.getElementById('p-subtotal').innerText = fmt(inv.subtotal);
    document.getElementById('p-total').innerText    = fmt(inv.total);
    if(inv.vat && inv.vat > 0) {
      document.getElementById('p-vat').innerText = fmt(inv.vat);
      document.getElementById('p-vat-row').style.display = '';
    }

    if(inv.notes) {
      document.getElementById('p-notes').innerText = inv.notes;
      document.getElementById('p-notes-wrap').style.display = '';
    } else {
      document.getElementById('p-notes-wrap').style.display = 'none';
    }

    document.getElementById('ctrl-status').innerText =
      `Invoice ${decode(inv.invoice_number)} | Due: ${inv.due_date}`;
    document.getElementById('loading-state').style.display = 'none';
    document.getElementById('preview-controls').style.display = 'flex';
    document.getElementById('doc-wrap').style.display = 'block';
    window._invoiceData = inv;
  }

  function downloadPDF() {
    const inv = window._invoiceData;
    const num = decode(inv.invoice_number).replace(/\//g,'-').replace(/\s/g,'_');
    const el = document.getElementById('inv-doc');
    html2pdf().set({
      margin: 8,
      filename: `ETL_Invoice_${num}.pdf`,
      image: { type:'jpeg', quality:0.98 },
      html2canvas: { scale:2, useCORS:true },
      jsPDF: { unit:'mm', format:'a4', orientation:'portrait' }
    }).from(el).save();
  }
