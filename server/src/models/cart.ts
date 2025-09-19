import mongoose, { model, Schema } from 'mongoose';
import { ICart, ICartItem } from '../interface/models/models';

const item: Schema<ICartItem> = new Schema({
  menuItemId: {
    type: Schema.Types.ObjectId,
    ref: 'menuItems',
    required: true,
  },
  variantId: {
    type: Schema.Types.ObjectId,
  },
  name: {
    type: String,
    required: true,
  },
  basePrice: {
    type: Number,
    required: true,
    min: 0,
  },
  image: {
    type: String,
  },
  quantity: {
    type: Number,
    min: 0,
    required: true,
  },
  variantName: String,
  variantPrice: {
    type: Number,
    min: 0,
  },
  selectedInstructions: {
    type: String,
  },
  itemTotal: {
    type: Number,
    min: 0,
  },
});

const CartSchema: Schema<ICart> = new Schema(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'customers',
      required: true,
    },
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: 'restaurants',
      required: true,
    },
    items: [item],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

CartSchema.virtual('subTotal').get(function (this: ICart) {
  return this.items.reduce((acc, item) => acc + item.itemTotal, 0);
});

CartSchema.virtual('itemCount').get(function (this: ICart) {
  return this.items.reduce((acc, item) => acc + item.quantity, 0);
});

CartSchema.index({ customerId: 1, restaurantId: 1 });

export const Cart = mongoose.model<ICart>('carts', CartSchema);
