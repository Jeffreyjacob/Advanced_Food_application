import mongoose from 'mongoose';
import { AppError } from '../utils/appError';
import { ValidationError } from 'joi';
import { NextFunction, Request, Response } from 'express';
import { getConfig } from '../config/config';

interface MongoError extends Error {
  code?: number;
  keyValue?: Object;
  errmsg?: string;
}

const config = getConfig();
const handleValidationErrorDb = (
  err: mongoose.Error.ValidationError
): AppError => {
  const error = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${error.join('. ')}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldDb = (err: MongoError): AppError => {
  const value = err.keyValue ? Object.values(err.keyValue)[0] : '';
  const message = `Duplicate field value: ${value}. Please use another value`;
  return new AppError(message, 400);
};

const handleJoiValidationError = (err: ValidationError): AppError => {
  const errors = err.details[0].message;
  const message = `Validation Faild ${errors}`;
  return new AppError(message, 400);
};

const handleCastErrorDb = (err: mongoose.Error.CastError): AppError => {
  const message = `invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleJwtError = (): AppError => {
  return new AppError('Invalid token. Please login again', 401);
};

const handleJwtExpiredError = (): AppError => {
  return new AppError('Your token has expired. Please log in again', 401);
};

const sendErrorDev = (err: AppError | Error, res: Response): void => {
  const statusCode = (err as AppError).statusCode || 500;
  console.log(err);

  res.status(statusCode).json({
    status: (err as AppError).status || 'error',
    err: err,
    message: err.message,
  });
};

const sendErrorProd = (err: AppError | Error, res: Response): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    console.error('Error', err);

    res.status(500).json({
      status: 'error',
      message: 'Something went wrong',
    });
  }
};

export const ErrorHandler = (
  err: Error | AppError | MongoError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err instanceof mongoose.Error.ValidationError) {
    err = handleValidationErrorDb(err);
  } else if (err instanceof mongoose.Error.CastError) {
    err = handleCastErrorDb(err);
  } else if ((err as MongoError).code === 11000) {
    err = handleDuplicateFieldDb(err as MongoError);
  } else if (err.name === 'ValidationError' && 'details' in err) {
    err = handleJoiValidationError(err as ValidationError);
  } else if (err.name === 'JsonWebTokenError') {
    err = handleJwtError();
  } else if (err.name === 'TokenExpiredError') {
    err = handleJwtExpiredError();
  }

  if (!(err instanceof AppError)) {
    err = new AppError(err.message, 500);
  }

  const nodeEnv = config.env.toLowerCase() || 'development';

  if (nodeEnv === 'development') {
    sendErrorDev(err, res);
  } else {
    sendErrorProd(err, res);
  }
};
