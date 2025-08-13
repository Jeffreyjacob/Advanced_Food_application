import mongoose, { Schema } from 'mongoose';
import { IMenuItem } from '../interface/models/models';

const MenuItemSchema: Schema<IMenuItem> = new Schema(
  {
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: 'restaurants',
      required: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'menuCategory',
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    image: {
      type: String,
      required: true,
    },
    preparationTime: {
      type: Number,
      default: 15,
    },
    variants: [
      {
        name: {
          type: String,
          required: true,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
        description: String,
      },
    ],
    isVegetarian: {
      type: Boolean,
      default: false,
    },
    isVegan: {
      type: Boolean,
      default: false,
    },
    isSpicy: {
      type: Boolean,
      default: false,
    },
    isPopular: {
      type: Boolean,
      default: false,
    },
    tags: {
      type: [String],
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    orderCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

MenuItemSchema.index({ restaurantId: 1, isAvailable: 1 });
MenuItemSchema.index({ name: 'text', description: 'text', tags: 'text' });

export const MenuItem = mongoose.model<IMenuItem>('menuItems', MenuItemSchema);
