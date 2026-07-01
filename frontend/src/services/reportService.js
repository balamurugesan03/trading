import api from './api';

export const getOverview = () => api.get('/reports/overview').then((r) => r.data);
