import mongoose, { Document, Mongoose } from 'mongoose';
import {
  DocumentStatusEnum,
  IdentityVerificationStatusEnum,
  RestaurantVerificationStatusEnum,
  RoleEnums,
  StripeAccountStatusEnum,
  StripeAccountType,
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

export interface IMenuCategory {
  _id: mongoose.Types.ObjectId;
  restaurantId: IRestaurant['_id'];
  name: string;
  description: string;
  displayOrder: number;
  isActive: boolean;
}

export interface IMenuItem {
  _id: mongoose.Types.ObjectId;
  restaurantId: IRestaurant['_id'];
  categoryId: IMenuCategory['_id'];
  name: string;
  description: string;
  price: number;
  image: string;
  preparationTime: number;
  variants: {
    name: string;
    price: string;
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

export interface ICart {
  _id: mongoose.Types.ObjectId;
  custmerId: ICustomer['_id'];
  restaurantId: IRestaurant['_id'];
  items: {
    menuItemId: IMenuItem['_id'];
    variantId: mongoose.Types.ObjectId;
    name: string;
    price: number;
    image: string;
    quantity: number;
    selectedInstructions: string;
    itemTotal: number;
  }[];
  subtotal: number;
  itemCount: number;
}

export interface IOrder {
  _id: mongoose.Types.ObjectId;
}
