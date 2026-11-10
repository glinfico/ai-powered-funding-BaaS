import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { normalizeLoanType, getFundingCategory } from './leadNormalization.js';
import { buildLeadUpdates, buildContactName } from './leadUpdateRules.js';
import capitalDigestRouter from './routes/capitalDigest.js';
import ccdMetricsRouter from './routes/ccdMetrics.js';
// pipelineRoute.js imported a non-existent 'executeIDEPipeline' export and
// failed to link. pipelineRouter.js is the working implementation.
import pipelineRouter from './routes/pipelineRouter.js';
import { createAdminCredentialsRouter } from './routes/adminCredentials.js';
import { createCrmDataRouter } from './routes/crmData.js';
import { createCcdDocumentsRouter } from './routes/ccdDocuments.js';
import { createCcdBankLeadsRouter } from './routes/ccdBankLeads.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, error: 'Too many requests, please try again later.' }
});

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.json({ limit: '256kb' }));
app.use('/api/', limiter);

// Mount API Routers FIRST before static assets & catch-all
app.use('/api/digest', capitalDigestRouter);
app.use(ccdMetricsRouter);
app.use('/api', pipelineRouter); // Exposes POST /api/pipeline/run
app.use('/api', createAdminCredentialsRouter()); // admin-only credential store
app.use('/api', createCrmDataRouter());           // real CRM data, staff-gated
app.use('/api/ccd/documents', createCcdDocumentsRouter()); // DPE: private files + staff-gated checklist
app.use('/api/ccd/bank-leads', createCcdBankLeadsRouter()); // private audited intake + pagination

// Supabase Admin Client
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';
// Lazy: creating the client at module scope crashes boot when env vars are
// absent, which takes down every route including the healthy ones.
let _supabase = null;
const supabase = new Proxy({}, {
  get(_t, prop) {
    if (!_supabase) {
      if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Supabase is not configured (SUPABASE_URL / SUPABASE_SERVICE_KEY).');
      }
      _supabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false }, realtime: { transport: ws } });
    }
    const v = _supabase[prop];
    return typeof v === 'function' ? v.bind(_supabase) : v;
  },
});

const RESTRICTED_INDUSTRIES = ['cannabis','marijuana','adult','gambling','crypto','cryptocurrency','firearms','tobacco'];

// Health check endpoints
app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'GLINFICO API' }));
app.get('/health', (req, res) => res.json({ status: 'ok', platform: 'GLINFICO', version: '1.0.0' }));

// Admin Panel Redirect
app.get('/admin', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.redirect('https://glinfico-admin.netlify.app');
});

// Auth Route
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }
    res.status(200).json({
      success: true,
      message: 'Sign-in successful',
      token: `glinfico-token-${Date.now()}`,
      user: { email, role: 'owner' }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Serve static frontend build from dist
app.use(express.static(path.join(__dirname, '../dist')));

// SPA Catch-all Fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});


// Definitive Pipeline Run Override (Supports Batch & Single LeadId)
import { runPipelineForLead, runBatchPipeline } from "./workers/pipelineOrchestrator.js";

app.post("/api/pipeline/run", async (req, res) => {
  try {
    const { leadId, batch_size, force_sync } = req.body;
    if (leadId) {
      const result = await runPipelineForLead(leadId);
      return res.status(200).json({ success: true, mode: "single", result });
    }
    const batchResult = await runBatchPipeline({ batchSize: batch_size || 100, forceSync: force_sync || true });
    return res.status(200).json({ success: true, mode: "batch", result: batchResult });
  } catch (err) {
    console.error("[Pipeline Route Error]:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});


app.listen(PORT, '0.0.0.0', () => {
  console.log(`GLINFICO Server running on port ${PORT}`);
});

// CCD Engine - Scheduled Orchestrator Loop (Every 15 Minutes)
// runBatchPipeline is already imported above; re-importing it here was a
// duplicate declaration and crashed the server at module-link time.
const FIFTEEN_MINUTES = 15 * 60 * 1000;
setInterval(async () => {
  console.log('[CCD Engine] Running scheduled background pipeline sync...');
  try {
    await runBatchPipeline({ batchSize: 100, forceSync: true });
  } catch (err) {
    console.error('[CCD Engine Background Loop Error]:', err.message);
  }
}, FIFTEEN_MINUTES);
