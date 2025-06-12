import { api } from './api';
import type { 
  HotelConfiguration, 
  HotelConfigFormData, 
  HotelFeature, 
  RoomType, 
  Floor, 
  RoomTemplate 
} from '../types/hotel';

interface DashboardStats {
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  maintenanceRooms: number;
  cleaningRooms: number;
  reservedRooms: number;
  occupancyRate: number;
  byType: Record<string, number>;
}

const BASE_URL = '/api/hotel/config';

export const hotelConfigService = {
  // Get current hotel configuration
  getCurrentConfig: async (): Promise<HotelConfiguration> => {
    const response = await api.get(`${BASE_URL}/current`);
    return response.data;
  },

  // Set current hotel configuration
  setCurrentConfig: async (configId: string): Promise<HotelConfiguration> => {
    const response = await api.post(`${BASE_URL}/current`, { configId });
    return response.data;
  },

  // Get all hotel configurations
  getAllConfigs: async (): Promise<HotelConfiguration[]> => {
    const response = await api.get(BASE_URL);
    return response.data;
  },

  // Create new hotel configuration
  createConfig: async (config: HotelConfigFormData): Promise<HotelConfiguration> => {
    const response = await api.post(BASE_URL, config);
    return response.data;
  },

  // Update hotel configuration
  updateConfig: async (id: string, config: Partial<HotelConfigFormData>): Promise<HotelConfiguration> => {
    const response = await api.patch(`${BASE_URL}/${id}`, config);
    return response.data;
  },

  // Features management
  addFeature: async (feature: Omit<HotelFeature, 'id'>): Promise<HotelFeature> => {
    const response = await api.post(`${BASE_URL}/features`, feature);
    return response.data;
  },

  updateFeature: async (id: string, feature: Partial<HotelFeature>): Promise<HotelFeature> => {
    const response = await api.patch(`${BASE_URL}/features/${id}`, feature);
    return response.data;
  },

  deleteFeature: async (id: string): Promise<void> => {
    await api.delete(`${BASE_URL}/features/${id}`);
  },

  // Room types management
  addRoomType: async (roomType: Omit<RoomType, 'id'>): Promise<RoomType> => {
    const response = await api.post(`${BASE_URL}/room-types`, roomType);
    return response.data;
  },

  updateRoomType: async (id: string, roomType: Partial<RoomType>): Promise<RoomType> => {
    const response = await api.patch(`${BASE_URL}/room-types/${id}`, roomType);
    return response.data;
  },

  deleteRoomType: async (id: string): Promise<void> => {
    await api.delete(`${BASE_URL}/room-types/${id}`);
  },

  // Floors management
  addFloor: async (floor: Omit<Floor, 'id'>): Promise<Floor> => {
    const response = await api.post(`${BASE_URL}/floors`, floor);
    return response.data;
  },

  updateFloor: async (id: string, floor: Partial<Floor>): Promise<Floor> => {
    const response = await api.patch(`${BASE_URL}/floors/${id}`, floor);
    return response.data;
  },

  deleteFloor: async (id: string): Promise<void> => {
    await api.delete(`${BASE_URL}/floors/${id}`);
  },

  // Room templates management
  addRoomTemplate: async (template: Omit<RoomTemplate, 'id'>): Promise<RoomTemplate> => {
    const response = await api.post(`${BASE_URL}/room-templates`, template);
    return response.data;
  },

  updateRoomTemplate: async (id: string, template: Partial<RoomTemplate>): Promise<RoomTemplate> => {
    const response = await api.patch(`${BASE_URL}/room-templates/${id}`, template);
    return response.data;
  },

  deleteRoomTemplate: async (id: string): Promise<void> => {
    await api.delete(`${BASE_URL}/room-templates/${id}`);
  },

  // Bulk room template creation
  createBulkRoomTemplates: async (templates: Omit<RoomTemplate, 'id'>[]): Promise<RoomTemplate[]> => {
    const response = await api.post(`${BASE_URL}/room-templates/bulk`, { templates });
    return response.data;
  },

  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await fetch('/api/dashboard/stats');
    if (!response.ok) {
      throw new Error('Failed to fetch dashboard stats');
    }
    return response.json();
  },
}; 