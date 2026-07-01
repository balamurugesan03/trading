import api from './api';

export const createDeposit = (formData) =>
  api.post('/deposits', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data);
export const myDeposits = () => api.get('/deposits/my').then((r) => r.data);
export const listDeposits = (params) => api.get('/deposits', { params }).then((r) => r.data);
export const approveDeposit = (id) => api.patch(`/deposits/${id}/approve`).then((r) => r.data);
export const rejectDeposit = (id, reason) => api.patch(`/deposits/${id}/reject`, { reason }).then((r) => r.data);
