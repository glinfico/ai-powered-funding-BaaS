import React, { useState } from 'react';

export default function REIDealAnalyzer({ onNavigateToSubmit }) {
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
      maxWidth: '900px',
      margin: '40px auto',
      padding: '32px',
      backgroundColor: '#090d16', // Deep dark black/slate background
      borderRadius: '20px',
      border: '1px solid #1e293b',
      boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
      color: '#ffffff',
      fontFamily: 'sans-serif'
    }}>
      {/* HEADER */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <span style={{
          backgroundColor: 'rgba(124, 58, 237, 0.2)',
          color: '#c084fc',
          border: '1px solid rgba(168, 85, 247, 0.4)',
          fontWeight: 'bold',
          fontSize: '12px',
          padding: '6px 16px',
          borderRadius: '20px',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          display: 'inline-block'
        }}>
          Free Investor Tool
        </span>
        <h2 style={{ fontSize: '28px', fontWeight: '800', margin: '14px 0 8px 0', color: '#ffffff', letterSpacing: '-0.02em' }}>
          ⚡ Instant REI Deal Analyzer
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '15px', margin: 0 }}>
          Analyze your property deal instantly & risk-free. No commitment required.
        </p>
      </div>

      {/* INPUT FIELDS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '18px', marginBottom: '28px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#cbd5e1', marginBottom: '8px' }}>
            Purchase Price ($):
          </label>
          <input
            type="number"
            value={purchasePrice}
            onChange={(e) => setPurchasePrice(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 14px',
              backgroundColor: '#131b2e',
              border: '1px solid #334155',
              borderRadius: '10px',
              color: '#ffffff',
              fontSize: '16px',
              fontWeight: '600',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#cbd5e1', marginBottom: '8px' }}>
            Estimated Rehab Cost ($):
          </label>
          <input
            type="number"
            value={rehabCost}
            onChange={(e) => setRehabCost(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 14px',
              backgroundColor: '#131b2e',
              border: '1px solid #334155',
              borderRadius: '10px',
              color: '#ffffff',
              fontSize: '16px',
              fontWeight: '600',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#cbd5e1', marginBottom: '8px' }}>
            After Repair Value (ARV) ($):
          </label>
          <input
            type="number"
            value={arv}
            onChange={(e) => setArv(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 14px',
              backgroundColor: '#131b2e',
              border: '1px solid #334155',
              borderRadius: '10px',
              color: '#ffffff',
              fontSize: '16px',
              fontWeight: '600',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#cbd5e1', marginBottom: '8px' }}>
            Est. Monthly Rent ($):
          </label>
          <input
            type="number"
            value={estimatedRent}
            onChange={(e) => setEstimatedRent(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 14px',
              backgroundColor: '#131b2e',
              border: '1px solid #334155',
              borderRadius: '10px',
              color: '#ffffff',
              fontSize: '16px',
              fontWeight: '600',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>
      </div>

      {/* INSTANT ANALYSIS SUMMARY BOX */}
      <div style={{
        backgroundColor: '#111827',
        padding: '24px',
        borderRadius: '16px',
        border: '1px solid #374151',
        borderLeft: '5px solid #8b5cf6', // Glowing Purple Accent
        marginBottom: '28px'
      }}>
        <h3 style={{ margin: '0 0 18px 0', fontSize: '15px', fontWeight: 'bold', color: '#c084fc', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          📊 Instant Analysis Summary
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '16px' }}>
          <div style={{ backgroundColor: '#1f2937', padding: '16px', borderRadius: '12px', textAlign: 'center', border: '1px solid #374151' }}>
            <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '6px', fontWeight: '500' }}>Total Investment</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff' }}>${totalInvestment.toLocaleString()}</div>
          </div>

          <div style={{ backgroundColor: '#1f2937', padding: '16px', borderRadius: '12px', textAlign: 'center', border: '1px solid #374151' }}>
            <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '6px', fontWeight: '500' }}>Est. Profit</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: estimatedProfit >= 0 ? '#34d399' : '#f87171' }}>
              ${estimatedProfit.toLocaleString()}
            </div>
          </div>

          <div style={{ backgroundColor: '#1f2937', padding: '16px', borderRadius: '12px', textAlign: 'center', border: '1px solid #374151' }}>
            <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '6px', fontWeight: '500' }}>Est. ROI</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: returnOnInvestment >= 0 ? '#34d399' : '#f87171' }}>
              {returnOnInvestment}%
            </div>
          </div>

          <div style={{ backgroundColor: '#1f2937', padding: '16px', borderRadius: '12px', textAlign: 'center', border: '1px solid #374151' }}>
            <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '6px', fontWeight: '500' }}>Est. Cap Rate</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#38bdf8' }}>{estimatedCapRate}%</div>
          </div>
        </div>
      </div>

      {/* CALL TO ACTION BUTTON */}
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '15px', color: '#e2e8f0', fontWeight: '600', marginBottom: '14px' }}>
          Like these numbers? Get pre-approved and funded fast!
        </p>
        <button
          onClick={handleRedirect}
          style={{
            background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)', // Purple to Indigo Gradient
            color: '#ffffff',
            padding: '16px 36px',
            fontSize: '16px',
            fontWeight: 'bold',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            boxShadow: '0 8px 20px rgba(124, 58, 237, 0.4)',
            transition: 'transform 0.2s, boxShadow 0.2s'
          }}
        >
          🚀 Submit to 22K Lenders for Fast Closing
        </button>
        <p style={{ fontSize: '12px', color: '#64748b', marginTop: '10px' }}>
          Instant submission • No credit impact to check rates
        </p>
      </div>
    </div>
  );
}
