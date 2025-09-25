import crypto from 'crypto';
import {
  S3Client,
  HeadObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';

const isDev = process.env.NODE_ENV !== 'production';

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  ...(isDev && {
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  }),
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME!;

// generate a hash from file buffer (for deduplication)

const generateFileHash = (buffer: Buffer): string => {
  return crypto.createHash('md5').update(buffer).digest('hex');
};

export const uploadFileToS3 = async (
  file: Express.Multer.File,
  folder: string = 'uploads'
): Promise<string> => {
  const fileHash = generateFileHash(file.buffer);
  const fileExtension = file.originalname.split('.').pop();
  const key = `${folder}/${fileHash}.${fileExtension}`;

  try {
    await s3.send(
      new HeadObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      })
    );

    // file exists, return existing URl

    console.log('File already exist in S3, returning existing link');
    return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  } catch (error: any) {
    if (error.name !== 'NotFound') {
      throw error;
    }
  }

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    })
  );

  return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
};
