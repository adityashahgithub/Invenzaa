import { api } from './axiosConfig';

export const collaborationApi = {
  getPartners: () => api.get('/collaboration/partners'),
  createRequest: (data) => api.post('/collaboration/requests', data),
  listRequests: (params) => api.get('/collaboration/requests', { params }),
  getRequestById: (id) => api.get(`/collaboration/requests/${id}`),
  updateRequestStatus: (id, status) =>
    api.patch(`/collaboration/requests/${id}/status`, { status }),
  createResponse: (data) => api.post('/collaboration/responses', data),
  getResponsesByRequestId: (requestId) =>
    api.get(`/collaboration/responses/${requestId}`),
};
