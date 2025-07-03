import express, { Request, Response, NextFunction } from 'express';
import { body, validationResult, param } from 'express-validator';
import { Room } from '../models/Room';
import { Guest } from '../models/Guest';
import { logger } from '../utils/logger';
import { createError } from '../middleware/errorHandler';
import { Hotel, HotelConfiguration } from '../models/Hotel';
const router = express.Router();

// Simple auth middleware that just passes through for now
const auth = (req: any, res: any, next: any) => next();

// Add a helper for async route handlers
function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return function (req: Request, res: Response, next: NextFunction) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// =============================================================================
// HOTEL BUSINESS ENDPOINTS (Main hotel management)
// =============================================================================

// Get all hotels from database
router.get('/', asyncHandler(async (req, res) => {
  try {
    const hotels = await Hotel.find({ isActive: true })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    
    logger.info(`Found ${hotels.length} active hotels`);
    res.json(hotels);
  } catch (error) {
    logger.error('Error fetching hotels:', error);
    res.status(500).json({ message: 'Error fetching hotels', error: (error as Error).message });
  }
}));

// Get current hotel from database
router.get('/current', asyncHandler(async (req, res) => {
  try {
    // For now, return the first active hotel
    // In production, this should be based on user context/tenant
    const hotel = await Hotel.findOne({ isActive: true })
      .populate('createdBy', 'name email');
    
    if (!hotel) {
      return res.status(404).json({ 
        message: 'No active hotel found',
        code: 'NO_HOTEL_FOUND',
        action: 'SETUP_HOTEL'
      });
    }
    
    logger.info(`Returning current hotel: ${hotel.name}`);
    res.json(hotel);
  } catch (error) {
    logger.error('Error fetching current hotel:', error);
    res.status(500).json({ message: 'Error fetching current hotel', error: (error as Error).message });
  }
}));

// Create new hotel
router.post('/', 
  [
    body('name').notEmpty().trim().withMessage('Hotel name is required'),
    body('slug').optional().trim(),
    body('description').optional().trim(),
    body('contactInfo.email').optional().isEmail().normalizeEmail(),
    body('contactInfo.phone').optional().trim(),
    body('contactInfo.website').optional().isURL(),
    body('settings.timezone').optional().trim(),
    body('settings.currency').optional().trim(),
    body('settings.language').optional().trim(),
  ],
  asyncHandler(async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Auto-generate slug if not provided
      if (!req.body.slug) {
        req.body.slug = req.body.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      }

      // Set createdBy (in production, get from authenticated user)
      const userId = (req.user && (req.user._id || req.user.id)) || '65f000000000000000000001';
      
      const hotel = new Hotel({ 
        ...req.body, 
        createdBy: userId,
        isActive: true 
      });
      
      await hotel.save();
      
      // Populate the createdBy field before returning
      await hotel.populate('createdBy', 'name email');
      
      logger.info(`Created new hotel: ${hotel.name} (${hotel._id})`);
      res.status(201).json(hotel);
    } catch (error) {
      logger.error('Error creating hotel:', error);
      if (error.code === 11000) {
        return res.status(409).json({ 
          message: 'Hotel slug already exists',
          error: 'Duplicate slug'
        });
      }
      res.status(500).json({ message: 'Error creating hotel', error: error.message });
    }
  })
);

// Update hotel
router.patch('/:id', 
  [
    param('id').isMongoId().withMessage('Invalid hotel ID'),
    body('name').optional().notEmpty().trim(),
    body('contactInfo.email').optional().isEmail().normalizeEmail(),
    body('contactInfo.website').optional().isURL(),
  ],
  asyncHandler(async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const hotel = await Hotel.findByIdAndUpdate(
        req.params.id, 
        { ...req.body, updatedAt: new Date() }, 
        { new: true, runValidators: true }
      ).populate('createdBy', 'name email');
      
      if (!hotel) {
        return res.status(404).json({ message: 'Hotel not found' });
      }
      
      logger.info(`Updated hotel: ${hotel.name} (${hotel._id})`);
      res.json(hotel);
    } catch (error) {
      logger.error('Error updating hotel:', error);
      res.status(500).json({ message: 'Error updating hotel', error: error.message });
    }
  })
);

