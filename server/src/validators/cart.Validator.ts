import Joi, { ObjectSchema } from 'joi';
import { ICartMutation } from '../interface/interface/interface';
import { updateCartItemTypeEnum } from '../interface/enums/enums';

export const addToCartValidators = async (
  reqBody: ICartMutation['addToCart']
): Promise<ICartMutation['addToCart']> => {
  const validators: ObjectSchema<ICartMutation['addToCart']> = Joi.object({
    restaurantId: Joi.string().required(),
    items: Joi.array().items(
      Joi.object({
        menuItemId: Joi.string().required(),
        variantId: Joi.string().optional(),
        name: Joi.string().required(),
        basePrice: Joi.number().required(),
        variantName: Joi.string().optional(),
        variantPrice: Joi.number().optional(),
        image: Joi.string().optional(),
        quantity: Joi.number().min(0).required(),
        selectedInstructions: Joi.string().optional(),
      })
    ),
  });

  return validators.validateAsync(reqBody, { abortEarly: false });
};

export const updateCartItemValidators = async (
  reqBody: ICartMutation['updateCartItem']
): Promise<ICartMutation['updateCartItem']> => {
  const validators: ObjectSchema<ICartMutation['updateCartItem']> = Joi.object({
    quantity: Joi.number().optional(),
    updateCartItemType: Joi.string()
      .valid(...Object.values(updateCartItemTypeEnum))
      .required(),
    restaurantId: Joi.string().required(),
  });

  return validators.validateAsync(reqBody, { abortEarly: false });
};
