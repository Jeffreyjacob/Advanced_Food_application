import dotenv from 'dotenv';

dotenv.config();

export default {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 8000,
  apiPrefix: process.env.API_PREFIX || '/api/v1',

  frontendUrls: {
    baseUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    verifiyEmail: `${process.env.FRONTEND_URL}/verifyEmail`,
    passwordReset: `${process.env.FRONTEND_URL}/resetPassword`,
  },

  tokens: {
    accessToken: {
      tokenKey: process.env.ACCESS_TOKEN_KEY!,
      tokenExpiresIn: process.env.ACCESS_TOKEN_EXPIRESIN,
    },
    refreshToken: {
      tokenKey: process.env.REFRESH_TOKEN_KEY!,
      tokenExpiesIn: process.env.REFRESH_TOKEN_EXPIRESIN,
    },
  },

  email: {
    from: process.env.EMAIL_MAIL,
    host: process.env.EMAIL_HOST,
    service: process.env.EMAIL_SERVICES,
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    auth: {
      user: process.env.EMAIL_MAIL,
      password: process.env.EMAIL_PASSWORD,
    },
  },

  cloudinary: {
    cloud_name: process.env.CLOUD_NAME,
    cloudinary_api_key: process.env.CLOUDINARY_API_KEY,
    cloudinary_api_secret: process.env.CLOUDINARY_API_SECRET,
  },

  stripe: {
    stripe_secret_key: process.env.STRIPE_SECRET_KEY,
    stripe_publishable_key: process.env.STRIPE_PUBLISHABLE_KEY,
    Stripe_webhook_connect_secret: process.env.STRIPE_CONNECT_WEBHOOK_SECRET,
    Stripe_webhook_secret: process.env.STRIPE_WEBHOOK_SECRET,
  },

  security: {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      credentials: process.env.CORS_CREDENTIALS === 'true',
    },
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
      max: parseInt(process.env.NODEENV === 'development' ? '1000' : '100', 10),
    },
  },

  redis: {
    host: process.env.REDIS_HOST || 'redis',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },

  bullmq: {
    defaultJobOptions: {
      removeOnComplete: parseInt(
        process.env.BULLMQ_REMOVE_ON_COMPLETE || '100',
        10
      ),
      removeOnFail: parseInt(process.env.BULLMQ_ON_FAIL || '50', 10),
      attempts: parseInt(process.env.BULL_MQ_ATTEMPTS || '3', 10),
      backoff: {
        type: 'exponential',
        delay: parseInt(process.env.BULLMQ_BACKOFF_DELAY || '2000', 10),
      },
    },
    concurrency: parseInt(process.env.BULLMQ_CONCURRENCY || '10', 10),
  },
  OCR: {
    API_KEY: process.env.OCRAPIKEY!,
    URL: process.env.OCR_URL,
  },
};
