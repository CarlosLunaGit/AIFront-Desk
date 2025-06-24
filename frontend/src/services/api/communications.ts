import { api } from '../axios';

export const getCommunicationStats = async () => {
  const { data } = await api.get('/api/communications/stats');
  return data;
};

export const getConversations = async () => {
  const { data } = await api.get('/api/communications/conversations');
  return data;
};

export const getConversation = async (conversationId: string) => {
  const { data } = await api.get(`/api/communications/${conversationId}`);
  return data;
};

export const sendMessage = async (payload: any) => {
  const { data } = await api.post('/api/communications/send', payload);
  return data;
};

export const receiveMessage = async (payload: any) => {
  const { data } = await api.post('/api/communications/receive', payload);
  return data;
};

export const requestTakeover = async (conversationId: string) => {
  const { data } = await api.post('/api/communications/takeover', { conversationId });
  return data;
}; 