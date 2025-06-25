import mongoose, { Document, Schema } from 'mongoose';
import { SubscriptionTier } from './SubscriptionTier';

export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELED = 'canceled',
  PAST_DUE = 'past_due',
  UNPAID = 'unpaid',
  TRIALING = 'trialing'
}

export interface IFeatureLimits {
  maxRooms: number;
  maxAIResponses: number; // per month
  maxUsers: number;
  channels: string[];
  hasVoiceCalls: boolean;
  hasAdvancedAnalytics: boolean;
  hasCustomAI: boolean;
  hasWhiteLabel: boolean;
  hasAPIAccess: boolean;
}

export interface ISubscription {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  features: IFeatureLimits;
  monthlyPrice: number;
}

export interface IFloor {
  id: string;
  name: string;
  number: number;
  description?: string;
  isActive: boolean;
}

export interface IHotel extends Document {
  name: string; // Hotel name
  slug: string; // URL-friendly identifier
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
  subscription: ISubscription;
  settings: {
    timezone: string;
    currency: string;
    language: string;
    checkInTime: string;
    checkOutTime: string;
  };
  floors: IFloor[]; // Embedded floors
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  usage: {
    currentRooms: number;
    aiResponsesThisMonth: number;
    usersCount: number;
    lastReset: Date;
  };
}

// Define feature limits for each tier
const TIER_FEATURES: Record<SubscriptionTier, IFeatureLimits> = {
  [SubscriptionTier.STARTER]: {
    maxRooms: 50,
    maxAIResponses: 1000,
    maxUsers: 3,
    channels: ['whatsapp', 'email'],
    hasVoiceCalls: false,
    hasAdvancedAnalytics: false,
    hasCustomAI: false,
    hasWhiteLabel: false,
    hasAPIAccess: false,
  },
  [SubscriptionTier.PROFESSIONAL]: {
    maxRooms: 200,
    maxAIResponses: 5000,
    maxUsers: 10,
    channels: ['whatsapp', 'email', 'sms'],
    hasVoiceCalls: true,
    hasAdvancedAnalytics: true,
    hasCustomAI: false,
    hasWhiteLabel: false,
    hasAPIAccess: true,
  },
  [SubscriptionTier.ENTERPRISE]: {
    maxRooms: -1, // unlimited
    maxAIResponses: -1, // unlimited
    maxUsers: -1, // unlimited
    channels: ['whatsapp', 'email', 'sms', 'phone'],
    hasVoiceCalls: true,
    hasAdvancedAnalytics: true,
    hasCustomAI: true,
    hasWhiteLabel: true,
    hasAPIAccess: true,
  },
};

const TIER_PRICING = {
  [SubscriptionTier.STARTER]: 29,
  [SubscriptionTier.PROFESSIONAL]: 99,
  [SubscriptionTier.ENTERPRISE]: 299,
};

