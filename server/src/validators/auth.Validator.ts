import Joi, { ObjectSchema } from 'joi';
import {
  IAuthenticationMutation,
  ICustomerMutation,
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
