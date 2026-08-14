import api from './api'

export async function getKeuanganSummary(year) {
  const res = await api.get('/v1/keuangan/summary', { params: { year } })
  return res.data
}

export async function getContractDetail(pengadaanId) {
  const res = await api.get(`/v1/keuangan/contract/${pengadaanId}`)
  return res.data
}

export async function storePayment(payload) {
  const res = await api.post('/v1/keuangan/payment', payload)
  return res.data
}

export async function updatePayment(id, payload) {
  const res = await api.put(`/v1/keuangan/payment/${id}`, payload)
  return res.data
}

export async function deletePayment(id) {
  const res = await api.delete(`/v1/keuangan/payment/${id}`)
  return res.data
}

export async function uploadDocument(formData) {
  const res = await api.post('/v1/keuangan/document', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return res.data
}

export async function deleteDocument(id) {
  const res = await api.delete(`/v1/keuangan/document/${id}`)
  return res.data
}

// ── Pagu Anggaran ──────────────────────────────────────────────
export async function getPaguList(year) {
  const res = await api.get('/v1/keuangan/pagu', { params: { year } })
  return res.data
}

export async function storePagu(payload) {
  const res = await api.post('/v1/keuangan/pagu', payload)
  return res.data
}

export async function deletePagu(id) {
  const res = await api.delete(`/v1/keuangan/pagu/${id}`)
  return res.data
}
