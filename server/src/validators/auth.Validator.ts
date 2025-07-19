import Joi, { ObjectSchema } from 'joi';
import {
  IAuthenticationMutation,
  ICustomerMutation,
  IDriverMutation,
  IRestaurantMutation,
} from '../interface/interface/interface';
import { countriesISO } from '../utils/countryIso';

const validCountries = countriesISO.map((c) => c.name);

export const registerCustomerValidators = async (
  reqBody: ICustomerMutation['registerCustomer']
): Promise<ICustomerMutation['registerCustomer']> => {
  const validators: ObjectSchema<ICustomerMutation['registerCustomer']> =
    Joi.object({
      firstName: Joi.string().required(),
      lastName: Joi.string().required(),
      email: Joi.string().lowercase().required(),
      password: Joi.string().required(),
      country: Joi.string()
        .valid(...validCountries)
        .required(),
      locationCord: Joi.array().items(Joi.number().required()).required(),
    });

  return validators.validateAsync(reqBody, { abortEarly: false });
};

export const verifyOtpValidators = async (
  reqBody: IAuthenticationMutation['verifyOtp']
): Promise<IAuthenticationMutation['verifyOtp']> => {
  const validators: ObjectSchema<IAuthenticationMutation['verifyOtp']> =
    Joi.object({
      otp: Joi.number().min(5).required(),
    });

  return validators.validateAsync(reqBody, { abortEarly: false });
};

export const resendOtpValidators = async (
  reqBody: IAuthenticationMutation['resendOtp']
): Promise<IAuthenticationMutation['resendOtp']> => {
  const validators: ObjectSchema<IAuthenticationMutation['resendOtp']> =
    Joi.object({
      email: Joi.string().required(),
    });

  return validators.validateAsync(reqBody, { abortEarly: false });
};

export const loginCustomerValidators = async (
  reqBody: ICustomerMutation['loginCustomer']
): Promise<ICustomerMutation['loginCustomer']> => {
  const validators: ObjectSchema<ICustomerMutation['loginCustomer']> =
    Joi.object({
      email: Joi.string().required(),
      password: Joi.string().required(),
    });

  return validators.validateAsync(reqBody, { abortEarly: false });
};

export const registerRestaurantOwnerValidators = async (
  reqBody: IRestaurantMutation['createRestaurant']
): Promise<IRestaurantMutation['createRestaurant']> => {
  const validators: ObjectSchema<IRestaurantMutation['createRestaurant']> =
    Joi.object({
      firstName: Joi.string().required(),
      lastName: Joi.string().required(),
      email: Joi.string().lowercase().required(),
      password: Joi.string().required(),
      locationCord: Joi.array().items(Joi.number().required()).required(),
      RestaurantName: Joi.string().required(),
      RestaurantAddress: Joi.object({
        street: Joi.string().required(),
        city: Joi.string().required(),
        state: Joi.string().required(),
        zipCode: Joi.string().required(),
        country: Joi.string()
          .valid(...validCountries)
          .required(),
      }).required(),
      cuisineType: Joi.string().required(),
      description: Joi.string().required(),
      country: Joi.string()
        .valid(...validCountries)
        .required(),
    });

  return validators.validateAsync(reqBody, { abortEarly: false });
};

export const loginRestaurantOwnerValidators = async (
  reqBody: IRestaurantMutation['loginRestaurant']
): Promise<IRestaurantMutation['loginRestaurant']> => {
  const validators: ObjectSchema<IRestaurantMutation['loginRestaurant']> =
    Joi.object({
      email: Joi.string().required(),
      password: Joi.string().required(),
    });

  return validators.validateAsync(reqBody, { abortEarly: false });
};

export const registerDriverValidators = async (
  reqBody: IDriverMutation['registerDriver']
): Promise<IDriverMutation['registerDriver']> => {
  const validator: ObjectSchema<IDriverMutation['registerDriver']> = Joi.object(
    {
      firstName: Joi.string().required(),
      lastName: Joi.string().required(),
      email: Joi.string().lowercase().required(),
      password: Joi.string().required(),
      country: Joi.string(),
      locationCord: Joi.array().items(Joi.number().required()).required(),
    }
  );

  return validator.validateAsync(reqBody, { abortEarly: false });
};

export const loginDriverValidators = async (
  reqBody: IDriverMutation['loginDriver']
): Promise<IDriverMutation['loginDriver']> => {
  const validator: ObjectSchema<IDriverMutation['loginDriver']> = Joi.object({
    email: Joi.string().required(),
    password: Joi.string().required(),
  });

  return validator.validateAsync(reqBody, { abortEarly: false });
};

export const forgetPasswordValidators = async (
  reqBody: IAuthenticationMutation['forgetPassword']
): Promise<IAuthenticationMutation['forgetPassword']> => {
  const validators: ObjectSchema<IAuthenticationMutation['forgetPassword']> =
    Joi.object({
      email: Joi.string().required(),
    });

  return validators.validateAsync(reqBody, { abortEarly: false });
};

export const resetPasswordValidators = async (
  reqBody: IAuthenticationMutation['resetPassword']
): Promise<IAuthenticationMutation['resetPassword']> => {
  const validators: ObjectSchema<IAuthenticationMutation['resetPassword']> =
    Joi.object({
      token: Joi.string().required(),
      password: Joi.string().required(),
    });

  return validators.validateAsync(reqBody, { abortEarly: false });
};
