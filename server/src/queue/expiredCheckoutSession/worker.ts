import { Job, Worker } from 'bullmq';
import { redisConnection } from '../../config/redisConfig';
import config from '../../config/config';
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

interface expiredCheckoutSessionData {
  orderId: IOrder['_id'];
  sessionId: string;
}

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

      const restaurantRequest = await RestaurantRequest.findOne({ orderId });

      if (restaurantRequest) {
        if (restaurantRequest.requestJobId) {
          try {
            const exipredRequestJob = await expiredRequestQueue.getJob(
              restaurantRequest.requestJobId
            );
            if (exipredRequestJob) {
              await exipredRequestJob.remove();
            }
            console.log(
              `Removed restaurant request job: ${restaurantRequest.requestJobId}`
            );
          } catch (error) {
            console.log(`Could not remove restaurant job: ${error}`);
          }
        }
      }

      await RestaurantRequest.updateOne(
        {
          _id: restaurantRequest?._id,
        },
        {
          $set: {
            requestStatus: OrderStatusEnum.cancelled,
          },
        },
        {
          session: mongoSession,
        }
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
