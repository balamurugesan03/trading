import api from './api';

export const listPackages = () => api.get('/packages').then((r) => r.data);
export const createPackage = (data) => api.post('/packages', data).then((r) => r.data);
export const updatePackage = (id, data) => api.patch(`/packages/${id}`, data).then((r) => r.data);
