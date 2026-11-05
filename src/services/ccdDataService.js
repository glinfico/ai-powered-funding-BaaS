import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('CRITICAL: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing from environment.');
}

const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

export async function fetchCCDRealtimeData() {
  try {
    // 1. Fetch exact metrics via RPC
    const { data: metrics, error: rpcError } = await supabase.rpc('get_ccd_metrics');
    if (rpcError) {
      console.error('RPC get_ccd_metrics failed:', rpcError.message);
      throw rpcError;
    }

    // 2. Fetch true live leads without arbitrary truncating
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id, aai, business_name, requested_amount, underwriting_status, assignment_status, created_at')
      .order('created_at', { ascending: false })
      .limit(1000);
    
    if (leadsError) {
      console.error('Leads fetch failed:', leadsError.message);
      throw leadsError;
    }

    // 3. Fetch Lenders sample/count
    const { data: lenders, error: lendersError } = await supabase
      .from('lenders')
      .select('id, name, is_active, created_at')
      .limit(500);
      
    if (lendersError) console.error('Lenders fetch warning:', lendersError.message);

    // 4. Fetch Investors (MyCapital 3000)
    const { data: investors, error: investorsError } = await supabase
      .from('investors')
      .select('*')
      .limit(500);
      
    if (investorsError) console.error('Investors fetch warning:', investorsError.message);

    // 5. Fetch LAE Attributions
    const { data: attributions, error: attributionsError } = await supabase
      .from('lae_attributions')
      .select('*')
      .order('assigned_at', { ascending: false })
      .limit(500);
      
    if (attributionsError) console.error('Attributions fetch warning:', attributionsError.message);

    return {
      metrics: metrics || {
        total_leads: 0,
        ide_verified: 0,
        ace_processing: 0,
        ace_approved: 0,
        total_lenders: 0,
        total_investors: 0,
        total_deals: 0,
        total_attributions: 0,
        platform_volume: 0
      },
      leads: leads || [],
      lenders: lenders || [],
      investors: investors || [],
      attributions: attributions || []
    };
  } catch (err) {
    console.error('CRITICAL CCD Telemetry Sync Failure:', err);
    throw err;
  }
}
