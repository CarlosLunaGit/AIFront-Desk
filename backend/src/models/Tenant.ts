import mongoose, { Document, Schema } from 'mongoose';

export enum SubscriptionTier {
  BASIC = 'basic',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise'
}

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

export interface ITenant extends Document {
  name: string; // Hotel name
  slug: string; // URL-friendly identifier
  description?: string;
  address?: string;
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
  [SubscriptionTier.BASIC]: {
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
  [SubscriptionTier.BASIC]: 29,
  [SubscriptionTier.PROFESSIONAL]: 99,
  [SubscriptionTier.ENTERPRISE]: 299,
};

const tenantSchema = new Schema<ITenant>(
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
      type: String,
      trim: true,
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
        default: SubscriptionTier.BASIC,
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
          return TIER_FEATURES[this.subscription?.tier || SubscriptionTier.BASIC];
        },
      },
      monthlyPrice: {
        type: Number,
        default: function() {
          return TIER_PRICING[this.subscription?.tier || SubscriptionTier.BASIC];
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
tenantSchema.index({ slug: 1 });
tenantSchema.index({ 'subscription.tier': 1 });
tenantSchema.index({ 'subscription.status': 1 });
tenantSchema.index({ createdBy: 1 });

// Methods
tenantSchema.methods.canUseFeature = function(feature: keyof IFeatureLimits): boolean {
  return this.subscription.features[feature] === true || this.subscription.features[feature] > 0;
};

tenantSchema.methods.isWithinLimits = function(resource: 'rooms' | 'aiResponses' | 'users'): boolean {
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

tenantSchema.methods.updateSubscription = function(tier: SubscriptionTier) {
  this.subscription.tier = tier;
  this.subscription.features = TIER_FEATURES[tier];
  this.subscription.monthlyPrice = TIER_PRICING[tier];
  return this.save();
};

// Static methods
tenantSchema.statics.getTierFeatures = function(tier: SubscriptionTier): IFeatureLimits {
  return TIER_FEATURES[tier];
};

tenantSchema.statics.getTierPrice = function(tier: SubscriptionTier): number {
  return TIER_PRICING[tier];
};

export const Tenant = mongoose.model<ITenant>('Tenant', tenantSchema);
export { TIER_FEATURES, TIER_PRICING }; 