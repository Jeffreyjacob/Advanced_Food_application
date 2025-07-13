import mongoose from 'mongoose';
import config from './config';

const DATABASEURI =
  config.env === 'production'
    ? process.env.PROD_MONGODB_URI
    : process.env.DEV_MONGODB_URI;

async function ConnectDB() {
  try {
    await mongoose.connect(DATABASEURI!).then(() => {
      console.log('MongoDb Connected!');
    });
  } catch (error: any) {
    console.log(`MongoDb connection error:${error.message}`);
  }

  mongoose.connection.on('error', (err) => {
    console.log(`MongoDb connection error: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected. Attempting to reconnect...');
  });

  process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('MongoDB connected close due to app terminations');
    process.exit(0);
  });
}

export default ConnectDB;
