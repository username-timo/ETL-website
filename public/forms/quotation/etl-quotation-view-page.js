// Quotation view page controller extracted from ETL-Quotation-View.html.
  const { SUPABASE_URL, SITE_BASE_URL } = window.ETLConfig;
  const SUPABASE_KEY = window.ETLConfig.SUPABASE_ANON_KEY;

  function fmtDate(d) {
    if(!d) return '—';
    try { return new Date(d).toLocaleDateString('en-GB', {day:'numeric', month:'long', year:'numeric'}); }
    catch(e) { return d; }
  }
  function fmt(n) { return 'UGX ' + Math.round(n||0).toLocaleString(); }

  async function loadQuotation() {
    const params = new URLSearchParams(window.location.search);
    const qLink  = params.get('q');

    if(!qLink) {
      document.getElementById('loading-state').style.display = 'none';
      document.getElementById('error-state').style.display   = 'block';
      return;
    }

    try {
      const res  = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_public_quotation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        },
        body: JSON.stringify({ p_unique_link: qLink })
      });
      if(!res.ok) throw new Error(await ETLUtils.readResponseError(res));
      const data = await res.json();

      if(!data || !data.length) {
        document.getElementById('loading-state').style.display = 'none';
        document.getElementById('error-state').style.display   = 'block';
        return;
      }

      renderQuotation(data[0]);
    } catch(e) {
      document.getElementById('loading-state').style.display = 'none';
      document.getElementById('error-state').innerHTML = `
        <div class="state-icon">⚠️</div><h2>Connection Error</h2>
        <p>Could not load your quotation. Please check your connection and try again.<br><br>
        Contact ETL at +256 776 566 522</p>`;
      document.getElementById('error-state').style.display = 'block';
    }
  }

  function renderQuotation(q) {
    window._quotationData = q; // store for LPO pre-fill
    const esc = ETLUtils.escapeHtml;
    document.getElementById('p-qnum').innerText    = q.reference || '-';
    document.getElementById('p-ref').innerText     = q.reference || '-';
    document.getElementById('p-date').innerText    = fmtDate(q.quote_date || q.created_at);
    document.getElementById('p-expiry').innerText  = fmtDate(q.valid_until);
    document.getElementById('p-project').innerText = q.project_title || '-';
    document.getElementById('p-location').innerText= q.project_location || '-';
    document.getElementById('p-status').innerText  = q.status || '-';

    document.getElementById('p-client-name').innerText  = q.client_name || '-';
    document.getElementById('p-client-detail').innerHTML = [
      q.contact_person,
      q.client_address,
      [q.client_email, q.client_phone].filter(Boolean).join(' ')
    ].filter(Boolean).map(esc).join('<br>');

    document.getElementById('p-proj-title').innerText = q.project_title || '-';
    document.getElementById('p-scope').innerText      = q.project_description || '-';

    const lpoBtn = document.getElementById('lpo-submit-btn');
    if(lpoBtn && q.unique_link) {
      lpoBtn.href = `ETL-LPO-System.html?from_quotation=${encodeURIComponent(q.unique_link)}`;
    }
    const printUrl = document.getElementById('lpo-print-url');
    if(printUrl && q.unique_link) {
      const lpoUrl = `${SITE_BASE_URL}/ETL-LPO-System.html?from_quotation=${encodeURIComponent(q.unique_link)}`;
      printUrl.innerHTML = `Submit your LPO online: <span style="font-weight:400;color:var(--text);">${esc(lpoUrl)}</span>`;
    }

    const items = q.items || [];
    const tbody = document.getElementById('p-items-body');
    tbody.innerHTML = items.map((item, i) => `
      <tr>
        <td>${i+1}</td>
        <td>${esc(item.desc || '-')}</td>
        <td>${esc(item.unit || '-')}</td>
        <td>${esc(item.qty ?? 0)}</td>
        <td style="text-align:right;">${ETLUtils.fmtNumber(item.price || 0)}</td>
        <td style="text-align:right;">${ETLUtils.fmtNumber(item.total || 0)}</td>
      </tr>`).join('');

    document.getElementById('p-subtotal').innerText = fmt(q.subtotal);
    document.getElementById('p-total').innerText    = fmt(q.total);
    if(q.vat && q.vat > 0) {
      document.getElementById('p-vat-row').style.display = '';
      document.getElementById('p-vat').innerText = fmt(q.vat);
    }

    document.getElementById('loading-state').style.display = 'none';
    document.getElementById('controls').style.display      = 'flex';
    document.getElementById('quot-wrap').style.display     = 'block';
  }

  function exportPDF() {
    const btns = document.querySelectorAll('.preview-controls button');
    btns.forEach(b => b.style.display = 'none');
    const ref = document.getElementById('p-qnum').innerText;
    const opt = {
      margin: 0.3,
      filename: `ETL_Quotation_${ref}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 3 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(document.getElementById('quotation-doc')).save().then(() => {
      btns.forEach(b => b.style.display = '');
    });
  }

  loadQuotation();
