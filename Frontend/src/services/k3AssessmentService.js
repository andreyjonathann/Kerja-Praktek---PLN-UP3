import api from './api'

export const k3AssessmentService = {
  // Master data
  getCategories: () => api.get('/k3/categories').then(res => res.data.data),
  
  // Assessments CRUD
  getAssessments: (params) => api.get('/k3/assessments', { params }).then(res => res.data.data),
  createAssessment: (data) => api.post('/k3/assessments', data).then(res => res.data.data),
  getAssessmentById: (id) => api.get(`/k3/assessments/${id}`).then(res => res.data.data),
  updateAssessment: (id, details) => api.put(`/k3/assessments/${id}`, { details }).then(res => res.data.data),
  
  // Workflow
  submitAssessment: (id) => api.post(`/k3/assessments/${id}/submit`).then(res => res.data.data),
  unsubmitAssessment: (id) => api.post(`/k3/assessments/${id}/unsubmit`).then(res => res.data.data),
  approveAssessment: (id) => api.post(`/k3/assessments/${id}/approve`).then(res => res.data.data),
  revisiAssessment: (id, catatan_revisor) => api.post(`/k3/assessments/${id}/revisi`, { catatan_revisor }).then(res => res.data.data),
  
  // Dashboard / Report data
  getDashboard: (params) => api.get('/k3/dashboard', { params }).then(res => res.data.data),
}
