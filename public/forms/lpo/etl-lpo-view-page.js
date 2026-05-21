// LPO view page controller extracted from ETL-LPO-View.html.
  const SUPABASE_URL = window.ETLConfig.SUPABASE_URL;
  const SUPABASE_KEY = window.ETLConfig.SUPABASE_ANON_KEY;

  function fmtDate(d) {
    if(!d) return '—';
    try { return new Date(d).toLocaleDateString('en-GB', {day:'numeric', month:'long', year:'numeric'}); }
    catch(e) { return d; }
  }

  function fmt(n) { return Math.round(n||0).toLocaleString(); }

  async function loadLPO() {
    // Get unique_link from URL ?lpo=xxxx
    const params = new URLSearchParams(window.location.search);
    const lpoLink = params.get('lpo');

    if(!lpoLink) {
      document.getElementById('loading-state').style.display = 'none';
      document.getElementById('error-state').style.display = 'block';
      return;
    }

    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_public_lpo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        },
        body: JSON.stringify({ p_unique_link: lpoLink })
      });
      if(!res.ok) throw new Error(await ETLUtils.readResponseError(res));
      const data = await res.json();

      if(!data || !data.length) {
        document.getElementById('loading-state').style.display = 'none';
        document.getElementById('error-state').style.display = 'block';
        return;
      }

      const lpo = data[0];
      renderLPO(lpo);

    } catch(e) {
      document.getElementById('loading-state').style.display = 'none';
      document.getElementById('error-state').innerHTML = `
        <div class="state-icon">⚠️</div>
        <h2>Connection Error</h2>
        <p>Could not load your LPO. Please check your internet connection and try again.<br><br>
        If the problem persists, contact ETL at +256 776 566 522</p>`;
      document.getElementById('error-state').style.display = 'block';
    }
  }

  function renderLPO(lpo) {
    const isOut = lpo.direction === 'outward';
    const esc = ETLUtils.escapeHtml;

    document.getElementById('doc-header').className = 'doc-header ' + (isOut ? 'out' : 'in');

    document.getElementById('p-lpo-badge').innerText = lpo.lpo_number || '-';
    document.getElementById('p-lpo-ref').innerText   = lpo.lpo_number || '-';
    document.getElementById('p-date-i').innerText    = fmtDate(lpo.issue_date);
    document.getElementById('p-date-d').innerText    = fmtDate(lpo.delivery_date);
    document.getElementById('p-direction').innerText = isOut ? 'ETL -> Supplier' : 'Client -> ETL';

    const entityLabel = document.getElementById('p-entity-label');
    entityLabel.innerText   = isOut ? 'VENDOR / SUPPLIER DETAILS:' : 'CLIENT / ISSUER DETAILS:';
    entityLabel.className   = 'party-label ' + (isOut ? 'label-out' : 'label-in');
    document.getElementById('p-entity-name').innerText   = lpo.entity_name || '-';
    const entityDetails = [
      lpo.entity_phone ? `Phone: ${lpo.entity_phone}` : '',
      lpo.entity_email ? `Email: ${lpo.entity_email}` : '',
      lpo.entity_address ? `Address: ${lpo.entity_address}` : ''
    ].filter(Boolean);
    document.getElementById('p-entity-detail').innerHTML = entityDetails.length ? entityDetails.map(esc).join('<br>') : '-';

    const items  = lpo.items || [];
    const tbody  = document.getElementById('p-items-body');
    tbody.innerHTML = items.map((item, i) => `
      <tr>
        <td>${i+1}</td>
        <td>${esc(item.desc || '-')}</td>
        <td>${esc(item.unit || '-')}</td>
        <td>${esc(item.qty ?? 0)}</td>
        <td style="text-align:right;">${fmt(item.price)}</td>
        <td style="text-align:right;">${fmt(item.total)}</td>
      </tr>`).join('');

    document.getElementById('p-grand-total').innerText = fmt(lpo.total);
    document.getElementById('p-total-row').className   = 'total-row ' + (isOut ? 'out' : 'in');

    if(lpo.notes) {
      document.getElementById('p-notes-block').style.display = 'block';
      document.getElementById('p-notes-text').innerText = lpo.notes;
    } else {
      document.getElementById('p-notes-block').style.display = 'none';
    }

    document.getElementById('loading-state').style.display = 'none';
    document.getElementById('controls').style.display      = 'flex';
    document.getElementById('lpo-wrap').style.display      = 'block';
    document.title = `LPO ${lpo.lpo_number || ''} - Engineering Trade Links`;
  }

  function exportPDF() {
    const btns = document.querySelectorAll('.preview-controls button');
    btns.forEach(b => b.style.display = 'none');
    const lpoNum = document.getElementById('p-lpo-ref').innerText;
    const opt = {
      margin: 0.3,
      filename: `ETL_LPO_${lpoNum}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 3 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(document.getElementById('lpo-document')).save().then(() => {
      btns.forEach(b => b.style.display = '');
    });
  }

  // Load on page open
  loadLPO();
