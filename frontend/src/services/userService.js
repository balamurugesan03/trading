import api from './api';

export const listUsers = (params) => api.get('/users', { params }).then((r) => r.data);
export const getUser = (id) => api.get(`/users/${id}`).then((r) => r.data);
export const updateUser = (id, data) => api.patch(`/users/${id}`, data).then((r) => r.data);
export const resetPassword = (id, password) =>
  api.patch(`/users/${id}/reset-password`, { password }).then((r) => r.data);
export const suspendUser = (id) => api.patch(`/users/${id}/suspend`).then((r) => r.data);
export const activateUser = (id) => api.patch(`/users/${id}/activate`).then((r) => r.data);
export const impersonateUser = (id) => api.post(`/users/${id}/impersonate`).then((r) => r.data);
