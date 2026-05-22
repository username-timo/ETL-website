#!/usr/bin/env node

/*
 * ETL Supabase internal-controls smoke test
 *
 * Required env vars:
 *   SMOKE_SUPABASE_URL
 *   SMOKE_SUPABASE_ANON_KEY
 *   SMOKE_MANAGEMENT_EMAIL
 *   SMOKE_MANAGEMENT_PASSWORD
 */

const required = [
  "SMOKE_SUPABASE_URL",
  "SMOKE_SUPABASE_ANON_KEY",
  "SMOKE_MANAGEMENT_EMAIL",
  "SMOKE_MANAGEMENT_PASSWORD",
];

const missing = required.filter((name) => !process.env[name] || !process.env[name].trim());
if (missing.length) {
  console.error("Missing required env vars:");
  for (const key of missing) console.error(`- ${key}`);
  process.exit(1);
}

const SUPABASE_URL = process.env.SMOKE_SUPABASE_URL.trim().replace(/\/+$/, "");
const SUPABASE_ANON_KEY = process.env.SMOKE_SUPABASE_ANON_KEY.trim();
const EMAIL = process.env.SMOKE_MANAGEMENT_EMAIL.trim();
const PASSWORD = process.env.SMOKE_MANAGEMENT_PASSWORD;

const stamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
const report = [];
const artifacts = {
  invoiceId: null,
  paymentId: null,
  movementId: null,
};

function addResult(name, ok, details, required = true) {
  report.push({ name, ok, details, required });
}

function shortBody(text, max = 240) {
  return (text || "").slice(0, max).replace(/\s+/g, " ").trim();
}

async function authLogin() {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const text = await r.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  if (!r.ok || !json || !json.access_token) {
    throw new Error(`Login failed (${r.status}): ${shortBody(text)}`);
  }
  return json;
}

async function rest(path, token, method = "GET", payload = null, prefer = null) {
  const headers = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
  if (prefer) headers.Prefer = prefer;

  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers,
    body: payload ? JSON.stringify(payload) : undefined,
  });

  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  return { ok: response.ok, status: response.status, text, json };
}

