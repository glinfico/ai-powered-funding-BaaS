import React, { useState } from 'react';
import REIForm from './components/REIForm';
import REIDealAnalyzer from './components/REIDealAnalyzer';

function App() {
  // Sets default view to the public landing page ('home')
  const [activeTab, setActiveTab] = useState('home');

  return (
    <div style={{ fontFamily: 'sans-serif', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      
      {/* PUBLIC HEADER NAVIGATION */}
      <header style={{ backgroundColor: '#1e293b', padding: '15px 20px', color: '#ffffff', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 
            style={{ fontSize: '20px', margin: 0, cursor: 'pointer' }}
            onClick={() => setActiveTab('home')}
          >
            🏢 AI-Powered Funding BaaS
          </h1>

          <nav style={{ display: 'flex', gap: '15px' }}>
            <button 
              onClick={() => setActiveTab('home')}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: activeTab === 'home' ? '#3b82f6' : 'transparent',
                color: '#ffffff',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Home
            </button>

            <button 
              onClick={() => setActiveTab('analyzer')}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: activeTab === 'analyzer' ? '#3b82f6' : 'transparent',
                color: '#ffffff',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Deal Analyzer
            </button>

            <button 
              onClick={() => setActiveTab('submit')}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: activeTab === 'submit' ? '#3b82f6' : 'transparent',
                color: '#ffffff',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Submit Deal
            </button>
          </nav>
        </div>
      </header>

      {/* PUBLIC FRONTEND CONTENT */}
      <main style={{ maxWidth: '1000px', margin: '30px auto', padding: '0 20px' }}>
        
        {/* PUBLIC HOME HERO SECTION */}
        {activeTab === 'home' && (
          <div style={{ textAlign: 'center', padding: '50px 20px', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <h2 style={{ fontSize: '32px', color: '#0f172a', marginBottom: '15px' }}>
              Fast Capital for Real Estate Investors
            </h2>
            <p style={{ fontSize: '18px', color: '#475569', maxWidth: '600px', margin: '0 auto 30px auto', lineHeight: '1.6' }}>
              Analyze investment deals in seconds with zero commitment, or submit your deal directly to our network of 22,000+ lenders for fast closing.
            </p>
            
            {/* PUBLIC CALL TO ACTION BUTTONS */}
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button 
                onClick={() => setActiveTab('analyzer')}
                style={{ padding: '14px 28px', fontSize: '16px', fontWeight: 'bold', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
              >
                📊 Analyze a Deal Free
              </button>
              <button 
                onClick={() => setActiveTab('submit')}
                style={{ padding: '14px 28px', fontSize: '16px', fontWeight: 'bold', backgroundColor: '#059669', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
              >
                🚀 Submit Deal to 22K Lenders
              </button>
            </div>
          </div>
        )}

        {/* FREE DEAL ANALYZER TAB */}
        {activeTab === 'analyzer' && (
          <REIDealAnalyzer onSubmitToLenders={() => setActiveTab('submit')} />
        )}

        {/* SUBMIT DEAL FORM TAB */}
        {activeTab === 'submit' && (
          <REIForm />
        )}

      </main>

    </div>
  );
}

export default App;
