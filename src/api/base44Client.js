// Glinfico Compatibility Wrapper for Legacy Base44 Imports
import { glinficoClient, fetchGlinfico } from './glinficoClient';

export const base44 = {
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
  ...glinficoClient
};

export { fetchGlinfico as fetchApi };
export const base44Client = glinficoClient;
export default glinficoClient;
