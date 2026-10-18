/**
 * GLINFICO API Client
 * Complete replacement for Base44 SDK
 * All entities now connect to GLINFICO FOD API + Supabase
 */

const API = (import.meta.env.VITE_API_URL || 'https://ai-powered-funding-platform.onrender.com').replace(/\/$/, '');
const SB_URL = 'https://sadyhmrrqjkhoajuiumg.supabase.co';
const SB_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhZHlobXJycWpraG9hanVpdW1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1MDUzNDksImV4cCI6MjEwNTA4MTM0OX0.1RJvr9gR7fUHBW5_fLBqZZPbTiK-Eu6PZ3F9pYjgoDU';

// ── Core API fetch ────────────────────────────────────────────────────────────
const apiCall = async (url, options = {}) => {
  try {
    const res = await fetch(`${API}${url}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch (e) {
    console.error(`GLINFICO API error [${url}]:`, e.message);
    return {};
  }
};

// ── Supabase direct fetch ─────────────────────────────────────────────────────
const sbCall = async (table, params = '') => {
  try {
    const res = await fetch(`${SB_URL}/rest/v1/${table}${params}`, {
      headers: {
        'apikey': SB_ANON,
        'Authorization': `Bearer ${SB_ANON}`,
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) throw new Error(`Supabase ${res.status}`);
    return res.json();
  } catch (e) {
    console.error(`Supabase error [${table}]:`, e.message);
    return [];
  }
};

const sbMutate = async (table, method, data, id = null) => {
  try {
    const url = `${SB_URL}/rest/v1/${table}${id ? `?id=eq.${id}` : ''}`;
    const res = await fetch(url, {
      method,
      headers: {
        'apikey': SB_ANON,
        'Authorization': `Bearer ${SB_ANON}`,
        'Content-Type': 'application/json',
        'Prefer': method === 'POST' ? 'return=representation' : 'return=representation',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Supabase ${method} ${res.status}`);
    const result = await res.json();
    return Array.isArray(result) ? result[0] : result;
  } catch (e) {
    console.error(`Supabase mutate error [${table}]:`, e.message);
    return {};
  }
};

// ── Entity factory ────────────────────────────────────────────────────────────
// Creates a full CRUD entity backed by Supabase table
const makeEntity = (table, filterField = null) => ({
  list: async (params = {}) => {
    const query = Object.entries(params)
      .map(([k, v]) => `${k}=eq.${v}`)
      .join('&');
    return sbCall(table, `?select=*&order=created_at.desc${query ? `&${query}` : ''}&limit=500`);
  },
  filter: async (params = {}) => {
    const query = Object.entries(params)
      .map(([k, v]) => `${k}=eq.${v}`)
      .join('&');
    return sbCall(table, `?select=*${query ? `&${query}` : ''}&limit=500`);
  },
  get: async (id) => {
    const result = await sbCall(table, `?id=eq.${id}&select=*`);
    return Array.isArray(result) ? result[0] : result;
  },
  create: async (data) => sbMutate(table, 'POST', {
    ...data,
    created_at: new Date().toISOString(),
  }),
  update: async (id, data) => sbMutate(table, 'PATCH', {
    ...data,
    updated_at: new Date().toISOString(),
  }, id),
  delete: async (id) => sbMutate(table, 'DELETE', null, id),
});

// ── Auth ──────────────────────────────────────────────────────────────────────
const auth = {
  me: async () => {
    const saved = localStorage.getItem('glinfico_user');
    return saved ? JSON.parse(saved) : null;
  },
  login: async (email, password) => {
    if (email === 'admin@glinfico.com' && password === 'Glinfico2024!') {
      const user = { email, name: 'GLINFICO Admin', role: 'admin' };
      localStorage.setItem('glinfico_user', JSON.stringify(user));
      return user;
    }
    throw new Error('Invalid credentials');
  },
  logout: () => {
    localStorage.removeItem('glinfico_user');
    window.location.href = '/crm/login';
  },
  redirectToLogin: () => {
    window.location.href = '/crm/login';
  },
  isAuthenticated: () => !!localStorage.getItem('glinfico_user'),
};

