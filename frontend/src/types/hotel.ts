import { RoomStatus, RoomType } from './room';

// MongoDB Hotel document structure (actual backend data)
export interface Hotel {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  contactInfo: {
    phone?: string;
    email?: string;
    website?: string;
  };
  communicationChannels?: {
    whatsapp?: {
      phoneNumber: string;
      verified: boolean;
      businessAccountId?: string;
    };
    sms?: {
      phoneNumber: string;
      verified: boolean;
    };
    email?: {
      address: string;
      verified: boolean;
    };
  };
  subscription: {
    tier: string;
    status: string;
    currentPeriodStart: string | Date;
    currentPeriodEnd: string | Date;
    cancelAtPeriodEnd: boolean;
    features: {
      maxRooms: number;
      maxAIResponses: number;
      maxUsers: number;
      channels: string[];
      hasVoiceCalls: boolean;
      hasAdvancedAnalytics: boolean;
      hasCustomAI: boolean;
      hasWhiteLabel: boolean;
      hasAPIAccess: boolean;
    };
    monthlyPrice: number;
  };
  settings: {
    timezone: string;
    currency: string;
    language: string;
    checkInTime: string;
    checkOutTime: string;
  };
  isActive: boolean;
  createdBy: string;
  usage: {
    currentRooms: number;
    aiResponsesThisMonth: number;
    usersCount: number;
    lastReset: string | Date;
  };
}

export interface HotelFeature {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  type: 'feature' | 'amenity';  // Add type to distinguish between features and amenities
  category?: 'room' | 'common' | 'service';  // Add category to further classify items
}



export interface Floor {
  id: string;
  name: string;
  number: number;
  description?: string;
  isActive: boolean;
}

export interface RoomTemplate {
  id: string;
  typeId: string; // Reference to RoomType
  floorId: string; // Reference to Floor
  name: string; // e.g., "Presidential Suite 1"
  capacity: number;
  features: string[]; // Additional features specific to this room
  rate: number; // Specific rate for this room (overrides base rate)
  notes?: string;
}

export interface HotelConfiguration {
  id: string;
  name: string;
  description?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  contactInfo?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  features: HotelFeature[];
  roomTypes: RoomType[];
  floors: Floor[];
  roomTemplates: RoomTemplate[];
  settings: {
    roomNumberingFormat: 'numeric' | 'alphanumeric' | 'custom';
    defaultStatus: RoomStatus;
    currency: string;
    timezone: string;
    checkInTime: string;
    checkOutTime: string;
  };
}

export interface HotelConfigFormData {
  name: string;
  description?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  contactInfo?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  features: Omit<HotelFeature, 'id'>[];
  roomTypes: Omit<RoomType, '_id'>[];
  floors: Omit<Floor, 'id'>[];
  roomTemplates: Omit<RoomTemplate, 'id'>[];
  settings: HotelConfiguration['settings'];
}

// For MongoDB schema
export interface HotelConfigDocument extends HotelConfiguration {
  createdAt: Date;
  updatedAt: Date;
  ownerId: string;
  isActive: boolean;
} 