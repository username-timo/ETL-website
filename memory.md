# ETL Next.js Project Memory

Last updated: May 20, 2026

This file is a handoff note for continuing the ETL project in another LLM or another coding session. It should be read together with:

- `project structure.md` - current file/folder map and what important files do.
- `PROJECT_TODO.md` - current refactor status, remaining cleanup, and future feature ideas.

## Project Location and Deployment

- Local repo: `C:\WORK\ETL\ETL_website\etl-nextjs`
- GitHub repo: `https://github.com/username-timo/ETL-website.git`
- Main branch: `main`
- Deployment: Cloudflare Workers through OpenNext.
- Worker name: `engineeringtradelinks`
- Current Worker URL: `https://engineeringtradelinks.timookui.workers.dev/`
- Future real domain: `engineeringtradelinks.com`

Do not edit generated folders:

- `.next/`
- `.open-next/`
- `.wrangler/`
- `node_modules/`

Edit source files in `src/`, `public/`, and root config files.

## User Preferences

- Explain in simple practical language. The user has IST background but prefers low-jargon explanations.
- Do not add `Co-Authored-By` or AI/Claude trailers to commits.
- User often wants local files changed directly, then they commit/push or ask for a commit message.
- If asked to commit/push, keep commits looking like the user's work.
- Prefer light checks for UI/refactor work.
- For email workflow changes, run a fuller email-flow test only when the user asks or when the change directly affects email sending.
- Avoid heavy browser testing unless specifically requested, to save tokens and avoid creating unnecessary live records.
- Do not revert user changes unless explicitly asked.
- If unexpected working-tree changes appear, preserve them and mention them.

## Current Git Notes

At the time this memory was refreshed, `md2.md` was deleted in the working tree. That deletion was not made by Codex in this update, so treat it as a user change unless the user asks to restore it.

Recent staged/edited documentation work in this session:

- `PROJECT_TODO.md` was refreshed to reflect the current refactor status.
- `project structure.md` was created/updated as a current project map.
- `src/app/components/home/about/index.tsx` had the About ETL logo watermark opacity increased slightly.
- `public/ETL-LPO-Outward.html` was removed after confirming active links use `public/ETL-LPO-System.html?mode=outward`.

Always run `git status --short --branch` before continuing.

## Architecture Overview

The project has two layers:

- Public marketing website: Next.js App Router files in `src/app`.
- Internal/demo operations tools: static HTML pages in `public` with extracted JS/CSS modules.

Important public website files:

- `src/app/page.tsx` - homepage route `/`.
- `src/app/layout.tsx` - root layout, metadata, header/footer wrapping.
- `src/app/globals.css` - main public-site global styling.
- `src/app/(site)/projects/page.tsx` - public projects page.
- `src/app/(site)/projects/ProjectsGrid.tsx` - project grid, filtering, and project modal UI.
- `src/app/(site)/contact/page.tsx` - contact page.
- `src/data/projects.ts` - main project database and image references.
- `src/app/components/shared/features/index.tsx` - service cards and service modal content.

Important static tool pages:

- `public/ETL-Dashboard.html` - internal operations dashboard.
- `public/ETL-Quotation-Request.html` - public incoming quotation request form.
- `public/ETL-Quotation-generator.html` - internal generated quotation tool.
- `public/ETL-Quotation-View.html` - public generated quotation view link.
- `public/ETL-LPO-System.html` - main LPO form for inward and outward LPOs via query mode.
- `public/ETL-LPO-View.html` - public LPO view link.
- `public/ETL-Invoice.html` - internal invoice generator and payment tools.
- `public/ETL-Invoice-View.html` - public invoice view link.
- `public/ETL-Inventory.html` - internal inventory management.
- `public/ETL-Site-Stock.html` - internal project site stock page.

## Shared Public Tool Helpers

These files reduce duplicated logic across quotation, LPO, invoice, dashboard, and inventory tools:

- `public/shared/etl-config.js` - public Supabase URL/anon key and site URL helpers.
- `public/shared/etl-auth.js` - Supabase Auth login overlay, role lookup, sign out, and authenticated fetch helper.
- `public/shared/etl-email.js` - shared `/api/send-email` wrapper.
- `public/shared/etl-utils.js` - escaping, formatting, and response parsing helpers.
- `public/forms/shared/etl-forms.css` - shared form styling.
- `public/forms/shared/etl-items.js` - shared item-row add/remove/recalculate behavior.
- `public/forms/shared/etl-submit.js` - shared form validation, date checks, item collection, and JSON submit helper.
- `public/forms/shared/etl-preview.js` - shared preview rendering helpers.
- `public/forms/shared/etl-share.js` - shared copy-link and WhatsApp share modal.
- `public/forms/shared/etl-inventory-autocomplete.js` - shared inventory autocomplete.

