import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
        <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold tracking-tight text-white">GLINVESTCO</span>
            <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-medium border border-blue-500/30">Platform Live</span>
          </div>
          <nav className="flex items-center gap-6 text-sm font-medium text-slate-300">
            <a href="/" className="hover:text-white transition-colors">Overview</a>
            <a href="/portal" className="hover:text-white transition-colors">Client Portal</a>
            <a href="/deals" className="hover:text-white transition-colors">Deals & Capital</a>
            <a href="/api/ccd/metrics" target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors">System Metrics</a>
          </nav>
        </header>

        <main className="flex-1 flex flex-col">
          <Routes>
            <Route path="/" element={
              <div className="max-w-6xl mx-auto px-6 py-16 w-full flex flex-col items-center text-center my-auto">
                <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6">
                  AI-Powered Commercial Funding & Real Estate Investments
                </h1>
                <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mb-10 leading-relaxed">
                  Automating merchant cash advances, real estate underwriting, M&A advisory, and institutional debt capital deployment at scale.
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <a href="/portal" className="px-8 py-4 bg-blue-600 hover:bg-blue-500 font-semibold rounded-xl shadow-lg shadow-blue-600/20 transition-all text-white">
                    Access Client Portal
                  </a>
                  <a href="/deals" className="px-8 py-4 bg-slate-900 hover:bg-slate-800 font-semibold rounded-xl border border-slate-800 transition-all text-slate-200">
                    Explore Active Deals
                  </a>
                </div>
              </div>
            } />
            <Route path="/portal" element={
              <div className="max-w-4xl mx-auto px-6 py-12 w-full">
                <h2 className="text-2xl font-bold text-white mb-4">Client Portal & Underwriting Dashboard</h2>
                <p className="text-slate-400 mb-6">Submit funding requests, track application status, and review institutional term sheets.</p>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-300">
                  <p className="text-sm">Secure session active. Connected to Supabase backend infrastructure.</p>
                </div>
              </div>
            } />
            <Route path="/deals" element={
              <div className="max-w-4xl mx-auto px-6 py-12 w-full">
                <h2 className="text-2xl font-bold text-white mb-4">Active Investment Portfolios & Deals</h2>
                <p className="text-slate-400 mb-6">Review verified commercial opportunities, real estate syndications, and asset acquisitions.</p>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-300">
                  <p className="text-sm">Real-time pipeline synchronization enabled.</p>
                </div>
              </div>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
          &copy; 2026 GLINVESTCO Holding. All rights reserved.
        </footer>
      </div>
    </Router>
  );
}
