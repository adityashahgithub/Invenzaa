import { api } from './axiosConfig';

export const masterApi = {
    list: (type) => api.get(`/masters/${type}`).then((res) => res.data.data.items),
    create: (type, payload) => api.post(`/masters/${type}`, payload).then((res) => res.data),
    update: (type, id, payload) => api.put(`/masters/${type}/${id}`, payload).then((res) => res.data),
    delete: (type, id) => api.delete(`/masters/${type}/${id}`).then((res) => res.data),
};
