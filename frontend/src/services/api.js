import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
const API_BASE = `${BACKEND_URL}/api/v1`;
export const STORAGE_BASE = BACKEND_URL;

const client = axios.create({
  baseURL: API_BASE,
  timeout: 120000, // 2 minutes for high-res Gemini analysis
});

export const api = {
  // 1. Scan & Analysis
  uploadAndScan: async (formData) => {
    const res = await client.post('/scan/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  scanUrl: async (urlPayload) => {
    const res = await client.post('/scan/url', urlPayload);
    return res.data;
  },

  // 2. Inspection Repository & Notice Actions
  getInspections: async (params = {}) => {
    const res = await client.get('/inspections', { params });
    return res.data;
  },

  getInspectionDetail: async (id) => {
    const res = await client.get(`/inspections/${id}`);
    return res.data;
  },

  deleteInspection: async (id) => {
    const res = await client.delete(`/inspections/${id}`);
    return res.data;
  },

  getAgingBuckets: async () => {
    const res = await client.get('/inspections/aging-buckets');
    return res.data;
  },

  submitPartyReply: async (inspectionId, payload) => {
    const res = await client.post(`/inspections/${inspectionId}/reply`, payload);
    return res.data;
  },

  escalateNotice: async (inspectionId, payload) => {
    const res = await client.post(`/inspections/${inspectionId}/escalate`, payload);
    return res.data;
  },

  // 3. Enterprise Party / Entity Management
  getParties: async (params = {}) => {
    const res = await client.get('/parties', { params });
    return res.data;
  },

  createParty: async (partyData) => {
    const res = await client.post('/parties', partyData);
    return res.data;
  },

  updatePartyStatus: async (partyId, status) => {
    const res = await client.patch(`/parties/${partyId}/status`, { status });
    return res.data;
  },

  // 4. Reports & Notices
  getPdfReportUrl: (inspectionId) => `${API_BASE}/reports/${inspectionId}/pdf`,
  getJsonReportUrl: (inspectionId) => `${API_BASE}/reports/${inspectionId}/json`,

  // 5. Configurable Rules
  getRules: async () => {
    const res = await client.get('/rules');
    return res.data;
  },

  updateRule: async (ruleCode, payload) => {
    const res = await client.put(`/rules/${ruleCode}`, payload);
    return res.data;
  },

  resetRules: async () => {
    const res = await client.post('/rules/reset');
    return res.data;
  },

  // 6. Dashboard Analytics
  getDashboardAnalytics: async () => {
    const res = await client.get('/analytics/dashboard');
    return res.data;
  },

  // Health check
  checkHealth: async () => {
    const res = await axios.get(`${BACKEND_URL}/api/health`);
    return res.data;
  }
};