async function run() {
  let token = "";
  let userId = "";

  try {
    const auth = await authLogin();
    token = auth.access_token;
    userId = auth.user?.id || "";
    addResult("auth.login", true, `user=${userId}`);
  } catch (err) {
    addResult("auth.login", false, String(err.message || err));
    return;
  }

  const roleRes = await rest(
    `profiles?id=eq.${encodeURIComponent(userId)}&select=id,role`,
    token
  );
  if (roleRes.ok && Array.isArray(roleRes.json) && roleRes.json[0]?.role) {
    const role = roleRes.json[0].role;
    addResult("profiles.role", role === "management", `role=${role}`);
  } else {
    addResult(
      "profiles.role",
      false,
      `status=${roleRes.status} body=${shortBody(roleRes.text)}`
    );
  }

  const invDate = new Date().toISOString().slice(0, 10);
  const invoiceNumber = `SMOKE-INV-${stamp}`;
  const invoicePayload = {
    invoice_number: invoiceNumber,
    lpo_ref: null,
    client_name: "Smoke Test Client",
    client_email: EMAIL,
    invoice_date: invDate,
    due_date: invDate,
    subtotal: 1000,
    vat: 180,
    total: 1180,
    payment_terms: "Immediate",
    notes: "SMOKE payment control test",
    unique_link: `smoke-${stamp}`,
    items: [{ desc: "Smoke item", unit: "pcs", qty: 1, price: 1000, total: 1000 }],
  };

  const invGood = await rest("invoices", token, "POST", invoicePayload, "return=representation");
  if (invGood.ok) {
    const row = Array.isArray(invGood.json) ? invGood.json[0] : invGood.json;
    artifacts.invoiceId = row?.id || null;
    addResult(
      "invoices.valid_insert",
      Boolean(artifacts.invoiceId),
      artifacts.invoiceId ? `invoice_id=${artifacts.invoiceId}` : `status=${invGood.status}`
    );
  } else {
    addResult(
      "invoices.valid_insert",
      false,
      `status=${invGood.status} body=${shortBody(invGood.text)}`
    );
  }

  const invBad = await rest(
    "invoices",
    token,
    "POST",
    {
      ...invoicePayload,
      invoice_number: `${invoiceNumber}-BAD`,
      unique_link: `smoke-${stamp}-bad`,
      due_date: "2020-01-01",
    },
    "return=representation"
  );
  addResult(
    "invoices.invalid_due_date_rejected",
    !invBad.ok,
    `status=${invBad.status} body=${shortBody(invBad.text)}`
  );

  if (artifacts.invoiceId) {
    const payGood = await rest(
      "invoice_payments",
      token,
      "POST",
      {
        invoice_id: artifacts.invoiceId,
        amount: 200,
        payment_date: invDate,
        note: "SMOKE payment",
      },
      "return=representation"
    );
    if (payGood.ok) {
      const row = Array.isArray(payGood.json) ? payGood.json[0] : payGood.json;
      artifacts.paymentId = row?.id || null;
      addResult(
        "invoice_payments.valid_insert",
        Boolean(artifacts.paymentId),
        artifacts.paymentId ? `payment_id=${artifacts.paymentId}` : `status=${payGood.status}`
      );
    } else {
      addResult(
        "invoice_payments.valid_insert",
        false,
        `status=${payGood.status} body=${shortBody(payGood.text)}`
      );
    }

    const payBad = await rest(
      "invoice_payments",
      token,
      "POST",
      {
        invoice_id: artifacts.invoiceId,
        amount: 1000000,
        payment_date: invDate,
        note: "SMOKE overpay",
      },
      "return=representation"
    );
    addResult(
      "invoice_payments.overpay_rejected",
      !payBad.ok,
      `status=${payBad.status} body=${shortBody(payBad.text)}`
    );
  } else {
    addResult("invoice_payments.valid_insert", false, "skipped: no invoice id");
    addResult("invoice_payments.overpay_rejected", false, "skipped: no invoice id");
  }

  const sampleItem = await rest(
    "inventory_items?select=id,name,unit,current_stock,min_stock,unit_cost&limit=1",
    token
  );
  let item = null;
  if (sampleItem.ok && Array.isArray(sampleItem.json) && sampleItem.json.length) {
    item = sampleItem.json[0];
    addResult("inventory_items.fetch_sample", true, `item_id=${item.id}`);

    const invBadPatch = await rest(
      `inventory_items?id=eq.${encodeURIComponent(item.id)}`,
      token,
      "PATCH",
      { current_stock: -1 },
      "return=representation"
    );
    addResult(
      "inventory_items.negative_stock_rejected",
      !invBadPatch.ok,
      `status=${invBadPatch.status} body=${shortBody(invBadPatch.text)}`
    );

    const invGoodPatch = await rest(
      `inventory_items?id=eq.${encodeURIComponent(item.id)}`,
      token,
      "PATCH",
      {
        current_stock: item.current_stock,
        min_stock: item.min_stock,
        unit_cost: item.unit_cost,
      },
      "return=representation"
    );
    addResult("inventory_items.valid_patch", invGoodPatch.ok, `status=${invGoodPatch.status}`);
  } else {
    addResult(
      "inventory_items.fetch_sample",
      false,
      `status=${sampleItem.status} body=${shortBody(sampleItem.text)}`
    );
    addResult("inventory_items.negative_stock_rejected", false, "skipped: no sample item");
    addResult("inventory_items.valid_patch", false, "skipped: no sample item");
  }

  if (item) {
    const moveGood = await rest(
      "stock_movements",
      token,
      "POST",
      {
        item_id: item.id,
        item_name: item.name,
        movement_type: "adjust",
        quantity: 1,
        notes: "SMOKE movement check",
      },
      "return=representation"
    );
    if (moveGood.ok) {
      const row = Array.isArray(moveGood.json) ? moveGood.json[0] : moveGood.json;
      artifacts.movementId = row?.id || null;
      addResult(
        "stock_movements.valid_insert",
        Boolean(artifacts.movementId),
        artifacts.movementId ? `movement_id=${artifacts.movementId}` : `status=${moveGood.status}`
      );
    } else {
      addResult(
        "stock_movements.valid_insert",
        false,
        `status=${moveGood.status} body=${shortBody(moveGood.text)}`
      );
    }

    const moveBad = await rest(
      "stock_movements",
      token,
      "POST",
      {
        item_id: item.id,
        item_name: item.name,
        movement_type: "bad_type",
        quantity: 1,
        notes: "SMOKE invalid movement type",
      },
      "return=representation"
    );
    addResult(
      "stock_movements.invalid_type_rejected",
      !moveBad.ok,
      `status=${moveBad.status} body=${shortBody(moveBad.text)}`
    );
  } else {
    addResult("stock_movements.valid_insert", false, "skipped: no sample item");
    addResult("stock_movements.invalid_type_rejected", false, "skipped: no sample item");
  }

  const site = await rest("project_sites?select=id,name&limit=1", token);
  if (site.ok && Array.isArray(site.json) && site.json.length && item) {
    const siteBad = await rest(
      "site_stock",
      token,
      "POST",
      {
        site_id: site.json[0].id,
        site_name: site.json[0].name,
        item_id: item.id,
        item_name: item.name,
        unit: item.unit,
        quantity: -1,
      },
      "return=representation"
    );
    addResult(
      "site_stock.negative_rejected",
      !siteBad.ok,
      `status=${siteBad.status} body=${shortBody(siteBad.text)}`
    );
  } else {
    addResult(
      "site_stock.negative_rejected",
      false,
      "skipped: need one project site and one inventory item"
    );
  }

  const audit = await rest(
    "audit_log?select=table_name,action,row_id,occurred_at&order=occurred_at.desc&limit=10",
    token
  );
  addResult(
    "audit_log.read_recent",
    audit.ok,
    audit.ok ? `rows=${Array.isArray(audit.json) ? audit.json.length : 0}` : `status=${audit.status} body=${shortBody(audit.text)}`
  );

  const cleanup = [];
  if (artifacts.paymentId) {
    const delPay = await rest(
      `invoice_payments?id=eq.${encodeURIComponent(artifacts.paymentId)}`,
      token,
      "DELETE",
      null,
      "return=minimal"
    );
    cleanup.push({ table: "invoice_payments", id: artifacts.paymentId, ok: delPay.ok, status: delPay.status });
  }
  if (artifacts.invoiceId) {
    const delInv = await rest(
      `invoices?id=eq.${encodeURIComponent(artifacts.invoiceId)}`,
      token,
      "DELETE",
      null,
      "return=minimal"
    );
    cleanup.push({ table: "invoices", id: artifacts.invoiceId, ok: delInv.ok, status: delInv.status });
  }
  if (artifacts.movementId) {
    const delMove = await rest(
      `stock_movements?id=eq.${encodeURIComponent(artifacts.movementId)}`,
      token,
      "DELETE",
      null,
      "return=minimal"
    );
    cleanup.push({ table: "stock_movements", id: artifacts.movementId, ok: delMove.ok, status: delMove.status });
  }

  const cleanupOk = cleanup.length === 0 || cleanup.every((x) => x.ok);
  addResult("cleanup", cleanupOk, JSON.stringify(cleanup), false);

  const requiredFailures = report.filter((r) => r.required && !r.ok);
  const summary = {
    ok: requiredFailures.length === 0,
    passed: report.filter((r) => r.ok).length,
    failed: report.filter((r) => !r.ok).length,
    required_failed: requiredFailures.length,
    results: report,
    cleanup_sql_if_needed: cleanup
      .filter((c) => !c.ok)
      .map((c) => `delete from public.${c.table} where id = '${c.id}';`),
  };

  console.log(JSON.stringify(summary, null, 2));
  process.exit(summary.ok ? 0 : 1);
}

run().catch((err) => {
  console.error("Smoke test crashed:", err);
  process.exit(1);
});
