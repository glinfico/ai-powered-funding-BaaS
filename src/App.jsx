import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
        <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white mb-3">GLINVESTCO Platform</h1>
          <p className="text-slate-400 mb-6">AI-Powered Commercial Funding & Real Estate Investment Underwriting Pipeline</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/portal" className="px-6 py-3 bg-blue-600 hover:bg-blue-500 font-medium rounded-lg transition-all text-white shadow-lg">
              Client Portal
            </a>
            <a href="/api/ccd/metrics" target="_blank" rel="noreferrer" className="px-6 py-3 bg-slate-800 hover:bg-slate-700 font-medium rounded-lg transition-all text-slate-200 border border-slate-700">
              View System Metrics
            </a>
          </div>
        </div>
      </div>
    </Router>
  );
}
