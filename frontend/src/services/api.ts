import axios from 'axios';

// Get environment variables with fallbacks
const getEnvVar = (key: keyof ImportMetaEnv, fallback: string): string => {
  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return fallback;
    }

    // Try to get the environment variable
    const value = import.meta.env?.[key];
    if (value === undefined || value === '') {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Environment variable ${key} is not defined or empty, using fallback: ${fallback}`);
      }
      return fallback;
    }

    return value;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Error accessing environment variable ${key}, using fallback: ${fallback}`, error);
    }
    return fallback;
  }
};

// Default configuration
const DEFAULT_CONFIG = {
  API_URL: 'http://localhost:3001',
  ENABLE_MOCK_API: 'true',
  APP_NAME: 'Hotel AI Front Desk',
  APP_VERSION: '1.0.0',
} as const;

// Check if we're in mock mode - default to true in development
const isMockMode = process.env.NODE_ENV === 'development' && 
  (getEnvVar('VITE_ENABLE_MOCK_API', DEFAULT_CONFIG.ENABLE_MOCK_API) === 'true');

// Create axios instance with default config
export const api = axios.create({
  baseURL: isMockMode ? '' : getEnvVar('VITE_API_URL', DEFAULT_CONFIG.API_URL),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication and logging
api.interceptors.request.use((config) => {
  // Add auth token if available
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Log request in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`🚀 [${config.method?.toUpperCase()}] ${config.url}`, {
      baseURL: config.baseURL,
      headers: config.headers,
      data: config.data,
      mockMode: isMockMode,
    });
  }

  return config;
});

// Add response interceptor for error handling and logging
api.interceptors.response.use(
  (response) => {
    // Log response in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ [${response.status}] ${response.config.url}`, {
        data: response.data,
        mockMode: isMockMode,
      });
    }
    return response;
  },
  async (error) => {
    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`❌ [${error.response?.status || 'NO RESPONSE'}] ${error.config?.url}`, {
        error: error.message,
        response: error.response?.data,
        mockMode: isMockMode,
      });
    }

    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }

    // Provide more helpful error messages in development
    if (process.env.NODE_ENV === 'development' && !error.response) {
      if (isMockMode) {
        console.warn('⚠️ No response received. Make sure the mock service worker is running.');
      } else {
        console.warn('⚠️ No response received. Make sure the backend server is running at:', getEnvVar('VITE_API_URL', DEFAULT_CONFIG.API_URL));
      }
    }

    return Promise.reject(error);
  }
);

// Reservation API
export const getReservations = async () => {
  const { data } = await api.get('/api/reservations');
  return data;
};

export const createReservation = async (reservation: any) => {
  const { data } = await api.post('/api/reservations', reservation);
  return data;
};

export const updateReservation = async (id: string, reservation: any) => {
  const { data } = await api.patch(`/api/reservations/${id}`, reservation);
  return data;
};

export const deleteReservation = async (id: string) => {
  await api.delete(`/api/reservations/${id}`);
};

// Guest API
export const getGuests = async () => {
  const { data } = await api.get('/api/guests');
  return data;
};

// Room API
export const getRooms = async () => {
  const { data } = await api.get('/api/rooms');
  return data;
}; 