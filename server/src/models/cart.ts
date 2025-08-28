import mongoose, { model, Schema } from 'mongoose';
import { ICart } from '../interface/models/models';

const item = {
  menuItemId: {
    type: Schema.Types.ObjectId,
    ref: 'menuItems',
    required: true,
  },
  variantId: {
    type: String,
  },
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
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
  selectedInstructions: {
    type: String,
  },
  itemTotal: {
    type: Number,
    min: 0,
  },
};

const CartSchema: Schema<ICart> = new Schema(
  {
    custmerId: {
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
    subtotal: {
      type: Number,
    },
    itemCount: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

CartSchema.pre('save', async function (next) {
  if (this.items.length > 0) {
    this.subtotal = this.items.reduce(
      (accum, item) => accum + item.itemTotal,
      0
    );
    this.itemCount = this.items.length;
    next();
  }
  next();
});

CartSchema.index({ customerId: 1, restaurantId: 1 });

export const Cart = mongoose.model<ICart>('carts', CartSchema);