const hotelSchema = new Schema<IHotel>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      zipCode: { type: String, trim: true },
      country: { type: String, trim: true },
    },
    contactInfo: {
      phone: { type: String, trim: true },
      email: { type: String, lowercase: true, trim: true },
      website: { type: String, trim: true },
    },
    communicationChannels: {
      whatsapp: {
        phoneNumber: { type: String, trim: true },
        verified: { type: Boolean, default: false },
        businessAccountId: { type: String, trim: true },
      },
      sms: {
        phoneNumber: { type: String, trim: true },
        verified: { type: Boolean, default: false },
      },
      email: {
        address: { type: String, lowercase: true, trim: true },
        verified: { type: Boolean, default: false },
      },
    },
    subscription: {
      tier: {
        type: String,
        enum: Object.values(SubscriptionTier),
        default: SubscriptionTier.STARTER,
      },
      status: {
        type: String,
        enum: Object.values(SubscriptionStatus),
        default: SubscriptionStatus.TRIALING,
      },
      stripeCustomerId: { type: String },
      stripeSubscriptionId: { type: String },
      currentPeriodStart: {
        type: Date,
        default: Date.now,
      },
      currentPeriodEnd: {
        type: Date,
        default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
      cancelAtPeriodEnd: {
        type: Boolean,
        default: false,
      },
      features: {
        type: Schema.Types.Mixed,
        default: function() {
          return TIER_FEATURES[this.subscription?.tier || SubscriptionTier.STARTER];
        },
      },
      monthlyPrice: {
        type: Number,
        default: function() {
          return TIER_PRICING[this.subscription?.tier || SubscriptionTier.STARTER];
        },
      },
    },
    settings: {
      timezone: {
        type: String,
        default: 'UTC',
      },
      currency: {
        type: String,
        default: 'USD',
      },
      language: {
        type: String,
        default: 'en',
      },
      checkInTime: {
        type: String,
        default: '15:00',
      },
      checkOutTime: {
        type: String,
        default: '11:00',
      },
    },
    floors: [{
      id: { type: String, required: true },
      name: { type: String, required: true, trim: true },
      number: { type: Number, required: true },
      description: { type: String, trim: true },
      isActive: { type: Boolean, default: true }
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    usage: {
      currentRooms: {
        type: Number,
        default: 0,
      },
      aiResponsesThisMonth: {
        type: Number,
        default: 0,
      },
      usersCount: {
        type: Number,
        default: 1,
      },
      lastReset: {
        type: Date,
        default: Date.now,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
hotelSchema.index({ 'subscription.tier': 1 });
hotelSchema.index({ 'subscription.status': 1 });
hotelSchema.index({ createdBy: 1 });

// Methods
hotelSchema.methods.canUseFeature = function(feature: keyof IFeatureLimits): boolean {
  return this.subscription.features[feature] === true || this.subscription.features[feature] > 0;
};

hotelSchema.methods.isWithinLimits = function(resource: 'rooms' | 'aiResponses' | 'users'): boolean {
  const limits = this.subscription.features;
  const usage = this.usage;
  
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

hotelSchema.methods.updateSubscription = function(tier: SubscriptionTier) {
  this.subscription.tier = tier;
  this.subscription.features = TIER_FEATURES[tier];
  this.subscription.monthlyPrice = TIER_PRICING[tier];
  return this.save();
};

// Static methods
hotelSchema.statics.getTierFeatures = function(tier: SubscriptionTier): IFeatureLimits {
  return TIER_FEATURES[tier];
};

hotelSchema.statics.getTierPrice = function(tier: SubscriptionTier): number {
  return TIER_PRICING[tier];
};

// =============================================================================
// HOTEL CONFIGURATION MODEL (Complex Hotel Setup)
// =============================================================================

export interface IHotelFeature {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  type: 'feature' | 'amenity';
  category?: 'room' | 'common' | 'service';
}

export interface IRoomType {
  id: string;
  name: string;
  description?: string;
  baseRate: number;
  defaultCapacity: number;
  features: string[]; // IDs of structural features
  amenities: string[]; // IDs of provided amenities
}

export interface IFloor {
  id: string;
  name: string;
  number: number;
  description?: string;
  isActive: boolean;
}

export interface IRoomTemplate {
  id: string;
  typeId: string; // Reference to RoomType
  floorId: string; // Reference to Floor
  name: string;
  capacity: number;
  features: string[]; // Additional features specific to this room
  rate: number;
  notes?: string;
}

export interface IHotelConfiguration extends Document {
  name: string;
  description?: string;
  address?: string;
  contactInfo?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  features: IHotelFeature[];
  roomTypes: IRoomType[];
  floors: IFloor[];
  roomTemplates: IRoomTemplate[];
  settings: {
    roomNumberingFormat: 'numeric' | 'alphanumeric' | 'custom';
    defaultStatus: string;
    currency: string;
    timezone: string;
    checkInTime: string;
    checkOutTime: string;
  };
  hotelId: mongoose.Types.ObjectId; // Reference to the main Hotel
  createdBy: mongoose.Types.ObjectId;
  isActive: boolean;
}

const hotelConfigurationSchema = new Schema<IHotelConfiguration>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    contactInfo: {
      phone: { type: String, trim: true },
      email: { type: String, lowercase: true, trim: true },
      website: { type: String, trim: true },
    },
    features: [{
      id: { type: String, required: true },
      name: { type: String, required: true },
      description: { type: String },
      icon: { type: String },
      type: { 
        type: String, 
        enum: ['feature', 'amenity'],
        required: true 
      },
      category: { 
        type: String, 
        enum: ['room', 'common', 'service'] 
      },
    }],
    roomTypes: [{
      id: { type: String, required: true },
      name: { type: String, required: true },
      description: { type: String },
      baseRate: { type: Number, required: true },
      defaultCapacity: { type: Number, required: true },
      features: [{ type: String }],
      amenities: [{ type: String }],
    }],
    floors: [{
      id: { type: String, required: true },
      name: { type: String, required: true },
      number: { type: Number, required: true },
      description: { type: String },
      isActive: { type: Boolean, default: true },
    }],
    roomTemplates: [{
      id: { type: String, required: true },
      typeId: { type: String, required: true },
      floorId: { type: String, required: true },
      name: { type: String, required: true },
      capacity: { type: Number, required: true },
      features: [{ type: String }],
      rate: { type: Number, required: true },
      notes: { type: String },
    }],
    settings: {
      roomNumberingFormat: {
        type: String,
        enum: ['numeric', 'alphanumeric', 'custom'],
        default: 'numeric',
      },
      defaultStatus: {
        type: String,
        default: 'available',
      },
      currency: {
        type: String,
        default: 'USD',
      },
      timezone: {
        type: String,
        default: 'UTC',
      },
      checkInTime: {
        type: String,
        default: '15:00',
      },
      checkOutTime: {
        type: String,
        default: '11:00',
      },
    },
    hotelId: {
      type: Schema.Types.ObjectId,
      ref: 'Hotel',
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for HotelConfiguration
hotelConfigurationSchema.index({ hotelId: 1 });
hotelConfigurationSchema.index({ createdBy: 1 });
hotelConfigurationSchema.index({ isActive: 1 });

export const HotelConfiguration = mongoose.model<IHotelConfiguration>('HotelConfiguration', hotelConfigurationSchema);

export const Hotel = mongoose.model<IHotel>('Hotel', hotelSchema, 'hotels');
export { TIER_FEATURES, TIER_PRICING }; 