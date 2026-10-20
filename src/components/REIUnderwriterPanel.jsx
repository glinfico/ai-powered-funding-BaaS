import React, { useState, useEffect } from 'react';
import { fetchRecentTermSheets } from '../utils/supabaseTermSheets';

export default function REIUnderwriterPanel() {
  const [termSheets, setTermSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSheet, setSelectedSheet] = useState(null);
  const [approvalNote, setApprovalNote] = useState('');
  const [statusMessage, setStatusMessage] = useState(null);

  useEffect(() => {
    loadTermSheets();
  }, []);

  const loadTermSheets = async () => {
    setLoading(true);
    const res = await fetchRecentTermSheets();
    if (res.success && res.data.length > 0) {
      setTermSheets(res.data);
    } else {
      // Fallback sample queue for demonstration
      setTermSheets([
        {
          deal_id: 'REI-102938',
          borrower_name: 'John Doe',
          property_address: '742 Evergreen Terrace',
          loan_amount: 262500,
          ltv: 75.0,
          dscr: 1.35,
          mca_score: 720,
          mca_tier: 'Prime',
          underwriting_status: 'APPROVED_FOR_TERM_SHEET',
          primary_lender_match: 'Apex Institutional DSCR Capital',
          created_at: new Date().toISOString()
        }
      ]);
    }
    setLoading(false);
  };

  const handleUpdateStatus = (newStatus) => {
    if (!selectedSheet) return;
    setStatusMessage(`Deal ${selectedSheet.deal_id} updated to ${newStatus}!`);
    setSelectedSheet({ ...selectedSheet, underwriting_status: newStatus });
  };

  return (
    <div style={{
      maxWidth: '1000px',
      margin: '30px auto',
      padding: '28px',
      backgroundColor: '#0f172a',
      borderRadius: '16px',
      border: '1px solid #334155',
      color: '#ffffff',
      fontFamily: 'sans-serif'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '25px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#38bdf8' }}>
          🛡️ Underwriter & Broker Approval Panel
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '14px' }}>
          Review queued deal underwriting, issue official commitments, and override risk parameters.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: '#94a3b8' }}>Loading term sheet queue...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          
          {/* QUEUED TERM SHEETS LIST */}
          <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '12px', border: '1px solid #334155' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#c084fc' }}>
              Pending Deals ({termSheets.length})
            </h3>
            {termSheets.map((sheet) => (
              <div
                key={sheet.deal_id}
                onClick={() => { setSelectedSheet(sheet); setStatusMessage(null); }}
                style={{
                  padding: '12px',
                  marginBottom: '10px',
                  backgroundColor: selectedSheet?.deal_id === sheet.deal_id ? '#334155' : '#0f172a',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  border: '1px solid #475569',
                  transition: 'background 0.2s'
                }}
              >
                <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#ffffff' }}>{sheet.borrower_name}</div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>{sheet.property_address}</div>
                <div style={{ fontSize: '12px', marginTop: '4px', color: '#38bdf8' }}>
                  ${sheet.loan_amount?.toLocaleString()} | LTV: {sheet.ltv}% | DSCR: {sheet.dscr}
                </div>
              </div>
            ))}
          </div>

          {/* DETAIL & APPROVAL ACTIONS PANEL */}
          <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '12px', border: '1px solid #334155' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#c084fc' }}>
              Underwriting Review
            </h3>

            {selectedSheet ? (
              <div>
                <div style={{ fontSize: '13px', marginBottom: '10px' }}>
                  <div><strong>Deal ID:</strong> {selectedSheet.deal_id}</div>
                  <div><strong>Lender Match:</strong> {selectedSheet.primary_lender_match}</div>
                  <div><strong>MCA Tier:</strong> {selectedSheet.mca_tier} ({selectedSheet.mca_score} pts)</div>
                  <div><strong>Current Status:</strong> <span style={{ color: '#34d399', fontWeight: 'bold' }}>{selectedSheet.underwriting_status}</span></div>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '5px' }}>
                    Underwriter Notes / Stips:
                  </label>
                  <textarea
                    rows="3"
                    value={approvalNote}
                    onChange={(e) => setApprovalNote(e.target.value)}
                    placeholder="e.g. Subject to satisfactory appraisal and clean title search."
                    style={{ width: '100%', padding: '8px', backgroundColor: '#0f172a', border: '1px solid #475569', borderRadius: '6px', color: '#fff', fontSize: '12px', boxSizing: 'border-box' }}
                  />
                </div>

                {statusMessage && (
                  <div style={{ padding: '8px', backgroundColor: '#065f46', color: '#fff', borderRadius: '6px', fontSize: '12px', marginBottom: '12px', textAlign: 'center' }}>
                    {statusMessage}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handleUpdateStatus('OFFICIAL_COMMITMENT_ISSUED')}
                    style={{ flex: 1, padding: '10px', backgroundColor: '#059669', color: '#fff', fontWeight: 'bold', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                  >
                    ✅ Issue Commitment
                  </button>
                  <button
                    onClick={() => handleUpdateStatus('REVISED_TERMS_REQUESTED')}
                    style={{ flex: 1, padding: '10px', backgroundColor: '#d97706', color: '#fff', fontWeight: 'bold', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                  >
                    ⚠️ Request Revision
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'center', paddingTop: '40px' }}>
                Select a deal from the queue to review and issue commitments.
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
