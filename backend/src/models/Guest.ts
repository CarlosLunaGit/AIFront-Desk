import mongoose, { Document, Schema } from 'mongoose';

export enum GuestStatus {
  BOOKED = 'booked',
  CHECKED_IN = 'checked-in',
  CHECKED_OUT = 'checked-out'
}

export interface IGuest extends Document {
  name: string;
  email: string;
  phone: string;
  status: GuestStatus;
  roomId: mongoose.Types.ObjectId;
  reservationStart: Date;
  reservationEnd: Date;
  checkIn?: Date;
  checkOut?: Date;
  hotelId: mongoose.Types.ObjectId;
  keepOpen: boolean;
}

const guestSchema = new Schema<IGuest>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(GuestStatus),
      default: GuestStatus.BOOKED,
    },
    roomId: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
    },
    reservationStart: {
      type: Date,
      required: true,
    },
    reservationEnd: {
      type: Date,
      required: true,
    },
    checkIn: {
      type: Date,
    },
    checkOut: {
      type: Date,
    },
    hotelId: {
      type: Schema.Types.ObjectId,
      ref: 'Hotel',
      required: true,
    },
    keepOpen: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
guestSchema.index({ hotelId: 1, status: 1 });
guestSchema.index({ roomId: 1 });
guestSchema.index({ email: 1 });

export const Guest = mongoose.model<IGuest>('Guest', guestSchema); 