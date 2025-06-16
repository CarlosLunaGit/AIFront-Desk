import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../services/api';

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
}

export interface FeatureLimits {
  maxRooms: number;
  maxAIResponses: number;
  maxUsers: number;
  channels: string[];
  hasVoiceCalls: boolean;
  hasAdvancedAnalytics: boolean;
  hasCustomAI: boolean;
  hasWhiteLabel: boolean;
  hasAPIAccess: boolean;
}

export interface Subscription {
  tier: 'basic' | 'professional' | 'enterprise';
  status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing';
  features: FeatureLimits;
  currentPeriodEnd: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  subscription: Subscription;
  settings: {
    timezone: string;
    currency: string;
    language: string;
    checkInTime: string;
    checkOutTime: string;
  };
  usage: {
    currentRooms: number;
    aiResponsesThisMonth: number;
    usersCount: number;
  };
}

export interface UserContextType {
  user: User | null;
  tenant: Tenant | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (userData: RegisterData) => Promise<void>;
  hasFeature: (feature: keyof FeatureLimits) => boolean;
  canUseFeature: (feature: string) => boolean;
  isWithinLimits: (resource: 'rooms' | 'aiResponses' | 'users') => boolean;
  getUsagePercentage: (resource: 'rooms' | 'aiResponses' | 'users') => number;
  refreshUserData: () => Promise<void>;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  hotelName: string;
  tier?: 'basic' | 'professional' | 'enterprise';
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated
  const isAuthenticated = !!user && !!tenant;

  // Initialize user session on app load
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('auth_token');
      
      if (token) {
        try {
          await refreshUserData();
        } catch (error) {
          console.error('Failed to restore session:', error);
          logout();
        }
      }
      
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<void> => {
    try {
      const response = await api.post('/api/auth/login', { email, password });
      const { token, user: userData, tenant: tenantData } = response.data;

      // Store token
      localStorage.setItem('auth_token', token);

      // Set user and tenant data
      setUser(userData);
      setTenant(tenantData);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  // Register function
  const register = async (userData: RegisterData): Promise<void> => {
    try {
      const response = await api.post('/api/auth/register', userData);
      const { token, user: newUser, tenant: newTenant } = response.data;

      // Store token
      localStorage.setItem('auth_token', token);

      // Set user and tenant data
      setUser(newUser);
      setTenant(newTenant);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  };

  // Logout function
  const logout = (): void => {
    localStorage.removeItem('auth_token');
    setUser(null);
    setTenant(null);
  };

  // Refresh user data
  const refreshUserData = async (): Promise<void> => {
    try {
      const response = await api.get('/api/auth/me');
      const { user: userData, tenant: tenantData } = response.data;

      setUser(userData);
      setTenant(tenantData);
    } catch (error) {
      throw new Error('Failed to fetch user data');
    }
  };

  // Feature checking functions
  const hasFeature = (feature: keyof FeatureLimits): boolean => {
    if (!tenant) return false;
    
    const featureValue = tenant.subscription.features[feature];
    if (typeof featureValue === 'boolean') return featureValue;
    if (typeof featureValue === 'number') return featureValue > 0;
    if (Array.isArray(featureValue)) return featureValue.length > 0;
    return false;
  };

  const canUseFeature = (feature: string): boolean => {
    if (!tenant) return false;
    
    const features = tenant.subscription.features;
    
    switch (feature) {
      case 'voice_calls':
        return features.hasVoiceCalls;
      case 'advanced_analytics':
        return features.hasAdvancedAnalytics;
      case 'custom_ai':
        return features.hasCustomAI;
      case 'white_label':
        return features.hasWhiteLabel;
      case 'api_access':
        return features.hasAPIAccess;
      case 'sms':
        return features.channels.includes('sms');
      case 'phone':
        return features.channels.includes('phone');
      case 'whatsapp':
        return features.channels.includes('whatsapp');
      case 'email':
        return features.channels.includes('email');
      default:
        return false;
    }
  };

  const isWithinLimits = (resource: 'rooms' | 'aiResponses' | 'users'): boolean => {
    if (!tenant) return false;
    
    const limits = tenant.subscription.features;
    const usage = tenant.usage;
    
    switch (resource) {
      case 'rooms':
        return limits.maxRooms === -1 || usage.currentRooms < limits.maxRooms;
      case 'aiResponses':
        return limits.maxAIResponses === -1 || usage.aiResponsesThisMonth < limits.maxAIResponses;
      case 'users':
        return limits.maxUsers === -1 || usage.usersCount < limits.maxUsers;
      default:
        return false;
    }
  };

  const getUsagePercentage = (resource: 'rooms' | 'aiResponses' | 'users'): number => {
    if (!tenant) return 0;
    
    const limits = tenant.subscription.features;
    const usage = tenant.usage;
    
    switch (resource) {
      case 'rooms':
        if (limits.maxRooms === -1) return 0; // Unlimited
        return (usage.currentRooms / limits.maxRooms) * 100;
      case 'aiResponses':
        if (limits.maxAIResponses === -1) return 0; // Unlimited
        return (usage.aiResponsesThisMonth / limits.maxAIResponses) * 100;
      case 'users':
        if (limits.maxUsers === -1) return 0; // Unlimited
        return (usage.usersCount / limits.maxUsers) * 100;
      default:
        return 0;
    }
  };

  const contextValue: UserContextType = {
    user,
    tenant,
    isLoading,
    isAuthenticated,
    login,
    logout,
    register,
    hasFeature,
    canUseFeature,
    isWithinLimits,
    getUsagePercentage,
    refreshUserData,
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
}; 