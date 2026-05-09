(function () {
  let currentShareLink = '';

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
    const companyPhone = opts.companyPhone || '+256 776 566 522';
    const label = opts.label || 'official ETL document';
    const text = opts.message || (
      `Hello ${clientName}, please find your ${label} at the link below:\n\n` +
      `${link}\n\nKind regards,\n${companyName}\n${companyPhone}`
    );
    const encoded = encodeURIComponent(text);
    return phone ? `https://wa.me/${phone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
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
    const overlay = document.getElementById(opts.overlayId || 'share-overlay');
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

    currentShareLink = opts.link || '';
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
