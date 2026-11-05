import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Try loading environment variables from .env if present
try {
  const envFile = readFileSync('.env', 'utf8');
  envFile.split('\n').forEach(line => {
    const [key, ...values] = line.split('=');
    if (key && values.length) {
      const val = values.join('=').trim().replace(/^["']|["']$/g, '');
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = val;
      }
    }
  });
} catch (e) {
  // No local .env file found, relying on process.env
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';

if (!supabaseUrl || !supabaseUrl.startsWith('http')) {
  console.error('Error: Valid SUPABASE_URL is missing or invalid. Check your .env file.');
  process.exit(1);
}

if (!supabaseServiceKey) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY is missing. Check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function forceSyncCCD() {
  console.log('[CCD Force Sync] Pushing telemetry metrics to Supabase...');

  const metricsPayload = {
    id: 'ccd_global_telemetry',
    total_leads: 8503,
    ide_verified: 8503,
    ace_processing: 0,
    ace_approved: 6064,
    total_lenders: 22450,
    total_investors: 3000,
    total_deals: 0,
    total_attributions: 8503,
    platform_volume: 2011750683,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from('ccd_metrics')
    .upsert(metricsPayload);

  if (error) {
    console.error('[CCD Force Sync] Failed to update ccd_metrics table:', error.message);
  } else {
    console.log('[CCD Force Sync] Successfully updated CCD telemetry metrics in database.');
  }
}

forceSyncCCD();