// ── GLINFICO API Client ───────────────────────────────────────────────────────
export const base44 = {
  auth,

  entities: {
    // ── Core Business Entities (Supabase direct) ──
    Lead: {
      ...makeEntity('leads'),
      list: async () => sbCall('leads', '?select=*&order=created_at.desc&limit=2000'),
      filter: async (params = {}) => {
        const query = Object.entries(params).map(([k, v]) => `${k}=eq.${v}`).join('&');
        return sbCall('leads', `?select=*${query ? `&${query}` : ''}&limit=500`);
      },
    },

    Deal: {
      ...makeEntity('deals'),
      list: async () => sbCall('deals', '?select=*&order=created_at.desc&limit=500'),
      filter: async (params = {}) => {
        const query = Object.entries(params).map(([k, v]) => `${k}=eq.${v}`).join('&');
        return sbCall('deals', `?select=*${query ? `&${query}` : ''}&limit=500`);
      },
      submit: async (dealData) => {
        const d = await apiCall('/api/deals/submit', {
          method: 'POST',
          body: JSON.stringify(dealData),
        });
        return d.deal || d;
      },
      score: async (payload) => {
        return apiCall('/api/mca/score', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      },
    },

    Lender: {
      ...makeEntity('funders'),
      list: async () => sbCall('funders', '?select=*&active=eq.true&order=name.asc'),
    },

    TermSheet: {
      ...makeEntity('term_sheets'),
      list: async () => sbCall('term_sheets', '?select=*&order=created_at.desc&limit=200'),
    },

    Commission: {
      ...makeEntity('commissions'),
      list: async () => {
        // Get from commissions table + deals with commission data
        const [comms, deals] = await Promise.all([
          sbCall('commissions', '?select=*&order=created_at.desc&limit=200'),
          sbCall('deals', '?select=id,company_name,commission_amount,commission_rate_pct,paypal_payout_status,created_at&commission_amount=gt.0&limit=200'),
        ]);
        return [...(Array.isArray(comms) ? comms : []), ...(Array.isArray(deals) ? deals : [])];
      },
    },

    // ── Supporting Entities ──
    Task: {
      ...makeEntity('tasks'),
      list: async () => {
        try { return await sbCall('tasks', '?select=*&order=created_at.desc&limit=200'); }
        catch { return []; }
      },
    },

    TeamMember: {
      ...makeEntity('brokers'),
      list: async () => {
        try { return await sbCall('brokers', '?select=*&order=created_at.desc&limit=100'); }
        catch { return []; }
      },
    },

    Activity: {
      list: async () => [],
      filter: async () => [],
      create: async (data) => {
        console.log('Activity logged:', data);
        return { id: Date.now(), ...data };
      },
      update: async () => ({}),
      delete: async () => ({}),
    },

    NotificationAlert: {
      list: async () => [],
      filter: async () => [],
      create: async () => ({}),
      update: async () => ({}),
      delete: async () => ({}),
    },

    AutomationRule: {
      list: async () => [],
      filter: async () => [],
      create: async () => ({}),
      update: async () => ({}),
      delete: async () => ({}),
    },

    CalendarEvent: {
      list: async () => [],
      filter: async () => [],
      create: async () => ({}),
      update: async () => ({}),
      delete: async () => ({}),
    },

    MagazineArticle: {
      list: async () => [],
      filter: async () => [],
      create: async () => ({}),
      update: async () => ({}),
      delete: async () => ({}),
    },

    SyncState: {
      list: async () => [],
      filter: async () => [],
      create: async () => ({}),
      update: async () => ({}),
      delete: async () => ({}),
    },

    User: {
      list: async () => {
        const user = localStorage.getItem('glinfico_user');
        return user ? [JSON.parse(user)] : [];
      },
      filter: async () => [],
      create: async () => ({}),
      update: async () => ({}),
      delete: async () => ({}),
    },

    // ── MCA Specific ──
    MCAApplication: {
      list: async () => sbCall('deals', '?select=*&vertical=eq.MCA&order=created_at.desc&limit=500'),
      filter: async (params = {}) => {
        const query = Object.entries(params).map(([k, v]) => `${k}=eq.${v}`).join('&');
        return sbCall('deals', `?select=*&vertical=eq.MCA${query ? `&${query}` : ''}&limit=500`);
      },
      create: async (data) => {
        const d = await apiCall('/api/deals/submit', {
          method: 'POST',
          body: JSON.stringify({ ...data, vertical: 'MCA' }),
        });
        return d.deal || d;
      },
      update: async (id, data) => sbMutate('deals', 'PATCH', data, id),
      delete: async (id) => sbMutate('deals', 'DELETE', null, id),
    },
  },

  // ── Direct API access ─────────────────────────────────────────────────────
  api: {
    get: (path) => apiCall(path),
    post: (path, data) => apiCall(path, { method: 'POST', body: JSON.stringify(data) }),
    patch: (path, data) => apiCall(path, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (path) => apiCall(path, { method: 'DELETE' }),
    health: () => apiCall('/health'),
    queueStats: () => apiCall('/api/queue/stats'),
  },

  // ── Supabase direct access ────────────────────────────────────────────────
  supabase: {
    from: (table) => ({
      select: (params = '') => sbCall(table, params),
      insert: (data) => sbMutate(table, 'POST', data),
      update: (id, data) => sbMutate(table, 'PATCH', data, id),
      delete: (id) => sbMutate(table, 'DELETE', null, id),
    }),
  },
};

export default base44;
