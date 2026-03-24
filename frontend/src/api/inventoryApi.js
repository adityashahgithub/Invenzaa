import { api } from './axiosConfig';

export const inventoryApi = {
  getStatus: (params) => api.get('/inventory/status', { params }),
  getLowStock: () => api.get('/inventory/low-stock'),
  getExpiryAlerts: () => api.get('/inventory/expiry-alerts'),
  getExpired: () => api.get('/inventory/expired'),
  getLogs: (params) => api.get('/inventory/logs', { params }),
};
