# ETL Next.js Project Memory

Last updated: June 11, 2026

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
- Keep `memory.md`, `PROJECT_TODO.md`, and `project structure.md` in sync after meaningful workflow, route, security, database, or major UI changes. If no docs update is needed, say so briefly.

## Current Git Notes

As of the June 11, 2026 documentation refresh, `main` matched `origin/main` before these docs were edited.

Important commits since the May 22 documentation snapshot:

- `45385fb` and `2242609` updated launch hardening docs, added `supabase-internal-controls-phase1.sql`, and added the reusable `npm run smoke:internal-controls` script.
- `6cec78a` updated the footer, including the ETL logo and working-hours presentation.
- `f443155`, `6494d76`, and `54e2caa` cleaned up Next.js code, removed unused/template code, consolidated navigation/types/email HTML helpers, hardened email env handling, and restored Supabase auth fallbacks for approval email flow.
- `0e5a2b2`, `8b6406c`, and `a20f9e6` updated homepage staff/working hours, improved service-card contrast, resized the header logo to fit the nav bar, and removed the extra large homepage logo.
- `5a43106` added the contact-page hero slider assets and layout.
- `4531f8a` redesigned the inward LPO path into an unpriced customer procurement request flow and added `supabase-launch-data-reset.sql`.

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
- `src/app/components/contact/contact-hero-slider/index.tsx` - contact page image slider replacing the old static banner.
- `src/data/navigation.ts` - shared public nav items used by the header.
- `src/data/projects.ts` - main project database and image references.
- `src/lib/email/build-etl-email-html.ts` - shared server-side ETL email HTML wrapper.
- `src/app/components/shared/features/index.tsx` - service cards and service modal content.

Important static tool pages:

- `public/ETL-Dashboard.html` - internal operations dashboard.
- `public/ETL-Quotation-Request.html` - public incoming quotation request form. It now supports both item/procurement requests and construction/tender BOQ pricing requests.
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

`etl-items.js` still supports inventory-backed priced rows for quotation/inventory-style flows. The current customer procurement request mode intentionally allows free-text items without forcing inventory, price, or stock data.

When adding new duplicated behavior, prefer extending one of these helpers instead of copying code into each page.

## Dashboard Module Map

- `public/dashboard/etl-dashboard-core.js` - escaping, formatting, status classes, dashboard helper functions.
- `public/dashboard/etl-dashboard-data.js` - Supabase REST data access.
- `public/dashboard/etl-dashboard-controller.js` - tabs, page startup, loading requests/LPOs/approvals, KPI refresh.
- `public/dashboard/etl-dashboard-records-view.js` - renders quotation request rows, LPO rows, approvals, details, stock-check modal UI, and the `Prepare Quotation` action for approved unpriced procurement requests.
- `public/dashboard/etl-dashboard-records-actions.js` - approve/reject, status updates, copy links, stock check, procurement-request approval notices, and record-related email actions.
- `public/dashboard/etl-dashboard-invoices-view.js` - invoice list and payment display rendering.
- `public/dashboard/etl-dashboard-invoices-actions.js` - invoice payment/history actions.
- `public/dashboard/etl-dashboard-page.css` - dashboard layout, mobile behavior, tables, modals, KPIs, dark theme.

## Form Module Map

Quotation:

- `public/forms/quotation/etl-quotation-request-page.js` - public request submit logic, including request-type selection for item/procurement versus construction/tender BOQ pricing.
- `public/forms/quotation/etl-quotation-generator-page.js` - generated quotation save/email/share logic, including prefill from approved customer procurement requests via `lpo_id`.
- `public/forms/quotation/etl-quotation-view-page.js` - public quote view loader.

LPO:

- `public/forms/lpo/etl-lpo-system-page.js` - outward LPO, quotation-acceptance inward LPO, and unpriced customer procurement request form for sourcing/pricing.
- `public/forms/lpo/etl-lpo-inventory.js` - LPO inventory helper behavior.
- `public/forms/lpo/etl-lpo-turnstile.js` - Turnstile for public/anonymous LPO submit.
- `public/forms/lpo/etl-lpo-view-page.js` - public LPO/procurement-request view loader and renderer.

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
- `lpos` - local purchase orders and customer procurement requests. Unpriced procurement requests are stored here as inward records with zero-priced items until staff prepare a generated quotation.
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

