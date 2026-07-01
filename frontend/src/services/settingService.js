import api from './api';

export const getSettings = () => api.get('/settings').then((r) => r.data);
export const updateSettings = (data) => api.patch('/settings', data).then((r) => r.data);
export const setTodayRoiRate = (percentage, date) =>
  api.post('/settings/roi-rate', { percentage, date }).then((r) => r.data);
export const listRoiRates = () => api.get('/settings/roi-rate').then((r) => r.data);
