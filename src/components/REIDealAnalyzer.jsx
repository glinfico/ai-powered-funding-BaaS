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
      padding: '36px',
      background: 'linear-gradient(145deg, #0b0f19 0%, #111827 100%)',
      borderRadius: '24px',
      border: '1px solid rgba(245, 158, 11, 0.3)',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
      color: '#ffffff',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* HEADER */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <span style={{
          backgroundColor: 'rgba(245, 158, 11, 0.15)',
          color: '#fbbf24',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          fontWeight: '700',
          fontSize: '11px',
          padding: '6px 16px',
          borderRadius: '30px',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          display: 'inline-block'
        }}>
          GLINFICO FOD • Free Investor Tool
        </span>
        <h2 style={{ fontSize: '30px', fontWeight: '800', margin: '14px 0 8px 0', color: '#ffffff', letterSpacing: '-0.02em' }}>
          ⚡ Instant REI Deal Analyzer
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '15px', maxWidth: '550px', margin: '0 auto', lineHeight: '1.5' }}>
          Analyze your property deal in real-time with zero commitment. Get pre-approved instantly across our 500+ lender network.
        </p>
      </div>

      {/* INPUT FIELDS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#e2e8f0', marginBottom: '8px' }}>
            Purchase Price ($)
          </label>
          <input
            type="number"
            value={purchasePrice}
            onChange={(e) => setPurchasePrice(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
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
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#e2e8f0', marginBottom: '8px' }}>
            Estimated Rehab Cost ($)
          </label>
          <input
            type="number"
            value={rehabCost}
            onChange={(e) => setRehabCost(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
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
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#e2e8f0', marginBottom: '8px' }}>
            After Repair Value (ARV) ($)
          </label>
          <input
            type="number"
            value={arv}
            onChange={(e) => setArv(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
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
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#e2e8f0', marginBottom: '8px' }}>
            Est. Monthly Rent ($)
          </label>
          <input
            type="number"
            value={estimatedRent}
            onChange={(e) => setEstimatedRent(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
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

      {/* SUMMARY DASHBOARD BOX */}
      <div style={{
        backgroundColor: '#131b2e',
        padding: '24px',
        borderRadius: '16px',
        border: '1px solid #334155',
        borderLeft: '5px solid #f59e0b',
        marginBottom: '32px'
      }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: '700', color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          📊 Instant Analysis Summary
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '16px' }}>
          <div style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '12px', textAlign: 'center', border: '1px solid #1e293b' }}>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '6px', fontWeight: '500' }}>Total Investment</div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#ffffff' }}>${totalInvestment.toLocaleString()}</div>
          </div>

          <div style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '12px', textAlign: 'center', border: '1px solid #1e293b' }}>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '6px', fontWeight: '500' }}>Est. Profit</div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: estimatedProfit >= 0 ? '#34d399' : '#f87171' }}>
              ${estimatedProfit.toLocaleString()}
            </div>
          </div>

          <div style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '12px', textAlign: 'center', border: '1px solid #1e293b' }}>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '6px', fontWeight: '500' }}>Est. ROI</div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: returnOnInvestment >= 0 ? '#34d399' : '#f87171' }}>
              {returnOnInvestment}%
            </div>
          </div>

          <div style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '12px', textAlign: 'center', border: '1px solid #1e293b' }}>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '6px', fontWeight: '500' }}>Est. Cap Rate</div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#38bdf8' }}>{estimatedCapRate}%</div>
          </div>
        </div>
      </div>

      {/* CALL TO ACTION BUTTON */}
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '15px', color: '#cbd5e1', fontWeight: '600', marginBottom: '14px' }}>
          Like these numbers? Get pre-approved and funded fast!
        </p>
        <button
          onClick={handleRedirect}
          style={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: '#ffffff',
            padding: '16px 36px',
            fontSize: '16px',
            fontWeight: '800',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            boxShadow: '0 10px 25px rgba(245, 158, 11, 0.4)',
            letterSpacing: '0.02em',
            transition: 'transform 0.2s'
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
