import api from './api'

export const k3AssessmentService = {
  // Master data
  getCategories: () => api.get('/k3/categories').then(res => res.data.data),
  
  // Assessments CRUD
  getAssessments: ({ tahun, semester }) => api.get(`/k3/assessments/${tahun}/${semester}`).then(res => res.data.data),
  createAssessment: (data) => api.post('/k3/assessments', data).then(res => res.data.data),
  getAssessmentById: (id) => api.get(`/k3/assessments/${id}`).then(res => res.data.data),
  updateAssessment: (id, details) => api.put(`/k3/assessments/${id}`, { details }).then(res => res.data.data),
  bulkAssessment: (period, assessments) => api.post('/k3/assessments/bulk', { period, assessments }).then(res => res.data),
  
  // Workflow
  submitAssessment: (period) => api.post(`/k3/assessments/bulk/submit`, { period }).then(res => res.data),
  unsubmitAssessment: (period) => api.post(`/k3/assessments/bulk/unsubmit`, { period }).then(res => res.data),
  approveAssessment: (period) => api.post(`/k3/assessments/bulk/approve`, { period }).then(res => res.data),
  revisiAssessment: (period, catatan_revisor) => api.post(`/k3/assessments/bulk/revisi`, { period, catatan_revisor }).then(res => res.data),
  
  // Dashboard / Report data
  getDashboard: (params) => api.get('/k3/dashboard', { params }).then(res => res.data.data),
  getDashboardTrend: () => api.get('/k3/dashboard/trend').then(res => res.data.data || res.data),
  getNkoSummary: (tahun, semester) => api.get(`/k3/nko-summary/${tahun}/${semester}`).then(res => res.data.data),
  getCategorySummary: (code, tahun, semester) => api.get(`/k3/category-summary/${code}/${tahun}/${semester}`).then(res => res.data.data),
  
  // Targets
  updateTarget: (id, target_level) => api.put(`/k3/targets/${id}`, { target_level }).then(res => res.data.data),
  createTarget: (criteria_id, period, target_level) => api.post(`/k3/targets`, { criteria_id, period, target_level }).then(res => res.data.data),
}
