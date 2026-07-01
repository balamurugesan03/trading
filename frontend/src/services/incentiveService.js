import api from './api';

export const listIncentives = (params) => api.get('/incentives', { params }).then((r) => r.data);
