import mongoose, { Document, Schema } from 'mongoose';

export interface IRoomType extends Document {
  name: string;
  description?: string;
  baseRate: number;
  capacity: number;
  features: string[]; // Array of feature IDs or names
  amenities: string[]; // Array of amenity IDs or names
  hotelId: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RoomTypeSchema = new Schema<IRoomType>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  baseRate: {
    type: Number,
    required: true,
    min: 0
  },
  capacity: {
    type: Number,
    required: true,
    min: 1
  },
  features: [{
    type: String,
    trim: true
  }],
  amenities: [{
    type: String,
    trim: true
  }],
  hotelId: {
    type: Schema.Types.ObjectId,
    ref: 'Hotel',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
RoomTypeSchema.index({ hotelId: 1, isActive: 1 });
RoomTypeSchema.index({ hotelId: 1, name: 1 }, { unique: true });

export const RoomType = mongoose.model<IRoomType>('RoomType', RoomTypeSchema); 