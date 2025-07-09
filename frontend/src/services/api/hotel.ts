import { api } from '../axios';
import type { Hotel, HotelConfiguration, HotelConfigFormData, HotelFeature, Floor, RoomTemplate } from '../../types/hotel';
import { RoomType } from '../../types/room';

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

// NEW: Set current hotel (for testing/MSW environment)
export const setCurrentHotel = async (hotelId: string): Promise<Hotel> => {
  const response = await api.post(`${BASE_URL}/set-current`, { hotelId });
  return response.data;
};

// Legacy configuration endpoints (for now, return mock data)
export const getCurrentConfig = async (): Promise<HotelConfiguration> => {
  // Transform Hotel to HotelConfiguration format with related data
  const hotel = await getCurrentHotel();
  
  // Fetch room types for this hotel from separate collection (normalized approach)
  let roomTypes: RoomType[] = [];
  try {
    console.log('🔍 Fetching room types for hotel ID:', hotel._id);
    const roomTypesResponse = await api.get(`${BASE_URL}/${hotel._id}/room-types`);
    console.log('📋 Raw room types response:', roomTypesResponse.data);
    roomTypes = roomTypesResponse.data.map((rt: any) => ({
      id: rt._id,
      name: rt.name,
      description: rt.description,
      defaultCapacity: rt.defaultCapacity,
      baseRate: rt.baseRate,
      features: rt.features || [],
      amenities: rt.amenities || []
    }));
    console.log('✅ Transformed room types:', roomTypes);
  } catch (error) {
    console.warn('Could not fetch room types for hotel:', hotel._id, error);
    roomTypes = [];
  }
  
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
    features: (hotel as any).features || [], // Hotel amenities/features
    roomTypes, // Fetched from separate room types collection (proper document relationships)
    floors: (hotel as any).floors || [], // For future use
    roomTemplates: (hotel as any).roomTemplates || [], // For future use
    settings: {
      roomNumberingFormat: (hotel as any).settings?.roomNumberingFormat || 'numeric' as const,
      defaultStatus: (hotel as any).settings?.defaultStatus || 'available' as const,
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
  // Convert Hotels to HotelConfigurations with related data
  const hotels = await getAllHotels();
  
  const configs = await Promise.all(hotels.map(async (hotel) => {
    // Fetch room types for each hotel from separate collection
    let roomTypes: RoomType[] = [];
    try {
      const roomTypesResponse = await api.get(`${BASE_URL}/${hotel._id}/room-types`);
      roomTypes = roomTypesResponse.data.map((rt: any) => ({
        id: rt._id,
        name: rt.name,
        description: rt.description,
        defaultCapacity: rt.defaultCapacity,
        baseRate: rt.baseRate,
        features: rt.features || [],
        amenities: rt.amenities || []
      }));
    } catch (error) {
      console.warn('Could not fetch room types for hotel:', hotel._id, error);
      roomTypes = [];
    }
    
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
      features: (hotel as any).features || [], // Hotel amenities/features
      roomTypes, // Fetched from separate room types collection (proper document relationships)
      floors: (hotel as any).floors || [], // For future use
      roomTemplates: (hotel as any).roomTemplates || [], // For future use
      settings: {
        roomNumberingFormat: (hotel as any).settings?.roomNumberingFormat || 'numeric' as const,
        defaultStatus: (hotel as any).settings?.defaultStatus || 'available' as const,
        currency: hotel.settings.currency,
        timezone: hotel.settings.timezone,
        checkInTime: hotel.settings.checkInTime,
        checkOutTime: hotel.settings.checkOutTime,
      }
    };
  }));
  
  return configs;
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
  // Get current hotel to use proper endpoint with hotel ID
  const hotel = await getCurrentHotel();
  const response = await api.post(`${BASE_URL}/${hotel._id}/room-types`, roomType);
  return {
    _id: response.data._id,
    name: response.data.name,
    description: response.data.description,
    defaultCapacity: response.data.defaultCapacity,
    baseRate: response.data.baseRate,
    capacity: response.data.capacity,
    features: response.data.features || [],
    amenities: response.data.amenities || [],
    hotelId: response.data.hotelId,
    isActive: response.data.isActive,
    createdAt: response.data.createdAt,
    updatedAt: response.data.updatedAt
  };
};

export const updateRoomType = async (id: string, roomType: Partial<RoomType>): Promise<RoomType> => {
  // Get current hotel to use proper endpoint with hotel ID
  const hotel = await getCurrentHotel();
  const response = await api.patch(`${BASE_URL}/${hotel._id}/room-types/${id}`, roomType);
  return {
    _id: response.data._id,
    name: response.data.name,
    description: response.data.description,
    defaultCapacity: response.data.defaultCapacity,
    capacity: response.data.capacity,
    baseRate: response.data.baseRate,
    features: response.data.features || [],
    amenities: response.data.amenities || [],
    hotelId: response.data.hotelId,
    isActive: response.data.isActive,
    createdAt: response.data.createdAt,
    updatedAt: response.data.updatedAt
  };
};

export const deleteRoomType = async (id: string): Promise<void> => {
  // Get current hotel to use proper endpoint with hotel ID
  const hotel = await getCurrentHotel();
  await api.delete(`${BASE_URL}/${hotel._id}/room-types/${id}`);
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