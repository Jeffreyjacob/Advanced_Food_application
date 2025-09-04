import { Schema } from 'mongoose';
import { IDriverRequest } from '../interface/models/models';
import { BaseRequest } from './baseRequest';

const traceableLocation = {
  type: { type: String, enum: ['Point'], required: true },
  coordinates: { type: [Number], trim: true, required: true },
};

const DriverRequestSchema: Schema<IDriverRequest> = new Schema(
  {
    driver: {
      type: Schema.Types.ObjectId,
      ref: 'drivers',
      required: true,
    },
    restaurantLocation: traceableLocation,
    distanceToCustomer: {
      type: Number,
      required: true,
    },
    estimatedPickupTime: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

DriverRequestSchema.index({ driver: 1, createdAt: -1 });
DriverRequestSchema.index({ traceableLocation: '2dsphere' });

export const DriverRequest = BaseRequest.discriminator<IDriverRequest>(
  'driverRequests',
  DriverRequestSchema
);
