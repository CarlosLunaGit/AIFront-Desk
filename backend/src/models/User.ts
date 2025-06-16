import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export enum UserRole {
  OWNER = 'owner',
  MANAGER = 'manager',
  STAFF = 'staff',
  ADMIN = 'admin'
}

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  tenantId: mongoose.Types.ObjectId;
  isActive: boolean;
  lastLogin?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  emailVerified: boolean;
  emailVerificationToken?: string;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.OWNER,
    },
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpires: {
      type: Date,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
userSchema.index({ email: 1 });
userSchema.index({ tenantId: 1 });
userSchema.index({ tenantId: 1, role: 1 });

// Virtual for tenant information
userSchema.virtual('tenant', {
  ref: 'Tenant',
  localField: 'tenantId',
  foreignField: '_id',
  justOne: true,
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser>('User', userSchema); 