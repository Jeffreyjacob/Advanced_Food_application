import { model, Schema } from 'mongoose';
import { IRestaurant } from '../interface/models/models';
import {
  DocumentStatusEnum,
  RestaurantVerificationStatusEnum,
} from '../interface/enums/enums';

const Address = {
  street: String,
  city: String,
  state: String,
  zipCode: String,
  country: String,
};

const traceableLocation = {
  type: { type: String, enum: ['Point'], required: true },
  coordinates: { type: [Number], trim: true, required: true },
};

const RestaurantSchema: Schema<IRestaurant> = new Schema(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'restaurantOwners',
      required: true,
    },
    name: {
      type: String,
      required: true,
      unique: true,
    },
    address: Address,
    traceableLocation: traceableLocation,
    cuisineType: {
      type: String,
      required: true,
    },
    logo: {
      type: String,
    },
    description: {
      type: String,
      trim: true,
    },
    stripeAccountId: {
      type: String,
    },
    verificationStatus: {
      type: String,
      trim: true,
      enum: RestaurantVerificationStatusEnum,
      default: RestaurantVerificationStatusEnum.Pending,
    },
    documents: {
      businessLicense: {
        url: String,
        status: {
          type: String,
          enum: DocumentStatusEnum,
        },
        rejectionReason: String,
        expiryDate: Date,
        reminderJobId: {
          type: String,
        },
        expiryJobId: {
          type: String,
        },
      },
      taxCeritificate: {
        url: String,
        status: {
          type: String,
          enum: DocumentStatusEnum,
        },
        rejectionReason: String,
        expiryDate: Date,
        reminderJobId: {
          type: String,
        },
        expiryJobId: {
          type: String,
        },
      },
      foodHandlerPermit: {
        url: String,
        status: {
          type: String,
          enum: DocumentStatusEnum,
        },
        rejectionReason: String,
        expiryDate: Date,
        reminderJobId: {
          type: String,
        },
        expiryJobId: {
          type: String,
        },
      },
    },
    walletSetup: {
      type: Boolean,
      default: false,
    },
    walletCreated: {
      type: Boolean,
      default: false,
    },
    isLive: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

RestaurantSchema.index({ owner: 1 });
RestaurantSchema.index({ cuisineType: 1 });

export const Restaurant = model<IRestaurant>('restaurants', RestaurantSchema);
