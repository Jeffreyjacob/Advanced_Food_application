import { IAddress } from '../models/models';

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

export interface IDriverQuery {}
export interface IRestaurantOwnerQuery {}
export interface ICustomerQuery {}
