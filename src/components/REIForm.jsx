// src/components/REIForm.jsx
import React, { useState } from 'react';

export default function REIForm() {
  const [formData, setFormData] = useState({
    property_address: '',
    property_type: 'single_family',
    occupancy_status: 'vacant',
    purchase_price: '',
    as_is_value: '',
    after_repair_value: '',
    rehab_budget: '0',
    requested_loan_amount: '',
    gross_monthly_rent: '0',
    estimated_annual_taxes: '0',
    estimated_annual_insurance: '0',
    annual_hoa_expenses: '0',
    loan_purpose: 'purchase',
    exit_strategy: 'property_sale',
    estimated_hold_period_months: '12'
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    const apiUrl = import.meta.env.VITE_API_URL || 'https://your-render-backend.onrender.com';

    try {
      const response = await fetch(`${apiUrl}/api/v1/rei/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Submission failed');

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-800 my-8">
      <h2 className="text-2xl font-bold mb-2 text-amber-400">GLINFICO Real Estate Investment (REI) Application</h2>
      <p className="text-slate-400 mb-6 text-sm">Submit your commercial or residential property details for instant automated underwriting and capital matching.</p>

      {error && <div className="p-4 mb-4 bg-red-900/50 border border-red-500 rounded text-red-200 text-sm">{error}</div>}

      {result ? (
        <div className="p-6 bg-slate-800 rounded-lg border border-emerald-500/30">
          <h3 className="text-xl font-bold text-emerald-400 mb-2">Deal Scored & Submitted Successfully!</h3>
          <p className="text-slate-300 mb-4">GLINFICO Score: <span className="text-2xl font-extrabold text-white">{result.underwriting.glinfico_score} / 100</span></p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center bg-slate-900 p-4 rounded-md border border-slate-700">
            <div>
              <div className="text-xs text-slate-400">LTV</div>
              <div className="text-lg font-bold text-amber-300">{result.underwriting.metrics.ltv}%</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">LTC</div>
              <div className="text-lg font-bold text-amber-300">{result.underwriting.metrics.ltc}%</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">DSCR</div>
              <div className="text-lg font-bold text-amber-300">{result.underwriting.metrics.dscr}x</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Status</div>
              <div className="text-sm font-bold text-emerald-400 mt-1">{result.underwriting.status}</div>
            </div>
          </div>
          <button onClick={() => setResult(null)} className="mt-6 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded font-medium text-sm transition">
            Submit Another REI Deal
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Property Fundamentals */}
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-lg font-semibold text-slate-200 mb-3">1. Property Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs text-slate-400 mb-1">Property Address</label>
                <input required type="text" name="property_address" value={formData.property_address} onChange={handleChange} placeholder="123 Main St, Austin, TX" className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-400" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Property Type</label>
                <select name="property_type" value={formData.property_type} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-400">
                  <option value="single_family">Single Family</option>
                  <option value="multi_family">Multi Family</option>
                  <option value="commercial">Commercial</option>
                  <option value="industrial">Industrial</option>
                  <option value="mixed_use">Mixed Use</option>
                  <option value="land">Land</option>
                </select>
              </div>
            </div>
          </div>

          {/* Valuation & Loan Request */}
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-lg font-semibold text-slate-200 mb-3">2. Valuation & Request</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">As-Is Value ($)</label>
                <input required type="number" name="as_is_value" value={formData.as_is_value} onChange={handleChange} placeholder="350000" className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-400" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Purchase Price ($)</label>
                <input type="number" name="purchase_price" value={formData.purchase_price} onChange={handleChange} placeholder="320000" className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-400" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Rehab Budget ($)</label>
                <input type="number" name="rehab_budget" value={formData.rehab_budget} onChange={handleChange} placeholder="40000" className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-400" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Requested Loan ($)</label>
                <input required type="number" name="requested_loan_amount" value={formData.requested_loan_amount} onChange={handleChange} placeholder="270000" className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-400" />
              </div>
            </div>
          </div>

          {/* Monthly Financials (DSCR) */}
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-lg font-semibold text-slate-200 mb-3">3. Income & Operating Expenses</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Gross Monthly Rent ($)</label>
                <input type="number" name="gross_monthly_rent" value={formData.gross_monthly_rent} onChange={handleChange} placeholder="3500" className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-400" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Annual Taxes ($)</label>
                <input type="number" name="estimated_annual_taxes" value={formData.estimated_annual_taxes} onChange={handleChange} placeholder="4200" className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-400" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Annual Insurance ($)</label>
                <input type="number" name="estimated_annual_insurance" value={formData.estimated_annual_insurance} onChange={handleChange} placeholder="1800" className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-400" />
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold rounded shadow-lg transition">
            {loading ? 'Calculating Underwriting & Scoring...' : 'Submit Real Estate Deal for Scoring'}
          </button>
        </form>
      )}
    </div>
  );
}
