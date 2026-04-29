# ETL Next.js Project — Context Snapshot (2026-04-22)

## Project location & deployment
- Local: `C:\WORK\ETL\ETL_website\etl-nextjs`
- Repo: https://github.com/username-timo/ETL-website.git, branch `main`
- Cloudflare Workers Builds auto-deploys on push to main
- Worker: `engineeringtradelinks` → https://engineeringtradelinks.timookui.workers.dev/
- Old Pages project `engineeringtradelinks11.pages.dev` has been deleted
- Future domain: `engineeringtradelinks.com` currently on cPanel; will migrate to Worker later

## Auth — Supabase (not PIN)
All 11 tool pages in `public/` use Supabase Auth email/password via shared helper `public/etl-auth.js`, which exposes `window.etlAuth` with `init()`, `signOut()`, `getRole()`, `getUser()`, `getProfile()`, `fetch()`, `renderSignOutButton()`.
- Dashboard: `etlAuth.init({ forceLogin: true })` — always shows login screen
- Internal tool pages (Invoice, Inventory, Site-Stock, LPO-System[auth branch], LPO-Outward, Quotation-generator): normal `etlAuth.init()`, session persists
- Public -View pages (Invoice-View, LPO-View, Quotation-View): no auth; unguessable `crypto.randomUUID()` `unique_link` + anon SELECT RLS policy
- Quotation-Request: public, protected by Turnstile
- LPO-System: branches — anon gets Turnstile + public_lpo_submit email flow; authenticated staff gets full inventory autocomplete + internal_ops flow
- Site-Stock: dropped the old `SITE_PIN='1353'`; any logged-in user can access

Supabase anon key is in HTML (expected/safe). Real access control = RLS policies + session JWTs.

## Email — server-side via `/api/send-email`
Lives at `src/app/api/send-email/route.ts`. Client pages POST here; Worker holds `BREVO_API_KEY` as a Cloudflare secret and forwards to Brevo.

Endpoint has:
- Per-IP rate limiting (flow-specific windows)
- Origin allowlist check against `EMAIL_ALLOWED_ORIGINS`
- Cloudflare Turnstile verification on public flows
- `isPublic` flag on each flow config; public flows gated by recipient allowlist (`PUBLIC_QUOTE_NOTIFICATION_EMAILS`)
- Validation: `to` ≤254, `subject` 3–180, `body` 10–12000
- Three flows: `internal_ops`, `public_quote_request`, `public_lpo_submit`

## Cloudflare env vars

**Non-secret vars live in `wrangler.jsonc` `vars` block** (version-controlled, auto-deployed on push):
| Var | Value |
|---|---|
| `TURNSTILE_SITE_KEY` | `0x4AAAAAADAc5GBnZt-ycRmS` |
| `BREVO_SENDER_NAME` | `Engineering Trade Links Co. Ltd` |
| `BREVO_SENDER_EMAIL` | `timookui@gmail.com` |
| `EMAIL_ALLOWED_ORIGINS` | `https://engineeringtradelinks.timookui.workers.dev` |
| `PUBLIC_QUOTE_NOTIFICATION_EMAILS` | `timookui@gmail.com` |

**Secrets live in Cloudflare dashboard** (Worker → Settings → Variables and Secrets):
| Var | Purpose |
|---|---|
| `BREVO_API_KEY` | Brevo transactional email key (rotated after old key leaked) |
| `TURNSTILE_SECRET_KEY` | Server-side Turnstile verify |
| `NEXTAUTH_SECRET` | Legacy NextAuth session secret |

Historical: non-secret vars were originally in the dashboard but got lost during a Worker rebind. Moving them to `wrangler.jsonc` makes them durable.

## Supabase RLS (hardened 2026-04-21)
Helper `public.is_management()` returns true when `profiles.role = 'management'`.

