import { Request } from 'express';
import multer from 'multer';
import { AppError } from '../utils/appError';
import { s3 } from '../config/aws';
import { ManagedUpload } from 'aws-sdk/clients/s3';

const storage = multer.memoryStorage();

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/avif',
    'application/pdf',
    'application/msword',
  ];

  if (allowMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Only JPEG,PNG,GIF and WebP images are allowed!', 400));
  }
};

export const MulterUploadImage = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});
