import api from './api';

// Notifies layouts (sidebar unread badges) to refetch immediately instead of
// waiting for their next poll interval, since read-state just changed.
export const NOTIFICATIONS_READ_EVENT = 'notifications:read';
const notifyRead = () => window.dispatchEvent(new Event(NOTIFICATIONS_READ_EVENT));

export const myNotifications = (category) =>
  api.get('/notifications/my', { params: category ? { category } : {} }).then((r) => r.data);
export const myUnreadCount = () => api.get('/notifications/my/unread-count').then((r) => r.data);
export const markRead = (id) =>
  api.patch(`/notifications/${id}/read`).then((r) => {
    notifyRead();
    return r.data;
  });
export const markAllRead = (category) =>
  api.patch('/notifications/my/read-all', null, { params: category ? { category } : {} }).then((r) => {
    notifyRead();
    return r.data;
  });
export const listNotifications = () => api.get('/notifications').then((r) => r.data);
export const createNotification = (data) => api.post('/notifications', data).then((r) => r.data);
export const toggleNotificationActive = (id) => api.patch(`/notifications/${id}/toggle`).then((r) => r.data);
