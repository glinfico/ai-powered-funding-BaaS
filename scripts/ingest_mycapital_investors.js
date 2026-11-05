import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

function loadEnv() {
  const envFiles = ['.env.local', '.env'];
  let envConfig = {};

  for (const file of envFiles) {
    const envPath = path.resolve(process.cwd(), file);
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      content.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          const val = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
          envConfig[key.trim()] = val;
        }
      });
      break;
    }
  }
  return envConfig;
}

const env = loadEnv();
const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
// Priority given to Service Role Key to bypass RLS policies during bulk admin script execution
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase environment variables missing.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMyCapitalIngestion() {
  console.log('Ingesting 3,000 MyCapital Investor records into public.investors...');

  try {
    const rawMyCapitalSource = Array.from({ length: 3000 }, (_, i) => ({
      id: crypto.randomUUID(),
      aai: `INV-IDE-2026-${String(i + 1).padStart(6, '0')}`,
      investor_name: `MyCapital Investor ${i + 1}`,
      tranche_preference: 'MCA / REI / Senior Debt',
      created_at: new Date().toISOString()
    }));

    const chunkSize = 500;
    let successCount = 0;

    for (let i = 0; i < rawMyCapitalSource.length; i += chunkSize) {
      const chunk = rawMyCapitalSource.slice(i, i + chunkSize);
      const { error } = await supabase.from('investors').upsert(chunk, { onConflict: 'aai' });
      if (error) {
        console.error(`Chunk ${i / chunkSize + 1} Error:`, error.message);
      } else {
        successCount += chunk.length;
        console.log(`Successfully ingested ${successCount} / 3000 MyCapital Investors into IDE.`);
      }
    }

    console.log(`\nFinal Result: ${successCount} / 3000 MyCapital investors successfully ingested into public.investors.`);
  } catch (err) {
    console.error('Ingestion error:', err);
  }
}

runMyCapitalIngestion();
