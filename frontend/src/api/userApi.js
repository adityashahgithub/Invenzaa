import { api } from './axiosConfig';

export const userApi = {
  getMe: () =>
    api.get('/users/me'),

  updateMe: (data) =>
    api.put('/users/me', data),

  changePassword: (data) =>
    api.put('/users/change-password', data),

  getAllUsers: (params) =>
    api.get('/users', { params }),

  createUser: (data) =>
    api.post('/users', data),

  updateUserStatus: (id, status) =>
    api.patch(`/users/${id}/status`, { status }),
};
