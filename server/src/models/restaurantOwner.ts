import { Schema } from 'mongoose';
import { IRestaurantOwner } from '../interface/models/models';
import { BaseUser } from './baseUser';

const ResturantOwnerschema: Schema<IRestaurantOwner> = new Schema(
  {
    ownedRestaurant: {
      type: Schema.Types.ObjectId,
      ref: 'restaurants',
    },
    stripeAccountId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

ResturantOwnerschema.index({ ownedRestaurant: 1 });

export const RestaurantOwner = BaseUser.discriminator<IRestaurantOwner>(
  'restaurantOwners',
  ResturantOwnerschema
);
