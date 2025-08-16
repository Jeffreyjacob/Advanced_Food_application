import {
  RestaurantDocumentTypeEnum,
  RoleEnums,
  VehicleTypeEnum,
} from '../enums/enums';
import { IAddress, IBaseUser, IMenuCategory } from '../models/models';

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
  updateDriver: {
    vehicleType: VehicleTypeEnum;
    make: string;
    model: string;
    color: string;
    plateNumber: string;
    firstName: string;
    lastName: string;
    phone: string;
    country: string;
  };
  updateVehicleRegisteration: {
    url: string;
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

export interface IMenuCategoryMutation {
  createCategory: {
    name: string;
    description: string;
  };
  updateCategory: {
    name?: string;
    description?: string;
  };
  updateDisplayOrder: {
    newOrderCategory: string[];
  };
  toggleCategoryStatus: {
    isActive: boolean;
  };
}
export interface IMenuCategoryQuery {}
export interface IMenuItemMutation {
  createMenuItem: {
    menuCategoryId: IMenuCategory['_id'];
    name: string;
    description: string;
    price: number;
    image: string;
    preparationTime: number;
    variants?: {
      name: string;
      price: number;
      description?: string;
    }[];
    isVegetarian?: boolean;
    isVegan?: boolean;
    isSpicy?: boolean;
    tags?: string[];
  };
  updateMenuItem: {
    menuCategoryId?: IMenuCategory['_id'];
    name?: string;
    description?: string;
    price?: number;
    image?: number;
    preparationTime?: number;
    variants?: {
      name: string;
      price: number;
      description?: string;
    }[];
    isVegetarian?: boolean;
    isVegan?: boolean;
    isSpicy?: boolean;
    tags?: string[];
  };
  updateDisplayOrder: {
    newOrderMenuItem: string[];
  };
  toggleStatus: {
    isAvaliable: boolean;
  };
}
export interface IMenuItemQuery {
  SearchMenuItem: {
    name?: string;
    isVegan?: boolean;
    isVegetarian?: boolean;
    isSpicy?: boolean;
    minPrice?: number;
    maxPrice?: number;
    limit?: number;
    page?: number;
  };
  getActiveMenuItem: {
    page?: number;
    limit?: number;
  };
  getAllMenuItem: {
    page?: number;
    limit?: number;
  };
}

export interface IDriverQuery {}
export interface IRestaurantOwnerQuery {}
export interface ICustomerQuery {
  getRestaurant: {
    name?: string;
    cusine?: string;
    nearBy?: boolean;
    page?: number;
    limit?: number;
  };
  getRestaurantMenuCategories: {
    name?: string;
    page?: number;
    limit?: number;
  };
  getRestaurantMenuItembyCategoryId: {
    page?: number;
    limit?: number;
  };
  getRestaurantMenuItems: {
    name?: string;
    page?: number;
    limit?: number;
  };
}
export interface IWalletQuery {}
