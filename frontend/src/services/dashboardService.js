import api from './api';

export const getSummary = () => api.get('/dashboard/summary').then((r) => r.data);
export const getTeam = () => api.get('/dashboard/team').then((r) => r.data);
export const getReferralHistory = () => api.get('/dashboard/referral-history').then((r) => r.data);
export const getLevelIncomeHistory = () => api.get('/dashboard/level-income-history').then((r) => r.data);
export const getIncentiveHistory = () => api.get('/dashboard/incentive-history').then((r) => r.data);