// Get hotel by ID
router.get('/:id', 
  [param('id').isMongoId().withMessage('Invalid hotel ID')],
  asyncHandler(async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const hotel = await Hotel.findById(req.params.id)
        .populate('createdBy', 'name email');
      
      if (!hotel) {
        return res.status(404).json({ message: 'Hotel not found' });
      }
      
      res.json(hotel);
    } catch (error) {
      logger.error('Error fetching hotel:', error);
      res.status(500).json({ message: 'Error fetching hotel', error: error.message });
    }
  })
);

// =============================================================================
// HOTEL CONFIGURATION ENDPOINTS (Complex Hotel Setup)
// =============================================================================

// Get all hotel configurations
router.get('/config', asyncHandler(async (req, res) => {
  try {
    const configs = await HotelConfiguration.find({ isActive: true })
      .populate('hotelId', 'name slug')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    
    logger.info(`Found ${configs.length} active hotel configurations`);
    res.json(configs);
  } catch (error) {
    logger.error('Error fetching hotel configurations:', error);
    res.status(500).json({ message: 'Error fetching hotel configurations', error: error.message });
  }
}));

// Get current hotel configuration
router.get('/config/current', asyncHandler(async (req, res) => {
  try {
    // For now, return the first active configuration
    // In production, this should be based on user context/tenant
    const config = await HotelConfiguration.findOne({ isActive: true })
      .populate('hotelId', 'name slug')
      .populate('createdBy', 'name email');
    
    if (!config) {
      return res.status(404).json({ 
        message: 'No active hotel configuration found',
        code: 'NO_CONFIG_FOUND',
        action: 'CREATE_CONFIG'
      });
    }
    
    logger.info(`Returning current hotel configuration: ${config.name}`);
    res.json(config);
  } catch (error) {
    logger.error('Error fetching current hotel configuration:', error);
    res.status(500).json({ message: 'Error fetching current hotel configuration', error: error.message });
  }
}));

// Create new hotel configuration
router.post('/config', 
  [
    body('name').notEmpty().trim().withMessage('Configuration name is required'),
    body('hotelId').optional().isMongoId().withMessage('Invalid hotel ID'),
    body('features').isArray().withMessage('Features must be an array'),
    body('roomTypes').isArray().withMessage('Room types must be an array'),
    body('floors').isArray().withMessage('Floors must be an array'),
    body('roomTemplates').isArray().withMessage('Room templates must be an array'),
  ],
  asyncHandler(async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Get the first available hotel if none specified
      let hotelId = req.body.hotelId;
      if (!hotelId) {
        const hotel = await Hotel.findOne({ isActive: true });
        if (!hotel) {
          return res.status(400).json({ 
            message: 'No active hotel found. Please create a hotel first.',
            code: 'NO_HOTEL_FOUND'
          });
        }
        hotelId = hotel._id;
      }

      // Set createdBy (in production, get from authenticated user)
      const userId = (req.user && (req.user._id || req.user.id)) || '65f000000000000000000001';
      
      // Generate IDs for nested items if not provided
      const configData = {
        ...req.body,
        hotelId,
        createdBy: userId,
        isActive: true,
        features: req.body.features.map((f: any) => ({
          ...f,
          id: f.id || `feature-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        })),
        roomTypes: req.body.roomTypes.map((rt: any) => ({
          ...rt,
          id: rt.id || `roomtype-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        })),
        floors: req.body.floors.map((fl: any) => ({
          ...fl,
          id: fl.id || `floor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        })),
        roomTemplates: req.body.roomTemplates.map((rt: any) => ({
          ...rt,
          id: rt.id || `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        }))
      };
      
      const config = new HotelConfiguration(configData);
      await config.save();
      
      // Populate the references before returning
      await config.populate('hotelId', 'name slug');
      await config.populate('createdBy', 'name email');
      
      logger.info(`Created new hotel configuration: ${config.name} (${config._id})`);
      res.status(201).json(config);
    } catch (error) {
      logger.error('Error creating hotel configuration:', error);
      res.status(500).json({ message: 'Error creating hotel configuration', error: error.message });
    }
  })
);

