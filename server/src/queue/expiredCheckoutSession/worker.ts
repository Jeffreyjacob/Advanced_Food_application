import { Job, Worker } from 'bullmq';
import { redisConnection } from '../../config/redisConfig';

import { IOrder } from '../../interface/models/models';
import mongoose from 'mongoose';
import { Order } from '../../models/order';
import { stripe } from '../../config/stripe';
import {
  OrderStatusEnum,
  StripePaymentStatus,
} from '../../interface/enums/enums';
import { RestaurantRequest } from '../../models/restaurantRequest';
import { expiredRequestQueue } from '../expiredRequest/queue';
import { getConfig } from '../../config/config';

interface expiredCheckoutSessionData {
  orderId: IOrder['_id'];
  sessionId: string;
}

const config = getConfig();
const expiredCheckoutSessionWorer = new Worker(
  'expiredCheckoutSession',
  async (job: Job<expiredCheckoutSessionData>) => {
    const { orderId, sessionId } = job.data;
    const mongoSession = await mongoose.startSession();
    mongoSession.startTransaction();
    try {
      const order = await Order.findById(orderId);

      if (!order) {
        console.log(`Order ${orderId} not found, skipping cleanup`);
        return;
      }

      const stripeSession = await stripe.checkout.sessions.retrieve(sessionId);

      if (stripeSession.payment_status === 'paid') {
        console.log(`Session ${sessionId} was already paid, skipping cleanup`);
        return;
      }

      if (order.payment.paymentStatus === StripePaymentStatus.succeeded) {
        console.log(
          `Order ${orderId} payment already succeed, skipping cleanup`
        );
        return;
      }

      await Order.updateOne(
        {
          _id: orderId,
        },
        {
          $set: {
            status: OrderStatusEnum.payment_expired,
            'payment.paymentStatus': StripePaymentStatus.expired,
          },
          $push: {
            statusHistory: {
              status: OrderStatusEnum.payment_expired,
              note: 'Checkout session expired',
              timestamp: new Date(),
            },
          },
        },
        { session: mongoSession }
      );

      await mongoSession.commitTransaction();
    } catch (error: any) {
      await mongoSession.abortTransaction();
      console.error(`Error processing expired session for order ${orderId}`);
      throw error;
    } finally {
      mongoSession.endSession();
    }
  },
  {
    connection: redisConnection,
    concurrency: config.bullmq.concurrency,
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  }
);

expiredCheckoutSessionWorer.on('completed', (job) => {
  console.log(`expiredCheckoutSession with id ${job?.id} completed`);
});

expiredCheckoutSessionWorer.on('failed', (job, error) => {
  console.error(`expiredCheckoutSession with id ${job?.id} failed`, error);
});

expiredCheckoutSessionWorer.on('progress', (job, progress) => {
  console.log(`expiredCheckoutSession with id ${job?.id} progress`, progress);
});

process.on('SIGTERM', async () => {
  console.log(`Shutting down expired expiredCheckoutSession worker`);
  await expiredCheckoutSessionWorer.close();
  await redisConnection.quit();
});

export { expiredCheckoutSessionWorer };
