import crypto from 'crypto';
import cloudinary from '../config/cloudinary';

const generateFileHash = (buffer: Buffer): string => {
  return crypto.createHash('md5').update(buffer).digest('hex');
};

export const uploadImage = async (
  file: Express.Multer.File
): Promise<string> => {
  const fileHash = generateFileHash(file.buffer);

  try {
    const searchResult = await cloudinary.search
      .expression(`context.file_hash="${fileHash}"`)
      .max_results(1)
      .execute();

    if (searchResult?.resources?.length > 0) {
      console.log('Image already exist, return exist image');
      return searchResult.resources[0].secure_url;
    }

    const base64Image = Buffer.from(file.buffer).toString('base64');
    const dataURI = `data:${file.mimetype};base64,${base64Image}`;

    const uploadImage = await cloudinary.uploader.upload(dataURI, {
      context: {
        file_hash: fileHash,
      },
    });

    return uploadImage.url;
  } catch (error: any) {
    console.error('Error checking for duplicates image in cloudinary', error);
    const base64Image = Buffer.from(file.buffer).toString('base64');
    const dataURI = `data:${file.mimetype};base64,${base64Image}`;
    const uploadedImage = await cloudinary.uploader.upload(dataURI);
    return uploadedImage.url;
  }
};
