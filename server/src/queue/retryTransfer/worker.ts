import { Job, Worker } from 'bullmq';
import { IOrder } from '../../interface/models/models';
import { redisConnection } from '../../config/redisConfig';
import { getConfig } from '../../config/config';
import { Order } from '../../models/order';
import { AppError } from '../../utils/appError';
import { stripe } from '../../config/stripe';
import { Restaurant } from '../../models/restaurant';
import { Driver } from '../../models/driver';
import { retryTransferPaymentQueue } from './queue';

interface RetryTransferData {
  orderId: IOrder['_id'];
  userType: 'restaurant' | 'driver' | 'customer';
  reason: string;
}

const config = getConfig();
const retryTransferWorker = new Worker(
  'retryTransferWorker',
  async (job: Job<RetryTransferData>) => {
    const { orderId, userType, reason } = job.data;

    const order = await Order.findById(orderId);

    if (!order) {
      throw new AppError('order was not found', 404);
    }

    const restaurant = await Restaurant.findById(order.restaurantId);

    if (!restaurant) {
      throw new AppError('Unable to found Restaurant', 404);
    }

    const driver = await Driver.findById(order.driverId);

    if (!driver) {
      throw new AppError('Unable to find driver', 404);
    }

    try {
      if (userType === 'restaurant') {
        if (order.payout.restaurantPaidOut) {
          console.log(
            'Restaurant has been transferred their amount for this order'
          );
          return;
        }

        if (
          order.payment.stripePaymentintentId &&
          order.restaurantId &&
          order.payout.restaurantRetryNeeded
        ) {
          const transfer = await stripe.transfers.create(
            {
              amount: Math.round(order.pricing.subtotal * 100),
              currency: 'usd',
              destination: restaurant.stripeAccountId,
              description: `Payout for order ${order._id.toString()}`,
              metadata: {
                order_id: order._id.toString(),
                restaurant_id: order.restaurantId.toString(),
                transfer_type: `restaurant_transfer`,
              },
            },
            {
              idempotencyKey: `transfer_${order._id.toString()}_restaurant_transfer`,
            }
          );

          await Order.updateOne(
            {
              _id: order._id,
            },
            {
              $set: {
                'payout.restaurantAmount': transfer.amount
                  ? transfer.amount
                  : 0,
                'payout.restaurantPaidOut': true,
                'payout.restaurantTransferId': transfer.id,
                'payout.restaurantRetryNeeded': false,
                'payout.restaurantTransferCount': 0,
              },
            }
          );
        }
        return { success: 'success transfer retry' };
      } else if (userType === 'driver') {
        if (order.payout.driverPaidOut) {
          console.log('Driver has already been transer amount for this order');
          return;
        }

        if (
          order.payment.stripePaymentintentId &&
          order.driverId &&
          order.payout.driverRetryNeeded
        ) {
          const transer = await stripe.transfers.create(
            {
              amount: Math.round(order.pricing.deliveryFee * 100),
              currency: 'usd',
              destination: driver.stripeAccountId,
              metadata: {
                order_id: order._id.toString(),
                restaurant_id: order.restaurantId.toString(),
                transfer_type: `driver transfer`,
              },
            },
            {
              idempotencyKey: `transfer_${order._id.toString()}_driver_transfer`,
            }
          );

          await Order.updateOne(
            {
              _id: order._id,
            },
            {
              $set: {
                'payout.driverAmount': transer.amount,
                'payout.driverPaidOut': true,
                'payout.driverTransferId': transer.id,
                'payout.driverRetryNeeded': false,
                'payout.driverTransferCount': 0,
              },
            }
          );
        }

        return { success: 'success transfer retry' };
      }
    } catch (error: any) {
      if (userType === 'restaurant') {
        const currentCount = order.payout.restaurantTransferCount || 0;
        if (currentCount >= 5) {
          console.error(
            ` restaurant transfer failed permanently for order ${order._id.toString()}`
          );

          await Order.updateOne(
            {
              _id: order._id,
            },
            {
              $set: {
                'payout.restaurantRetryNeeded': false,
              },
            }
          );

          return;
        } else {
          await Order.updateOne(
            {
              _id: order._id,
            },
            {
              $inc: { 'payout.restaurantTransferCount': 1 },
            }
          );

          const delay = 15 * 60 * 1000 * Math.pow(2, currentCount);
          await retryTransferPaymentQueue.add(
            'retryTransferWorker',
            {
              orderId: order._id,
              userType: 'restaurant',
              reason: 'restaurant transfer',
            },
            {
              delay,
            }
          );
        }
      } else if (userType === 'driver') {
        const currentCount = order.payout.driverTransferCount || 0;
        if (currentCount >= 5) {
          console.log(
            `driver transfer failed permanently for order ${order._id.toString()}`
          );

          if (order.payout.driverTransferCount >= 5) {
            await Order.updateOne(
              {
                _id: order._id,
              },
              {
                $set: {
                  'payout.driverRetryNeeded': false,
                },
              }
            );
          }
        } else {
          await Order.updateOne(
            {
              _id: order._id,
            },
            {
              $inc: { 'payout.driverTransferCount': 1 },
            }
          );
          const delay = 15 * 60 * 1000 * Math.pow(2, currentCount);
          await retryTransferPaymentQueue.add(
            'retryTransferWorker',
            {
              orderId: order._id,
              userType: 'driver',
              reason: 'driver transfer',
            },
            {
              delay,
            }
          );
        }
      }
    }
  },
  {
    connection: redisConnection,
    concurrency: config.bullmq.concurrency,
  }
);

retryTransferWorker.on('completed', (job) => {
  console.log(`retry transfer worker with ${job.id} completed`);
});

retryTransferWorker.on('failed', (job, error) => {
  console.log(`retry Transfer worker with ${job?.id}`, error);
});

retryTransferPaymentQueue.on('progress', (job, progress) => {
  console.log(`retry transfer worker with id ${job.id} progress: ${progress}`);
});

process.on('SIGTERM', async () => {
  await retryTransferWorker.close();
  await redisConnection.quit();
});

export { retryTransferWorker };
