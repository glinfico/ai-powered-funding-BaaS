import React, { useState } from 'react';

export default function REIDealAnalyzer({ onSubmitToLenders }) {
  // 1. Inputs for deal analysis
  const [purchasePrice, setPurchasePrice] = useState(250000);
  const [rehabCost, setRehabCost] = useState(30000);
  const [arv, setArv] = useState(350000); // After Repair Value
  const [estimatedRent, setEstimatedRent] = useState(2500);

  // 2. Calculations
  const totalInvestment = Number(purchasePrice) + Number(rehabCost);
  const estimatedProfit = Number(arv) - totalInvestment;
  const returnOnInvestment = totalInvestment > 0 ? ((estimatedProfit / totalInvestment) * 100).toFixed(1) : 0;
  const estimatedAnnualRent = Number(estimatedRent) * 12;
  const estimatedCapRate = totalInvestment > 0 ? ((estimatedAnnualRent / totalInvestment) * 100).toFixed(1) : 0;

  return (
    <div style={{ maxWidth: '700px', margin: '20px auto', padding: '25px', border: '1px solid #e2e8f0', borderRadius: '12px', fontFamily: 'sans-serif', backgroundColor: '#ffffff', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '25px' }}>
        <h2 style={{ fontSize: '24px', color: '#1a202c', marginBottom: '8px' }}>⚡ Instant REI Deal Analyzer</h2>
        <p style={{ color: '#4a5568', fontSize: '14px', margin: 0 }}>
          Analyze your property deal instant & risk-free. No commitment required.
        </p>
      </div>

      {/* INPUT FIELDS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
        <div>
          <label style={{ display: 'block', fontWeight: 'bold', fontSize: '14px', marginBottom: '5px' }}>Purchase Price ($):</label>
          <input
            type="number"
            value={purchasePrice}
            onChange={(e) => setPurchasePrice(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 'bold', fontSize: '14px', marginBottom: '5px' }}>Estimated Rehab Cost ($):</label>
          <input
            type="number"
            value={rehabCost}
            onChange={(e) => setRehabCost(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 'bold', fontSize: '14px', marginBottom: '5px' }}>After Repair Value (ARV) ($):</label>
          <input
            type="number"
            value={arv}
            onChange={(e) => setArv(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 'bold', fontSize: '14px', marginBottom: '5px' }}>Est. Monthly Rent ($):</label>
          <input
            type="number"
            value={estimatedRent}
            onChange={(e) => setEstimatedRent(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }}
          />
        </div>
      </div>

      {/* INSTANT RESULTS DASHBOARD */}
      <div style={{ backgroundColor: '#f7fafc', padding: '20px', borderRadius: '8px', marginBottom: '25px', borderLeft: '4px solid #3182ce' }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#2d3748' }}>📊 Instant Analysis Summary</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '15px' }}>
          <div><strong>Total Investment:</strong> ${totalInvestment.toLocaleString()}</div>
          <div><strong>Est. Profit:</strong> <span style={{ color: estimatedProfit >= 0 ? '#2f855a' : '#c53030', fontWeight: 'bold' }}>${estimatedProfit.toLocaleString()}</span></div>
          <div><strong>Est. ROI:</strong> <span style={{ color: returnOnInvestment >= 0 ? '#2f855a' : '#c53030', fontWeight: 'bold' }}>{returnOnInvestment}%</span></div>
          <div><strong>Est. Cap Rate:</strong> {estimatedCapRate}%</div>
        </div>
      </div>

      {/* CALL TO ACTION TO SUBMIT TO LENDERS */}
      <div style={{ textAlign: 'center', paddingTop: '15px', borderTop: '1px solid #e2e8f0' }}>
        <p style={{ fontWeight: '600', color: '#2d3748', marginBottom: '12px' }}>
          Like these numbers? Get pre-approved and funded fast!
        </p>
        <button
          onClick={() => {
            if (onSubmitToLenders) {
              onSubmitToLenders({ purchasePrice, rehabCost, arv, estimatedRent, estimatedProfit });
            } else {
              alert('Redirecting to 22K Lender Match application...');
            }
          }}
          style={{
            backgroundColor: '#2b6cb0',
            color: '#ffffff',
            padding: '14px 28px',
            fontSize: '16px',
            fontWeight: 'bold',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          🚀 Submit to 22K Lenders for Fast Closing
        </button>
        <p style={{ fontSize: '12px', color: '#718096', marginTop: '8px' }}>
          Instant submission • No credit impact to check rates
        </p>
      </div>

    </div>
  );
}
