import { Schema } from 'mongoose';
import { IRestaurantRequest } from '../interface/models/models';
import { BaseRequest } from './baseRequest';

const RestaurantRequestSchema: Schema<IRestaurantRequest> = new Schema(
  {
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: 'restaurants',
      required: true,
    },
    restaurantOwner: {
      type: Schema.Types.ObjectId,
      ref: 'restaurantOwners',
      required: true,
    },
    estimatedPrepTime: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

RestaurantRequestSchema.index({ restaurantId: 1, createdAt: -1 });
RestaurantRequestSchema.index({ restaurantOwner: 1, createdAt: -1 });

export const RestaurantRequest = BaseRequest.discriminator<IRestaurantRequest>(
  'restaurantRequest',
  RestaurantRequestSchema
);
