# ETL Project TODO

Last updated: June 11, 2026

## Current Refactor Status

The project should now be treated as production-bound, not just demo-safe. The old public HTML tools are still available, but repeated logic has been pulled into shared JavaScript and CSS files so future changes are safer while we continue hardening the launch risks.

The active procurement direction has changed: customers can now submit unpriced procurement requests with free-text items and quantities. ETL staff then check warehouse/availability, use supplier options where needed, and prepare the priced quotation from the dashboard.

Main public tool pages:
- `public/ETL-Dashboard.html`
- `public/ETL-Quotation-generator.html`
- `public/ETL-LPO-System.html`
- `public/ETL-Invoice.html`
- `public/ETL-Inventory.html`
- `public/ETL-Quotation-Request.html`
- `public/ETL-Site-Stock.html`
- Public view pages: quotation, LPO, and invoice view links

## Completed Refactor Work

- Shared form styles now live in `public/forms/shared/etl-forms.css`.
- Shared item-row logic now lives in `public/forms/shared/etl-items.js`.
- Shared form validation and JSON submit helpers now live in `public/forms/shared/etl-submit.js`.
- Shared preview rendering helpers now live in `public/forms/shared/etl-preview.js`.
- Shared WhatsApp/copy-link share modal logic now lives in `public/forms/shared/etl-share.js`.
- Shared inventory autocomplete now lives in `public/forms/shared/etl-inventory-autocomplete.js`.
- Shared public config now lives in `public/shared/etl-config.js`.
- Shared email sending now lives in `public/shared/etl-email.js`.
- Shared auth behavior now lives in `public/shared/etl-auth.js`.
- Shared escaping, formatting, and response parsing helpers now live in `public/shared/etl-utils.js`.
- Dashboard logic is split into focused modules under `public/dashboard/`.
- Inventory logic is split into focused modules under `public/inventory/`.
- Form page logic is split into focused modules under `public/forms/`.
- Large page-specific CSS blocks were moved out of HTML into page CSS files.
- Dashboard, quotation, LPO, invoice, inventory, site stock, and public view pages now keep much less JavaScript/CSS directly inside the HTML.
- Duplicate template assets and unused starter files were cleaned up.
- Main LPO routing now uses `public/ETL-LPO-System.html` with mode query parameters instead of depending on the incomplete legacy outward page.
- Removed the old `public/ETL-LPO-Outward.html` redirect stub after confirming active links already use `public/ETL-LPO-System.html?mode=outward`.
- Navigation data now lives in `src/data/navigation.ts`.
- Server-side ETL email HTML building now lives in `src/lib/email/build-etl-email-html.ts`.
- `Aoscompo` was renamed/cleaned up through `src/utils/aos.tsx`.
- Unused/template code was reduced with Knip-guided cleanup, including removal of the old `src/app/api/pagedata/route.ts`.
- Header link handling was simplified and navigation keys now use stable hrefs instead of array indexes.
- The quote-reminders route now reads Supabase config from env/public env fallbacks instead of a hardcoded project URL.

## Completed Launch/UI Work Since May 22

- Footer uses the ETL logo instead of the placeholder square, and working hours now show 9:00 AM - 6:00 PM.
- Header logo was resized to fit inside the nav bar, and the extra large homepage logo was removed.
- Staff Login button text was made white on the transparent/dark nav.
- Homepage service/project card titles and cash/number text were brightened for readability.
- Contact page ETL banner was replaced with a real image slider. The sign-post and Naguru asphalt slides use contained image fitting with a blurred fill layer.
- Public portal wording now points customers to quotation requests and procurement requests/items pricing. Procurement wording should say ETL checks availability and supplier options, not that ETL always outsources.
- Homepage featured projects now use an explicit order: Electoral Commission HQ, Naguru Asphalt Works - Addendum No.1, Proposed Warehouses - Namanve, Ciforo Market Building, Ankole Tea Estates, and MTN Tower - Bubada.
- Project gallery photos were cleaned up across civil, road, water, and electrical projects. Recently uploaded photos were upscaled and the relevant gallery paths now point to `.png` versions in `public/etl-images/`.
- The Upscayl output folder used for the recent gallery batch was `C:\WORK\ETL\ETL_website\recent-images-to-upscale-2026-06-08\upscayl_png_remacri-4x_2x`.
- Public quotation request estimated budget placeholder was changed from `50,000,000` to `10,000,000`.
- Public quotation request now asks whether the client needs item/procurement pricing or construction/tender/BOQ pricing. BOQ details are saved into the existing request details for now, so no Supabase table migration is required.
- Sande Robert remains a Site Agent in the staff section; Timbigamba Hilary was removed from senior management. Verify any experience-year wording before launch.

## Completed Procurement Request Work

