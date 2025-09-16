import mongoose, { Schema } from 'mongoose';
import { IAddress, ICartItem, IOrder } from '../interface/models/models';
import {
  OrderStatusEnum,
  RoleEnums,
  StripePaymentStatus,
} from '../interface/enums/enums';

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

const statusHistoryItem = new Schema({
  status: {
    type: String,
    required: true,
  },
  note: String,
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const traceableLocation = {
  type: { type: String, enum: ['Point'], required: true },
  coordinates: { type: [Number], trim: true, required: true },
};

const OrderSchema: Schema<IOrder> = new Schema(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'customers',
      required: true,
    },
    customerDetails: {
      name: {
        type: String,
        required: true,
        trim: true,
      },
      phone: {
        type: String,
      },
      email: {
        type: String,
        required: true,
      },
    },
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: 'restaurants',
    },
    restaurantDetails: {
      name: String,
      phone: String,
      address: String,
    },
    driverId: {
      type: Schema.Types.ObjectId,
      ref: 'drivers',
    },
    driverDetails: {
      name: String,
      phone: String,
      vehicleInfo: {
        type: String,
        plateNumber: String,
      },
    },
    items: [item],
    deliveryAddress: Address,
    pricing: {
      subtotal: {
        type: Number,
        required: true,
      },
      deliveryFee: {
        type: Number,
        required: true,
      },
      serviceFee: {
        type: Number,
        default: 0,
      },
      total: {
        type: Number,
        required: true,
      },
    },
    deliveryMetrics: {
      distanceKm: {
        type: Number,
        required: true,
      },
      estimatedPreptime: {
        type: Number,
        default: 30,
      },
      estimatedDeliveryTime: {
        type: Number,
        default: 45,
      },
      deliveryLocation: traceableLocation,
      actualDeliveryTime: Number,
      actualPrepTime: Number,
    },
    status: {
      type: String,
      enum: OrderStatusEnum,
      default: OrderStatusEnum.awaiting_payment,
      trim: true,
    },
    statusHistory: [statusHistoryItem],
    payment: {
      stripeSessionId: String,
      stripePaymentintentId: String,
      stripeChargeId: String,
      paymentStatus: {
        type: String,
        enum: StripePaymentStatus,
        default: StripePaymentStatus.pending,
        trim: true,
      },
      paymentMethod: {
        type: String,
        default: 'card',
      },
      paidAt: {
        type: Date,
      },
      refundedAt: Date,
      sessionCreatedAt: {
        type: Date,
        default: Date.now,
      },
      sessionExpiredAt: Date,
    },
    idempotencyKey: {
      type: String,
      unique: true,
      sparse: true,
    },
    payout: {
      restaurantAmount: Number,
      driverAmount: Number,
      platformFee: Number,
      restaurantPaidOut: Boolean,
      driverPaidOut: Boolean,
      payoutDate: Date,
      refundId: String,
      lastAttempt: Date,
      retryCount: {
        type: Number,
        default: 0,
      },
      retryNeeded: {
        type: Boolean,
        default: false,
      },
      restaurantTransferId: String,
      driverTransferId: String,
      driverTransferCount: {
        type: Number,
        default: 0,
      },
      restaurantTransferCount: {
        type: Number,
        default: 0,
      },
      driverRetryNeeded: {
        type: Boolean,
        default: false,
      },
      restaurantRetryNeeded: {
        type: Boolean,
        default: false,
      },
    },
    sessionExpirationJobId: String,
    specialInstructions: String,
    restaurantNotes: String,
    driverNotes: String,
    orderPlacedAt: Date,
    acceptedAt: Date,
    readyAt: Date,
    pickedUpAt: Date,
    deliveredAt: Date,
    cancellation: {
      cancelledBy: {
        type: String,
        enum: RoleEnums,
        trim: true,
      },
      reason: String,
      cancelledAt: Date,
      refundAmount: Number,
    },
    rating: {
      restaurantRating: Number,
      driverRating: Number,
      overallRating: Number,
    },
    retryFindDriver: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

OrderSchema.index({ customerId: 1, createdAt: -1 });
OrderSchema.index({ restaurantId: 1, createdAt: -1 });
OrderSchema.index({ driver: 1, createdAt: -1 });
OrderSchema.index({ status: 1 });

OrderSchema.index({ 'payment.stripeSessionId': 1 });
OrderSchema.index({ 'payment.paymentStatus': 1 });
OrderSchema.index({ idempotencyKey: 1 }, { sparse: true });
OrderSchema.index({ orderPlacedAt: 1 });

export const Order = mongoose.model<IOrder>('order', OrderSchema);