- The project is now being treated as production-bound, not just demo-safe. When choosing between quick demo convenience and safer launch behavior, prefer the safer launch behavior.
- Internal tool login uses Supabase Auth through `public/shared/etl-auth.js`.
- Main roles are `staff` and `management`.
- Public view pages do not require login; they rely on unguessable `unique_link` values plus Supabase RLS.
- Public forms use Turnstile and `/api/send-email`.
- Internal email sends now attach the Supabase session token from `public/shared/etl-email.js`; `/api/send-email` verifies that token before allowing `internal_ops`.
- The quote reminder endpoint now fails closed in production if `CRON_SECRET` is missing, and rejects calls with the wrong bearer token.
- The Supabase anon key is public by design and visible in browser JS. Security depends on strict RLS.
- Never expose service-role keys or Brevo API keys in browser/public files.
- Secrets belong in Cloudflare Worker secrets or local `.env`.
- `supabase-rls-audit.sql` is a read-only SQL audit file to run in Supabase before launch. It checks RLS status, policies, browser-role grants, anon access, and SECURITY DEFINER functions.
- `supabase-public-link-hardening.sql` creates token-based public RPC functions for quotation, LPO, and invoice view links, then removes direct anon SELECT from those tables. Run it only together with the matching frontend code that calls `/rpc/get_public_quotation`, `/rpc/get_public_lpo`, and `/rpc/get_public_invoice`.
- `supabase-authenticated-policy-hardening.sql` is now a read-only/internal-risk review plan, not a management-only lockdown migration. Staff are involved in generated quote, invoice, payment, project-site, and inventory edits, so the safer production path is controlled server/API/RPC actions with audit logs instead of bluntly removing staff UPDATE access.
- `supabase-internal-controls-phase1.sql` is the first runnable internal-controls migration. It adds `audit_log`, management-read RLS policy for audit entries, and non-breaking validation/audit triggers on `invoices`, `invoice_payments`, `inventory_items`, `stock_movements`, and `site_stock`.
- `supabase-launch-data-reset.sql` clears launch/demo records from operational tables while preserving `auth.users` and `profiles`. Run it in Supabase SQL Editor only when intentionally preparing a clean launch dataset.
- Public/static pages still contain some `innerHTML` rendering. Any time those paths are touched, escape user/database values before inserting them into HTML or move rendering to safer DOM APIs.

## Email System

Server-side email route:

- `src/app/api/send-email/route.ts`
- `src/lib/email/build-etl-email-html.ts` holds the shared ETL email HTML builder used by API routes.

It sends through Brevo and handles:

- payload validation
- rate limiting
- allowed origin checks
- Turnstile checks for public flows
- public recipient allowlist

Email flows:

- `internal_ops` - internal quote/LPO/invoice/dashboard actions, requires a valid Supabase session token, no Turnstile.
- `public_quote_request` - public quotation request, Turnstile required.
- `public_lpo_submit` - anonymous/public LPO submit, Turnstile required.

Dashboard approval notifications for quotation/procurement work are currently sent to `tokui@usiu.ac.ke`. That address is a notification recipient, not necessarily a Supabase login account.

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
- Header logo was resized to sit inside the nav line, and the extra large homepage logo was removed.
- Staff Login text is white on the transparent/dark nav so it matches the other nav words.
- About ETL watermark logo was moved to the upper-right area, then aligned near the heading, made more opaque, and most recently bumped to opacity values `0.66`, `0.54`, and `0.34` for different modes.
- Service modals were fixed for mobile scrolling.
- Homepage service/project images were updated to use ETL image assets from `public/etl-images`.
- Service/project card title and cash/number contrast was improved for readability over images.
- Dashboard got a moon/sun dark theme trigger rather than a text "dark mode" button.
- LPO dashboard view now includes the entity phone.
- Public LPO view labels entity details as Phone, Email, and Address.
- Inward LPO WhatsApp share goes to the ETL team number and uses ETL team wording.
- Footer uses the ETL logo instead of the small square placeholder, and working hours are Monday - Friday, 9:00 AM - 6:00 PM.
- Contact page hero now uses `ContactHeroSlider` instead of the old ETL banner. Current first slides are the ETL sign-post image and `naguru-asphalt-08.jpg.jpeg`; both use contained image fitting with a blurred fill layer behind them.
- Homepage portal wording now points customers to quotation requests and procurement requests/items pricing rather than a priced inventory order. The procurement card should say ETL checks availability and supplier options; do not make it sound like ETL always outsources.
- Sande Robert was added to the staff section as Site Agent. Verify any experience-year wording before treating it as official company history. Timbigamba Hilary was removed from the senior management staff section.
- Homepage featured projects are no longer just `projects.slice(0, 6)`. `src/app/components/home/projects/index.tsx` uses `FEATURED_PROJECT_TITLE_PREFIXES` in this order: Electoral Commission HQ, Naguru Asphalt Works - Addendum No.1, Proposed Warehouses - Namanve, Ciforo Market Building, Ankole Tea Estates, and MTN Tower - Bubada.
- Project gallery images had a large cleanup on June 10-11. `src/data/projects.ts` is the source of truth for project cards/modals. Many recently uploaded project images were upscaled with Upscayl and copied from `C:\WORK\ETL\ETL_website\recent-images-to-upscale-2026-06-08\upscayl_png_remacri-4x_2x` into `public/etl-images/`; gallery references were updated to the new `.png` files where applicable.
- After changing project gallery paths, run a local image-reference check against `public/etl-images` so missing files such as old deleted JPGs do not remain in `src/data/projects.ts`.
- Public quotation request estimated budget placeholder now uses `10,000,000` instead of `50,000,000`.

