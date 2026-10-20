import { downloadTermSheetText, emailTermSheet } from '../utils/termSheetDispatch';
import React, { useState } from 'react';
import { underwriteREIDeal, matchLenders, generateREITermSheetPayload } from '../utils/reiUnderwritingEngine';
import { fetchAutomatedPropertyValuation, initiateServiceLinkEClosing } from '../utils/propertyAndTitleService';
import { saveTermSheetToSupabase } from '../utils/supabaseTermSheets';

export default function REITermSheetPreview() {
  const [dealData, setDealData] = useState({
    borrowerName: '',
    propertyAddress: '',
    purchasePrice: 300000,
    rehabCost: 50000,
    arv: 450000,
    monthlyRent: 3200,
    monthlyRevenue: 45000,
    creditScore: 680
  });

  const [underwritingResult, setUnderwritingResult] = useState(null);
  const [valuationData, setValuationData] = useState(null);
  const [eCloseStatus, setECloseStatus] = useState(null);
  const [dbSaveStatus, setDbSaveStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setDealData({ ...dealData, [e.target.name]: e.target.value });
  };

  const handleRunUnderwriting = async (e) => {
    e.preventDefault();
    setLoading(true);
    setDbSaveStatus(null);

    // 1. Run Automated Property Valuation Check (CoStar/CBRE)
    const valuation = await fetchAutomatedPropertyValuation(dealData.propertyAddress);
    setValuationData(valuation);

    // 2. Run Underwriting & MCA Scoring Engine
    const result = underwriteREIDeal({
      purchasePrice: dealData.purchasePrice,
      rehabCost: dealData.rehabCost,
      arv: dealData.arv,
      monthlyRent: dealData.monthlyRent,
      mcaMetrics: {
        monthlyRevenue: dealData.monthlyRevenue,
        creditScore: dealData.creditScore
      }
    });

    // 3. Match Lenders
    const matchedLenders = matchLenders(result);

    // 4. Generate Term Sheet Payload (Supabase Compatible)
    const termSheet = generateREITermSheetPayload(dealData, result, matchedLenders);

    const [emailInput, setEmailInput] = useState('');
const [emailStatus, setEmailStatus] = useState(null);
    
    // 5. Automatically Save to Supabase Database
    const saveResult = await saveTermSheetToSupabase(termSheet);
    if (saveResult.success) {
      setDbSaveStatus({ success: true, message: 'Term Sheet saved to Supabase successfully!' });
    } else {
      setDbSaveStatus({ success: false, message: 'Saved locally (Database key pending)' });
    }

    setUnderwritingResult({ result, matchedLenders, termSheet });
    setLoading(false);
  };

  const handleTriggerTitleEclose = async () => {
    if (!underwritingResult) return;
    const order = await initiateServiceLinkEClosing(underwritingResult.termSheet, underwritingResult.termSheet);
    setECloseStatus(order);
  };

  <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
  <button 
    onClick={() => downloadTermSheetText(underwritingResult.termSheet)}
    style={{ padding: '10px 18px', backgroundColor: '#2563eb', color: '#fff', fontWeight: 'bold', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
  >
    📥 Download Term Sheet (.txt)
  </button>

  <div style={{ display: 'flex', gap: '5px' }}>
    <input 
      type="email" 
      placeholder="borrower@email.com" 
      value={emailInput} 
      onChange={(e) => setEmailInput(e.target.value)}
      style={{ padding: '8px', backgroundColor: '#0f172a', border: '1px solid #475569', borderRadius: '6px', color: '#fff', fontSize: '13px' }}
    />
    <button 
      onClick={async () => {
        if (!emailInput) { alert('Please enter a recipient email'); return; }
        const res = await emailTermSheet(underwritingResult.termSheet, emailInput);
        setEmailStatus(res.message);
      }}
      style={{ padding: '10px 18px', backgroundColor: '#d97706', color: '#fff', fontWeight: 'bold', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
    >
      ✉️ Email Term Sheet
    </button>
  </div>
</div>

{emailStatus && (
  <div style={{ marginTop: '10px', textAlign: 'center', fontSize: '13px', color: '#34d399' }}>
    {emailStatus}
  </div>
)}
  
  return (
    <div style={{
      maxWidth: '900px',
      margin: '30px auto',
      padding: '28px',
      backgroundColor: '#0f172a',
      borderRadius: '16px',
      border: '1px solid #334155',
      color: '#ffffff',
      fontFamily: 'sans-serif'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '25px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#c084fc' }}>
          📄 Instant REI Term Sheet & Underwriting Engine
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '14px' }}>
          Automated LTV/DSCR calculations, MCA risk scoring, and CoStar/ServiceLink pipeline integration.
        </p>
      </div>

      <form onSubmit={handleRunUnderwriting} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '25px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '5px' }}>Borrower Name</label>
          <input type="text" name="borrowerName" value={dealData.borrowerName} onChange={handleChange} required style={{ width: '100%', padding: '10px', backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '6px', color: '#fff', boxSizing: 'border-box' }} />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '5px' }}>Property Address</label>
          <input type="text" name="propertyAddress" value={dealData.propertyAddress} onChange={handleChange} required style={{ width: '100%', padding: '10px', backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '6px', color: '#fff', boxSizing: 'border-box' }} />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '5px' }}>Purchase Price ($)</label>
          <input type="number" name="purchasePrice" value={dealData.purchasePrice} onChange={handleChange} style={{ width: '100%', padding: '10px', backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '6px', color: '#fff', boxSizing: 'border-box' }} />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '5px' }}>Estimated ARV ($)</label>
          <input type="number" name="arv" value={dealData.arv} onChange={handleChange} style={{ width: '100%', padding: '10px', backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '6px', color: '#fff', boxSizing: 'border-box' }} />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '5px' }}>Monthly Business Revenue ($)</label>
          <input type="number" name="monthlyRevenue" value={dealData.monthlyRevenue} onChange={handleChange} style={{ width: '100%', padding: '10px', backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '6px', color: '#fff', boxSizing: 'border-box' }} />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '5px' }}>FICO Credit Score</label>
          <input type="number" name="creditScore" value={dealData.creditScore} onChange={handleChange} style={{ width: '100%', padding: '10px', backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '6px', color: '#fff', boxSizing: 'border-box' }} />
        </div>

        <button type="submit" disabled={loading} style={{ gridColumn: '1 / -1', padding: '12px', backgroundColor: '#7c3aed', color: '#fff', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer', marginTop: '10px' }}>
          {loading ? 'Underwriting Deal...' : '⚡ Generate Term Sheet & Underwrite'}
        </button>
      </form>

      {/* UNDERWRITING & TERM SHEET RESULTS DISPLAY */}
      {underwritingResult && (
        <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px', borderLeft: '4px solid #a855f7' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#c084fc', fontSize: '18px' }}>📋 Automated Term Sheet Decision</h3>

          {dbSaveStatus && (
            <div style={{ padding: '8px 12px', borderRadius: '6px', marginBottom: '15px', fontSize: '13px', backgroundColor: dbSaveStatus.success ? '#065f46' : '#991b1b', color: '#fff' }}>
              {dbSaveStatus.message}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
            <div><strong>Approval Status:</strong> <span style={{ color: underwritingResult.result.isApproved ? '#34d399' : '#f87171' }}>{underwritingResult.result.underwritingStatus}</span></div>
            <div><strong>Approved Loan:</strong> ${underwritingResult.result.loanAmount.toLocaleString()}</div>
            <div><strong>Calculated LTV:</strong> {underwritingResult.result.ltv}%</div>
            <div><strong>DSCR Score:</strong> {underwritingResult.result.dscr}</div>
            <div><strong>MCA Credit Tier:</strong> {underwritingResult.result.mcaRisk.mcaTier} ({underwritingResult.result.mcaRisk.mcaScore} pts)</div>
            <div><strong>Est. Monthly PITAI:</strong> ${underwritingResult.result.monthlyPayment.toLocaleString()}</div>
          </div>

          {valuationData && (
            <div style={{ backgroundColor: '#0f172a', padding: '12px', borderRadius: '8px', marginBottom: '15px', fontSize: '13px' }}>
              <strong>CoStar/CBRE Valuation Check:</strong> {valuationData.dataSource} — Valued at ${valuationData.estimatedValue.toLocaleString()} ({valuationData.confidenceScore} Confidence)
            </div>
          )}

          <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #334155' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#38bdf8' }}>Matched Lenders:</h4>
            {underwritingResult.matchedLenders.map((lender, i) => (
              <div key={i} style={{ fontSize: '13px', marginBottom: '6px' }}>
                • <strong>{lender.lenderName}</strong> — Max LTV: {lender.maxLtv} | Rate: {lender.rateRange} | Closing: {lender.speed}
              </div>
            ))}
          </div>

          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button onClick={handleTriggerTitleEclose} style={{ padding: '10px 20px', backgroundColor: '#059669', color: '#fff', fontWeight: 'bold', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              Initiate ServiceLink Title Search & eClosing Package
            </button>
            {eCloseStatus && (
              <div style={{ marginTop: '10px', fontSize: '13px', color: '#34d399' }}>
                ✅ Order Issued: {eCloseStatus.servicelink_order_id} ({eCloseStatus.status})
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
