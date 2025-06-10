import { RoomStatus } from './room';

export interface HotelFeature {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  type: 'feature' | 'amenity';  // Add type to distinguish between features and amenities
  category?: 'room' | 'common' | 'service';  // Add category to further classify items
}

export interface RoomType {
  id: string;
  name: string;
  description?: string;
  baseRate: number;
  defaultCapacity: number;
  features: string[]; // IDs of structural features
  amenities: string[]; // IDs of provided amenities
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
  name: string; // e.g., "101", "A1", "Presidential Suite 1"
  number: string; // The actual room number/identifier
  capacity: number;
  features: string[]; // Additional features specific to this room
  rate: number; // Specific rate for this room (overrides base rate)
  notes?: string;
}

export interface HotelConfiguration {
  id: string;
  name: string;
  description?: string;
  address?: string;
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
  address?: string;
  contactInfo?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  features: Omit<HotelFeature, 'id'>[];
  roomTypes: Omit<RoomType, 'id'>[];
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