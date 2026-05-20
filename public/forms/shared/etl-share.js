(function () {
  let currentShareLink = '';
  const SHARE_STYLE_ID = 'etl-share-panel-styles';
  const DEFAULT_ETL_WHATSAPP = '+256704545163';

  function normalizeUgandaPhone(phone) {
    const cleaned = String(phone || '').replace(/[^0-9+]/g, '');
    if (!cleaned) return '';
    if (cleaned.startsWith('0')) return '256' + cleaned.slice(1);
    return cleaned.replace(/^\+/, '');
  }

  function buildWhatsAppUrl(options) {
    const opts = options || {};
    const link = opts.link || '';
    const clientName = opts.clientName || 'there';
    const phone = normalizeUgandaPhone(opts.phone);
    const companyName = opts.companyName || 'Engineering Trade Links Co. Ltd';
    const companyPhone = opts.companyPhone || DEFAULT_ETL_WHATSAPP;
    const label = opts.label || 'official ETL document';
    const text = opts.message || (
      `Hello ${clientName}, please find your ${label} at the link below:\n\n` +
      `${link}\n\nKind regards,\n${companyName}\n${companyPhone}`
    );
    const encoded = encodeURIComponent(text);
    return phone ? `https://wa.me/${phone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
  }

  function ensureShareStyles() {
    if (document.getElementById(SHARE_STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = SHARE_STYLE_ID;
    style.textContent = `
      .share-overlay { display:none; position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; align-items:center; justify-content:center; padding:20px; }
      .share-overlay.open { display:flex; }
      .share-panel { background:#fff; border-radius:14px; max-width:480px; width:100%; padding:28px 28px 24px; box-shadow:0 8px 40px rgba(0,0,0,0.2); }
      .share-panel h3 { font-family:'Barlow Condensed',sans-serif; font-size:20px; font-weight:900; color:var(--primary,#1a3c6e); text-transform:uppercase; margin-bottom:6px; }
      .share-panel p { font-size:13px; color:var(--text-muted,#64748b); margin-bottom:16px; }
      .share-link-box { display:flex; gap:8px; margin-bottom:20px; }
      .share-link-box input { flex:1; min-width:0; padding:10px 12px; border:1.5px solid var(--border,#cfe3f0); border-radius:8px; font-size:12px; font-family:inherit; color:var(--text,#1e293b); background:var(--lighter-bg,#f5f9fd); outline:none; }
      .share-link-box button { padding:10px 16px; background:var(--light-bg,#eaf2fb); border:1.5px solid var(--border,#cfe3f0); border-radius:8px; font-size:12px; font-weight:700; color:var(--primary,#1a3c6e); cursor:pointer; white-space:nowrap; transition:all 0.2s; }
      .share-link-box button:hover { background:var(--secondary,#4fa3d1); color:#fff; border-color:var(--secondary,#4fa3d1); }
      .share-btns { display:flex; gap:10px; flex-wrap:wrap; }
      .btn-whatsapp { flex:1; display:flex; align-items:center; justify-content:center; gap:8px; padding:14px 20px; background:#25D366; color:#fff; border:none; border-radius:10px; font-family:'Barlow Condensed',sans-serif; font-size:18px; font-weight:800; text-transform:uppercase; cursor:pointer; text-decoration:none; transition:all 0.2s; }
      .btn-whatsapp:hover { background:#1ebe5d; transform:translateY(-1px); box-shadow:0 6px 20px rgba(37,211,102,0.35); }
      .btn-share-close { padding:14px 20px; background:var(--lighter-bg,#f5f9fd); color:var(--text-muted,#64748b); border:1.5px solid var(--border,#cfe3f0); border-radius:10px; font-weight:700; font-size:13px; cursor:pointer; transition:all 0.2s; }
      .btn-share-close:hover { border-color:var(--secondary,#4fa3d1); color:var(--primary,#1a3c6e); }
      @media (max-width:520px) {
        .share-panel { padding:24px 20px 20px; }
        .share-link-box { flex-direction:column; }
        .share-btns { flex-direction:column; }
        .btn-whatsapp, .btn-share-close { width:100%; }
      }
    `;
    document.head.appendChild(style);
  }

  function ensureSharePanel(options) {
    ensureShareStyles();
    const overlayId = options.overlayId || 'share-overlay';
    let overlay = document.getElementById(overlayId);
    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.className = 'share-overlay';
    overlay.id = overlayId;
    overlay.innerHTML = `
      <div class="share-panel">
        <h3>Ready to Share</h3>
        <p>You can copy the link or share it directly via WhatsApp.</p>
        <div class="share-link-box">
          <input type="text" id="${options.inputId || 'share-link-input'}" name="document_share_link" aria-label="Document share link" readonly onclick="this.select()">
          <button type="button" onclick="copyShareLink()">&#128203; Copy</button>
        </div>
        <div class="share-btns">
          <a id="${options.whatsAppButtonId || 'whatsapp-btn'}" href="#" target="_blank" rel="noopener" class="btn-whatsapp">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Send via WhatsApp
          </a>
          <button type="button" class="btn-share-close" onclick="closeSharePanel()">Close</button>
        </div>
      </div>
    `;
    overlay.addEventListener('click', function (event) {
      if (event.target === overlay) closeSharePanel(overlayId);
    });
    document.body.appendChild(overlay);
    return overlay;
  }

  function copyText(text, button, copiedLabel, defaultLabel) {
    const originalLabel = button ? (button.dataset.defaultText || button.innerText || defaultLabel || 'Copy') : defaultLabel;
    if (button && !button.dataset.defaultText) button.dataset.defaultText = originalLabel;
    const resetButton = function () {
      if (button) button.innerText = originalLabel || 'Copy';
    };
    const markCopied = function () {
      if (button) {
        button.innerText = copiedLabel || 'Copied!';
        setTimeout(resetButton, 2000);
      }
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(markCopied).catch(function () {
        document.execCommand('copy');
        markCopied();
      });
    }
    document.execCommand('copy');
    markCopied();
    return Promise.resolve();
  }

  function openSharePanel(config) {
    const opts = config || {};
    const overlay = ensureSharePanel(opts);
    const panel = overlay ? overlay.querySelector('.share-panel') : null;
    const linkInput = document.getElementById(opts.inputId || 'share-link-input');
    const whatsAppButton = document.getElementById(opts.whatsAppButtonId || 'whatsapp-btn');
    const previewWhatsAppButton = document.getElementById(opts.previewWhatsAppButtonId || 'preview-whatsapp-btn');
    if (!overlay || !panel || !linkInput || !whatsAppButton) return;

    const title = opts.title || 'Ready to Share';
    const message = opts.message || 'You can copy the link or share it directly via WhatsApp.';
    const whatsAppUrl = buildWhatsAppUrl({
      link: opts.link,
      clientName: opts.clientName,
      phone: opts.phone,
      label: opts.label,
      message: opts.whatsAppMessage,
      companyName: opts.companyName,
      companyPhone: opts.companyPhone
    });

    currentShareLink = opts.copyValue || opts.link || '';
    linkInput.value = currentShareLink;
    panel.querySelector('h3').textContent = title;
    panel.querySelector('p').textContent = message;
    whatsAppButton.href = whatsAppUrl;

    if (previewWhatsAppButton) {
      previewWhatsAppButton.href = whatsAppUrl;
      previewWhatsAppButton.style.display = '';
    }

    overlay.classList.add('open');
  }

  function closeSharePanel(overlayId) {
    const overlay = document.getElementById(overlayId || 'share-overlay');
    if (overlay) overlay.classList.remove('open');
  }

  function copyShareLink(inputId) {
    const input = document.getElementById(inputId || 'share-link-input');
    if (!input) return;
    input.select();
    copyText(currentShareLink || input.value, input.nextElementSibling, 'Copied!', 'Copy');
  }

  window.ETLShare = {
    buildWhatsAppUrl,
    closeSharePanel,
    copyShareLink,
    copyText,
    normalizeUgandaPhone,
    openSharePanel
  };

  window.showSharePanel = function (link, clientName, clientPhone, options) {
    openSharePanel({
      ...(options || {}),
      link,
      clientName,
      phone: clientPhone,
      label: (options && options.label) || 'official ETL quotation'
    });
  };
  window.closeSharePanel = function () { closeSharePanel(); };
  window.copyShareLink = function () { copyShareLink(); };
})();
