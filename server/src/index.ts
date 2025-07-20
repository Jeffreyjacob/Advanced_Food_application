import express, { Request, Response } from 'express';
import cors from 'cors';
import config from './config/config';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import ConnectDB from './config/dbConfig';
import { ErrorHandler } from './middleware/errorhandler';
import { serverAdapter } from './BullBoard';
import { emailWorker } from './queue/email/worker';
import authRoutes from './routes/authRoutes';
import customerRoutes from './routes/customerRoutes';

const limiter = rateLimit({
  windowMs: config.security.rateLimit.windowMs,
  max: config.security.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    const ip = Array.isArray(req.headers['x-forwarded-for'])
      ? req.headers['x-forwarded-for'][0]
      : typeof req.headers['x-forwarded-for'] === 'string'
        ? req.headers['x-forwarded-for'].split(',')[0].trim()
        : (req.ip ?? 'unknown');
    return ip;
  },
  handler: (req: Request, res: Response) => {
    const mins = config.env === 'development' ? 2 * 60 : 60;
    res.setHeader('Retry-After', Math.ceil(mins));
    res.status(429).json({
      message: `Too many requests, please try again adter:${mins} minutes`,
    });
  },
});

const StartServer = async () => {
  const app = express();

  app.use(
    cors({
      origin: config.security.cors.origin,
      credentials: config.security.cors.credentials,
    })
  );
  app.use(helmet());
  app.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }));
  app.use(morgan('common'));
  app.use(limiter);
  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  emailWorker.on('ready', () => {
    console.log('Email worker is ready');
  });

  emailWorker.on('error', (err) => {
    console.error('Email worker error:', err);
  });

  app.use(`${config.apiPrefix}/admin/queues`, serverAdapter.getRouter());
  app.use(`${config.apiPrefix}/auth`, authRoutes);
  app.use(`${config.apiPrefix}/customer`, customerRoutes);

  app.use(ErrorHandler);

  const PORT = config.port;

  await ConnectDB();
  app.listen(PORT, () => {
    console.log(`Server is running on Port ${PORT}`);
  });
};

StartServer();