When adding new duplicated behavior, prefer extending one of these helpers instead of copying code into each page.

## Dashboard Module Map

- `public/dashboard/etl-dashboard-core.js` - escaping, formatting, status classes, dashboard helper functions.
- `public/dashboard/etl-dashboard-data.js` - Supabase REST data access.
- `public/dashboard/etl-dashboard-controller.js` - tabs, page startup, loading requests/LPOs/approvals, KPI refresh.
- `public/dashboard/etl-dashboard-records-view.js` - renders quotation request rows, LPO rows, approvals, details, and stock-check modal UI.
- `public/dashboard/etl-dashboard-records-actions.js` - approve/reject, status updates, copy links, stock check, and record-related email actions.
- `public/dashboard/etl-dashboard-invoices-view.js` - invoice list and payment display rendering.
- `public/dashboard/etl-dashboard-invoices-actions.js` - invoice payment/history actions.
- `public/dashboard/etl-dashboard-page.css` - dashboard layout, mobile behavior, tables, modals, KPIs, dark theme.

## Form Module Map

Quotation:

- `public/forms/quotation/etl-quotation-request-page.js` - public request submit logic.
- `public/forms/quotation/etl-quotation-generator-page.js` - generated quotation save/email/share logic.
- `public/forms/quotation/etl-quotation-view-page.js` - public quote view loader.

LPO:

- `public/forms/lpo/etl-lpo-system-page.js` - inward/outward LPO form, preview, save, email, WhatsApp, quote prefill.
- `public/forms/lpo/etl-lpo-inventory.js` - LPO inventory helper behavior.
- `public/forms/lpo/etl-lpo-turnstile.js` - Turnstile for public/anonymous LPO submit.
- `public/forms/lpo/etl-lpo-view-page.js` - public LPO view loader and renderer.

Invoice:

- `public/forms/invoice/etl-invoice-page.js` - invoice form, LPO prefill, save, email, share.
- `public/forms/invoice/etl-invoice-view-page.js` - public invoice view loader.

Inventory:

- `public/inventory/etl-inventory-page.js` - inventory item and stock movement logic.
- `public/inventory/etl-site-stock-page.js` - site stock tracking.

Each module has a matching CSS file where appropriate.

## Supabase Tables

Current table meaning:

- `quotations` - public incoming quotation requests from clients.
- `quotations_generated` - generated quotations created by staff.
- `lpos` - local purchase orders, both inward and outward.
- `invoices` - generated invoices.
- `invoice_payments` - detailed payment records linked to invoices.
- `inventory_items` - inventory/store item list.
- `stock_movements` - inventory movement history.
- `project_sites` - project site records.
- `site_stock` - stock held at project sites.
- `site_consumption` - site material consumption records.
- `profiles` - Supabase Auth user profile and role data.

Important correction: older notes may mention `quotation_requests`; the current public incoming request table is `quotations`, and generated quotes are stored in `quotations_generated`.

## Auth and Security

- Internal tool login uses Supabase Auth through `public/shared/etl-auth.js`.
- Main roles are `staff` and `management`.
- Public view pages do not require login; they rely on unguessable `unique_link` values plus Supabase RLS.
- Public forms use Turnstile and `/api/send-email`.
- The Supabase anon key is public by design and visible in browser JS. Security depends on strict RLS.
- Never expose service-role keys or Brevo API keys in browser/public files.
- Secrets belong in Cloudflare Worker secrets or local `.env`.

## Email System

Server-side email route:

- `src/app/api/send-email/route.ts`

It sends through Brevo and handles:

- payload validation
- rate limiting
- allowed origin checks
- Turnstile checks for public flows
- public recipient allowlist

Email flows:

- `internal_ops` - internal quote/LPO/invoice/dashboard actions, no Turnstile.
- `public_quote_request` - public quotation request, Turnstile required.
- `public_lpo_submit` - anonymous/public LPO submit, Turnstile required.

Quote expiry reminder:

