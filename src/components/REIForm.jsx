import React, { useState } from 'react';

export default function REIForm() {
  const [purchasePrice, setPurchasePrice] = useState(250000);
  const [rehabCost, setRehabCost] = useState(30000);
  const [arv, setArv] = useState(350000);
  const [estimatedRent, setEstimatedRent] = useState(2500);

  const totalInvestment = Number(purchasePrice) + Number(rehabCost);
  const estimatedProfit = Number(arv) - totalInvestment;
  const returnOnInvestment = totalInvestment > 0 ? ((estimatedProfit / totalInvestment) * 100).toFixed(1) : 0;
  const estimatedAnnualRent = Number(estimatedRent) * 12;
  const estimatedCapRate = totalInvestment > 0 ? ((estimatedAnnualRent / totalInvestment) * 100).toFixed(1) : 0;

  const handleRedirect = () => {
    if (onNavigateToSubmit) {
      onNavigateToSubmit();
    } else {
      window.location.href = '/fod/submit';
    }
  };

  return (
    <div style={{
      maxWidth: '850px',
      margin: '40px auto',
      padding: '30px',
      backgroundColor: '#0f172a', // Deep slate background for contrast
      borderRadius: '16px',
      border: '1px solid #334155',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
      color: '#f8fafc',
      fontFamily: 'sans-serif'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '25px' }}>
        <span style={{
          backgroundColor: 'rgba(245, 158, 11, 0.15)',
          color: '#fbbf24',
          fontWeight: 'bold',
          fontSize: '12px',
          padding: '4px 12px',
          borderRadius: '20px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          Free Investor Tool
        </span>
        <h2 style={{ fontSize: '26px', fontWeight: 'bold', margin: '12px 0 6px 0', color: '#ffffff' }}>
          ⚡ Instant REI Deal Analyzer
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>
          Analyze your property deal instantly & risk-free. No commitment required.
        </p>
      </div>

      {/* INPUT FIELDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '25px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>
            Purchase Price ($):
          </label>
          <input
            type="number"
            value={purchasePrice}
            onChange={(e) => setPurchasePrice(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '15px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>
            Estimated Rehab Cost ($):
          </label>
          <input
            type="number"
            value={rehabCost}
            onChange={(e) => setRehabCost(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '15px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>
            After Repair Value (ARV) ($):
          </label>
          <input
            type="number"
            value={arv}
            onChange={(e) => setArv(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '15px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>
            Est. Monthly Rent ($):
          </label>
          <input
            type="number"
            value={estimatedRent}
            onChange={(e) => setEstimatedRent(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '15px',
              boxSizing: 'border-box'
            }}
          />
        </div>
      </div>

      {/* SUMMARY DASHBOARD BOX */}
      <div style={{
        backgroundColor: '#1e293b',
        padding: '20px',
        borderRadius: '12px',
        borderLeft: '4px solid #f59e0b',
        marginBottom: '25px'
      }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '15px', fontWeight: 'bold', color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          📊 Instant Analysis Summary
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '15px' }}>
          <div style={{ backgroundColor: '#0f172a', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Total Investment</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff' }}>${totalInvestment.toLocaleString()}</div>
          </div>

          <div style={{ backgroundColor: '#0f172a', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Est. Profit</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: estimatedProfit >= 0 ? '#4ade80' : '#f87171' }}>
              ${estimatedProfit.toLocaleString()}
            </div>
          </div>

          <div style={{ backgroundColor: '#0f172a', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Est. ROI</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: returnOnInvestment >= 0 ? '#4ade80' : '#f87171' }}>
              {returnOnInvestment}%
            </div>
          </div>

          <div style={{ backgroundColor: '#0f172a', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Est. Cap Rate</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff' }}>{estimatedCapRate}%</div>
          </div>
        </div>
      </div>

      {/* CTA BUTTON */}
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '14px', color: '#cbd5e1', fontWeight: '500', marginBottom: '12px' }}>
          Like these numbers? Get pre-approved and funded fast!
        </p>
        <button
          onClick={handleRedirect}
          style={{
            backgroundColor: '#d97706',
            color: '#ffffff',
            padding: '14px 28px',
            fontSize: '16px',
            fontWeight: 'bold',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(217, 119, 6, 0.3)',
            transition: 'all 0.2s'
          }}
        >
          🚀 Submit to 22K Lenders for Fast Closing
        </button>
        <p style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
          Instant submission • No credit impact to check rates
        </p>
      </div>
    </div>
  );
}
