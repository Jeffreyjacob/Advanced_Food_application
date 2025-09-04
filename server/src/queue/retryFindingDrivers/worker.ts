import { Job, Worker } from 'bullmq';
import { IOrder, IRestaurant } from '../../interface/models/models';
import { redisConnection } from '../../config/redisConfig';
import config from '../../config/config';
import { Order } from '../../models/order';
import { AppError } from '../../utils/appError';
import { Restaurant } from '../../models/restaurant';
import { Driver } from '../../models/driver';
import {
  OrderStatusEnum,
  RequestStatusEnum,
  RestaurantVerificationStatusEnum,
} from '../../interface/enums/enums';
import { DriverRequest } from '../../models/driverRequest';
import { expiredRequestQueue } from '../expiredRequest/queue';
import { retryFindDriverQueue } from './queue';
import { emailQueue } from '../email/queue';
import { CustomerNoDriverFind } from '../../utils/EmailTemplate/customerNoDriver';
import { previousDriversManager } from '../../utils/redisPreviousDriversManager';
import { stripe } from '../../config/stripe';
import Stripe from 'stripe';
import { handleRefundedAndTransfer } from '../../utils/helper';

interface RetryFindDriver {
  orderId: IOrder['_id'];
  restaurantId: IRestaurant['_id'];
}

const retryFindDriver = new Worker(
  'retryFindDriver',
  async (job: Job<RetryFindDriver>) => {
    const { orderId, restaurantId } = job.data;

    try {
      const order = await Order.findById(orderId);
      if (!order) {
        throw new AppError('Unable to find order', 404);
      }

      const restaurant = await Restaurant.findById(restaurantId);
      if (!restaurant) {
        throw new AppError('Restaurant was not found', 404);
      }

      // get Previous driver from redis

      const previousDrivers = await previousDriversManager.getDrivers(
        order._id.toString()
      );

      // find a new driver around and send them a request
      const radiusKm = 5 * 1000;
      const nearByDriver = await Driver.find({
        isOnline: true,
        verificationStatus: RestaurantVerificationStatusEnum.Approved,
        avaliableForPickup: true,
        _id: { $nin: previousDrivers },
        traceableLocation: {
          $near: {
            $geometry: restaurant.traceableLocation,
            $maxDistance: radiusKm,
          },
        },
      }).lean();

      if (nearByDriver.length === 0) {
        // Check retry limit only when no drivers are found
        if (order.retryFindDriver >= 3) {
          await Order.updateOne(
            {
              _id: order._id,
            },
            {
              $set: {
                status: OrderStatusEnum.no_drivers_available,
                retryFindDriver: 0,
              },
            }
          );

          const customerHtml = CustomerNoDriverFind({
            restauarantName: order.restaurantDetails.name,
            customerName: order.customerDetails.name,
            orderId: order._id,
          });

          await emailQueue.add('email', {
            to: order.customerDetails.email,
            subject: 'Order update',
            html: customerHtml,
            template: 'Order update',
          });

          // clean up redis Data

          await previousDriversManager.deleteDriver(order._id.toString());

          // refund the customer their delivery fee and transfer money to restaurant

          await handleRefundedAndTransfer({
            order,
            restaurantStripeId: restaurant.stripeAccountId,
            refundAmount: Math.round(order.pricing.deliveryFee * 100),
            transferAmount: Math.round(order.pricing.subtotal * 100),
            refundReason: 'no_driver_available_pickup',
            transferType: 'customer_pickup_payment',
          });

          return {
            success: true,
            message: 'Order marked as no drivers available',
          };
        }

        // Schedule another retry after 15 minutes
        await retryFindDriverQueue.add(
          'retryFindDriver',
          {
            orderId: order._id,
            previousDrivers: previousDrivers,
            restaurantId: restaurant._id,
          },
          {
            delay: 15 * 60 * 1000, // 15 minutes delay
          }
        );

        await Order.updateOne(
          {
            _id: order._id,
          },
          {
            $inc: {
              retryFindDriver: 1,
            },
          }
        );

        return {
          success: true,
          message: 'No drivers found, scheduled retry in 15 minutes',
        };
      }

      // Driver found - create new request
      const driverRequest = await DriverRequest.create({
        orderId: order._id,
        requestStatus: RequestStatusEnum.pending,
        driver: nearByDriver[0]._id,
        restaurantLocation: restaurant.traceableLocation,
        distanceToCustomer: order.deliveryMetrics.distanceKm,
        estimatedPickupTime: 15,
      });

      const requestJobId = await expiredRequestQueue.add(
        'expiredRequest',
        {
          orderId: order._id,
          requestId: driverRequest._id,
          requestType: 'Driver',
        },
        {
          delay: new Date(driverRequest.expiresAt).getTime() - Date.now(),
        }
      );

      await DriverRequest.updateOne(
        {
          _id: driverRequest._id,
        },
        {
          $set: {
            requestJobId: requestJobId.id,
          },
        }
      );

      return {
        success: true,
        message: 'Driver found and request created successfully',
      };
    } catch (error: any) {
      console.error(
        `Failed to retry finding driver for order ${orderId}:`,
        error
      );
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: config.bullmq.concurrency,
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  }
);

retryFindDriver.on('completed', (job) => {
  console.log(`retryFindDriverJob with id ${job.id} completed`);
});

retryFindDriver.on('failed', (job, err) => {
  console.error(`retryFindDriverJob with id ${job?.id} failed`, err);
});

retryFindDriver.on('progress', (job, progress) => {
  console.log(`retryFindDriverJob with id ${job.id} progress: ${progress}%`);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down retry find driver worker');
  await retryFindDriver.close();
  await redisConnection.quit();
});

export { retryFindDriver };