// Update hotel configuration
router.patch('/config/:id', 
  [
    param('id').isMongoId().withMessage('Invalid configuration ID'),
    body('name').optional().notEmpty().trim(),
    body('features').optional().isArray(),
    body('roomTypes').optional().isArray(),
    body('floors').optional().isArray(),
    body('roomTemplates').optional().isArray(),
  ],
  asyncHandler(async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Update nested item IDs if needed
      const updateData = { ...req.body };
      if (updateData.features) {
        updateData.features = updateData.features.map((f: any) => ({
          ...f,
          id: f.id || `feature-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        }));
      }
      if (updateData.roomTypes) {
        updateData.roomTypes = updateData.roomTypes.map((rt: any) => ({
          ...rt,
          id: rt.id || `roomtype-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        }));
      }

      const config = await HotelConfiguration.findByIdAndUpdate(
        req.params.id, 
        { ...updateData, updatedAt: new Date() }, 
        { new: true, runValidators: true }
      )
      .populate('hotelId', 'name slug')
      .populate('createdBy', 'name email');
      
      if (!config) {
        return res.status(404).json({ message: 'Hotel configuration not found' });
      }
      
      logger.info(`Updated hotel configuration: ${config.name} (${config._id})`);
      res.json(config);
    } catch (error) {
      logger.error('Error updating hotel configuration:', error);
      res.status(500).json({ message: 'Error updating hotel configuration', error: error.message });
    }
  })
);

// Get hotel configuration by ID
router.get('/config/:id', 
  [param('id').isMongoId().withMessage('Invalid configuration ID')],
  asyncHandler(async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const config = await HotelConfiguration.findById(req.params.id)
        .populate('hotelId', 'name slug')
        .populate('createdBy', 'name email');
      
      if (!config) {
        return res.status(404).json({ message: 'Hotel configuration not found' });
      }
      
      res.json(config);
    } catch (error) {
      logger.error('Error fetching hotel configuration:', error);
      res.status(500).json({ message: 'Error fetching hotel configuration', error: error.message });
    }
  })
);

// =============================================================================
// ROOM MANAGEMENT ENDPOINTS
// =============================================================================

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

// Get complete dashboard data (hotel + room types + stats)
router.get('/:id/dashboard-data', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Get hotel
  const hotel = await Hotel.findById(id);
  if (!hotel) {
    return res.status(404).json({ message: 'Hotel not found' });
  }

  // Get room types for this hotel
  const { RoomType } = require('../models/RoomType');
  const roomTypes = await RoomType.find({ hotelId: id, isActive: true }).sort({ name: 1 });

  // Get rooms for this hotel
  const rooms = await Room.find({ hotelId: id });
  
  // Calculate stats
  const stats = {
    totalRooms: rooms.length,
    availableRooms: rooms.filter(r => r.status === 'available').length,
    occupiedRooms: rooms.filter(r => r.status === 'occupied').length,
    maintenanceRooms: rooms.filter(r => r.status === 'maintenance').length,
    cleaningRooms: rooms.filter(r => r.status === 'cleaning').length,
    reservedRooms: rooms.filter(r => ['reserved', 'partially-reserved'].includes(r.status)).length,
    byType: {}
  };

  // Calculate rooms by type
  rooms.forEach(room => {
    const typeId = room.roomTypeId || room.type || 'unknown';
    stats.byType[typeId] = (stats.byType[typeId] || 0) + 1;
  });

  // Calculate occupancy rate
  stats.occupancyRate = stats.totalRooms > 0 ? stats.occupiedRooms / stats.totalRooms : 0;

  res.json({
    hotel,
    roomTypes,
    stats
  });
}));

// Get dashboard stats (legacy endpoint)
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