import { v2 as cloudinary } from 'cloudinary';
import { getConfig } from './config';

const config = getConfig();
cloudinary.config({
  cloud_name: config.cloudinary.cloud_name,
  api_key: config.cloudinary.cloudinary_api_key,
  api_secret: config.cloudinary.cloudinary_api_secret,
});

export default cloudinary;
