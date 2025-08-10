import Joi, { ObjectSchema } from 'joi';
import { IDriverMutation } from '../interface/interface/interface';
import { countriesISO } from '../utils/countryIso';

const validCountry = countriesISO.map((c) => c.name);

export const updateDriverInfoValidator = async (
  reqBody: IDriverMutation['updateDriver']
): Promise<IDriverMutation['updateDriver']> => {
  const validators: ObjectSchema<IDriverMutation['updateDriver']> = Joi.object({
    firstName: Joi.string().optional(),
    lastName: Joi.string().optional(),
    country: Joi.string()
      .valid(...validCountry)
      .optional(),
    phone: Joi.string().optional(),
  });

  return validators.validateAsync(reqBody, { abortEarly: false });
};

export const updateVehicleRegisterationValidators = async (
  reqBody: IDriverMutation['updateVehicleRegisteration']
) => {
  const validators: ObjectSchema<
    IDriverMutation['updateVehicleRegisteration']
  > = Joi.object({
    url: Joi.string().required(),
  });

  return validators.validateAsync(reqBody, { abortEarly: false });
};
