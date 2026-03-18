import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.response.use(
  res => res,
  err => {
    const msg = err.response?.data?.error || err.message || 'An error occurred'
    return Promise.reject(new Error(msg))
  }
)

// ── Workflows ────────────────────────────────────────────────────────────────
export const workflowApi = {
  list:   (params) => api.get('/workflows', { params }).then(r => r.data),
  get:    (id)     => api.get(`/workflows/${id}`).then(r => r.data),
  create: (data)   => api.post('/workflows', data).then(r => r.data),
  update: (id, data) => api.put(`/workflows/${id}`, data).then(r => r.data),
  delete: (id)     => api.delete(`/workflows/${id}`).then(r => r.data),
  execute:(id, data) => api.post(`/workflows/${id}/execute`, data).then(r => r.data),
}

// ── Steps ─────────────────────────────────────────────────────────────────────
export const stepApi = {
  list:   (workflowId)        => api.get(`/workflows/${workflowId}/steps`).then(r => r.data),
  create: (workflowId, data)  => api.post(`/workflows/${workflowId}/steps`, data).then(r => r.data),
  update: (id, data)          => api.put(`/steps/${id}`, data).then(r => r.data),
  delete: (id)                => api.delete(`/steps/${id}`).then(r => r.data),
}

// ── Rules ─────────────────────────────────────────────────────────────────────
export const ruleApi = {
  list:   (stepId)       => api.get(`/steps/${stepId}/rules`).then(r => r.data),
  create: (stepId, data) => api.post(`/steps/${stepId}/rules`, data).then(r => r.data),
  update: (id, data)     => api.put(`/rules/${id}`, data).then(r => r.data),
  delete: (id)           => api.delete(`/rules/${id}`).then(r => r.data),
}

// ── Executions ────────────────────────────────────────────────────────────────
export const executionApi = {
  list:   (params) => api.get('/executions', { params }).then(r => r.data),
  get:    (id)     => api.get(`/executions/${id}`).then(r => r.data),
  cancel: (id)     => api.post(`/executions/${id}/cancel`).then(r => r.data),
  retry:  (id)     => api.post(`/executions/${id}/retry`).then(r => r.data),
}

export default api
