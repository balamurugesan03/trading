import api from './api';

export const submitKyc = (formData) =>
  api.post('/kyc', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data);
export const myKyc = () => api.get('/kyc/my').then((r) => r.data);
export const listKyc = (params) => api.get('/kyc', { params }).then((r) => r.data);
export const reviewKyc = (id, status, remarks) =>
  api.patch(`/kyc/${id}/review`, { status, remarks }).then((r) => r.data);