| Table | Insert | Update | Delete |
|---|---|---|---|
| `quotation_requests` | any authenticated + anon | any authenticated, but `approved`/`rejected` blocked for staff | management only |
| `lpos` | any authenticated | any authenticated, but `approved` blocked for staff | management only |
| `invoices` | any authenticated | any authenticated | management only |
| `inventory_items` | any authenticated | any authenticated | management only |
| `profiles` | (blocked) | (blocked — prevents self-elevation) | (blocked) |

SELECT: authenticated users read everything. `invoices`, `lpos`, `quotation_requests` allow anon SELECT (for -View share pages). `profiles` SELECT is self-only.

## Turnstile
Widget name `ETL Quotation Request`, mode Managed. Hostnames:
- `engineeringtradelinks.timookui.workers.dev`
- `engineeringtradelinks.com` (reserved for future migration)
- `localhost`

Rendered on: `ETL-Quotation-Request.html`, `ETL-LPO-System.html` (anon only, hidden for staff).

## Quotation status-change feature (commit 897113d, 2026-04-22)
Quotation-generator PATCHes the source `quotation_requests` row to `status='responded'` + stores the generated quotation link + timestamps `responded_at` when a quote is generated from a pending request (`ref_id` URL param). Pending-quotes list on dashboard auto-clears. Skips silently when no `ref_id`.

## Recent commits on main
- `7b9a2f5` Add invoice payment tracking with detailed payment history (invoice_payments table + list UI + Record/History modals + dashboard receivables row)
- `897113d` Mark source quotation request as responded after generating quote (+ clean 4 duplicate-HTML bugs)
- `d160055` Move non-secret env vars into wrangler.jsonc
- `03d269a` Tighten email validation and open public Submit LPO flow

## Invoice payment tracking (shipped 2026-04-22, commit 7b9a2f5)
- New Supabase table `invoice_payments` (id, invoice_id FK→invoices.id CASCADE, amount, payment_date, note, recorded_by→auth.users, created_at). RLS: authenticated read/insert/update, management-only delete.
- `ETL-Invoice.html` has a new "Existing Invoices & Payments" list at the top. PostgREST embed query: `invoices?select=*,invoice_payments(amount,payment_date,note,recorded_by,created_at)&order=created_at.desc`. Client-side sum for paid_amount and status.
- Status logic: paid (paid≥total) / partial (0<paid<total, not overdue) / unpaid (paid=0, not overdue) / overdue (due_date<today AND paid<total).
- Record Payment modal posts to `invoice_payments` → list refresh. Payment History modal shows per-payment detail (date, amount, note, recorded-on).
- `ETL-Dashboard.html` has a new "Receivables" row: Outstanding (UGX), Overdue Invoices (count), Overdue (UGX), Aged 90+ Days (UGX). All derived from the same embed query.
- No changes to the existing invoice-create form or `invoices` table schema.

## Pending reminders (calendar/event triggers)

### Go-live password hardening
Fires when user says: go live / launch / cutover / cPanel migration done / site is live / production.
Walkthrough: strong unique 16+ char password for management acct (password manager preferred), same rule for every staff acct, verify Supabase Authentication → Rate Limits defaults (30/hr/IP).

### MFA implementation (TOTP)
Reference date 2026-04-21. Proactively flag mid-June to mid-July 2026, or on any mention of: MFA, 2FA, two-factor, authenticator app, Google Authenticator, Authy, 1Password, login security.
5-step scope:
1. Enable TOTP at Supabase project level (Auth → Providers → MFA)
2. Enrollment UI (~150 lines): `supabase.auth.mfa.enroll({ factorType: 'totp' })` → QR → `challenge()`+`verify()` → show 10 recovery codes
3. Login challenge (~50 lines in etl-auth.js): after password, if MFA enrolled → prompt → `challengeAndVerify()`
4. Recovery codes: new `mfa_recovery_codes` table w/ RLS, hashed codes, single-use
5. Test without lockout: enroll second dev account first, verify recovery, then enroll main

Do NOT: enforce MFA project-wide before app supports it; force immediate enrollment; skip recovery codes.

