import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
const API_BASE = `${BACKEND_URL}/api/v1`;
export const STORAGE_BASE = BACKEND_URL;

const client = axios.create({ baseURL: API_BASE, timeout: 120000 });
client.interceptors.request.use((config) => {
  const apiKey = import.meta.env.VITE_API_KEY;
  if (apiKey) config.headers['X-API-Key'] = apiKey;
  return config;
});

const get = async (path, config) => (await client.get(path, config)).data;
const post = async (path, body, config) => (await client.post(path, body, config)).data;

export const api = {
  getAphConfig: () => get('/rules/config'),
  getRules: () => get('/rules/config'),
  updateAphConfig: (config) => client.put('/rules/config', config).then((res) => res.data),
  updateRule: (_ruleCode, payload) => client.put('/rules/config', payload).then((res) => res.data),
  resetAphConfig: () => post('/rules/config/reset'),
  resetRules: () => post('/rules/config/reset'),
  routeWorkflow: (appType, overrideRoute = null) => post('/rules/workflow/route', { app_type: appType, override_route: overrideRoute }),
  advanceWorkflow: (payload) => post('/rules/workflow/advance', payload),
  revertWorkflow: (payload) => post('/rules/workflow/revert', payload),
  simulateDays: (days = 7, applications = [], undertakings = [], documents = []) => post('/rules/simulate/day', { days, applications, undertakings, documents }),
  scanAicteDocument: (formData) => post('/aicte/scan-document', formData),
  scanUndertakingEvidence: (formData) => post('/aicte/scan-evidence', formData),
  uploadAicteDocument: (documentId, file, renewal = false) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('renewal', String(renewal));
    return post(`/aicte/documents/${documentId}/upload`, formData);
  },
  uploadUndertakingEvidence: (undertakingId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return post(`/aicte/undertakings/${undertakingId}/evidence`, formData);
  },
  getAicteCaseSummary: (appData) => post('/aicte/case-summary', appData),
  getAicteInstitutions: () => get('/aicte/institutions'),
  getAicteApplications: (institutionId = null) => get('/aicte/applications', { params: institutionId ? { institution_id: institutionId } : {} }),
  getAicteUndertakings: () => get('/aicte/undertakings'),
  getAicteDocuments: (institutionId = null) => get('/aicte/documents', { params: institutionId ? { institution_id: institutionId } : {} }),
  getAicteNotifications: () => get('/aicte/notifications'),
  checkHealth: async () => (await axios.get(`${BACKEND_URL}/api/health`)).data,
};
