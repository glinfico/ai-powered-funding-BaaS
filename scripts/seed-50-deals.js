import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const INDUSTRIES = ['Logistics', 'Healthcare', 'Construction', 'Retail', 'Technology', 'Services', 'Hospitality'];
const STATES = ['TX', 'FL', 'GA', 'NY', 'CA', 'IL', 'OH', 'NC', 'AZ', 'PA'];
const BANKS = ['bnk_chase', 'bnk_bofa', 'bnk_wells', 'bnk_citi', 'bnk_pnc'];

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function seedDeals() {
  console.log('🚀 Generating 50 synthetic deals for Supabase...');

  const deals = [];

  for (let i = 1; i <= 50; i++) {
    const requestedAmount = getRandomInt(15, 450) * 1000;
    const monthlyRevenue = Math.round(requestedAmount * (1.1 + Math.random() * 0.9));
    const avgDailyBalance = Math.round(monthlyRevenue * (0.05 + Math.random() * 0.15));
    const nsfCount = Math.random() > 0.75 ? getRandomInt(1, 3) : 0;
    
    // Calculate Score
    let score = 50;
    if (monthlyRevenue >= 30000) score += 20;
    if (avgDailyBalance >= 2500) score += 15;
    if (nsfCount === 0) score += 15;

    const companyPrefix = getRandomElement(['Apex', 'Metro', 'Summit', 'Vanguard', 'Beacon', 'Atlas', 'Pinnacle', 'Horizon']);
    const industry = getRandomElement(INDUSTRIES);
    const companyType = getRandomElement(['LLC', 'Inc', 'Group', 'Partners', 'Corp']);

    deals.push({
      id: `dl_seed_${1000 + i}`,
      legal_name: `${companyPrefix} ${industry} ${companyType}`,
      ein: `${getRandomInt(10, 99)}-${getRandomInt(1000000, 9999999)}`,
      contact_email: `funding@${companyPrefix.toLowerCase()}${industry.toLowerCase()}.com`,
      contact_phone: `555-${getRandomInt(100, 999)}-${getRandomInt(1000, 9999)}`,
      requested_amount: requestedAmount,
      bank_id: getRandomElement(BANKS),
      monthly_revenue: monthlyRevenue,
      avg_daily_balance: avgDailyBalance,
      nsf_count_30d: nsfCount,
      state: getRandomElement(STATES),
      deal_score: score,
      status: score >= 70 ? 'ENRICHED' : 'INGESTED',
    });
  }

  // Insert in batch
  const { data, error } = await supabase.from('deals').upsert(deals, { onConflict: 'id' });

  if (error) {
    console.error('❌ Failed to seed deals:', error.message);
  } else {
    console.log(`✅ Successfully seeded 50 test deals into the 'deals' table!`);
  }
}

seedDeals();