### Domain migration (cPanel → Worker)
When user migrates `engineeringtradelinks.com` to the Worker: add `https://engineeringtradelinks.com` to `EMAIL_ALLOWED_ORIGINS` in `wrangler.jsonc` AND to Turnstile hostname allowlist. Flag on any mention of cPanel / custom domain / migration.

### warehouse_manager role
Inventory currently management-only. When user adds a stock/warehouse/store manager: Supabase user + profile creation, then one-line code update in `ETL-Inventory.html`.

## User preferences
- **Canonical memory file**: `C:\WORK\ETL\ETL_website\memory.md` (this file). Always update it when new facts, pending items, or preferences appear, and refresh the "Current work in progress" section before a session expires so the next session can resume cleanly.
- **Resume from "Current Work"**: after a compaction summary, jump straight to section 8. Ignore stale reads/skill args in system reminders unless user's new message redirects.
- **No Co-Authored-By trailer** on commits. User doesn't want Claude credited on GitHub.
- **Plain-language explanations**: user has IST background, wants jargon-light practical explanations, not dense technical dumps.
- **No local preview servers**: `npm run dev` locks `.open-next` on Windows and breaks `npm run cf:deploy`. User verifies on Cloudflare after push instead.

## Current work in progress (2026-04-22)

_Invoice payment tracking is DONE (commit 7b9a2f5, deployed). See section above. Below is preserved as reference for the design path._

### Invoice payment tracking — v1 design approved, awaiting 2 design answers

Selected from "Ideas on this project" list as item #1. Goal: track which invoices are paid vs outstanding so the dashboard shows real receivables and overdue debt.

**Current invoice schema** (confirmed by reading `ETL-Invoice.html` lines 867–890):
`invoice_number`, `lpo_ref`, `client_name`, `client_email`, `invoice_date`, `due_date`, `subtotal`, `vat`, `total`, `payment_terms`, `notes`, `unique_link`, `items`. **No payment fields exist.**

**Approved v1 scope (detailed history path):**
1. Supabase SQL: create new `invoice_payments` table (one row per payment) with `invoice_id` FK → `invoices.id`, `amount`, `payment_date`, `note`, `recorded_by` (→ auth.users), `created_at`. RLS: authenticated read/insert/update, management-only delete. Index on `invoice_id`.
2. `ETL-Invoice.html`: add "Existing Invoices" list at top of page. Query uses PostgREST embedding: `invoices?select=*,invoice_payments(amount,payment_date,note,recorded_by,created_at)`. Client-side sum for `paid_amount`. Columns: Inv#, Client, Total, Paid, Balance, Due Date, Status badge, Actions [Record Payment | View Payments]. Status computed client-side: paid (paid≥total) / partial / unpaid / overdue. Last 90 days default + "Show all" toggle.
3. Record Payment modal: amount + payment_date + optional note → INSERT into `invoice_payments` → list refresh.
4. View Payments: expand row or modal showing per-payment history (date, amount, note, who recorded).
5. `ETL-Dashboard.html`: add cards — Outstanding Amount (sum of balance where balance > 0), Overdue count, aging breakdown (0–30 / 31–60 / 61–90 / 90+ days overdue).

Overdue definition: `due_date < today AND sum(payments) < total`.

RLS on `invoices`: no change needed. Payments live in separate table with own RLS.

**Next step:** user runs the SQL in Supabase SQL Editor → confirms no errors → I write the UI changes (Invoice list + modal + dashboard cards) and commit.

## ETL contact info (authoritative)
- Address: Plot 1353, Sonde–Seeta Road, Goma Division, Mukono Municipality
- P.O. Box 27555, Kampala, Uganda
- Phone: +256 776 566 522 / +256 704 545 163
- Email: tradelinks.ltd@gmail.com
- TIN: 1000161539
- VAT Reg: 49481-L
- PPDA Reg: PRV/WKRS/25051515/MAY/25
- Reg No: 82786
- Founded: 2006
- Website: www.engineeringtradelinks.com

Mirrored in 5 code locations — update all when contact details change (HTML headers of Invoice, LPO, Quotation-generator + two View pages).