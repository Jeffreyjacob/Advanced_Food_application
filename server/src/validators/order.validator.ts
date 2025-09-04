import Joi, { ObjectSchema } from 'joi';
import { IOrderMutation } from '../interface/interface/interface';

export const createCheckoutSessionValidators = async (
  reqBody: IOrderMutation['createCheckoutSession']
): Promise<IOrderMutation['createCheckoutSession']> => {
  const validators: ObjectSchema<IOrderMutation['createCheckoutSession']> =
    Joi.object({
      address: Joi.object({
        street: Joi.string().required(),
        city: Joi.string().required(),
        state: Joi.string().required(),
        country: Joi.string().required(),
        zipCode: Joi.string().optional(),
      }).required(),
    });

  return validators.validateAsync(reqBody, { abortEarly: false });
};
