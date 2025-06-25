import express, { Request, Response, NextFunction } from 'express';
import { RoomType } from '../models/RoomType';
import { Hotel } from '../models/Hotel';

const router = express.Router();

// Simple auth middleware that just passes through for now
const auth = (req: any, res: any, next: any) => next();

// Add a helper for async route handlers
function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return function (req: Request, res: Response, next: NextFunction) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Get all room types for a hotel
router.get('/hotel/:hotelId/room-types', auth, asyncHandler(async (req, res) => {
  const { hotelId } = req.params;
  
  // Verify hotel exists and user has access
  const hotel = await Hotel.findById(hotelId);
  if (!hotel) {
    return res.status(404).json({ message: 'Hotel not found' });
  }
  
  // Skip user check for now (will implement proper auth later)
  // if (hotel.createdBy.toString() !== req.user.id) {
  //   return res.status(403).json({ message: 'Access denied' });
  // }

  const roomTypes = await RoomType.find({ 
    hotelId, 
    isActive: true 
  }).sort({ name: 1 });

  res.json(roomTypes);
}));

// Create a new room type
router.post('/hotel/:hotelId/room-types', auth, asyncHandler(async (req, res) => {
  const { hotelId } = req.params;
  const { name, description, baseRate, capacity, features, amenities } = req.body;
  
  // Verify hotel exists and user has access
  const hotel = await Hotel.findById(hotelId);
  if (!hotel) {
    return res.status(404).json({ message: 'Hotel not found' });
  }
  
  // Skip user check for now (will implement proper auth later)
  // if (hotel.createdBy.toString() !== req.user.id) {
  //   return res.status(403).json({ message: 'Access denied' });
  // }

  // Check if room type name already exists for this hotel
  const existingRoomType = await RoomType.findOne({ 
    hotelId, 
    name, 
    isActive: true 
  });
  
  if (existingRoomType) {
    return res.status(400).json({ message: 'Room type with this name already exists' });
  }

  const roomType = new RoomType({
    name,
    description,
    baseRate,
    capacity,
    features: features || [],
    amenities: amenities || [],
    hotelId
  });

  await roomType.save();
  res.status(201).json(roomType);
}));

// Update a room type
router.patch('/hotel/:hotelId/room-types/:roomTypeId', auth, asyncHandler(async (req, res) => {
  const { hotelId, roomTypeId } = req.params;
  const updates = req.body;
  
  // Verify hotel exists and user has access
  const hotel = await Hotel.findById(hotelId);
  if (!hotel) {
    return res.status(404).json({ message: 'Hotel not found' });
  }
  
  // Skip user check for now (will implement proper auth later)
  // if (hotel.createdBy.toString() !== req.user.id) {
  //   return res.status(403).json({ message: 'Access denied' });
  // }

  const roomType = await RoomType.findOneAndUpdate(
    { _id: roomTypeId, hotelId, isActive: true },
    updates,
    { new: true, runValidators: true }
  );

  if (!roomType) {
    return res.status(404).json({ message: 'Room type not found' });
  }

  res.json(roomType);
}));

// Delete a room type (soft delete)
router.delete('/hotel/:hotelId/room-types/:roomTypeId', auth, asyncHandler(async (req, res) => {
  const { hotelId, roomTypeId } = req.params;
  
  // Verify hotel exists and user has access
  const hotel = await Hotel.findById(hotelId);
  if (!hotel) {
    return res.status(404).json({ message: 'Hotel not found' });
  }
  
  // Skip user check for now (will implement proper auth later)
  // if (hotel.createdBy.toString() !== req.user.id) {
  //   return res.status(403).json({ message: 'Access denied' });
  // }

  const roomType = await RoomType.findOneAndUpdate(
    { _id: roomTypeId, hotelId },
    { isActive: false },
    { new: true }
  );

  if (!roomType) {
    return res.status(404).json({ message: 'Room type not found' });
  }

  res.json({ message: 'Room type deleted successfully' });
}));

export default router; 