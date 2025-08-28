import Joi, { ObjectSchema } from 'joi';
import { IRestaurantMutation } from '../interface/interface/interface';
import { RestaurantDocumentTypeEnum } from '../interface/enums/enums';

export const updateRestaurantValidators = async (
  reqBody: IRestaurantMutation['updateRestaurant']
): Promise<IRestaurantMutation['updateRestaurant']> => {
  const validators: ObjectSchema<IRestaurantMutation['updateRestaurant']> =
    Joi.object({
      name: Joi.string().optional(),
      address: Joi.string().optional(),
      cuisineType: Joi.string().optional(),
      description: Joi.string().optional(),
      locationCoord: Joi.array().items(Joi.number().required()).optional(),
      logo: Joi.string().optional(),
      isOpen: Joi.boolean().optional(),
      isAcceptingOrders: Joi.boolean().optional(),
    });

  return validators.validateAsync(reqBody, { abortEarly: false });
};

export const addRestaurantDocumentValidators = async (
  reqBody: IRestaurantMutation['addRestaurantDocument']
): Promise<IRestaurantMutation['addRestaurantDocument']> => {
  const validators: ObjectSchema<IRestaurantMutation['addRestaurantDocument']> =
    Joi.object({
      url: Joi.string().required(),
      documentType: Joi.string()
        .valid(...Object.keys(RestaurantDocumentTypeEnum))
        .required(),
    });

  return validators.validateAsync(reqBody, { abortEarly: false });
};

export const updateRestaurantDocumentValidators = async (
  reqBody: IRestaurantMutation['updateRestaurantDocument']
): Promise<IRestaurantMutation['updateRestaurantDocument']> => {
  const validators: ObjectSchema<
    IRestaurantMutation['updateRestaurantDocument']
  > = Joi.object({
    documentType: Joi.string().valid(
      ...Object.keys(RestaurantDocumentTypeEnum)
    ),
    url: Joi.string().required(),
  });

  return validators.validateAsync(reqBody, { abortEarly: false });
};
