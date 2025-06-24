import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User } from '../models/User';
import { Hotel, SubscriptionStatus } from '../models/Hotel';
import { logger } from '../utils/logger';

// Extend Express Request type to include user and hotel
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
    hotelId: string;
  };
  hotel?: {
    id: string;
    name: string;
    slug: string;
    subscription: any;
    settings: any;
    usage: any;
  };
}

// JWT token payload interface
interface TokenPayload {
  userId: string;
  hotelId: string;
  role: string;
  iat: number;
  exp: number;
}

// Basic authentication middleware
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  try {
    const token = extractToken(req);
    
    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    // Verify JWT token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'fallback-secret'
    ) as TokenPayload;

    // Find user
    const user = await User.findById(decoded.userId)
      .select('-password')
      .populate('hotelId');

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid or inactive user' });
    }

    // Find hotel
    const hotel = await Hotel.findById(decoded.hotelId);
    
    if (!hotel || !hotel.isActive) {
      return res.status(401).json({ message: 'Invalid or inactive hotel' });
    }

    // Attach user and hotel to request
    req.user = {
      id: (user._id as mongoose.Types.ObjectId).toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      hotelId: (hotel._id as mongoose.Types.ObjectId).toString(),
    };

    req.hotel = {
      id: (hotel._id as mongoose.Types.ObjectId).toString(),
      name: hotel.name,
      slug: hotel.slug,
      subscription: hotel.subscription,
      settings: hotel.settings,
      usage: hotel.usage,
    };

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Subscription validation middleware
export const requireActiveSubscription = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void | Response => {
  if (!req.hotel) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const { subscription } = req.hotel;
  
  // Check if subscription is active
  if (subscription.status !== SubscriptionStatus.ACTIVE && 
      subscription.status !== SubscriptionStatus.TRIALING) {
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

// Feature access middleware factory
export const requireFeature = (feature: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void | Response => {
    if (!req.hotel) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { subscription } = req.hotel;
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

// Usage limit middleware factory
export const checkUsageLimit = (resource: 'rooms' | 'aiResponses' | 'users') => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void | Response> => {
    if (!req.hotel) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    try {
      // Get current usage from database
      const hotel = await Hotel.findById(req.hotel.id);
      
      if (!hotel) {
        return res.status(404).json({ message: 'Hotel not found' });
      }

      // Check if within limits
      const withinLimits = hotel.isWithinLimits(resource);
      
      if (!withinLimits) {
        const features = hotel.subscription.features;
        let limit;
        let current;

        switch (resource) {
          case 'rooms':
            limit = features.maxRooms;
            current = hotel.usage.currentRooms;
            break;
          case 'aiResponses':
            limit = features.maxAIResponses;
            current = hotel.usage.aiResponsesThisMonth;
            break;
          case 'users':
            limit = features.maxUsers;
            current = hotel.usage.usersCount;
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
    } catch (error) {
      logger.error('Usage limit check error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  };
};

// Role-based access control
export const requireRole = (roles: string | string[]) => {
  const requiredRoles = Array.isArray(roles) ? roles : [roles];
  
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void | Response => {
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

// Utility function to extract token from request
const extractToken = (req: Request): string | null => {
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
export const generateToken = (userId: string, hotelId: string, role: string): string => {
  return jwt.sign(
    { userId, hotelId, role },
    process.env.JWT_SECRET || 'fallback-secret',
    { expiresIn: '7d' }
  );
};

// Middleware to attach user info to response (for frontend)
export const attachUserInfo = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (req.user && req.hotel) {
    res.locals.user = req.user;
    res.locals.hotel = {
      ...req.hotel,
      // Only send safe hotel info to frontend
      subscription: {
        tier: req.hotel.subscription.tier,
        status: req.hotel.subscription.status,
        features: req.hotel.subscription.features,
        currentPeriodEnd: req.hotel.subscription.currentPeriodEnd,
      },
    };
  }
  next();
};

// Export authenticate as auth for backward compatibility
export const auth = authenticate; 