- `src/app/api/cron/quote-reminders/route.ts`
- Trigger is configured in `wrangler.jsonc` as `0 21 * * *`.
- It checks generated quotations expiring in 3 days and emails clients.

## WhatsApp Behavior

Shared helper:

- `public/forms/shared/etl-share.js`

Current behavior:

- Quotation generator uses the client phone when available.
- Invoice uses the client/LPO phone when available.
- Outward LPO uses the supplier/vendor phone when available.
- Inward LPO sends to ETL team number `+256704545163`.
- Public quotation request sends to ETL team number `+256704545163`.
- If no phone is available, WhatsApp opens a manual contact picker with the message already filled.

The wording should say "ETL team", not "director".

## Recent UI/Feature Decisions

- Homepage top nav was reduced in height while keeping nav words readable.
- Homepage nav words and company text near the logo were enlarged after reduction.
- About ETL watermark logo was moved to the upper-right area, then aligned near the heading, made more opaque, and most recently bumped to opacity values `0.66`, `0.54`, and `0.34` for different modes.
- Service modals were fixed for mobile scrolling.
- Homepage service/project images were updated to use ETL image assets from `public/etl-images`.
- Dashboard got a moon/sun dark theme trigger rather than a text "dark mode" button.
- LPO dashboard view now includes the entity phone.
- Public LPO view labels entity details as Phone, Email, and Address.
- Inward LPO WhatsApp share goes to the ETL team number and uses ETL team wording.

## Refactor Status

Demo-safe refactor phase is mostly complete:

- Shared helpers exist for forms, item rows, previews, submits, emails, sharing, config, auth, and utils.
- Dashboard is split into controller, data, view, action, invoice-view, and invoice-action modules.
- Inventory and site stock are split out of inline HTML.
- Form pages have extracted JS/CSS modules.
- Large inline CSS blocks have mostly moved into page CSS files.

Remaining cleanup should be gradual:

- The old `public/ETL-LPO-Outward.html` redirect stub has been removed. Use `public/ETL-LPO-System.html?mode=outward` for outward LPOs.
- Reduce large files only when touching them anyway:
  - `public/inventory/etl-inventory-page.js`
  - `public/forms/invoice/etl-invoice-page.js`
  - `public/forms/lpo/etl-lpo-system-page.js`
  - `public/forms/quotation/etl-quotation-generator-page.js`
  - `public/dashboard/etl-dashboard-records-view.js`
  - `public/dashboard/etl-dashboard-records-actions.js`
  - `public/dashboard/etl-dashboard-controller.js`
  - `public/forms/shared/etl-forms.css`
  - `public/forms/invoice/etl-invoice-page.css`
  - `public/dashboard/etl-dashboard-page.css`
- Long-term option: move operational tools into proper Next.js pages/components after demo is stable.

## Testing Preferences and Commands

Light checks:

```bash
git diff --check
npx tsc --noEmit
node --check path/to/file.js
```

Build/deploy checks:

```bash
npm run build
npm run cf:build
npm run cf:deploy
```

Use heavy browser/email tests only when needed. For normal UI/refactor changes, light checks are usually enough unless the user asks for browser verification.

## Important Contact Details

- Company: Engineering Trade Links Co. Ltd
- Address: Plot 1353, Sonde-Seeta Road, Goma Division, Mukono Municipality
- P.O. Box: 27555, Kampala, Uganda
- Phone: +256 776 566 522 / +256 704 545 163
- WhatsApp-enabled ETL number: +256 704 545 163
- Public email: tradelinksltd@gmail.com
- TIN: 1000161539
- VAT Reg: 49481-L
- PPDA Reg: PRV/WKRS/25051515/MAY/25
- Reg No: 82786
- Incorporated: 2006
- Website: www.engineeringtradelinks.com

## Future Feature Ideas

- Client database/autofill for repeat clients and suppliers.
- Quote expiry reminders polish.
- Soft-delete instead of permanent deletes.
- Audit log for approve/reject/delete/payment updates.
- Warehouse/store manager role.
- EFRIS/URA compliance review with accountant before full go-live.
- Move public submissions through server API routes later for tighter validation and rate limiting.

## How Another LLM Should Continue

1. Run `git status --short --branch`.
2. Read `project structure.md` and `PROJECT_TODO.md`.
3. Do not edit generated folders.
4. Preserve user changes.
5. Prefer shared helpers over duplicated logic.
6. Keep explanations simple and practical.
7. Run light checks before final response.
8. Do not include AI/Claude trailers in commits.
