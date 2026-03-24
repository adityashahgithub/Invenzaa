import { api } from './axiosConfig';

export const authApi = {
  register: (data) =>
    api.post('/auth/register', data),

  login: (data) =>
    api.post('/auth/login', data),

  logout: (refreshToken) =>
    api.post('/auth/logout', { refreshToken }),

  forgotPassword: (email) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: ({ email, token, newPassword }) =>
    api.post('/auth/reset-password', { email, token, newPassword }),
};