## Quotation Request Flow

The public quotation request form now separates two client situations:

- Items / Materials / Procurement: the client lists materials, services, or equipment they want ETL to check and price.
- Construction / Tender / BOQ Pricing: the client has a building, road, or similar works package and may already have a Bill of Quantities or tender document prepared by a consultant/ministry.

For the BOQ path, the form shows optional consultant/ministry, BOQ/tender reference, submission deadline, and site-visit date fields. To avoid a database migration during this step, those details are bundled into the existing `project_description` text saved in the `quotations` table. Add real BOQ document upload/storage later if staff need to attach files directly.

## Procurement Request Flow

The inward LPO route now has two meanings:

- Quotation acceptance: still behaves like a priced inward LPO when opened from an accepted/generated quotation.
- Customer procurement request: the normal public inward path lets customers type the items or services they want, with quantities. ETL can then check warehouse/availability first and supplier options where needed. Direct public opens of `ETL-LPO-System.html` should default to this customer request path; staff outward LPO creation should use `?mode=outward`.

Customer procurement requests are intentionally unpriced at submission time:

- No unit-price, subtotal, VAT, total, or stock promise is shown to the customer.
- No ETL preparer/authorization signature block is shown on the customer request preview; that block belongs only on commercial LPO documents.
- Treat inventory as internal/optional for customer entry, not as nonexistent. The customer request path stays free-text, while staff handle availability review, warehouse checks, supplier checks where needed, and pricing.
- ETL receives the request, management approves it, and staff then use `Prepare Quotation` from the dashboard.
- Approving a customer procurement request now offers to open the quotation generator immediately, so management/staff see the next step without hunting through the LPO tab.
- The quotation generator can load the request with `?lpo_id=...`, prefill customer/request details, and let staff enter actual prices after checking availability and supplier options where needed.
- After a generated quotation is saved from a procurement request, the source LPO/request status is patched to `issued`.
- Public LPO view pages detect unpriced requests and render them as `CUSTOMER PROCUREMENT REQUEST` with request wording.

Priced inward LPOs are different from unpriced procurement requests:

- If an inward LPO is approved and already has item prices/total, the dashboard should show `Generate Invoice`.
- `Generate Invoice` opens `public/ETL-Invoice.html?lpo_id=...`, where the invoice generator pre-fills from that LPO.

## Refactor Status

Production-bound refactor phase is mostly complete:

- Shared helpers exist for forms, item rows, previews, submits, emails, sharing, config, auth, and utils.
- Dashboard is split into controller, data, view, action, invoice-view, and invoice-action modules.
- Inventory and site stock are split out of inline HTML.
- Form pages have extracted JS/CSS modules.
- Large inline CSS blocks have mostly moved into page CSS files.
- Shared header navigation lives in `src/data/navigation.ts`.
- Shared server-side email HTML lives in `src/lib/email/build-etl-email-html.ts`.
- `src/app/api/pagedata/route.ts` and unused/template leftovers were removed during cleanup.

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
npm run smoke:internal-controls
```

Build/deploy checks:

```bash
npm run build
npm run cf:build
npm run cf:deploy
```

Use heavy browser/email tests only when needed. For normal UI/refactor changes, light checks are usually enough unless the user asks for browser verification.
For database hardening verification, the reusable smoke script expects:
- `SMOKE_SUPABASE_URL`
- `SMOKE_SUPABASE_ANON_KEY`
- `SMOKE_MANAGEMENT_EMAIL`
- `SMOKE_MANAGEMENT_PASSWORD`

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
