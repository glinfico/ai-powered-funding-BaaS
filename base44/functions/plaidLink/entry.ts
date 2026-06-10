import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Plaid Link integration
 * POST /  { action: "create_link_token" }            → returns link_token
 * POST /  { action: "exchange_token", public_token } → returns access_token + item_id
 * POST /  { action: "get_accounts", access_token }   → returns accounts list
 * POST /  { action: "get_transactions", access_token, start_date, end_date } → returns transactions
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action } = body;

    const PLAID_CLIENT_ID = Deno.env.get('PLAID_CLIENT_ID');
    const PLAID_SECRET = Deno.env.get('PLAID_SECRET');
    const PLAID_BASE = 'https://sandbox.plaid.com'; // change to https://production.plaid.com for prod

    const plaidPost = async (endpoint, payload) => {
      const res = await fetch(`${PLAID_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: PLAID_CLIENT_ID,
          secret: PLAID_SECRET,
          ...payload,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error_message || JSON.stringify(data));
      return data;
    };

    if (action === 'create_link_token') {
      const data = await plaidPost('/link/token/create', {
        user: { client_user_id: user.id },
        client_name: 'GLINFICO',
        products: ['transactions', 'auth'],
        country_codes: ['US'],
        language: 'en',
      });
      return Response.json({ link_token: data.link_token });
    }

    if (action === 'exchange_token') {
      const { public_token } = body;
      if (!public_token) return Response.json({ error: 'public_token required' }, { status: 400 });
      const data = await plaidPost('/item/public_token/exchange', { public_token });
      return Response.json({ access_token: data.access_token, item_id: data.item_id });
    }

    if (action === 'get_accounts') {
      const { access_token } = body;
      if (!access_token) return Response.json({ error: 'access_token required' }, { status: 400 });
      const data = await plaidPost('/accounts/get', { access_token });
      return Response.json({ accounts: data.accounts });
    }

    if (action === 'get_transactions') {
      const { access_token, start_date, end_date } = body;
      if (!access_token) return Response.json({ error: 'access_token required' }, { status: 400 });
      const data = await plaidPost('/transactions/get', {
        access_token,
        start_date: start_date || new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0],
        end_date: end_date || new Date().toISOString().split('T')[0],
      });
      return Response.json({ transactions: data.transactions, accounts: data.accounts });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});