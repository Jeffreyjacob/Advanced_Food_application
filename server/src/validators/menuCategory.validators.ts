import Joi, { ObjectSchema } from 'joi';
import { IMenuCategoryMutation } from '../interface/interface/interface';

export const createMenuCategoryValidators = async (
  reqBody: IMenuCategoryMutation['createCategory']
): Promise<IMenuCategoryMutation['createCategory']> => {
  const validators: ObjectSchema<IMenuCategoryMutation['createCategory']> =
    Joi.object({
      name: Joi.string().required(),
      description: Joi.string().required(),
    });

  return validators.validateAsync(reqBody, { abortEarly: false });
};

export const updateMenuCategoryValidators = async (
  reqBody: IMenuCategoryMutation['updateCategory']
): Promise<IMenuCategoryMutation['updateCategory']> => {
  const validators: ObjectSchema<IMenuCategoryMutation['updateCategory']> =
    Joi.object({
      name: Joi.string().optional(),
      description: Joi.string().optional(),
    });

  return validators.validateAsync(reqBody, { abortEarly: false });
};

export const updateDisplayOrderMenuCategoryValidators = async (
  reqBody: IMenuCategoryMutation['updateDisplayOrder']
): Promise<IMenuCategoryMutation['updateDisplayOrder']> => {
  const validators: ObjectSchema<IMenuCategoryMutation['updateDisplayOrder']> =
    Joi.object({
      newOrderCategory: Joi.array().items(Joi.string().required()).required(),
    });

  return validators.validateAsync(reqBody, { abortEarly: false });
};

export const changeMenuCategoryStatusValidators = async (
  reqBody: IMenuCategoryMutation['toggleCategoryStatus']
): Promise<IMenuCategoryMutation['toggleCategoryStatus']> => {
  const validators: ObjectSchema<
    IMenuCategoryMutation['toggleCategoryStatus']
  > = Joi.object({
    isActive: Joi.boolean().required(),
  });

  return validators.validateAsync(reqBody, { abortEarly: false });
};
