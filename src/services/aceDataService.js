import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Fetch assigned or self-sourced leads for the broker's Private Portal Gate (PPG)
 */
export async function fetchBrokerPPGLeads() {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    console.error('Authentication error or no active user:', authError);
    return { leads: [], metrics: null };
  }

  // Query the secure vault leads table for this broker's PPG container
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .or(`broker_id.eq.${user.id},created_by_broker_id.eq.${user.id}`)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching PPG portal leads:', error.message);
    return { leads: [], metrics: null };
  }

  const ppgLeads = data || [];
  const totalVolume = ppgLeads.reduce((acc, lead) => acc + (Number(lead.requested_amount) || 0), 0);
  const approvedCount = ppgLeads.filter(l => l.underwriting_status === 'APPROVED_MATCHED').length;

  return {
    leads: ppgLeads,
    metrics: {
      totalPPG: ppgLeads.length,
      approvedVolume: totalVolume,
      approvedDeals: approvedCount
    }
  };
}
