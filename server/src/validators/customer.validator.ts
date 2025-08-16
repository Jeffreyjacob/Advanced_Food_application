import Joi, { ObjectSchema } from 'joi';
import {
  ICustomerMutation,
  ICustomerQuery,
} from '../interface/interface/interface';
import { countriesISO } from '../utils/countryIso';

const validCountries = countriesISO.map((c) => c.name);

export const updateCustomerInfoValidators = async (
  reqBody: ICustomerMutation['updateCustomer']
): Promise<ICustomerMutation['updateCustomer']> => {
  const validators: ObjectSchema<ICustomerMutation['updateCustomer']> =
    Joi.object({
      firstName: Joi.string().optional(),
      lastName: Joi.string().optional(),
      phone: Joi.string().optional(),
      avatar: Joi.string().optional(),
      location: Joi.string().optional(),
      country: Joi.string()
        .valid(...validCountries)
        .optional(),
      locationCoord: Joi.array().items(Joi.number().required()).optional(),
    });

  return validators.validateAsync(reqBody, { abortEarly: false });
};

export const addAddressValidators = async (
  reqBody: ICustomerMutation['addAddress']
): Promise<ICustomerMutation['addAddress']> => {
  const validators: ObjectSchema<ICustomerMutation['addAddress']> = Joi.object({
    street: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    zipCode: Joi.string().required(),
    country: Joi.string()
      .valid(...validCountries)
      .required(),
  });

  return validators.validateAsync(reqBody, { abortEarly: false });
};

export const updateAddressValidators = async (
  reqBody: ICustomerMutation['updateAddress']
): Promise<ICustomerMutation['updateAddress']> => {
  const validators: ObjectSchema<ICustomerMutation['updateAddress']> =
    Joi.object({
      street: Joi.string().optional(),
      city: Joi.string().optional(),
      state: Joi.string().optional(),
      zipCode: Joi.string().optional(),
      country: Joi.string().optional(),
    });

  return validators.validateAsync(reqBody, { abortEarly: false });
};

export const getRestaurantValidators = async (
  reqBody: ICustomerQuery['getRestaurant']
): Promise<ICustomerQuery['getRestaurant']> => {
  const validators: ObjectSchema<ICustomerQuery['getRestaurant']> = Joi.object({
    name: Joi.string().optional(),
    cusine: Joi.string().optional(),
    nearBy: Joi.boolean().optional(),
    page: Joi.number().min(0).optional(),
    limit: Joi.number().min(0).optional,
  });

  return validators.validateAsync(reqBody, { abortEarly: false });
};

export const getRestaurantMenuCategoriesValidator = async (
  reqBody: ICustomerQuery['getRestaurantMenuCategories']
): Promise<ICustomerQuery['getRestaurantMenuCategories']> => {
  const validators: ObjectSchema<
    ICustomerQuery['getRestaurantMenuCategories']
  > = Joi.object({
    name: Joi.string().optional(),
    page: Joi.number().optional(),
    limit: Joi.number().optional(),
  });

  return validators.validateAsync(reqBody, { abortEarly: false });
};

export const getRestaurantMenuItemByCategoryIdValidators = async (
  reqBody: ICustomerQuery['getRestaurantMenuItembyCategoryId']
): Promise<ICustomerQuery['getRestaurantMenuItembyCategoryId']> => {
  const validators: ObjectSchema<
    ICustomerQuery['getRestaurantMenuItembyCategoryId']
  > = Joi.object({
    page: Joi.number().optional(),
    limit: Joi.number().optional(),
  });

  return validators.validateAsync(reqBody, { abortEarly: false });
};

export const getRestaurantAllMenuItemsValidators = async (
  reqBody: ICustomerQuery['getRestaurantMenuItems']
): Promise<ICustomerQuery['getRestaurantMenuItems']> => {
  const validators: ObjectSchema<ICustomerQuery['getRestaurantMenuItems']> =
    Joi.object({
      name: Joi.string().optional(),
      page: Joi.number().optional(),
      limit: Joi.number().optional(),
    });

  return validators.validateAsync(reqBody, { abortEarly: false });
};
