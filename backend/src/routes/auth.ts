import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import { User, UserRole } from '../models/User';
import { Tenant, SubscriptionTier } from '../models/Tenant';
import { generateToken, authenticate, AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();

// Register endpoint
router.post('/register', 
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').trim().isLength({ min: 1 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, name } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = new User({
        email,
        password: hashedPassword,
        name,
      });

      await user.save();

      // Generate JWT
      const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '7d' }
      );

      res.status(201).json({
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
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
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      // Check password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      // Generate JWT
      const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '7d' }
      );

      res.json({
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
        },
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Get current user
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    logger.error('Get user error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
});

export default router; 