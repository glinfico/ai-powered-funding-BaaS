import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Identity IQ (IDIQ) Credit Monitoring integration
 * POST /  { action: "pull_credit", first_name, last_name, ssn, dob, address, city, state, zip }
 *           → pulls a soft credit inquiry and returns score + summary
 * POST /  { action: "get_report", report_id }
 *           → retrieves a previously pulled credit report
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action } = body;

    const IDIQ_API_KEY = Deno.env.get('IDIQ_API_KEY');
    const IDIQ_API_SECRET = Deno.env.get('IDIQ_API_SECRET');
    const IDIQ_BASE = 'https://api.identityiq.com/api'; // IDIQ REST API base

    const credentials = btoa(`${IDIQ_API_KEY}:${IDIQ_API_SECRET}`);

    const idiqRequest = async (endpoint, payload = null, method = 'POST') => {
      const res = await fetch(`${IDIQ_BASE}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${credentials}`,
        },
        ...(payload ? { body: JSON.stringify(payload) } : {}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || JSON.stringify(data));
      return data;
    };

    if (action === 'pull_credit') {
      const { first_name, last_name, ssn, dob, address, city, state, zip } = body;
      if (!first_name || !last_name || !ssn) {
        return Response.json({ error: 'first_name, last_name, and ssn are required' }, { status: 400 });
      }

      const data = await idiqRequest('/credit/soft-pull', {
        firstName: first_name,
        lastName: last_name,
        ssn,
        dateOfBirth: dob,
        address: { street: address, city, state, zip },
      });

      return Response.json({
        report_id: data.reportId,
        score: data.creditScore,
        grade: data.grade,
        summary: data.summary,
        accounts: data.accounts,
        derogatory_marks: data.derogatoryMarks,
        inquiries: data.inquiries,
        raw: data,
      });
    }

    if (action === 'get_report') {
      const { report_id } = body;
      if (!report_id) return Response.json({ error: 'report_id required' }, { status: 400 });
      const data = await idiqRequest(`/credit/report/${report_id}`, null, 'GET');
      return Response.json(data);
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});