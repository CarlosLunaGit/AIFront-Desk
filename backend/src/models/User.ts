import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { SubscriptionTier } from './SubscriptionTier';

export enum UserRole {
  SUBSCRIPTION_OWNER = 'subscription_owner', // Top-level: owns subscription, can have multiple hotels
  HOTEL_OWNER = 'hotel_owner',              // Hotel-level: manages specific hotel
  MANAGER = 'manager',                      // Hotel-level: hotel management
  STAFF = 'staff',                         // Hotel-level: front desk, etc.
  ADMIN = 'admin'                          // Platform admin
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELED = 'canceled',
  PAST_DUE = 'past_due',
  UNPAID = 'unpaid',
  TRIALING = 'trialing'
}

export interface ISubscription {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  monthlyPrice: number;
  maxHotels: number;
  trialEndsAt?: Date;
}

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  
  // For SUBSCRIPTION_OWNER users
  subscription?: ISubscription;
  ownedHotels?: mongoose.Types.ObjectId[]; // Array of hotel IDs they own
  
  // For hotel-level users (HOTEL_OWNER, MANAGER, STAFF)
  hotelId?: mongoose.Types.ObjectId;      // Which hotel they work for
  parentUserId?: mongoose.Types.ObjectId;  // Which subscription owner created them
  
  isActive: boolean;
  lastLogin?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  emailVerified: boolean;
  emailVerificationToken?: string;
  
  // Development/testing
  isDevelopmentUser?: boolean;
}

// Define subscription limits
const SUBSCRIPTION_LIMITS = {
  [SubscriptionTier.STARTER]: {
    monthlyPrice: 49,
    maxHotels: 1,
    maxRoomsPerHotel: 50,
    maxAIResponses: 1000,
    maxUsersPerHotel: 3,
    channels: ['whatsapp', 'email'],
    features: {
      hasVoiceCalls: false,
      hasAdvancedAnalytics: false,
      hasCustomAI: false,
      hasWhiteLabel: false,
      hasAPIAccess: false,
    }
  },
  [SubscriptionTier.PROFESSIONAL]: {
    monthlyPrice: 149,
    maxHotels: 5,
    maxRoomsPerHotel: 200,
    maxAIResponses: 5000,
    maxUsersPerHotel: 10,
    channels: ['whatsapp', 'email', 'sms'],
    features: {
      hasVoiceCalls: true,
      hasAdvancedAnalytics: true,
      hasCustomAI: false,
      hasWhiteLabel: false,
      hasAPIAccess: true,
    }
  },
  [SubscriptionTier.ENTERPRISE]: {
    monthlyPrice: 499,
    maxHotels: -1, // unlimited
    maxRoomsPerHotel: -1, // unlimited
    maxAIResponses: -1, // unlimited
    maxUsersPerHotel: -1, // unlimited
    channels: ['whatsapp', 'email', 'sms', 'phone'],
    features: {
      hasVoiceCalls: true,
      hasAdvancedAnalytics: true,
      hasCustomAI: true,
      hasWhiteLabel: true,
      hasAPIAccess: true,
    }
  },
};

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.SUBSCRIPTION_OWNER,
    },
    
    // Subscription owner fields
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
        default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
      },
      cancelAtPeriodEnd: {
        type: Boolean,
        default: false,
      },
      monthlyPrice: {
        type: Number,
        default: 49, // STARTER tier default
      },
      maxHotels: {
        type: Number,
        default: 1, // STARTER tier default
      },
      trialEndsAt: {
        type: Date,
        default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
      },
    },
    ownedHotels: [{
      type: Schema.Types.ObjectId,
      ref: 'Hotel',
    }],
    
    // Hotel-level user fields
    hotelId: {
      type: Schema.Types.ObjectId,
      ref: 'Hotel',
    },
    parentUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpires: {
      type: Date,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
    },
    isDevelopmentUser: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
userSchema.index({ role: 1 });
userSchema.index({ hotelId: 1 });
userSchema.index({ parentUserId: 1 });
userSchema.index({ 'subscription.status': 1 });

// Virtual for hotel information
userSchema.virtual('hotel', {
  ref: 'Hotel',
  localField: 'hotelId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for owned hotels
userSchema.virtual('hotels', {
  ref: 'Hotel',
  localField: 'ownedHotels',
  foreignField: '_id',
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Check if subscription is active
userSchema.methods.isSubscriptionActive = function (): boolean {
  if (this.role !== UserRole.SUBSCRIPTION_OWNER || !this.subscription) {
    return false;
  }
  
  return this.subscription.status === SubscriptionStatus.ACTIVE || 
         this.subscription.status === SubscriptionStatus.TRIALING;
};

// Get subscription limits
userSchema.methods.getSubscriptionLimits = function () {
  if (this.role !== UserRole.SUBSCRIPTION_OWNER || !this.subscription) {
    return null;
  }
  
  return SUBSCRIPTION_LIMITS[this.subscription.tier];
};

export { SUBSCRIPTION_LIMITS };
export const User = mongoose.model<IUser>('User', userSchema); 