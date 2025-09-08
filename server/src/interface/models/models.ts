import mongoose, { Document, Mongoose } from 'mongoose';
import {
  DocumentStatusEnum,
  IdentityVerificationStatusEnum,
  OrderStatusEnum,
  RequestStatusEnum,
  RestaurantVerificationStatusEnum,
  RoleEnums,
  StripeAccountStatusEnum,
  StripeAccountType,
  StripePaymentStatus,
  VehicleTypeEnum,
} from '../enums/enums';

export interface IBaseUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  password: string;
  role: RoleEnums;
  isVerified: boolean;
  isActive: boolean;
  firstName: string;
  lastName: string;
  phone: string;
  avatar: string;
  emailOtp?: number;
  emailOtpExpiresAt?: Date;
  emailisVerified: boolean;
  passwordReset: {
    token?: string;
    expiresAt?: Date;
  };
  country: string;
  loginAttempts: number;
  accountLockedUntil?: Date;
  lastLogin: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateAuthTokens(): { accessToken: string; refreshToken: string };
}

export interface IAddress extends Document {
  _id: mongoose.Types.ObjectId;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface ICustomer extends IBaseUser {
  location: string;
  traceableLocation: {
    type: string;
    coordinates: number[];
  };
  address: IAddress[];
  favorites: mongoose.Types.ObjectId[];
  loyaltyPoints: number;
}

export interface IRestaurantOwner extends IBaseUser {
  ownedRestaurant: IRestaurant['_id'];
  stripeAccountId: string;
}

export interface IRestaurant extends Document {
  _id: mongoose.Types.ObjectId;
  owner: IRestaurantOwner['_id'];
  name: string;
  address: IAddress;
  traceableLocation: {
    type: string;
    coordinates: number[];
  };
  logo: string;
  cuisineType: string;
  description: string;
  stripeAccountId: string;
  verificationStatus: RestaurantVerificationStatusEnum;
  documents: {
    businessLicense: {
      url: string;
      status: DocumentStatusEnum;
      rejectionReason?: string;
      expiryDate?: Date;
      expiryJobId?: string;
      reminderJobId?: string;
    };
    taxCeritificate: {
      url: string;
      status: DocumentStatusEnum;
      rejectionReason?: string;
      expiryDate?: Date;
      expiryJobId?: string;
      reminderJobId?: string;
    };
    foodHandlerPermit: {
      url: string;
      status: DocumentStatusEnum;
      rejectionReason?: string;
      expiryDate?: Date;
      expiryJobId?: string;
      reminderJobId?: string;
    };
  };
  isOpen: boolean;
  isAcceptingOrders: boolean;
  walletSetup: Boolean;
  walletCreated: Boolean;
  isLive: boolean;
  banned: boolean;
}

export interface IDriver extends IBaseUser {
  traceableLocation: {
    type: string;
    coordinates: number[];
  };
  vehicleInfo: {
    vechicleType: VehicleTypeEnum;
    make: string;
    model: string;
    color: string;
    plateNumber: string;
  };
  stripeAccountId: string;
  verificationStatus: RestaurantVerificationStatusEnum;
  stripeVerificationSessionId: string;
  stripeVerificationStatus: IdentityVerificationStatusEnum;
  stripeIdentitySetup: boolean;
  documents: {
    driverLicense: {
      url: string;
      status: DocumentStatusEnum;
      rejectionReason?: string;
      stripeVerificationReportId?: string;
      expiryDate?: Date;
      expiryJobId?: string;
      reminderJobId?: string;
    };
    vehicleRegistration: {
      url: string;
      status: DocumentStatusEnum;
      rejectionReason?: string;
      expiryDate?: Date;
      expiryJobId?: string;
      reminderJobId?: string;
    };
    profilePhoto: {
      url: string;
      status: DocumentStatusEnum;
      rejectionReason?: string;
      stripeVerificationReportId?: string;
    };
  };
  avaliableForPickup: boolean;
  isOnline: boolean;
  walletCreated: boolean;
  walletSetup: boolean;
  banned: boolean;
}

export interface IWallet extends Document {
  _id: mongoose.Types.ObjectId;
  userId: IBaseUser['_id'];
  stripeAccountId: string;
  stripeCustomerId?: string;
  accountType: StripeAccountType;
  country: string;
  currency: string;
  balance: {
    available: number;
    pending: number;
    lastUpdated: Date;
  };
  accountStatus: StripeAccountStatusEnum;
  payoutsEnabled: boolean;
  chargesEnabled: boolean;
  detailsSubmitted: boolean;
  requirements: {
    currentDeadline?: Date;
    disabledReason?: string;
    currentlyDue: string[];
    eventuallyDue: string[];
    pastDue: string[];
    pendingVerification: string[];
  };
  bankAccount?: {
    accountHolderName: string;
    accountNumber: string;
    routingNumber?: string;
    bankName: string;
    country: string;
    currency: string;
    isVerified: boolean;
  };
  reasons: string[];
  deauthorizedAt: Date;
  isActive: boolean;
}

export interface IToken extends Document {
  _id: mongoose.Types.ObjectId;
  user: IBaseUser['_id'];
  token: string;
  isRevoked: boolean;
  isExpiresAt: Date;
}

export interface IMenuCategory extends Document {
  _id: mongoose.Types.ObjectId;
  restaurantId: IRestaurant['_id'];
  name: string;
  description: string;
  displayOrder: number;
  isActive: boolean;
}

export interface IMenuItem extends Document {
  _id: mongoose.Types.ObjectId;
  restaurantId: IRestaurant['_id'];
  categoryId: IMenuCategory['_id'];
  name: string;
  description: string;
  price: number;
  image: string;
  preparationTime: number;
  variants: {
    _id?: mongoose.Types.ObjectId;
    name: string;
    price: number;
    description: string;
  }[];
  isVegetarian: boolean;
  isVegan: boolean;
  isSpicy: boolean;
  isPopular: boolean;
  tags: string[];
  isAvailable: boolean;
  displayOrder: number;
  orderCount: number;
}

export interface ICartItem {
  _id?: mongoose.Types.ObjectId;
  menuItemId: IMenuItem['_id'];
  variantId?: mongoose.Types.ObjectId;
  variantName?: string;
  variantPrice?: number;
  name: string;
  basePrice: number;
  image?: string;
  quantity: number;
  selectedInstructions?: string;
  itemTotal: number;
}

export interface ICart extends Document {
  _id: mongoose.Types.ObjectId;
  customerId: ICustomer['_id'];
  restaurantId: IRestaurant['_id'];
  items: ICartItem[];
  subtotal?: number;
  itemCount?: number;
}

export interface IOrder extends Document {
  _id: mongoose.Types.ObjectId;
  customerId: ICustomer['_id'];
  customerDetails: {
    name: string;
    phone: string;
    email: string;
  };
  restaurantId: IRestaurant['_id'];
  restaurantDetails: {
    name: string;
    phone: string;
    address: string;
  };
  driverId: IDriver['_id'];
  driverDetails: {
    name: string;
    phone: string;
    vehicleInfo: {
      type: string;
      plateNumber: string;
    };
  };
  items: ICartItem[];
  deliveryAddress: IAddress;
  pricing: {
    subtotal: number;
    deliveryFee: number;
    serviceFee: number;
    tip: number;
    total: number;
  };
  deliveryMetrics: {
    distanceKm: number;
    estimatedPreptime: number;
    estimatedDeliveryTime: number;
    actualPrepTime: number;
    actualDeliveryTime: number;
  };
  status: OrderStatusEnum;
  statusHistory: [
    {
      status: string;
      note: string;
      timestamp: Date;
    },
  ];
  payment: {
    stripeSessionId: string;
    stripePaymentintentId: string;
    stripeChargeId: string;
    paymentStatus: StripePaymentStatus;
    paymentMethod: string;
    paidAt: Date;
    refundedAt: Date;
    sessionCreatedAt: Date;
    sessionExpiredAt: Date;
  };
  idempotencyKey: string;
  sessionExpirationJobId?: string;
  payout: {
    restaurantAmount: number;
    driverAmount: number;
    platformFee: number;
    restaurantPaidOut: boolean;
    driverPaidOut: boolean;
    payoutDate: Date;
    refundId?: string;
    lastAttempt?: Date;
    retryNeeded: boolean;
    restaurantTransferId?: string;
    driverTransferId?: string;
    retryCount: number;
  };
  specialInstructions: string;
  restaurantNotes: string;
  driverNotes: string;
  orderPlacedAt: Date;
  acceptedAt: Date;
  readyAt: Date;
  pickedUpAt: Date;
  deliveredAt: Date;
  cancellation: {
    cancelledBy: RoleEnums;
    reason: string;
    cancelledAt: Date;
    refundAmount: Number;
  };
  rating: {
    restaurantRating: number;
    driverRating: number;
    overallRating: number;
  };
  retryFindDriver: number;
}

export interface IBaseRequest extends Document {
  _id: mongoose.Types.ObjectId;
  orderId: IOrder['_id'];
  requestStatus: RequestStatusEnum;
  rejectionReason: string;
  requestJobId: string;
  respondedAt: Date;
  expiresAt: Date;
}

export interface IRestaurantRequest extends IBaseRequest {
  restaurantId: IRestaurant['_id'];
  restaurantOwner: IRestaurantOwner['_id'];
  estimatedPrepTime: number;
}

export interface IDriverRequest extends IBaseRequest {
  driver: IDriver['_id'];
  restaurantLocation: {
    type: string;
    coordinates: number[];
  };
  distanceToCustomer: number;
  estimatedPickupTime: Date;
}

export interface IRejectedTracker extends Document {
  _id: mongoose.Types.ObjectId;
  userId: IBaseUser['_id'];
  userType: RoleEnums;
  orderId: IOrder['_id'];
  rejectedAt: Date;
}
