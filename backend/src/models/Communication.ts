import mongoose, { Document, Schema } from 'mongoose';

export enum MessageType {
  INBOUND = 'inbound',
  OUTBOUND = 'outbound'
}

export enum MessageStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed'
}

export enum MessageChannel {
  WHATSAPP = 'whatsapp',
  SMS = 'sms',
  EMAIL = 'email'
}

export interface ICommunication extends Document {
  hotelId: mongoose.Types.ObjectId;
  guestId?: mongoose.Types.ObjectId;
  type: MessageType;
  channel: MessageChannel;
  status: MessageStatus;
  from: string;
  to: string;
  content: string;
  mediaUrl?: string;
  metadata?: Record<string, any>;
  aiResponse?: boolean;
  templateId?: string;
  error?: string;
  scheduledFor?: Date;
  deliveredAt?: Date;
  readAt?: Date;
}

const communicationSchema = new Schema<ICommunication>(
  {
    hotelId: {
      type: Schema.Types.ObjectId,
      ref: 'Hotel',
      required: true,
    },
    guestId: {
      type: Schema.Types.ObjectId,
      ref: 'Guest',
    },
    type: {
      type: String,
      enum: Object.values(MessageType),
      required: true,
    },
    channel: {
      type: String,
      enum: Object.values(MessageChannel),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(MessageStatus),
      default: MessageStatus.PENDING,
    },
    from: {
      type: String,
      required: true,
    },
    to: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    mediaUrl: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    aiResponse: {
      type: Boolean,
      default: false,
    },
    templateId: {
      type: String,
    },
    error: {
      type: String,
    },
    scheduledFor: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
communicationSchema.index({ hotelId: 1, createdAt: -1 });
communicationSchema.index({ hotelId: 1, guestId: 1, createdAt: -1 });
communicationSchema.index({ status: 1, scheduledFor: 1 });

export const Communication = mongoose.model<ICommunication>('Communication', communicationSchema); 