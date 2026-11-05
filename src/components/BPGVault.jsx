import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-supabase-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function BPGVault() {
  const [user, setUser] = useState(null);
  const [brokerTier, setBrokerTier] = useState('Silver');
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sweeping, setSweeping] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    fetchBrokerAndVault();
  }, []);

  const fetchBrokerAndVault = async () => {
    setLoading(true);
    setStatusMsg('');
    try {
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      if (userError || !currentUser) {
        setStatusMsg('Error: Broker session not found. Please log in.');
        setLoading(false);
        return;
      }

      setUser(currentUser);
      const tier = currentUser.user_metadata?.tier || 'Silver';
      setBrokerTier(tier);

      const { data: vaultLeads, error: leadsError } = await supabase
        .from('leads')
        .select('id, aai, business_name, requested_amount, underwriting_status, assignment_status, created_at')
        .eq('broker_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (leadsError) {
        console.error('Error fetching vault leads:', leadsError);
        setStatusMsg('Failed to load BPG Vault inventory.');
      } else {
        setLeads(vaultLeads || []);
      }
    } catch (err) {
      console.error('Vault error:', err);
      setStatusMsg('An unexpected error occurred loading your BPG Vault.');
    } finally {
      setLoading(false);
    }
  };

  const handleRunLAETierSweep = async () => {
    setSweeping(true);
    setStatusMsg('Running LAE Tier Assignment Engine...');

    try {
      const { data, error } = await supabase.rpc('execute_lae_tier_bpg_dump');

      if (error) {
        console.error('LAE Sweep Error:', error);
        setStatusMsg(`LAE Sweep Failed: ${error.message}`);
      } else {
        const brokerResult = data?.find((row) => row.out_broker_id === user?.id);
        const count = brokerResult ? brokerResult.dumped_count : 0;
        setStatusMsg(`LAE Sweep Complete! Dumped ${count} new lead(s) into your BPG Vault.`);
        
        await fetchBrokerAndVault();
      }
    } catch (err) {
      console.error('Sweep execution error:', err);
      setStatusMsg('Failed to execute LAE sweep.');
    } finally {
      setSweeping(false);
    }
  };

  const getTierBadgeColor = (tier) => {
    switch (tier.toLowerCase()) {
      case 'gold': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'platinum': 
      case 'pro': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'emerald': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      default: return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  const getQuotaLabel = (tier) => {
    switch (tier.toLowerCase()) {
      case 'gold': return '100 Leads Quota (G-)';
      case 'platinum':
      case 'pro': return '1,000 Safe Batch Cap (P-)';
      case 'emerald': return '1,000 Safe Batch Cap (E-)';
      default: return '25 Leads Quota (S-)';
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 bg-slate-900 border border-slate-800 rounded-xl">
        Loading private BPG Vault container...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6 bg-slate-950 text-slate-100 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-slate-900/90 border border-slate-800 rounded-xl shadow-lg">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white">BPG Private Vault</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getTierBadgeColor(brokerTier)}`}>
              {brokerTier} Tier
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Container ID: <code className="text-slate-300 bg-slate-800 px-2 py-0.5 rounded">{user?.id}</code> | Quota: <span className="text-emerald-400 font-medium">{getQuotaLabel(brokerTier)}</span>
          </p>
        </div>

        <button
          onClick={handleRunLAETierSweep}
          disabled={sweeping}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-medium text-sm rounded-lg transition-all shadow-md active:scale-95 cursor-pointer"
        >
          {sweeping ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Executing LAE Dump...</span>
            </>
          ) : (
            <>
              <span>Run LAE Tier Sweep</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </>
          )}
        </button>
      </div>

      {statusMsg && (
        <div className="p-4 bg-blue-950/60 border border-blue-800/80 rounded-lg text-sm text-blue-200">
          {statusMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Vault Asset Count</p>
          <p className="text-3xl font-extrabold text-white mt-2">{leads.length}</p>
        </div>
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Isolation Container</p>
          <p className="text-sm font-semibold text-emerald-400 mt-3 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Private & Encrypted
          </p>
        </div>
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Matching Prefix Filter</p>
          <p className="text-lg font-bold text-slate-200 mt-2">
            {brokerTier.toLowerCase() === 'gold' ? 'G-*' : (brokerTier.toLowerCase() === 'emerald' ? 'E-*' : (brokerTier.toLowerCase() === 'platinum' ? 'P-*' : 'S-*'))}
          </p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Assigned & Self-Sourced Portfolio</h2>
          <span className="text-xs text-slate-400">Showing {leads.length} leads</span>
        </div>

        {leads.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            No leads currently assigned in your BPG Vault. Click "Run LAE Tier Sweep" to ingest matching inventory.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3">AAI Reference</th>
                  <th className="px-6 py-3">Business Name</th>
                  <th className="px-6 py-3">Requested Amount</th>
                  <th className="px-6 py-3">Underwriting Status</th>
                  <th className="px-6 py-3">Vault Status</th>
                  <th className="px-6 py-3">Assigned Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-blue-400">{lead.aai || 'N/A'}</td>
                    <td className="px-6 py-4 font-medium text-white">{lead.business_name || 'Private Merchant'}</td>
                    <td className="px-6 py-4 text-emerald-400 font-medium">
                      {lead.requested_amount ? `$${Number(lead.requested_amount).toLocaleString()}` : '$0.00'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-950 text-emerald-300 border border-emerald-800">
                        {lead.underwriting_status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                        {lead.assignment_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
