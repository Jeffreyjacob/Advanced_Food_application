import { model, Schema } from 'mongoose';
import { IBaseUser } from '../interface/models/models';
import { RoleEnums } from '../interface/enums/enums';
import bcrypt from 'bcryptjs';
import { GenerateToken } from '../utils/token.utils';

const BaseUserSchema: Schema<IBaseUser> = new Schema(
  {
    email: {
      type: String,
      trim: true,
      unique: true,
      lowercase: true,
      required: true,
    },
    firstName: {
      type: String,
      trim: true,
      required: true,
    },
    lastName: {
      type: String,
      trim: true,
      required: true,
    },
    role: {
      type: String,
      trim: true,
      enum: RoleEnums,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    isVerified: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    phone: {
      type: String,
    },
    avatar: {
      type: String,
    },
    emailOtp: {
      type: Number,
    },
    emailOtpExpiresAt: {
      type: Date,
    },
    emailisVerified: {
      type: Boolean,
    },
    passwordReset: {
      token: {
        type: String,
      },
      expiresAt: {
        type: Date,
      },
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    accountLockedUntil: {
      type: Date,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
    discriminatorKey: 'userIdentity',
  }
);

BaseUserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

BaseUserSchema.pre('save', async function (next) {
  if (this.isModified('emailOtp') && this.emailOtp) {
    this.emailOtpExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
  }
  next();
});

BaseUserSchema.methods.generateAuthTokens = function (
  this: IBaseUser
): ReturnType<typeof GenerateToken> {
  return GenerateToken(this);
};

BaseUserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

BaseUserSchema.index({ email: 1, isVerified: 1 });

export const BaseUser = model<IBaseUser>('baseUsers', BaseUserSchema);
