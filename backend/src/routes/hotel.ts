import express, { Request, Response } from 'express';
import { body, validationResult, param } from 'express-validator';
import { Room } from '../models/Room';
import { Guest } from '../models/Guest';
import { logger } from '../utils/logger';
import { createError } from '../middleware/errorHandler';

const router = express.Router();

// Authentication middleware (simplified for now)
const auth = (req: Request, res: Response, next: any) => {
  // TODO: Implement proper JWT authentication
  next();
};

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

export default router; 