- `public/ETL-LPO-System.html?mode=inward` now acts as a customer procurement request form unless opened from quotation acceptance.
- Customer procurement requests allow free-text item/service descriptions and quantities without making the customer select saved warehouse items.
- Price/unit/stock/subtotal/VAT/total fields are hidden from the customer request path.
- Customer request previews hide ETL preparer/authorization signature lines; those remain for commercial LPO documents only.
- Inventory/warehouse checking is an internal staff step. The customer path remains free-text; staff review availability first and use suppliers where needed before pricing.
- Public LPO view can render unpriced records as `CUSTOMER PROCUREMENT REQUEST`.
- Dashboard detects approved unpriced LPO records and shows `Prepare Quotation`.
- Approving an unpriced procurement request now offers to open the quotation generator immediately.
- Dashboard detects approved priced inward LPO records and shows `Generate Invoice`.
- Approving a procurement request notifies the staff quotation-preparation recipient at `tokui@usiu.ac.ke`.
- Quotation generator supports `?lpo_id=...` to prefill from a procurement request, lets staff enter real prices, and patches the source request status to `issued`.
- Invoice generator supports `?lpo_id=...` to prefill from approved priced inward LPOs.
- `supabase-launch-data-reset.sql` was added to clear launch/example operational records while preserving Supabase users and profiles.

## Remaining Cleanup

- Treat security work as launch-blocking before the real domain goes live:
  - Run `supabase-rls-audit.sql` in Supabase and review every anon grant and every policy.
  - Use `supabase-public-link-hardening.sql` to replace direct anon document-table reads with token-based RPC functions.
  - Use `supabase-authenticated-policy-hardening.sql` as a read-only review plan before go-live; staff are involved in those edit workflows, so do not lock them to management-only without matching controlled APIs.
  - New phase-1 internal controls script added: `supabase-internal-controls-phase1.sql`.
  - Run phase 1 to add audit logs and validation triggers for `invoices`, `invoice_payments`, `inventory_items`, `stock_movements`, and `site_stock` without removing staff edit paths.
  - After phase 1, move high-risk writes to controlled server/API/RPC actions table-by-table, starting with invoice payments.
  - Run `supabase-launch-data-reset.sql` only when intentionally clearing demo/launch data in Supabase SQL Editor.
  - Keep doing XSS passes when touching any `innerHTML` render path.
  - Move high-risk writes and admin actions toward server/API routes where practical.
  - Keep secrets only in `.env` or Cloudflare Worker secrets, never in browser files.
- Continue reducing the largest remaining files only when we are already touching them:
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
- Consider moving the biggest operational tools into proper Next.js pages/components later, after the demo is stable and the current structure is fully understood.
- Keep checking for duplicated logic before adding new code. If quotation, LPO, invoice, dashboard, or inventory need the same behavior, prefer a shared helper.
- Keep `memory.md`, `PROJECT_TODO.md`, and `project structure.md` in sync after meaningful workflow, route, security, database, or major UI changes.
- Review procurement-request labels and LPO naming with real staff before launch so customers do not confuse an unpriced request with a binding purchase order.
- Re-check the staff section content before launch, especially any placeholder photos or experience-year text.
- When replacing project gallery photos, update `src/data/projects.ts`, copy any upscaled outputs into `public/etl-images/`, and verify every local `/etl-images/...` reference exists before committing.

## Launch Security Checklist

- Supabase RLS live audit complete and reviewed.
- Public quotation/LPO intake limited to required inserts only.
- Public quotation/LPO/invoice view links served through token-based RPC functions, not broad anon table SELECT.
- Inventory, payments, profiles, and stock movement tables blocked from anon access.
- Management-only operations verified for approve, reject, delete, and sensitive payment changes.
- Broad authenticated `UPDATE true` policies reviewed, with staff-safe server/RPC hardening planned for financial and inventory edits.
- `supabase-internal-controls-phase1.sql` executed and verified (audit log table + high-priority validation/audit triggers).
- `supabase-launch-data-reset.sql` run only when ready to clear example operational data.
- XSS pass complete for public/static pages that use `innerHTML`.
- Email flows verified after any server-side auth or recipient logic changes.
- Customer procurement request flow smoke-tested from public request -> management approval -> staff Prepare Quotation -> generated quotation.

## Future Feature Ideas

- Client database/autofill for repeat clients and suppliers.
- Quote expiry reminders.
- Soft-delete instead of permanent deletes.
- Audit log for sensitive actions such as approve, reject, delete, and payment updates.
- Warehouse/store manager role when a real stock manager account is needed.
- EFRIS/URA compliance review with an accountant before going fully live.
- Move high-risk financial/inventory writes behind controlled API/RPC actions with audit logs.
- Add a clearer sourcing/quotation preparation queue if procurement requests grow beyond the current dashboard buttons.
- Add real BOQ/tender document upload storage later if clients need to attach bidding documents directly instead of sending references/links.

## Testing Preference

- For normal UI/refactor work, run light checks and light browser smoke tests only when useful.
- For email workflow changes, run the full email flow test because those paths affect real delivery.
- Avoid heavy browser testing unless specifically requested, to save tokens and avoid unnecessary live records.
- For procurement workflow changes, smoke-test the full public request -> dashboard approval -> quotation generation path when practical.
- For internal-controls/RLS hardening checks, use `npm run smoke:internal-controls` with:
  - `SMOKE_SUPABASE_URL`
  - `SMOKE_SUPABASE_ANON_KEY`
  - `SMOKE_MANAGEMENT_EMAIL`
  - `SMOKE_MANAGEMENT_PASSWORD`
