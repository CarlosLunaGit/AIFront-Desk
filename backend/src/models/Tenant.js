"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TIER_PRICING = exports.TIER_FEATURES = exports.Tenant = exports.SubscriptionStatus = exports.SubscriptionTier = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var SubscriptionTier;
(function (SubscriptionTier) {
    SubscriptionTier["BASIC"] = "basic";
    SubscriptionTier["PROFESSIONAL"] = "professional";
    SubscriptionTier["ENTERPRISE"] = "enterprise";
})(SubscriptionTier || (exports.SubscriptionTier = SubscriptionTier = {}));
var SubscriptionStatus;
(function (SubscriptionStatus) {
    SubscriptionStatus["ACTIVE"] = "active";
    SubscriptionStatus["CANCELED"] = "canceled";
    SubscriptionStatus["PAST_DUE"] = "past_due";
    SubscriptionStatus["UNPAID"] = "unpaid";
    SubscriptionStatus["TRIALING"] = "trialing";
})(SubscriptionStatus || (exports.SubscriptionStatus = SubscriptionStatus = {}));
// Define feature limits for each tier
const TIER_FEATURES = {
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
exports.TIER_FEATURES = TIER_FEATURES;
const TIER_PRICING = {
    [SubscriptionTier.BASIC]: 29,
    [SubscriptionTier.PROFESSIONAL]: 99,
    [SubscriptionTier.ENTERPRISE]: 299,
};
exports.TIER_PRICING = TIER_PRICING;
const tenantSchema = new mongoose_1.Schema({
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
            type: mongoose_1.Schema.Types.Mixed,
            default: function () {
                var _a;
                return TIER_FEATURES[((_a = this.subscription) === null || _a === void 0 ? void 0 : _a.tier) || SubscriptionTier.BASIC];
            },
        },
        monthlyPrice: {
            type: Number,
            default: function () {
                var _a;
                return TIER_PRICING[((_a = this.subscription) === null || _a === void 0 ? void 0 : _a.tier) || SubscriptionTier.BASIC];
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
        type: mongoose_1.Schema.Types.ObjectId,
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
}, {
    timestamps: true,
});
// Indexes
tenantSchema.index({ slug: 1 });
tenantSchema.index({ 'subscription.tier': 1 });
tenantSchema.index({ 'subscription.status': 1 });
tenantSchema.index({ createdBy: 1 });
// Methods
tenantSchema.methods.canUseFeature = function (feature) {
    return this.subscription.features[feature] === true || this.subscription.features[feature] > 0;
};
tenantSchema.methods.isWithinLimits = function (resource) {
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
tenantSchema.methods.updateSubscription = function (tier) {
    this.subscription.tier = tier;
    this.subscription.features = TIER_FEATURES[tier];
    this.subscription.monthlyPrice = TIER_PRICING[tier];
    return this.save();
};
// Static methods
tenantSchema.statics.getTierFeatures = function (tier) {
    return TIER_FEATURES[tier];
};
tenantSchema.statics.getTierPrice = function (tier) {
    return TIER_PRICING[tier];
};
exports.Tenant = mongoose_1.default.model('Tenant', tenantSchema);
