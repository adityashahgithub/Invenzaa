import { api } from './axiosConfig';

export const dashboardApi = {
  getSummary: () => api.get('/dashboard/summary'),
};
