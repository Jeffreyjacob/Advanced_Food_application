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

const generateRawUrl = (publicId: string): string => {
  return cloudinary.url(publicId, {
    resource_type: 'raw',
    secure: true,
  });
};

export const uploadDocumentToCloudinary = async (
  file: Express.Multer.File
): Promise<string> => {
  // A) Compute file hash
  const fileHash = generateFileHash(file.buffer);

  const search = await cloudinary.search
    .expression(`context.file_hash="${fileHash}"`) // ← quotes around the hash are critical!
    .max_results(1)
    .execute();

  if (search.resources?.length) {
    return search.resources[0].secure_url;
  }

  const dataUri = `data:${file.mimetype};base64,${file.buffer.toString(
    'base64'
  )}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    resource_type: 'raw',
    use_filename: true,
    unique_filename: false,
    overwrite: false,
    context: { file_hash: fileHash },
  });

  if (!result.secure_url) {
    throw new Error('Cloudinary did not return a secure_url');
  }

  return generateRawUrl(result.public_id);
};
