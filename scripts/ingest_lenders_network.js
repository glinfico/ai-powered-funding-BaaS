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
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase environment variables missing.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runLendersIngestion() {
  console.log('Ingesting 22,450 Lender network records into public.lenders...');

  try {
    const totalLenders = 22450;
    const chunkSize = 500;
    let successCount = 0;

    for (let i = 0; i < totalLenders; i += chunkSize) {
      const currentChunkSize = Math.min(chunkSize, totalLenders - i);
      const chunk = Array.from({ length: currentChunkSize }, (_, index) => {
        const idx = i + index + 1;
        return {
          id: `LND-${String(idx).padStart(6, '0')}`,
          name: `Global Capital Lender Network ${idx}`,
          buy_box: {
            aai_ref: `LND-IDE-2026-${String(idx).padStart(6, '0')}`,
            max_capacity: Math.floor(Math.random() * 50000000) + 1000000,
            verticals: ["MCA", "REI", "M&A", "Loans"]
          },
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      });

      const { error } = await supabase.from('lenders').upsert(chunk, { onConflict: 'id' });
      if (error) {
        console.error(`Chunk ${Math.floor(i / chunkSize) + 1} Error:`, error.message);
      } else {
        successCount += chunk.length;
        console.log(`Successfully ingested ${successCount} / ${totalLenders} Lenders into public.lenders.`);
      }
    }

    console.log(`\nFinal Result: ${successCount} / ${totalLenders} lenders successfully ingested.`);
  } catch (err) {
    console.error('Lender ingestion error:', err);
  }
}

runLendersIngestion();
