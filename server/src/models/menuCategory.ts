import mongoose, { Schema } from 'mongoose';
import { IMenuCategory } from '../interface/models/models';

const MenuCategorySchema: Schema<IMenuCategory> = new Schema(
  {
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: 'restaurants',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
    },
    displayOrder: {
      type: Number,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const MenuCategory = mongoose.model<IMenuCategory>(
  'menuCategory',
  MenuCategorySchema
);

export default MenuCategory;
