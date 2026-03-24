import { api } from './axiosConfig';

export const salesApi = {
  create: (data) => api.post('/sales', data),
  list: (params) => api.get('/sales', { params }),
  getById: (id) => api.get(`/sales/${id}`),
};
