import express, { Request, Response } from 'express';
import { body, validationResult, param } from 'express-validator';
import { Room } from '../models/Room';
import { Guest } from '../models/Guest';
import { logger } from '../utils/logger';
import { createError } from '../middleware/errorHandler';
import { Hotel } from '../models/Hotel';
const router = express.Router();

// Simple auth middleware that just passes through for now
const auth = (req: any, res: any, next: any) => next();

// Get all rooms
router.get('/rooms', auth, async (req: Request, res: Response) => {
  try {
    const rooms = await Room.find().populate('assignedGuests');
    res.json(rooms);
  } catch (error) {
    logger.error('Error fetching rooms:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create room
router.post('/rooms', 
  auth,
  [
    body('number').notEmpty().trim(),
    body('typeId').notEmpty(),
    body('capacity').isInt({ min: 1 }),
    body('rate').isNumeric(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const room = new Room(req.body);
      await room.save();
      res.status(201).json(room);
    } catch (error) {
      logger.error('Error creating room:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Update room
router.patch('/rooms/:id',
  auth,
  [param('id').isMongoId()],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const room = await Room.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );

      if (!room) {
        return res.status(404).json({ message: 'Room not found' });
      }

      res.json(room);
    } catch (error) {
      logger.error('Error updating room:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Delete room
router.delete('/rooms/:id',
  auth,
  [param('id').isMongoId()],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const room = await Room.findByIdAndDelete(req.params.id);
      if (!room) {
        return res.status(404).json({ message: 'Room not found' });
      }

      res.json({ message: 'Room deleted successfully' });
    } catch (error) {
      logger.error('Error deleting room:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Get all guests
router.get('/guests', auth, async (req: Request, res: Response) => {
  try {
    const guests = await Guest.find().populate('roomId');
    res.json(guests);
  } catch (error) {
    logger.error('Error fetching guests:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create guest
router.post('/guests',
  auth,
  [
    body('name').notEmpty().trim(),
    body('email').isEmail().normalizeEmail(),
    body('phone').notEmpty().trim(),
    body('roomId').isMongoId(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const guest = new Guest(req.body);
      await guest.save();
      res.status(201).json(guest);
    } catch (error) {
      logger.error('Error creating guest:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Update guest
router.patch('/guests/:id',
  auth,
  [param('id').isMongoId()],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const guest = await Guest.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );

      if (!guest) {
        return res.status(404).json({ message: 'Guest not found' });
      }

      res.json(guest);
    } catch (error) {
      logger.error('Error updating guest:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Delete guest
router.delete('/guests/:id',
  auth,
  [param('id').isMongoId()],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const guest = await Guest.findByIdAndDelete(req.params.id);
      if (!guest) {
        return res.status(404).json({ message: 'Guest not found' });
      }

      res.json({ message: 'Guest deleted successfully' });
    } catch (error) {
      logger.error('Error deleting guest:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Get dashboard stats
router.get('/stats', auth, async (req: Request, res: Response) => {
  try {
    const totalRooms = await Room.countDocuments();
    const availableRooms = await Room.countDocuments({ status: 'available' });
    const totalGuests = await Guest.countDocuments();
    const checkedInGuests = await Guest.countDocuments({ status: 'checked-in' });

    const stats = {
      totalRooms,
      availableRooms,
      occupiedRooms: totalRooms - availableRooms,
      totalGuests,
      checkedInGuests,
      occupancyRate: totalRooms > 0 ? ((totalRooms - availableRooms) / totalRooms) * 100 : 0,
    };

    res.json(stats);
  } catch (error) {
    logger.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a helper for async route handlers
function asyncHandler(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Add a type for req.user (quick fix for now)
// In production, use proper authentication middleware to populate req.user

// Get all hotels from database
router.get('/', asyncHandler(async (req, res) => {
  try {
    const hotels = await Hotel.find({ isActive: true });
    res.json(hotels);
  } catch (error) {
    logger.error('Error fetching hotels:', error);
    res.status(500).json({ message: 'Error fetching hotels' });
  }
}));

// Get current hotel from database
router.get('/current', asyncHandler(async (req, res) => {
  try {
    // For now, return the first active hotel
    // In production, this should be based on user context
    const hotel = await Hotel.findOne({ isActive: true });
    if (!hotel) {
      return res.status(404).json({ message: 'No active hotel found' });
    }
    res.json(hotel);
  } catch (error) {
    logger.error('Error fetching current hotel:', error);
    res.status(500).json({ message: 'Error fetching current hotel' });
  }
}));

router.post('/', asyncHandler(async (req, res) => {
  const userId = (req.user && (req.user._id || req.user.id)) || undefined;
  const hotel = new Hotel({ ...req.body, owner: userId });
  await hotel.save();
  res.status(201).json(hotel);
}));

router.patch('/:id', asyncHandler(async (req, res) => {
  const hotel = await Hotel.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!hotel) return res.status(404).json({ message: 'Hotel config not found' });
  res.json(hotel);
}));

export default router; 