import { api } from './axiosConfig';

export const medicineApi = {
  list: (params) => api.get('/medicines', { params }),
  search: (params) => api.get('/medicines/search', { params }),
  getById: (id) => api.get(`/medicines/${id}`),
  create: (data) => api.post('/medicines', data),
  update: (id, data) => api.put(`/medicines/${id}`, data),
  delete: (id) => api.delete(`/medicines/${id}`),
};
