import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import BPGVault from './components/BPGVault';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={
          <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
            <h1 className="text-xl font-bold">Authentication Login View</h1>
          </div>
        } />

        <Route 
          path="/portal" 
          element={
            <ProtectedRoute allowedRoles={['broker', 'admin']}>
              <BPGVault />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/crm/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'staff']}>
                          </ProtectedRoute>
          } 
        />

        <Route path="*" element={<Navigate to="/portal" replace />} />
      </Routes>
    </Router>
  );
}
