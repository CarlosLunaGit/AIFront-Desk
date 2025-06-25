import { api } from '../axios';
import type { Hotel, HotelConfiguration, HotelConfigFormData, HotelFeature, RoomType, Floor, RoomTemplate } from '../../types/hotel';

const BASE_URL = '/api/hotel';

// Hotel business endpoints (current working endpoints)
export const getCurrentHotel = async (): Promise<Hotel> => {
  const response = await api.get(`${BASE_URL}/current`);
  return response.data;
};

export const getAllHotels = async (): Promise<Hotel[]> => {
  const response = await api.get(BASE_URL);
  return response.data;
};

// Legacy configuration endpoints (for now, return mock data)
export const getCurrentConfig = async (): Promise<HotelConfiguration> => {
  // Transform Hotel to HotelConfiguration format
  const hotel = await getCurrentHotel();
  return {
    id: hotel._id,
    name: hotel.name,
    description: hotel.description,
    address: hotel.address || {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    contactInfo: hotel.contactInfo,
    features: (hotel as any).features || [], // Hotel now has features array
    roomTypes: [],
    floors: [],
    roomTemplates: [],
    settings: {
      roomNumberingFormat: 'numeric' as const,
      defaultStatus: 'available' as const,
      currency: hotel.settings.currency,
      timezone: hotel.settings.timezone,
      checkInTime: hotel.settings.checkInTime,
      checkOutTime: hotel.settings.checkOutTime,
    }
  };
};

export const setCurrentConfig = async (configId: string): Promise<HotelConfiguration> => {
  // For now, just return the current config
  return getCurrentConfig();
};

export const getConfigs = async (): Promise<HotelConfiguration[]> => {
  // Convert Hotels to HotelConfigurations
  const hotels = await getAllHotels();
  return hotels.map(hotel => ({
    id: hotel._id,
    name: hotel.name,
    description: hotel.description,
    address: hotel.address || {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    contactInfo: hotel.contactInfo,
    features: (hotel as any).features || [], // Hotel now has features array
    roomTypes: [],
    floors: [],
    roomTemplates: [],
    settings: {
      roomNumberingFormat: 'numeric' as const,
      defaultStatus: 'available' as const,
      currency: hotel.settings.currency,
      timezone: hotel.settings.timezone,
      checkInTime: hotel.settings.checkInTime,
      checkOutTime: hotel.settings.checkOutTime,
    }
  }));
};

export const createConfig = async (config: HotelConfigFormData): Promise<HotelConfiguration> => {
  const response = await api.post(BASE_URL, config);
  return response.data;
};

export const updateConfig = async (id: string, config: Partial<HotelConfigFormData>): Promise<HotelConfiguration> => {
  const response = await api.patch(`${BASE_URL}/${id}`, config);
  return response.data;
};

export const addFeature = async (feature: Omit<HotelFeature, 'id'>): Promise<HotelFeature> => {
  const response = await api.post(`${BASE_URL}/features`, feature);
  return response.data;
};

export const updateFeature = async (id: string, feature: Partial<HotelFeature>): Promise<HotelFeature> => {
  const response = await api.patch(`${BASE_URL}/features/${id}`, feature);
  return response.data;
};

export const deleteFeature = async (id: string): Promise<void> => {
  await api.delete(`${BASE_URL}/features/${id}`);
};

export const addRoomType = async (roomType: Omit<RoomType, 'id'>): Promise<RoomType> => {
  const response = await api.post(`${BASE_URL}/room-types`, roomType);
  return response.data;
};

export const updateRoomType = async (id: string, roomType: Partial<RoomType>): Promise<RoomType> => {
  const response = await api.patch(`${BASE_URL}/room-types/${id}`, roomType);
  return response.data;
};

export const deleteRoomType = async (id: string): Promise<void> => {
  await api.delete(`${BASE_URL}/room-types/${id}`);
};

export const addFloor = async (floor: Omit<Floor, 'id'>): Promise<Floor> => {
  const response = await api.post(`${BASE_URL}/floors`, floor);
  return response.data;
};

export const updateFloor = async (id: string, floor: Partial<Floor>): Promise<Floor> => {
  const response = await api.patch(`${BASE_URL}/floors/${id}`, floor);
  return response.data;
};

export const deleteFloor = async (id: string): Promise<void> => {
  await api.delete(`${BASE_URL}/floors/${id}`);
};

export const addRoomTemplate = async (template: Omit<RoomTemplate, 'id'>): Promise<RoomTemplate> => {
  const response = await api.post(`${BASE_URL}/room-templates`, template);
  return response.data;
};

export const updateRoomTemplate = async (id: string, template: Partial<RoomTemplate>): Promise<RoomTemplate> => {
  const response = await api.patch(`${BASE_URL}/room-templates/${id}`, template);
  return response.data;
};

export const deleteRoomTemplate = async (id: string): Promise<void> => {
  await api.delete(`${BASE_URL}/room-templates/${id}`);
};

export const createBulkRoomTemplates = async (templates: Omit<RoomTemplate, 'id'>[]): Promise<RoomTemplate[]> => {
  const response = await api.post(`${BASE_URL}/room-templates/bulk`, { templates });
  return response.data;
};

export const getDashboardStats = async () => {
  const response = await api.get('/api/dashboard/stats');
  return response.data;
};

// NEW: Get unified dashboard data (hotel + roomTypes + stats)
export const getHotelDashboardData = async (hotelId: string): Promise<any> => {
  const response = await api.get(`${BASE_URL}/${hotelId}/dashboard-data`);
  return response.data;
}; 