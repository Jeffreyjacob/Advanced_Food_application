import { NextFunction, Request, Response } from 'express';
import { query, validationResult } from 'express-validator';

export const SearchMenuItemValidator = [
  query('name')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1 })
    .withMessage('name query must be above 1 characters'),
  query('isVegan')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('isVegan must be true or false')
    .isBoolean(),

  query('isVegetarian')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('isVegetarian must be true or false')
    .isBoolean(),

  query('isSpicy')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('isSpicy must true or false')
    .isBoolean(),

  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .toFloat()
    .withMessage('Min price query must be a positive number'),

  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .toFloat()
    .withMessage('Max Price query must be a positive number'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .toInt()
    .withMessage('limit must be between 1 - 100'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .toInt()
    .withMessage('Page musty be a positive number '),
];

export const ActiveMenuItem = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .toInt()
    .withMessage('page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .toInt()
    .withMessage('limit must be between 1 - 100'),
];

export const AllMenuItem = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .toInt()
    .withMessage('page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .toInt()
    .withMessage('limit must be between 1 - 100'),
];

export const handleQueryValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: 'Query validation Failed',
      errors: errors.array().map((error) => ({
        field: error.type,
        message: error.msg,
        value: 'value' in error ? error.value : undefined,
      })),
    });

    return;
  }

  next();
};
