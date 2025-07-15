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
  emailOtp?: string;
  emailOtpExpiresAt?: Date;
  emailisVerified: boolean;
  passwordReset: {
    token?: string;
    expiresAt?: Date;
  };
  loginAttempts: number;
  accountLockedUntil?: Date;
  lastLogin: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateAuthTokens(): { accessToken: string; refreshToken: string };
}

export interface IAddress {
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
  cuisineType: string;
  description: string;
  stripeAccountId?: string;
  verificationStatus: RestaurantVerificationStatusEnum;
  documents: {
    businessLicense: {
      url: string;
      status: DocumentStatusEnum;
      rejectionReason?: string;
    };
    taxCeritificate: {
      url: string;
      status: DocumentStatusEnum;
      rejectionReason?: string;
    };
    foodHandlerPermit: {
      url: string;
      status: DocumentStatusEnum;
      rejectionReason?: string;
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
  stripeAccountId?: string;
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
  deauthorizedAt: Date;
  isActive: boolean;
}
