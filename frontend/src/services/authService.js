import api from './api';

export const register = (data) => api.post('/auth/register', data).then((r) => r.data);
export const login = (data) => api.post('/auth/login', data).then((r) => r.data);
export const me = () => api.get('/auth/me').then((r) => r.data);
export const getSponsorByCode = (code) => api.get(`/auth/sponsor/${code}`).then((r) => r.data);
