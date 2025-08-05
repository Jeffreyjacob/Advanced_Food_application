import { RestaurantDocumentTypeEnum, RoleEnums } from '../enums/enums';
import { IAddress, IBaseUser } from '../models/models';

export interface ICustomerMutation {
  registerCustomer: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    locationCord: number[];
    country: string;
  };
  loginCustomer: {
    email: string;
    password: string;
  };
  updateCustomer: {
    firstName: string;
    lastName: string;
    phone: string;
    avatar: string;
    location: string;
    country: string;
    locationCoord: [number];
  };

  addAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };

  updateAddress: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
}

export interface IAuthenticationMutation {
  verifyOtp: {
    otp: number;
  };
  resendOtp: {
    email: string;
  };
  forgetPassword: {
    email: string;
  };
  resetPassword: {
    token: string;
    password: string;
  };
}

export interface IRestaurantMutation {
  createRestaurant: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    locationCord: number[];
    RestaurantAddress: IAddress;
    RestaurantName: string;
    country: string;
    cuisineType: string;
    description: string;
  };
  loginRestaurant: {
    email: string;
    password: string;
  };
  updateRestaurant: {
    name?: string;
    address?: IAddress;
    cuisineType?: string;
    description?: string;
    locationCoord?: number[];
    logo?: string;
  };
  addRestaurantDocument: {
    documentType: RestaurantDocumentTypeEnum;
    url: string;
  };

  updateRestaurantDocument: {
    documentType: RestaurantDocumentTypeEnum;
    url: string;
  };
}

export interface IDriverMutation {
  registerDriver: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    country: string;
    locationCord: number[];
  };
  loginDriver: {
    email: string;
    password: string;
  };
}

export interface IVerifyDocument {
  isValid: boolean;
  expiryDate: string;
  extractedData: { [key: string]: string };
  issues: string[];
  score: 0;
}

export interface IWalletMutation {
  createStripeConnectAccount: {
    role: RoleEnums;
    userId: IBaseUser['_id'];
  };
  onBoardingLink: {
    role: RoleEnums;
    userId: IBaseUser['_id'];
  };
}

export interface IDriverQuery {}
export interface IRestaurantOwnerQuery {}
export interface ICustomerQuery {}
export interface IWalletQuery {}
