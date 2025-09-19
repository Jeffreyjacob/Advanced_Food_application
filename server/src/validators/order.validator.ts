import Joi, { ObjectSchema } from 'joi';
import { IOrderMutation, IOrderQuery } from '../interface/interface/interface';
import { OrderStatusEnum, RequestStatusEnum } from '../interface/enums/enums';
import { IOrder } from '../interface/models/models';

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
      locationCord: Joi.array().items(Joi.number().required()).required(),
    });

  return validators.validateAsync(reqBody, { abortEarly: false });
};

export const updateRestaurantRequestValidator = async (
  reqBody: IOrderMutation['updateRestaurantRequest']
): Promise<IOrderMutation['updateRestaurantRequest']> => {
  const validators: ObjectSchema<IOrderMutation['updateRestaurantRequest']> =
    Joi.object({
      reason: Joi.string().optional(),
      status: Joi.string()
        .valid(...Object.keys(RequestStatusEnum))
        .required(),
    });

  return validators.validateAsync(reqBody, { abortEarly: false });
};

export const updateOrderValidators = async (
  reqBody: IOrderMutation['updateOrder']
): Promise<IOrderMutation['updateOrder']> => {
  const validators: ObjectSchema<IOrderMutation['updateOrder']> = Joi.object({
    status: Joi.string()
      .valid(...Object.values(OrderStatusEnum))
      .required(),
  });

  return validators.validateAsync(reqBody, { abortEarly: false });
};

export const updateDriverRequestValidators = async (
  reqBody: IOrderMutation['updateDriverRequest']
): Promise<IOrderMutation['updateDriverRequest']> => {
  const validators: ObjectSchema<IOrderMutation['updateDriverRequest']> =
    Joi.object({
      reason: Joi.string().optional(),
      status: Joi.string()
        .valid(...Object.keys(RequestStatusEnum))
        .required(),
    });

  return validators.validateAsync(reqBody, { abortEarly: false });
};

export const getRestaurantRequestValidators = async (
  reqBody: IOrderQuery['getRestaurantRequest']
): Promise<IOrderQuery['getRestaurantRequest']> => {
  const validators: ObjectSchema<IOrderQuery['getRestaurantRequest']> =
    Joi.object({
      status: Joi.string()
        .valid(...Object.keys(RequestStatusEnum))
        .optional(),
      page: Joi.number().optional(),
      limit: Joi.number().optional(),
    });

  return validators.validateAsync(reqBody, { abortEarly: false });
};

export const getDriverRequestValidators = async (
  reqBody: IOrderQuery['getDriverRequest']
): Promise<IOrderQuery['getDriverRequest']> => {
  const validators: ObjectSchema<IOrderQuery['getDriverRequest']> = Joi.object({
    status: Joi.string()
      .valid(...Object.keys(RequestStatusEnum))
      .optional(),
    page: Joi.number().optional(),
    limit: Joi.number().optional(),
  });

  return validators.validateAsync(reqBody, { abortEarly: false });
};
