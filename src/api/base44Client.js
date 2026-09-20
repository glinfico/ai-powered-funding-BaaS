const API = import.meta.env.VITE_API_URL || 'https://ai-powered-funding-platform.onrender.com';

const apiCall = async (url) => {
  try {
    const r = await fetch(`${API}${url}`);
    const d = await r.json();
    return d;
  } catch(e) {
    console.error('API error:', e);
    return {};
  }
};

export const base44 = {
  auth: {
    me: async () => null,
    logout: () => {
      localStorage.removeItem('glinfico_user');
      window.location.href = '/crm/login';
    },
    redirectToLogin: () => {
      window.location.href = '/crm/login';
    }
  },
  entities: {
    Lead: {
      list: async () => { const d = await apiCall('/api/leads'); return d.leads || []; },
      filter: async () => [],
      create: async () => ({}),
      update: async () => ({}),
      delete: async () => ({})
    },
    Deal: {
      list: async () => { const d = await apiCall('/api/mca/applications'); return d.applications || []; },
      filter: async () => [],
      create: async () => ({}),
      update: async () => ({}),
      delete: async () => ({})
    },
    Task: { list: async () => [], filter: async () => [], create: async () => ({}), update: async () => ({}), delete: async () => ({}) },
    Lender: { list: async () => [], filter: async () => [], create: async () => ({}), update: async () => ({}), delete: async () => ({}) },
    TeamMember: { list: async () => [], filter: async () => [], create: async () => ({}), update: async () => ({}), delete: async () => ({}) },
    Activity: { list: async () => [], filter: async () => [], create: async () => ({}), update: async () => ({}), delete: async () => ({}) },
    NotificationAlert: { list: async () => [], filter: async () => [], create: async () => ({}), update: async () => ({}), delete: async () => ({}) },
    AutomationRule: { list: async () => [], filter: async () => [], create: async () => ({}), update: async () => ({}), delete: async () => ({}) },
    CalendarEvent: { list: async () => [], filter: async () => [], create: async () => ({}), update: async () => ({}), delete: async () => ({}) },
    MagazineArticle: { list: async () => [], filter: async () => [], create: async () => ({}), update: async () => ({}), delete: async () => ({}) },
    SyncState: { list: async () => [], filter: async () => [], create: async () => ({}), update: async () => ({}), delete: async () => ({}) },
    User: { list: async () => [], filter: async () => [], create: async () => ({}), update: async () => ({}), delete: async () => ({}) }
  }
};

export default base44;
