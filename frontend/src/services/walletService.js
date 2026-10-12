import api from './api';

export const myWallet = () => api.get('/wallet/my').then((r) => r.data);
export const myTransactions = (wallet) =>
  api.get('/wallet/my/transactions', { params: wallet ? { wallet } : {} }).then((r) => r.data);
export const listWallets = () => api.get('/wallet').then((r) => r.data);
export const transferToWithdrawal = (from, amount) =>
  api.post('/wallet/my/transfer', { from, amount }).then((r) => r.data);
export const updateWithdrawalAddress = (withdrawalAddress, password) =>
  api.put('/wallet/my/withdrawal-address', { withdrawalAddress, password }).then((r) => r.data);
