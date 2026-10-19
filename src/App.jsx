import React, { useState } from 'react';

// --- 1. REI DEAL ANALYZER COMPONENT ---
function REIDealAnalyzer({ onSubmitToLenders }) {
  const [purchasePrice, setPurchasePrice] = useState(250000);
  const [rehabCost, setRehabCost] = useState(30000);
  const [arv, setArv] = useState(350000);
  const [estimatedRent, setEstimatedRent] = useState(2500);

  const totalInvestment = Number(purchasePrice) + Number(rehabCost);
  const estimatedProfit = Number(arv) - totalInvestment;
  const returnOnInvestment = totalInvestment > 0 ? ((estimatedProfit / totalInvestment) * 100).toFixed(1) : 0;
  const estimatedAnnualRent = Number(estimatedRent) * 12;
  const estimatedCapRate = totalInvestment > 0 ? ((estimatedAnnualRent / totalInvestment) * 100).toFixed(1) : 0;

  return (
    <div style={{ maxWidth: '700px', margin: '20px auto', padding: '25px', border: '1px solid #e2e8f0', borderRadius: '12px', fontFamily: 'sans-serif', backgroundColor: '#ffffff', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
      <div style={{ textAlign: 'center', marginBottom: '25px' }}>
        <h2 style={{ fontSize: '24px', color: '#1a202c', marginBottom: '8px' }}>⚡ Instant REI Deal Analyzer</h2>
        <p style={{ color: '#4a5568', fontSize: '14px', margin: 0 }}>Analyze your property deal instantly & risk-free. No commitment required.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
        <div>
          <label style={{ display: 'block', fontWeight: 'bold', fontSize: '14px', marginBottom: '5px' }}>Purchase Price ($):</label>
          <input type="number" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontWeight: 'bold', fontSize: '14px', marginBottom: '5px' }}>Estimated Rehab Cost ($):</label>
          <input type="number" value={rehabCost} onChange={(e) => setRehabCost(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontWeight: 'bold', fontSize: '14px', marginBottom: '5px' }}>After Repair Value (ARV) ($):</label>
          <input type="number" value={arv} onChange={(e) => setArv(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontWeight: 'bold', fontSize: '14px', marginBottom: '5px' }}>Est. Monthly Rent ($):</label>
          <input type="number" value={estimatedRent} onChange={(e) => setEstimatedRent(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} />
        </div>
      </div>

      <div style={{ backgroundColor: '#f7fafc', padding: '20px', borderRadius: '8px', marginBottom: '25px', borderLeft: '4px solid #3182ce' }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#2d3748' }}>📊 Instant Analysis Summary</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '15px' }}>
          <div><strong>Total Investment:</strong> ${totalInvestment.toLocaleString()}</div>
          <div><strong>Est. Profit:</strong> <span style={{ color: estimatedProfit >= 0 ? '#2f855a' : '#c53030', fontWeight: 'bold' }}>${estimatedProfit.toLocaleString()}</span></div>
          <div><strong>Est. ROI:</strong> <span style={{ color: returnOnInvestment >= 0 ? '#2f855a' : '#c53030', fontWeight: 'bold' }}>{returnOnInvestment}%</span></div>
          <div><strong>Est. Cap Rate:</strong> {estimatedCapRate}%</div>
        </div>
      </div>

      <div style={{ textAlign: 'center', paddingTop: '15px', borderTop: '1px solid #e2e8f0' }}>
        <p style={{ fontWeight: '600', color: '#2d3748', marginBottom: '12px' }}>Like these numbers? Get pre-approved and funded fast!</p>
        <button
          onClick={onSubmitToLenders}
          style={{ backgroundColor: '#2b6cb0', color: '#ffffff', padding: '14px 28px', fontSize: '16px', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
        >
          🚀 Submit to 22K Lenders for Fast Closing
        </button>
      </div>
    </div>
  );
}

// --- 2. REI FORM COMPONENT ---
function REIForm() {
  const [submitted, setSubmitted] = useState(false);
  
  if (submitted) {
    return (
      <div style={{ maxWidth: '600px', margin: '40px auto', padding: '30px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', textAlign: 'center' }}>
        <h2 style={{ color: '#166534', fontSize: '24px' }}>✅ Deal Submitted!</h2>
        <p style={{ color: '#15803d' }}>Our team will review your deal and match you with the best lenders within 24 hours.</p>
        <button onClick={() => setSubmitted(false)} style={{ marginTop: '15px', padding: '10px 20px', backgroundColor: '#166534', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
          Submit Another Deal
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '600px', margin: '20px auto', padding: '25px', border: '1px solid #e2e8f0', borderRadius: '12px', backgroundColor: '#ffffff', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
      <h2 style={{ textAlign: 'center', color: '#1e293b', marginBottom: '20px' }}>Real Estate Funding Application</h2>
      <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Full Name:</label>
          <input type="text" required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email Address:</label>
          <input type="email" required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Property Address:</label>
          <input type="text" required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Loan Amount Requested ($):</label>
          <input type="number" required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} />
        </div>
        <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#059669', color: '#ffffff', fontSize: '16px', fontWeight: 'bold', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
          Submit Deal to Lenders
        </button>
      </form>
    </div>
  );
}

// --- 3. MAIN PUBLIC FRONTEND LANDING PAGE ---
export default function App() {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <div style={{ fontFamily: 'sans-serif', minHeight: '100vh', backgroundColor: '#f8fafc', margin: 0 }}>
      {/* PUBLIC HEADER NAVIGATION */}
      <header style={{ backgroundColor: '#1e293b', padding: '15px 20px', color: '#ffffff', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '20px', margin: 0, cursor: 'pointer' }} onClick={() => setActiveTab('home')}>
            🏢 AI-Powered Funding BaaS
          </h1>
          <nav style={{ display: 'flex', gap: '15px' }}>
            <button onClick={() => setActiveTab('home')} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: activeTab === 'home' ? '#3b82f6' : 'transparent', color: '#ffffff', fontWeight: 'bold', cursor: 'pointer' }}>
              Home
            </button>
            <button onClick={() => setActiveTab('analyzer')} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: activeTab === 'analyzer' ? '#3b82f6' : 'transparent', color: '#ffffff', fontWeight: 'bold', cursor: 'pointer' }}>
              Deal Analyzer
            </button>
            <button onClick={() => setActiveTab('submit')} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: activeTab === 'submit' ? '#3b82f6' : 'transparent', color: '#ffffff', fontWeight: 'bold', cursor: 'pointer' }}>
              Submit Deal
            </button>
          </nav>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main style={{ maxWidth: '1000px', margin: '30px auto', padding: '0 20px' }}>
        {activeTab === 'home' && (
          <div style={{ textAlign: 'center', padding: '50px 20px', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <h2 style={{ fontSize: '32px', color: '#0f172a', marginBottom: '15px' }}>
              Fast Capital for Real Estate Investors
            </h2>
            <p style={{ fontSize: '18px', color: '#475569', maxWidth: '600px', margin: '0 auto 30px auto', lineHeight: '1.6' }}>
              Analyze investment deals in seconds with zero commitment, or submit your deal directly to our network of 22,000+ lenders for fast closing.
            </p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button onClick={() => setActiveTab('analyzer')} style={{ padding: '14px 28px', fontSize: '16px', fontWeight: 'bold', backgroundColor: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                📊 Analyze a Deal Free
              </button>
              <button onClick={() => setActiveTab('submit')} style={{ padding: '14px 28px', fontSize: '16px', fontWeight: 'bold', backgroundColor: '#059669', color: '#ffffff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                🚀 Submit Deal to 22K Lenders
              </button>
            </div>
          </div>
        )}

        {activeTab === 'analyzer' && (
          <REIDealAnalyzer onSubmitToLenders={() => setActiveTab('submit')} />
        )}

        {activeTab === 'submit' && (
          <REIForm />
        )}
      </main>
    </div>
  );
}
