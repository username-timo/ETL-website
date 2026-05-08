(function () {
  const { SUPABASE_URL, SUPABASE_ANON_KEY } = window.ETLConfig;

  function authHeaders(token, extra) {
    return Object.assign({
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token || SUPABASE_ANON_KEY}`
    }, extra || {});
  }

  async function readJson(responsePromise) {
    const response = await responsePromise;
    if (!response.ok) {
      const message = window.ETLUtils && ETLUtils.readResponseError
        ? await ETLUtils.readResponseError(response)
        : response.statusText;
      throw new Error(`${message || 'Request failed'} (${response.status})`);
    }
    return response.json();
  }

  async function readMinimal(responsePromise) {
    const response = await responsePromise;
    if (!response.ok) {
      const message = window.ETLUtils && ETLUtils.readResponseError
        ? await ETLUtils.readResponseError(response)
        : response.statusText;
      throw new Error(`${message || 'Request failed'} (${response.status})`);
    }
    return true;
  }

  function get(path, token) {
    if (window.etlAuth && typeof etlAuth.fetch === 'function') {
      return etlAuth.fetch(`/rest/v1/${path}`);
    }
    return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      headers: authHeaders(token)
    });
  }

  function patch(table, id, payload, token) {
    if (window.etlAuth && typeof etlAuth.fetch === 'function') {
      return etlAuth.fetch(`/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: {
          Prefer: 'return=minimal'
        },
        body: JSON.stringify(payload)
      });
    }
    return fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: authHeaders(token, {
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      }),
      body: JSON.stringify(payload)
    });
  }

  function post(table, payload, token) {
    if (window.etlAuth && typeof etlAuth.fetch === 'function') {
      return etlAuth.fetch(`/rest/v1/${table}`, {
        method: 'POST',
        headers: {
          Prefer: 'return=representation'
        },
        body: JSON.stringify(payload)
      });
    }
    return fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: 'POST',
      headers: authHeaders(token, {
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      }),
      body: JSON.stringify(payload)
    });
  }

  window.ETLDashboardApi = {
    authHeaders,
    fetchQuotations: (token) => readJson(get('quotations?order=created_at.desc', token)),
    fetchPendingLpoIds: (token) => readJson(get('lpos?status=eq.pending_approval&select=id', token)),
    fetchLpos: (token) => readJson(get('lpos?order=created_at.desc', token)),
    fetchPendingApprovals: async (token) => {
      const [quotations, lpos] = await Promise.all([
        readJson(get('quotations?status=in.(pending_approval,pending)&order=created_at.desc', token)),
        readJson(get('lpos?status=eq.pending_approval&order=created_at.desc', token))
      ]);
      return { quotations, lpos };
    },
    updateQuotation: (id, payload, token) => readMinimal(patch('quotations', id, payload, token)),
    updateLpo: (id, payload, token) => readMinimal(patch('lpos', id, payload, token)),
    fetchInventoryStock: (token) => readJson(get('inventory_items?select=name,current_stock,unit', token)),
    fetchInvoicesWithPayments: (token) => readJson(get('invoices?select=*,invoice_payments(*)&order=created_at.desc', token)),
    fetchReceivableInvoices: (token) => readJson(get('invoices?select=id,total,due_date,invoice_payments(amount)', token)),
    createInvoicePayment: (payload, token) => readJson(post('invoice_payments', payload, token)),
    fetchRecentCount: (table, sinceIso, token, extra) => readJson(get(`${table}?select=id&created_at=gte.${sinceIso}${extra || ''}`, token)),
    fetchRecentInvoiceTotals: (sinceIso, token) => readJson(get(`invoices?select=id,total&created_at=gte.${sinceIso}`, token))
  };
})();
