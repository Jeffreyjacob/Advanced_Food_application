import { model, Schema } from 'mongoose';
import { IAddress, ICustomer } from '../interface/models/models';
import { BaseUser } from './baseUser';

const traceableLocation = {
  type: { type: String, enum: ['Point'], required: true },
  coordinates: { type: [Number], trim: true, required: true },
};

const Address: Schema<IAddress> = new Schema({
  street: {
    type: String,
  },
  city: {
    type: String,
  },
  state: {
    type: String,
  },
  zipCode: {
    type: String,
  },
  country: {
    type: String,
  },
});

const CustomerSchema: Schema<ICustomer> = new Schema(
  {
    location: {
      type: String,
    },
    traceableLocation: traceableLocation,
    address: [Address],
    favorites: {
      type: [Schema.Types.ObjectId],
      ref: 'restaurants',
    },
    loyaltyPoints: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

CustomerSchema.index({ traceableLocation: '2dsphere' });

export const Customer = BaseUser.discriminator<ICustomer>(
  'customers',
  CustomerSchema
);
