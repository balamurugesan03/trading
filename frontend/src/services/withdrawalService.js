import api from './api';

export const requestWithdrawal = (data) => api.post('/withdrawals', data).then((r) => r.data);
export const verifyOtp = (id, otpCode) => api.post(`/withdrawals/${id}/verify-otp`, { otpCode }).then((r) => r.data);
export const myWithdrawals = () => api.get('/withdrawals/my').then((r) => r.data);
export const getCutoffStatus = () => api.get('/withdrawals/cutoff-status').then((r) => r.data);
export const listWithdrawals = (params) => api.get('/withdrawals', { params }).then((r) => r.data);
export const approveWithdrawal = (id) => api.patch(`/withdrawals/${id}/approve`).then((r) => r.data);
export const startProcessing = (id) => api.patch(`/withdrawals/${id}/start-processing`).then((r) => r.data);
export const markPaid = (id, txHash) => api.patch(`/withdrawals/${id}/pay`, { txHash }).then((r) => r.data);
export const rejectWithdrawal = (id, reason) =>
  api.patch(`/withdrawals/${id}/reject`, { reason }).then((r) => r.data);
