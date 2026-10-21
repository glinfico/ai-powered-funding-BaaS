// Native Glinfico Client Shim replacing Base44 SDK
export const base44 = {
  auth: {
    me: async () => ({ email: 'user@glinfico.com', full_name: 'Admin User', role: 'admin' }),
    login: async () => ({ success: true }),
    redirectToLogin: () => { window.location.href = '/portal'; },
    updateMe: async (data) => data,
  },
  entities: {
    Lead: {
      list: async () => [],
      filter: async () => [],
      create: async (data) => data,
      update: async (id, data) => data,
      delete: async (id) => ({ success: true }),
    },
    Deal: {
      list: async () => [],
      filter: async () => [],
      create: async (data) => data,
      update: async (id, data) => data,
      delete: async (id) => ({ success: true }),
    },
    Lender: {
      list: async () => [],
      filter: async () => [],
      create: async (data) => data,
      update: async (id, data) => data,
      delete: async (id) => ({ success: true }),
    },
    Task: {
      list: async () => [],
      filter: async () => [],
      create: async (data) => data,
      update: async (id, data) => data,
      delete: async (id) => ({ success: true }),
    },
    TeamMember: {
      list: async () => [],
      filter: async () => [],
      create: async (data) => data,
      update: async (id, data) => data,
      delete: async (id) => ({ success: true }),
    },
    AutomationRule: {
      list: async () => [],
      filter: async () => [],
      create: async (data) => data,
      update: async (id, data) => data,
      delete: async (id) => ({ success: true }),
    },
    NotificationAlert: {
      list: async () => [],
      create: async (data) => data,
      update: async (id, data) => data,
      delete: async (id) => ({ success: true }),
    },
  },
  functions: {
    invoke: async (name, payload) => ({ success: true, name, payload }),
  },
  integrations: {
    Core: {
      UploadFile: async ({ file }) => ({ file_url: URL.createObjectURL(file) }),
      InvokeLLM: async () => ({ result: '' }),
      GenerateImage: async () => ({ url: '' }),
    },
  },
  appLogs: {
    logUserInApp: async () => {},
  }
};

export default base44;
