import { api } from './axiosConfig';

export const purchasesApi = {
  create: (data) => api.post('/purchases', data),
  list: (params) => api.get('/purchases', { params }),
  getById: (id) => api.get(`/purchases/${id}`),
};
