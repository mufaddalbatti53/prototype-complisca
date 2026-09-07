import axios from 'axios';

const API_BASE = 'http://localhost:8000/api/v1';
export const STORAGE_BASE = 'http://localhost:8000';

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

  // 2. Inspection Repository
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

  // 3. Reports & Notices
  getPdfReportUrl: (inspectionId) => `${API_BASE}/reports/${inspectionId}/pdf`,
  getJsonReportUrl: (inspectionId) => `${API_BASE}/reports/${inspectionId}/json`,

  // 4. Configurable Rules
  getRules: async () => {
    const res = await client.get('/rules');
    return res.data;
  },

  updateRule: async (ruleCode, payload) => {
    const res = await client.put(`/rules/${ruleCode}`, payload);
    return res.data;
  },

  // 5. Dashboard Analytics
  getDashboardAnalytics: async () => {
    const res = await client.get('/analytics/dashboard');
    return res.data;
  },

  // Health check
  checkHealth: async () => {
    const res = await axios.get('http://localhost:8000/api/health');
    return res.data;
  }
};
