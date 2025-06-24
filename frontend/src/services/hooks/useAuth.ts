import { useMutation, useQuery } from '@tanstack/react-query';
import * as authApi from '../api/auth';

export const useLogin = () => {
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => authApi.login(email, password),
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: authApi.register,
  });
};

export const useMe = () => {
  return useQuery({
    queryKey: ['me'],
    queryFn: authApi.getMe,
    enabled: typeof window !== 'undefined' && window.location.pathname !== '/login',
    refetchOnWindowFocus: false,
  });
}; 