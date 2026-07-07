import api from './api';

export const getOverview = () => api.get('/reports/overview').then((r) => r.data);
export const listInvestments = (params = {}) => api.get('/reports/investments', { params }).then((r) => r.data);
export const listReferralIncome = () => api.get('/reports/referral-income').then((r) => r.data);
export const listLevelIncome = () => api.get('/reports/level-income').then((r) => r.data);
export const listTodayTransactions = (params = {}) =>
  api.get('/reports/today-transactions', { params }).then((r) => r.data);
