import { Schema } from 'mongoose';
import { IDriver } from '../interface/models/models';
import {
  DocumentStatusEnum,
  IdentityVerificationStatusEnum,
  RestaurantVerificationStatusEnum,
  VehicleTypeEnum,
} from '../interface/enums/enums';
import { BaseUser } from './baseUser';

const traceableLocation = {
  type: { type: String, enum: ['Point'], required: true },
  coordinates: { type: [Number], trim: true, required: true },
};

const DriverSchema: Schema<IDriver> = new Schema(
  {
    traceableLocation: traceableLocation,
    vehicleInfo: {
      vehicleType: {
        type: String,
        enum: VehicleTypeEnum,
      },
      make: {
        type: String,
      },
      model: {
        type: String,
      },
      color: {
        type: String,
      },
      plateNumber: {
        type: String,
      },
    },
    stripeAccountId: String,
    verificationStatus: {
      type: String,
      enum: RestaurantVerificationStatusEnum,
      default: RestaurantVerificationStatusEnum.Pending,
    },
    stripeVerificationSessionId: String,
    stripeVerificationStatus: {
      type: String,
      enum: IdentityVerificationStatusEnum,
      default: IdentityVerificationStatusEnum.pending,
    },
    stripeIdentitySetup: {
      type: Boolean,
      default: false,
    },
    documents: {
      driverLicense: {
        url: String,
        status: {
          type: String,
          enum: DocumentStatusEnum,
          default: DocumentStatusEnum.Pending,
        },
        rejectionReason: String,
        stripeVerificationReportId: String,
        expiryDate: Date,
        expiryJobId: String,
        reminderJobId: String,
      },
      vehicleRegistration: {
        url: String,
        status: {
          type: String,
          enum: DocumentStatusEnum,
          default: DocumentStatusEnum.Pending,
        },
        rejectionReason: String,
        expiryDate: Date,
        expiryJobId: String,
        reminderJobId: String,
      },
      profilePhoto: {
        url: String,
        status: {
          type: String,
          enum: DocumentStatusEnum,
          default: DocumentStatusEnum.Pending,
        },
        rejectionReason: String,
        stripeVerificationReportId: String,
      },
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    walletSetup: {
      type: Boolean,
      default: false,
    },
    walletCreated: {
      type: Boolean,
      default: false,
    },
    avaliableForPickup: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

DriverSchema.index({ traceableLocation: '2dsphere' });

export const Driver = BaseUser.discriminator<IDriver>('drivers', DriverSchema);
