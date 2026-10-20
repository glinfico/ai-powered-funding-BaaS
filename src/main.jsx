import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { AuthProvider } from '@/lib/AuthContext'
import '@/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <QueryClientProvider client={queryClientInstance}>
    <AuthProvider>
      <App />
    </AuthProvider>
  </QueryClientProvider>
)
