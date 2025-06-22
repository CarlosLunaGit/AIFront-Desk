import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { User, UserRole, SubscriptionStatus } from '../models/User';
import { Hotel } from '../models/Hotel';
import { generateToken, authenticate, AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import { SubscriptionTier } from '../models/SubscriptionTier';

const router = express.Router();

// Register endpoint
router.post('/register', 
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').trim().isLength({ min: 1 }),
    body('hotelName').optional().trim().isLength({ min: 1 }),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, name, hotelName } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // First create a basic hotel if hotel name provided
      let hotel = null;
      if (hotelName) {
        const slug = hotelName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
        
        hotel = new Hotel({
          name: hotelName,
          slug: `${slug}-${Date.now()}`,
          subscription: {
            tier: SubscriptionTier.STARTER,
            status: 'trialing',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            cancelAtPeriodEnd: false,
            features: {
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
            monthlyPrice: 29,
          },
          settings: {
            timezone: 'UTC',
            currency: 'USD',
            language: 'en',
            checkInTime: '15:00',
            checkOutTime: '11:00',
          },
          isActive: true,
          usage: {
            currentRooms: 0,
            aiResponsesThisMonth: 0,
            usersCount: 1,
            lastReset: new Date(),
          },
        });

        await hotel.save();
      }

      // Create user
      const user = new User({
        email,
        password,
        name,
        role: UserRole.SUBSCRIPTION_OWNER,
        hotelId: hotel?._id,
        emailVerified: false,
      });

      // Set createdBy after user is saved
      if (hotel) {
        hotel.createdBy = user._id;
        await hotel.save();
      }

      await user.save();

      // Generate JWT
      const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '7d' }
      );

      logger.info('User registered successfully', { 
        userId: user._id, 
        email: user.email,
        role: user.role,
        hotelCreated: !!hotel 
      });

      res.status(201).json({
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          hotelId: user.hotelId,
          hotel: hotel ? {
            id: hotel._id,
            name: hotel.name,
            slug: hotel.slug,
          } : null,
        },
      });
    } catch (error) {
      logger.error('Registration error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Login endpoint
router.post('/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').exists(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ email }).populate('hotel');
      if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      // Check password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(400).json({ message: 'Account is deactivated' });
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate JWT
      const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '7d' }
      );

      logger.info('User logged in successfully', { 
        userId: user._id, 
        email: user.email,
        role: user.role 
      });

      res.json({
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          hotelId: user.hotelId,
          hotel: user.hotel,
          lastLogin: user.lastLogin,
        },
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Get current user
router.get('/me', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
    const user = await User.findById(decoded.userId)
      .select('-password')
      .populate('hotel', 'name slug isActive subscription.tier subscription.status');
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        hotelId: user.hotelId,
        hotel: user.hotel,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    logger.error('Get user error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
});

// Create development user (for testing)
router.post('/create-dev-user', async (req: Request, res: Response) => {
  try {
    logger.info('Create dev user endpoint called');

    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ message: 'Not allowed in production' });
    }

    const devEmail = 'dev@aifront-desk.com';
    
    // Check if dev user already exists
    const existingUser = await User.findOne({ email: devEmail });
    if (existingUser) {
      return res.status(400).json({ 
        message: 'Development user already exists',
        user: {
          email: existingUser.email,
          role: existingUser.role
        }
      });
    }

    // Create development user with subscription
    const devUser = new User({
      email: devEmail,
      password: 'dev123456',
      name: 'Development User',
      role: UserRole.SUBSCRIPTION_OWNER,
      emailVerified: true,
      isDevelopmentUser: true,
      subscription: {
        tier: SubscriptionTier.ENTERPRISE,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        cancelAtPeriodEnd: false,
        monthlyPrice: 0,
        maxHotels: -1, // unlimited
      },
      ownedHotels: [],
    });

    await devUser.save();

    // After user is created:
    const allHotels = await Hotel.find({});
    devUser.ownedHotels = allHotels.map(h => h._id);
    await devUser.save();
    // Set createdBy for all hotels if not already set
    for (const hotel of allHotels) {
      if (!hotel.createdBy || hotel.createdBy.toString() !== devUser._id.toString()) {
        hotel.createdBy = devUser._id;
        await hotel.save();
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: devUser._id },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    logger.info('Development user created successfully', {
      userId: devUser._id,
      email: devUser.email,
    });

    res.status(201).json({
      message: 'Development user created successfully',
      user: {
        id: devUser._id,
        email: devUser.email,
        name: devUser.name,
        role: devUser.role,
        subscription: devUser.subscription,
      },
      token,
      credentials: {
        email: devEmail,
        password: 'dev123456',
      },
    });
  } catch (error) {
    logger.error('Create dev user error:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 