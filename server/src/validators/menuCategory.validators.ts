import Joi, { ObjectSchema } from 'joi';
import {
  IMenuCategoryMutation,
  IMenuItemMutation,
  IMenuItemQuery,
} from '../interface/interface/interface';

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

export const createMenuItemValidators = async (
  reqBody: IMenuItemMutation['createMenuItem']
): Promise<IMenuItemMutation['createMenuItem']> => {
  const validators: ObjectSchema<IMenuItemMutation['createMenuItem']> =
    Joi.object({
      name: Joi.string().required(),
      menuCategoryId: Joi.string().required(),
      description: Joi.string().required(),
      price: Joi.number().required(),
      image: Joi.string().required(),
      preparationTime: Joi.number().required(),
      variants: Joi.array()
        .items(
          Joi.object({
            name: Joi.string().required(),
            price: Joi.number().required(),
            description: Joi.string().optional(),
          })
        )
        .optional(),
      isVegetarian: Joi.boolean().optional(),
      isVegan: Joi.boolean().optional(),
      isSpicy: Joi.boolean().optional(),
      tags: Joi.array().items(Joi.string().required()).optional(),
    });

  return validators.validateAsync(reqBody, { abortEarly: false });
};

export const updateMenuItemValidators = async (
  reqBody: IMenuItemMutation['updateMenuItem']
): Promise<IMenuItemMutation['updateMenuItem']> => {
  const validators: ObjectSchema<IMenuItemMutation['updateMenuItem']> =
    Joi.object({
      menuCategoryId: Joi.string().optional(),
      name: Joi.string().optional(),
      description: Joi.string().optional(),
      price: Joi.number().optional(),
      image: Joi.string().optional(),
      preparationTime: Joi.string().optional(),
      variants: Joi.array()
        .items(
          Joi.object({
            name: Joi.string().required(),
            price: Joi.number().required(),
            description: Joi.string().optional(),
          })
        )
        .optional(),
      isVegetarian: Joi.boolean().optional(),
      isVegan: Joi.boolean().optional(),
      isSpicy: Joi.boolean().optional(),
      tags: Joi.array().items(Joi.string().required()).optional(),
    });

  return validators.validateAsync(reqBody, { abortEarly: false });
};

export const updateMenuItemDisplayOrderValidator = async (
  reqBody: IMenuItemMutation['updateDisplayOrder']
): Promise<IMenuItemMutation['updateDisplayOrder']> => {
  const validators: ObjectSchema<IMenuItemMutation['updateDisplayOrder']> =
    Joi.object({
      newOrderMenuItem: Joi.array().items(Joi.string().required()).required(),
    });

  return validators.validateAsync(reqBody, { abortEarly: false });
};

export const toggleMenuItemStatusValidators = async (
  reqBody: IMenuItemMutation['toggleStatus']
): Promise<IMenuItemMutation['toggleStatus']> => {
  const validators: ObjectSchema<IMenuItemMutation['toggleStatus']> =
    Joi.object({
      isAvaliable: Joi.boolean().required(),
    });

  return validators.validateAsync(reqBody, { abortEarly: false });
};

export const getActiveMenuItemsValidators = async (
  reqBody: IMenuItemQuery['getActiveMenuItem']
): Promise<IMenuItemQuery['getActiveMenuItem']> => {
  const validators: ObjectSchema<IMenuItemQuery['getActiveMenuItem']> =
    Joi.object({
      page: Joi.number().optional(),
      limit: Joi.number().optional(),
    });

  return validators.validateAsync(reqBody, { abortEarly: false });
};

export const getAllMenuItemsValidators = async (
  reqBody: IMenuItemQuery['getAllMenuItem']
): Promise<IMenuItemQuery['getAllMenuItem']> => {
  const validators: ObjectSchema<IMenuItemQuery['getAllMenuItem']> = Joi.object(
    {
      page: Joi.number().optional(),
      limit: Joi.number().optional(),
    }
  );

  return validators.validateAsync(reqBody, { abortEarly: false });
};

export const SearchMenuItemsValidators = async (
  reqBody: IMenuItemQuery['SearchMenuItem']
): Promise<IMenuItemQuery['SearchMenuItem']> => {
  const validators: ObjectSchema<IMenuItemQuery['SearchMenuItem']> = Joi.object(
    {
      name: Joi.string().optional(),
      isVegan: Joi.boolean().optional(),
      isVegetarian: Joi.boolean().optional(),
      isSpicy: Joi.boolean().optional(),
      minPrice: Joi.number().min(0).optional(),
      maxPrice: Joi.number().min(0).optional(),
      page: Joi.number().optional(),
      limit: Joi.number().optional(),
    }
  );

  return validators.validateAsync(reqBody, { abortEarly: false });
};
