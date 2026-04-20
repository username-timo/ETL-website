import { NextRequest, NextResponse } from "next/server";

const FOOTER_HTML =
  '<br><br><hr style="border:none;border-top:1px solid #cfe3f0;"><p style="font-size:11px;color:#64748b;">Engineering Trade Links Co. Ltd | Plot 1353, Sonde-Seeta Road, Mukono | +256 776 566 522</p>';

function buildHtml(body: string) {
  const safe = body
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const linked = safe.replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" style="color:#1a3c6e;font-weight:bold;">$1</a>'
  );

  return (
    '<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.8;color:#1e293b;max-width:600px;">' +
    linked.replace(/\n/g, "<br>") +
    FOOTER_HTML +
    "</div>"
  );
}

export const POST = async (request: NextRequest) => {
  const brevoApiKey = process.env.BREVO_API_KEY;
  const senderName =
    process.env.BREVO_SENDER_NAME || "Engineering Trade Links Co. Ltd";
  const senderEmail =
    process.env.BREVO_SENDER_EMAIL || "timookui@gmail.com";

  if (!brevoApiKey) {
    return NextResponse.json(
      { error: "BREVO_API_KEY is not configured on the server." },
      { status: 500 }
    );
  }

  let payload: { to?: string; subject?: string; body?: string };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request body." },
      { status: 400 }
    );
  }

  const to = payload.to?.trim();
  const subject = payload.subject?.trim();
  const body = payload.body?.trim();

  if (!to || !to.includes("@")) {
    return NextResponse.json(
      { error: "A valid recipient email is required." },
      { status: 400 }
    );
  }

  if (!subject) {
    return NextResponse.json(
      { error: "Email subject is required." },
      { status: 400 }
    );
  }

  if (!body) {
    return NextResponse.json(
      { error: "Email body is required." },
      { status: 400 }
    );
  }

  const brevoResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": brevoApiKey,
    },
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: [{ email: to }],
      subject,
      htmlContent: buildHtml(body),
    }),
  });

  if (!brevoResponse.ok) {
    const errorText = await brevoResponse.text();
    return NextResponse.json(
      { error: errorText || "Brevo request failed." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
};
