const EMAIL_CARD_HEADER = `
  <div style="background:#1a3c6e;padding:20px 24px;border-radius:8px 8px 0 0;">
    <p style="color:#fff;font-size:18px;font-weight:bold;margin:0;">Engineering Trade Links Co. Ltd</p>
    <p style="color:rgba(255,255,255,0.7);font-size:11px;margin:4px 0 0;text-transform:uppercase;letter-spacing:1px;">Quality at Service</p>
  </div>
`;

const EMAIL_FOOTER = `
  <br><br>
  <hr style="border:none;border-top:1px solid #cfe3f0;">
  <p style="font-size:11px;color:#64748b;">Engineering Trade Links Co. Ltd | Plot 1353, Sonde-Seeta Road, Mukono | +256 776 566 522</p>
`;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function linkify(value: string) {
  return value.replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" style="color:#1a3c6e;font-weight:bold;">$1</a>'
  );
}

export function buildEtlEmailHtml(body: string, options?: { includeHeader?: boolean }) {
  const includeHeader = options?.includeHeader ?? false;
  const safeBody = linkify(escapeHtml(body)).replace(/\n/g, "<br>");

  return `
    <div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.8;color:#1e293b;max-width:600px;">
      ${includeHeader ? EMAIL_CARD_HEADER : ""}
      <div style="padding:24px;border:1px solid #cfe3f0;${includeHeader ? "border-top:none;border-radius:0 0 8px 8px;" : "border-radius:8px;"}">
        ${safeBody}
      </div>
      ${EMAIL_FOOTER}
    </div>
  `;
}
