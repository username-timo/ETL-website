import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = "https://stpxnnvwhkueyryliehu.supabase.co";

type QuotationRow = {
  id: string;
  reference?: string;
  quote_number?: string;
  client_name?: string;
  client_email?: string;
  project_title?: string;
  valid_until: string;
  total?: number | string;
};

type ReminderResult = {
  id: string;
  email: string;
  status: string;
};

// Called by Cloudflare Cron Trigger. Sends reminders for quotations expiring in 3 days.
export const GET = async (request: NextRequest) => {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET?.trim();
  const isProduction = process.env.NODE_ENV === "production";

  if (!cronSecret && isProduction) {
    console.error("[cron] CRON_SECRET is missing in production");
    return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 500 });
  }

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
  const brevoApiKey = process.env.BREVO_API_KEY;
  const senderName = process.env.BREVO_SENDER_NAME || "Engineering Trade Links Co. Ltd";
  const senderEmail = process.env.BREVO_SENDER_EMAIL || "timookui@gmail.com";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://etluganda.com";

  if (!supabaseKey || !brevoApiKey) {
    return NextResponse.json({ error: "Missing env vars" }, { status: 500 });
  }

  const now = new Date();
  const target = new Date(now);
  target.setDate(target.getDate() + 3);
  const targetDate = target.toISOString().split("T")[0];

  console.info(`[cron] Checking for quotes expiring on ${targetDate}`);

  let quotations: QuotationRow[] = [];

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/quotations_generated?valid_until=eq.${targetDate}&select=id,reference,client_name,client_email,project_title,valid_until,total`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("[cron] Supabase error:", err);
      return NextResponse.json({ error: "Supabase query failed", detail: err }, { status: 502 });
    }

    quotations = await res.json();
  } catch (error) {
    return NextResponse.json({ error: "Supabase fetch failed", detail: String(error) }, { status: 502 });
  }

  console.info(`[cron] Found ${quotations.length} quote(s) expiring on ${targetDate}`);

  if (!quotations.length) {
    return NextResponse.json({ ok: true, sent: 0, message: "No quotes expiring in 3 days" });
  }

  const results: ReminderResult[] = [];

  for (const quote of quotations) {
    if (!quote.client_email || !quote.client_email.includes("@")) {
      results.push({ id: quote.id, email: quote.client_email || "-", status: "skipped: no email" });
      continue;
    }

    const formattedDate = new Date(quote.valid_until).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const formattedTotal = quote.total ? `UGX ${Number(quote.total).toLocaleString()}` : "as quoted";

    const emailBody = `Dear ${quote.client_name || "Valued Client"},

This is a friendly reminder that your quotation from Engineering Trade Links Co. Ltd is expiring in 3 days.

QUOTATION DETAILS:
Quote Reference: ${quote.reference || quote.id}
Project: ${quote.project_title || "-"}
Amount: ${formattedTotal}
Valid Until: ${formattedDate}

To proceed with this quotation or request an extension, please contact us before the expiry date.

Phone: +256 776 566 522
Email: tradelinksltd@gmail.com
Website: ${siteUrl}

Kind regards,
Engineering Trade Links Co. Ltd
Plot 1353, Sonde-Seeta Road, Mukono
"Quality at Service"`;

    try {
      const emailRes = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": brevoApiKey,
        },
        body: JSON.stringify({
          sender: { name: senderName, email: senderEmail },
          to: [{ email: quote.client_email, name: quote.client_name || undefined }],
          subject: `Your ETL quotation expires in 3 days - ${quote.quote_number || quote.project_title || "Action Required"}`,
          htmlContent: buildEmailHtml(emailBody),
        }),
      });

      if (emailRes.ok) {
        console.info(`[cron] Reminder sent to ${quote.client_email} for quote ${quote.reference}`);
        results.push({ id: quote.id, email: quote.client_email, status: "sent" });
      } else {
        const errText = await emailRes.text();
        console.error(`[cron] Brevo failed for ${quote.client_email}:`, errText);
        results.push({ id: quote.id, email: quote.client_email, status: `failed: ${errText}` });
      }
    } catch (error) {
      results.push({ id: quote.id, email: quote.client_email, status: `error: ${String(error)}` });
    }
  }

  const sent = results.filter((result) => result.status === "sent").length;
  console.info(`[cron] Done. ${sent}/${quotations.length} reminder(s) sent.`);

  return NextResponse.json({
    ok: true,
    date: targetDate,
    total: quotations.length,
    sent,
    results,
  });
};

function buildEmailHtml(body: string) {
  const safe = body.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const linked = safe.replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" style="color:#1a3c6e;font-weight:bold;">$1</a>'
  );

  return `
    <div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.8;color:#1e293b;max-width:600px;">
      <div style="background:#1a3c6e;padding:20px 24px;border-radius:8px 8px 0 0;">
        <p style="color:#fff;font-size:18px;font-weight:bold;margin:0;">Engineering Trade Links Co. Ltd</p>
        <p style="color:rgba(255,255,255,0.7);font-size:11px;margin:4px 0 0;text-transform:uppercase;letter-spacing:1px;">Quality at Service</p>
      </div>
      <div style="padding:24px;border:1px solid #cfe3f0;border-top:none;border-radius:0 0 8px 8px;">
        ${linked.replace(/\n/g, "<br>")}
      </div>
      <br>
      <hr style="border:none;border-top:1px solid #cfe3f0;">
      <p style="font-size:11px;color:#64748b;">Engineering Trade Links Co. Ltd | Plot 1353, Sonde-Seeta Road, Mukono | +256 776 566 522</p>
    </div>`;
}
