import api from './api';

export const myNotifications = () => api.get('/notifications/my').then((r) => r.data);
export const markRead = (id) => api.patch(`/notifications/${id}/read`).then((r) => r.data);
export const listNotifications = () => api.get('/notifications').then((r) => r.data);
export const createNotification = (data) => api.post('/notifications', data).then((r) => r.data);
export const toggleNotificationActive = (id) => api.patch(`/notifications/${id}/toggle`).then((r) => r.data);
