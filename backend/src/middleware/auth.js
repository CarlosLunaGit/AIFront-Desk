"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = exports.attachUserInfo = exports.generateToken = exports.requireRole = exports.checkUsageLimit = exports.requireFeature = exports.requireActiveSubscription = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const Tenant_1 = require("../models/Tenant");
const logger_1 = require("../utils/logger");
// Basic authentication middleware
const authenticate = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = extractToken(req);
        if (!token) {
            return res.status(401).json({ message: 'Access token required' });
        }
        // Verify JWT token
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        // Find user
        const user = yield User_1.User.findById(decoded.userId)
            .select('-password')
            .populate('tenantId');
        if (!user || !user.isActive) {
            return res.status(401).json({ message: 'Invalid or inactive user' });
        }
        // Find tenant
        const tenant = yield Tenant_1.Tenant.findById(decoded.tenantId);
        if (!tenant || !tenant.isActive) {
            return res.status(401).json({ message: 'Invalid or inactive tenant' });
        }
        // Attach user and tenant to request
        req.user = {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            tenantId: tenant._id.toString(),
        };
        req.tenant = {
            id: tenant._id.toString(),
            name: tenant.name,
            slug: tenant.slug,
            subscription: tenant.subscription,
            settings: tenant.settings,
            usage: tenant.usage,
        };
        next();
    }
    catch (error) {
        logger_1.logger.error('Authentication error:', error);
        return res.status(401).json({ message: 'Invalid token' });
    }
});
exports.authenticate = authenticate;
// Subscription validation middleware
const requireActiveSubscription = (req, res, next) => {
    if (!req.tenant) {
        return res.status(401).json({ message: 'Authentication required' });
    }
    const { subscription } = req.tenant;
    // Check if subscription is active
    if (subscription.status !== Tenant_1.SubscriptionStatus.ACTIVE &&
        subscription.status !== Tenant_1.SubscriptionStatus.TRIALING) {
        return res.status(403).json({
            message: 'Active subscription required',
            subscriptionStatus: subscription.status,
            action: 'update_payment_method'
        });
    }
    // Check if subscription has expired
    if (new Date() > new Date(subscription.currentPeriodEnd)) {
        return res.status(403).json({
            message: 'Subscription expired',
            expiredAt: subscription.currentPeriodEnd,
            action: 'renew_subscription'
        });
    }
    next();
};
exports.requireActiveSubscription = requireActiveSubscription;
// Feature access middleware factory
const requireFeature = (feature) => {
    return (req, res, next) => {
        if (!req.tenant) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        const { subscription } = req.tenant;
        const features = subscription.features;
        // Check feature access
        let hasAccess = false;
        switch (feature) {
            case 'voice_calls':
                hasAccess = features.hasVoiceCalls;
                break;
            case 'advanced_analytics':
                hasAccess = features.hasAdvancedAnalytics;
                break;
            case 'custom_ai':
                hasAccess = features.hasCustomAI;
                break;
            case 'white_label':
                hasAccess = features.hasWhiteLabel;
                break;
            case 'api_access':
                hasAccess = features.hasAPIAccess;
                break;
            case 'sms':
                hasAccess = features.channels.includes('sms');
                break;
            case 'phone':
                hasAccess = features.channels.includes('phone');
                break;
            default:
                hasAccess = false;
        }
        if (!hasAccess) {
            return res.status(403).json({
                message: `Feature "${feature}" not available in current plan`,
                currentTier: subscription.tier,
                feature,
                action: 'upgrade_subscription'
            });
        }
        next();
    };
};
exports.requireFeature = requireFeature;
// Usage limit middleware factory
const checkUsageLimit = (resource) => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        if (!req.tenant) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        try {
            // Get current usage from database
            const tenant = yield Tenant_1.Tenant.findById(req.tenant.id);
            if (!tenant) {
                return res.status(404).json({ message: 'Tenant not found' });
            }
            // Check if within limits
            const withinLimits = tenant.isWithinLimits(resource);
            if (!withinLimits) {
                const features = tenant.subscription.features;
                let limit;
                let current;
                switch (resource) {
                    case 'rooms':
                        limit = features.maxRooms;
                        current = tenant.usage.currentRooms;
                        break;
                    case 'aiResponses':
                        limit = features.maxAIResponses;
                        current = tenant.usage.aiResponsesThisMonth;
                        break;
                    case 'users':
                        limit = features.maxUsers;
                        current = tenant.usage.usersCount;
                        break;
                }
                return res.status(403).json({
                    message: `${resource} limit reached`,
                    limit: limit === -1 ? 'unlimited' : limit,
                    current,
                    resource,
                    action: 'upgrade_subscription'
                });
            }
            next();
        }
        catch (error) {
            logger_1.logger.error('Usage limit check error:', error);
            return res.status(500).json({ message: 'Server error' });
        }
    });
};
exports.checkUsageLimit = checkUsageLimit;
// Role-based access control
const requireRole = (roles) => {
    const requiredRoles = Array.isArray(roles) ? roles : [roles];
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        if (!requiredRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: 'Insufficient permissions',
                required: requiredRoles,
                current: req.user.role
            });
        }
        next();
    };
};
exports.requireRole = requireRole;
// Utility function to extract token from request
const extractToken = (req) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.slice(7);
    }
    // Check for token in cookies (for web app)
    if (req.cookies && req.cookies.token) {
        return req.cookies.token;
    }
    return null;
};
// Generate JWT token
const generateToken = (userId, tenantId, role) => {
    return jsonwebtoken_1.default.sign({ userId, tenantId, role }, process.env.JWT_SECRET || 'fallback-secret', { expiresIn: '7d' });
};
exports.generateToken = generateToken;
// Middleware to attach user info to response (for frontend)
const attachUserInfo = (req, res, next) => {
    if (req.user && req.tenant) {
        res.locals.user = req.user;
        res.locals.tenant = Object.assign(Object.assign({}, req.tenant), { 
            // Only send safe tenant info to frontend
            subscription: {
                tier: req.tenant.subscription.tier,
                status: req.tenant.subscription.status,
                features: req.tenant.subscription.features,
                currentPeriodEnd: req.tenant.subscription.currentPeriodEnd,
            } });
    }
    next();
};
exports.attachUserInfo = attachUserInfo;
// Export authenticate as auth for backward compatibility
exports.auth = exports.authenticate;
