import { api } from './axiosConfig';

export const rolesApi = {
  getAll: () => api.get('/roles'),
  create: (data) => api.post('/roles', data),
  update: (id, data) => api.put(`/roles/${id}`, data),
  delete: (id) => api.delete(`/roles/${id}`),
  assign: (userId, role) => api.patch(`/roles/assign/${userId}`, { role }),
};
