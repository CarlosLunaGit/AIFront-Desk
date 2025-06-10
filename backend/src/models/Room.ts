import mongoose, { Document, Schema } from 'mongoose';

export enum RoomType {
  SINGLE = 'single',
  DOUBLE = 'double',
  SUITE = 'suite',
  DELUXE = 'deluxe'
}

export enum RoomStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  MAINTENANCE = 'maintenance',
  CLEANING = 'cleaning'
}

export interface IRoom extends Document {
  number: string;
  type: RoomType;
  status: RoomStatus;
  price: number;
  capacity: number;
  amenities: string[];
  description: string;
  hotelId: mongoose.Types.ObjectId;
  currentGuestId?: mongoose.Types.ObjectId;
  checkInDate?: Date;
  checkOutDate?: Date;
  lastCleaned?: Date;
  notes?: string;
}

const roomSchema = new Schema<IRoom>(
  {
    number: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    type: {
      type: String,
      enum: Object.values(RoomType),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(RoomStatus),
      default: RoomStatus.AVAILABLE,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    amenities: [{
      type: String,
      trim: true,
    }],
    description: {
      type: String,
      trim: true,
    },
    hotelId: {
      type: Schema.Types.ObjectId,
      ref: 'Hotel',
      required: true,
    },
    currentGuestId: {
      type: Schema.Types.ObjectId,
      ref: 'Guest',
    },
    checkInDate: {
      type: Date,
    },
    checkOutDate: {
      type: Date,
    },
    lastCleaned: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient room availability queries
roomSchema.index({ hotelId: 1, status: 1, type: 1 });

export const Room = mongoose.model<IRoom>('Room', roomSchema); 