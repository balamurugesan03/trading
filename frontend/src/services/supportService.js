import api from './api';

// Notifies layouts (sidebar unread badges) to refetch immediately instead of
// waiting for their next poll interval, since read-state just changed.
export const SUPPORT_READ_EVENT = 'support:read';
const notifyRead = () => window.dispatchEvent(new Event(SUPPORT_READ_EVENT));

// Customer side
export const myMessages = () => api.get('/support/my/messages').then((r) => r.data);
export const sendMyMessage = (message) => api.post('/support/my/messages', { message }).then((r) => r.data);
export const markMyRead = () =>
  api.patch('/support/my/read').then((r) => {
    notifyRead();
    return r.data;
  });
export const myUnreadCount = () => api.get('/support/my/unread-count').then((r) => r.data);

// Admin side
export const listConversations = () => api.get('/support/conversations').then((r) => r.data);
export const unreadCount = () => api.get('/support/unread-count').then((r) => r.data);
export const getConversation = (customerId) =>
  api.get(`/support/conversations/${customerId}/messages`).then((r) => r.data);
export const sendAdminMessage = (customerId, message) =>
  api.post(`/support/conversations/${customerId}/messages`, { message }).then((r) => r.data);
export const markConversationRead = (customerId) =>
  api.patch(`/support/conversations/${customerId}/read`).then((r) => {
    notifyRead();
    return r.data;
  });
