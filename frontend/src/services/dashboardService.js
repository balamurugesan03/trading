import api from './api';

export const getSummary = () => api.get('/dashboard/summary').then((r) => r.data);
export const getTeam = () => api.get('/dashboard/team').then((r) => r.data);
