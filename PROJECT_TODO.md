# ETL Project TODO

## Refactor Large Public Tool Pages

The public HTML tools have grown large because each page currently contains its own HTML, CSS, and JavaScript in one file. This is working, but it is becoming harder to maintain safely.

Priority pages:
- `public/ETL-Dashboard.html`
- `public/ETL-Quotation-generator.html`
- `public/ETL-LPO-System.html`
- `public/ETL-Invoice.html`
- `public/ETL-Inventory.html`

Recommended refactor workload:
- Move shared form/table/mobile styles into shared CSS files such as `public/etl-forms.css`.
  - Started: quotation generator, LPO system, and invoice generator now share base/mobile item table styles through `public/etl-forms.css`.
  - Continued: shared theme tokens, top nav, form cards, grids, fields, totals, actions, and inventory autocomplete styles moved into `public/etl-forms.css` for quotation generator, LPO system, and invoice generator.
- Move repeated item-row logic into a shared JS helper such as `public/etl-items.js`.
  - Started: quotation generator, LPO system, and invoice generator now share add/remove/recalculate/update-total behavior through `public/etl-items.js`.
- Continue using `public/etl-utils.js` for escaping, validation, formatting, and response parsing.
- Continue using `public/etl-auth.js` for shared Supabase authentication behavior.
- Centralize Supabase public config and reduce repeated inline anon-key declarations.
  - Note: the Supabase anon key is visible in public HTML by design, so safety depends on strict RLS policies. Do not expose `service_role` keys in public files.
  - Later option: move public submissions through Next.js API routes for tighter validation, rate limiting, and less browser-side Supabase wiring.
  - Started: `public/etl-config.js` now centralizes the public Supabase URL/anon key and site URLs; dashboard, request, generator, LPO, invoice, inventory, site stock, and public view pages now use it.
- Move repeated email POST/error handling into shared helpers.
  - Started: dashboard, quotation request, quotation generator, LPO system, and invoice generator now send through `public/etl-email.js`.
- Move repeated dashboard table rendering into shared helpers.
  - Started: request and LPO row/action/status-select markup now renders through `public/etl-dashboard.js`.
  - Continued: invoice list filtering/status/row markup now renders through `public/etl-dashboard.js`.
  - Continued: invoice payment modal summary/history and receivables KPI calculations now share `public/etl-dashboard.js` helpers.
  - Continued: LPO detail, quotation request detail, and stock-check modal rendering moved into `public/etl-dashboard.js`; dashboard controller now delegates to shared render helpers.
- Keep each HTML page focused on page structure and page-specific logic only.
  - Started: dashboard page controller JavaScript moved from `public/ETL-Dashboard.html` into `public/etl-dashboard-page.js`, cutting the dashboard HTML down significantly.
  - Started: quotation generator page controller JavaScript moved from `public/ETL-Quotation-generator.html` into `public/etl-quotation-generator-page.js`.
  - Started: LPO system page controller JavaScript moved from `public/ETL-LPO-System.html` into `public/etl-lpo-system-page.js`.
  - Started: invoice generator page controller JavaScript moved from `public/ETL-Invoice.html` into `public/etl-invoice-page.js`.
  - Started: inventory page controller JavaScript moved from `public/ETL-Inventory.html` into `public/etl-inventory-page.js`.
  - Started: site stock and quotation request page controller JavaScript moved into `public/etl-site-stock-page.js` and `public/etl-quotation-request-page.js`.
  - Started: quotation, LPO, and invoice public view page controllers moved into `public/etl-quotation-view-page.js`, `public/etl-lpo-view-page.js`, and `public/etl-invoice-view-page.js`.
  - Route cleanup: dashboard LPO entry points now use the working `public/ETL-LPO-System.html` instead of the incomplete legacy `public/ETL-LPO-Outward.html`.
- Move large page-specific CSS blocks out of HTML into page CSS files.
  - Started: dashboard, quotation generator, LPO system, invoice, and inventory now use `public/etl-*-page.css` files instead of large inline `<style>` blocks.
  - Continued: quotation request, site stock, and public document view pages now use their own `public/etl-*-page.css` files too.
- Eventually consider moving the largest tools into proper Next.js pages/components.

Important note:
- Refactor gradually and test one tool page at a time. These pages are actively used for quotations, LPOs, invoices, stock, and dashboard operations.
- Testing preference: after UI/refactor work, run light browser smoke tests; for email-related flows, run full browser/email flow tests.
