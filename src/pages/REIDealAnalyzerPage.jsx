import React from 'react';
import REIDealAnalyzer from '../components/REIDealAnalyzer';

export default function REIDealAnalyzerPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <REIDealAnalyzer onNavigateToSubmit={() => window.location.href = '/crm/rei-form'} />
    </div>
  );
}
