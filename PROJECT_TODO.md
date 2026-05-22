# ETL Project TODO

## Current Refactor Status

The project should now be treated as production-bound, not just demo-safe. The old public HTML tools are still available, but repeated logic has been pulled into shared JavaScript and CSS files so future changes are safer while we continue hardening the launch risks.

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

## Remaining Cleanup

- Treat security work as launch-blocking before the real domain goes live:
  - Run `supabase-rls-audit.sql` in Supabase and review every anon grant and every policy.
  - Use `supabase-public-link-hardening.sql` to replace direct anon document-table reads with token-based RPC functions.
  - Use `supabase-authenticated-policy-hardening.sql` as a read-only review plan before go-live; staff are involved in those edit workflows, so do not lock them to management-only without matching controlled APIs.
  - New phase-1 internal controls script added: `supabase-internal-controls-phase1.sql`.
  - Run phase 1 to add audit logs and validation triggers for `invoices`, `invoice_payments`, `inventory_items`, `stock_movements`, and `site_stock` without removing staff edit paths.
  - After phase 1, move high-risk writes to controlled server/API/RPC actions table-by-table, starting with invoice payments.
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

## Launch Security Checklist

- Supabase RLS live audit complete and reviewed.
- Public quotation/LPO intake limited to required inserts only.
- Public quotation/LPO/invoice view links served through token-based RPC functions, not broad anon table SELECT.
- Inventory, payments, profiles, and stock movement tables blocked from anon access.
- Management-only operations verified for approve, reject, delete, and sensitive payment changes.
- Broad authenticated `UPDATE true` policies reviewed, with staff-safe server/RPC hardening planned for financial and inventory edits.
- `supabase-internal-controls-phase1.sql` executed and verified (audit log table + high-priority validation/audit triggers).
- XSS pass complete for public/static pages that use `innerHTML`.
- Email flows verified after any server-side auth or recipient logic changes.

## Future Feature Ideas

- Client database/autofill for repeat clients and suppliers.
- Quote expiry reminders.
- Soft-delete instead of permanent deletes.
- Audit log for sensitive actions such as approve, reject, delete, and payment updates.
- Warehouse/store manager role when a real stock manager account is needed.
- EFRIS/URA compliance review with an accountant before going fully live.

## Testing Preference

- For normal UI/refactor work, run light checks and light browser smoke tests only when useful.
- For email workflow changes, run the full email flow test because those paths affect real delivery.
- Avoid heavy browser testing unless specifically requested, to save tokens and avoid unnecessary live records.
- For internal-controls/RLS hardening checks, use `npm run smoke:internal-controls` with:
  - `SMOKE_SUPABASE_URL`
  - `SMOKE_SUPABASE_ANON_KEY`
  - `SMOKE_MANAGEMENT_EMAIL`
  - `SMOKE_MANAGEMENT_PASSWORD`
