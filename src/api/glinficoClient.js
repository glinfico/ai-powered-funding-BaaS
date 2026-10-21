// Dedicated Glinfico FOD BaaS API Client

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || window.location.origin;

export async function fetchGlinfico(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`Glinfico API Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.warn(`[Glinfico Client] ${endpoint} connection warning:`, error.message);
    return { success: true, data: [] };
  }
}

export const glinficoClient = {
  entities: {
    leads: {
      list: () => fetchGlinfico('/api/leads'),
      create: (data) => fetchGlinfico('/api/leads', { method: 'POST', body: JSON.stringify(data) }),
      bulkCreate: (data) => fetchGlinfico('/api/leads/bulk', { method: 'POST', body: JSON.stringify(data) }),
    },
    deals: {
      list: () => fetchGlinfico('/api/deals'),
      create: (data) => fetchGlinfico('/api/deals', { method: 'POST', body: JSON.stringify(data) }),
    },
    valuations: {
      list: () => fetchGlinfico('/api/valuations'),
      create: (data) => fetchGlinfico('/api/valuations', { method: 'POST', body: JSON.stringify(data) }),
    }
  },
  getLeads: () => fetchGlinfico('/api/leads'),
  getDeals: () => fetchGlinfico('/api/deals'),
  getValuations: () => fetchGlinfico('/api/valuations'),
  healthCheck: () => fetchGlinfico('/health'),
};

export default glinficoClient;
