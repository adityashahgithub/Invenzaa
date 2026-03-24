import { api } from './axiosConfig';

export const reportsApi = {
  getInventory: () => api.get('/reports/inventory'),
  getSales: (params) => api.get('/reports/sales', { params }),
  getPurchases: (params) => api.get('/reports/purchases', { params }),
  getLowStock: () => api.get('/reports/low-stock'),
  getExpiry: (params) => api.get('/reports/expiry', { params }),
};
