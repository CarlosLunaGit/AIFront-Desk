import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as commApi from '../api/communications';

export const useCommunicationStats = () => {
  return useQuery({
    queryKey: ['communications', 'stats'],
    queryFn: commApi.getCommunicationStats,
  });
};

export const useConversations = () => {
  return useQuery({
    queryKey: ['communications', 'conversations'],
    queryFn: commApi.getConversations,
  });
};

export const useConversation = (conversationId: string) => {
  return useQuery({
    queryKey: ['communications', 'conversation', conversationId],
    queryFn: () => commApi.getConversation(conversationId),
    enabled: !!conversationId,
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: commApi.sendMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communications', 'conversations'] });
    },
  });
};

export const useReceiveMessage = () => {
  return useMutation({
    mutationFn: commApi.receiveMessage,
  });
};

export const useRequestTakeover = () => {
  return useMutation({
    mutationFn: commApi.requestTakeover,
  });
}; 