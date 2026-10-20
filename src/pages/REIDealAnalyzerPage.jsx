import React from 'react';
import REIDealAnalyzer from '../components/REIDealAnalyzer';

export default function REIDealAnalyzerPage() {
  return (
    <div style={{ padding: '20px' }}>
      <REIDealAnalyzer onSubmitToLenders={() => window.location.href = '/REIForm'} />
    </div>
  );
}
