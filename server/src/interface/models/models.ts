import mongoose, { Document } from 'mongoose';
import {
  DocumentStatusEnum,
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
  walletSetup: Boolean;
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
  documents: {
    driverLicense: {
      url: string;
      status: DocumentStatusEnum;
      rejectionReason?: string;
    };
    vehicleRegistration: {
      url: string;
      status: DocumentStatusEnum;
      rejectionReason?: string;
    };
    profilePhoto: {
      url: string;
      status: DocumentStatusEnum;
      rejectionReason?: string;
    };
  };
  isOnline: boolean;
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
