import { NextRequest, NextResponse } from "next/server";

const FOOTER_HTML =
  '<br><br><hr style="border:none;border-top:1px solid #cfe3f0;"><p style="font-size:11px;color:#64748b;">Engineering Trade Links Co. Ltd | Plot 1353, Sonde-Seeta Road, Mukono | +256 776 566 522</p>';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FLOW_CONFIG = {
  internal_ops: {
    rateLimit: { max: 20, windowMs: 5 * 60 * 1000 },
    requiresTurnstile: false,
    allowedOrigins: [] as string[],
  },
  public_quote_request: {
    rateLimit: { max: 3, windowMs: 15 * 60 * 1000 },
    requiresTurnstile: true,
    allowedOrigins: [] as string[],
  },
} as const;

type FlowName = keyof typeof FLOW_CONFIG;

type EmailPayload = {
  to?: string;
  subject?: string;
  body?: string;
  flow?: FlowName;
  turnstileToken?: string;
  context?: string;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const rateLimitStore = new Map<string, RateLimitEntry>();

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

function getClientIp(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("cf-connecting-ip") || "unknown";
}

function getOrigin(request: NextRequest) {
  return request.headers.get("origin") || "";
}

function getConfiguredOrigins(request: NextRequest) {
  const configured = process.env.EMAIL_ALLOWED_ORIGINS
    ?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (configured?.length) return configured;

  const url = new URL(request.url);
  return [url.origin];
}

function getPublicFlowRecipients(senderEmail: string) {
  const configured = process.env.PUBLIC_QUOTE_NOTIFICATION_EMAILS
    ?.split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  if (configured?.length) return configured;
  return [senderEmail.toLowerCase()];
}

function cleanStore(now: number) {
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt <= now) rateLimitStore.delete(key);
  }
}

function applyRateLimit(flow: FlowName, ip: string) {
  const now = Date.now();
  cleanStore(now);

  const { max, windowMs } = FLOW_CONFIG[flow].rateLimit;
  const key = `${flow}:${ip}`;
  const existing = rateLimitStore.get(key);

  if (!existing || existing.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: max - 1, resetAt: now + windowMs };
  }

  if (existing.count >= max) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  rateLimitStore.set(key, existing);
  return {
    allowed: true,
    remaining: Math.max(0, max - existing.count),
    resetAt: existing.resetAt,
  };
}

function validatePayload(payload: EmailPayload) {
  const to = payload.to?.trim() || "";
  const subject = payload.subject?.trim() || "";
  const body = payload.body?.trim() || "";
  const flow = payload.flow || "internal_ops";
  const context = (payload.context || flow).trim().slice(0, 80);

  if (!(flow in FLOW_CONFIG)) {
    return { error: "Invalid email flow." };
  }

  if (!to || !EMAIL_RE.test(to)) {
    return { error: "A valid recipient email is required." };
  }

  if (!subject) {
    return { error: "Email subject is required." };
  }

  if (subject.length > 180) {
    return { error: "Email subject is too long." };
  }

  if (!body) {
    return { error: "Email body is required." };
  }

  if (body.length > 12000) {
    return { error: "Email body is too long." };
  }

  return {
    data: {
      to,
      subject,
      body,
      flow: flow as FlowName,
      context,
      turnstileToken: payload.turnstileToken?.trim() || "",
    },
  };
}

async function verifyTurnstileToken(
  request: NextRequest,
  token: string,
  ip: string
) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    return { ok: false, error: "TURNSTILE_SECRET_KEY is not configured." };
  }

  if (!token) {
    return { ok: false, error: "Turnstile verification is required." };
  }

  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret,
        response: token,
        remoteip: ip,
      }),
    }
  );

  const result = (await response.json()) as {
    success?: boolean;
    "error-codes"?: string[];
  };

  if (!result.success) {
    return {
      ok: false,
      error:
        "Turnstile verification failed." +
        (result["error-codes"]?.length
          ? ` (${result["error-codes"].join(", ")})`
          : ""),
    };
  }

  return { ok: true };
}

export const GET = async () => {
  const turnstileEnabled = Boolean(
    process.env.TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET_KEY
  );

  return NextResponse.json({
    turnstileEnabled,
    turnstileSiteKey: process.env.TURNSTILE_SITE_KEY || "",
  });
};

export const POST = async (request: NextRequest) => {
  const brevoApiKey = process.env.BREVO_API_KEY;
  const senderName =
    process.env.BREVO_SENDER_NAME || "Engineering Trade Links Co. Ltd";
  const senderEmail =
    process.env.BREVO_SENDER_EMAIL || "timookui@gmail.com";
  const turnstileEnabled = Boolean(
    process.env.TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET_KEY
  );
  const ip = getClientIp(request);
  const origin = getOrigin(request);

  if (!brevoApiKey) {
    console.error("[email] Missing BREVO_API_KEY");
    return NextResponse.json(
      { error: "BREVO_API_KEY is not configured on the server." },
      { status: 500 }
    );
  }

  let payload: EmailPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request body." },
      { status: 400 }
    );
  }

  const validated = validatePayload(payload);
  if ("error" in validated) {
    console.warn("[email] Validation failed", { ip, error: validated.error });
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const { to, subject, body, flow, context, turnstileToken } = validated.data;
  const flowConfig = FLOW_CONFIG[flow];
  const allowedOrigins = getConfiguredOrigins(request);
  const publicFlowRecipients = getPublicFlowRecipients(senderEmail);

  if (origin && !allowedOrigins.includes(origin)) {
    console.warn("[email] Rejected unexpected origin", { ip, origin, flow });
    return NextResponse.json(
      { error: "Origin is not allowed for email requests." },
      { status: 403 }
    );
  }

  if (
    flow === "public_quote_request" &&
    !publicFlowRecipients.includes(to.toLowerCase())
  ) {
    console.warn("[email] Rejected public recipient", { ip, flow, to, context });
    return NextResponse.json(
      { error: "Public email flow cannot send to that recipient." },
      { status: 403 }
    );
  }

  const rateLimit = applyRateLimit(flow, ip);
  if (!rateLimit.allowed) {
    console.warn("[email] Rate limited", { ip, flow, context });
    return NextResponse.json(
      { error: "Too many email requests. Please wait and try again." },
      {
        status: 429,
        headers: {
          "Retry-After": String(
            Math.max(1, Math.ceil((rateLimit.resetAt - Date.now()) / 1000))
          ),
        },
      }
    );
  }

  if (flowConfig.requiresTurnstile && turnstileEnabled) {
    const turnstile = await verifyTurnstileToken(request, turnstileToken, ip);
    if (!turnstile.ok) {
      console.warn("[email] Turnstile failed", { ip, flow, context });
      return NextResponse.json(
        { error: turnstile.error },
        { status: 403 }
      );
    }
  }

  console.info("[email] Sending", {
    flow,
    context,
    ip,
    to,
    origin: origin || "n/a",
  });

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
    console.error("[email] Brevo failed", {
      flow,
      context,
      ip,
      to,
      status: brevoResponse.status,
      errorText,
    });
    return NextResponse.json(
      { error: errorText || "Brevo request failed." },
      { status: 502 }
    );
  }

  console.info("[email] Sent successfully", { flow, context, ip, to });
  return NextResponse.json({ ok: true, flow, context });
};
