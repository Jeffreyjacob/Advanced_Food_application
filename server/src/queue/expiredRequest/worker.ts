import { Job, Worker } from 'bullmq';
import { IBaseRequest, IOrder } from '../../interface/models/models';
import { redisConnection } from '../../config/redisConfig';
import config from '../../config/config';
import { RestaurantRequest } from '../../models/restaurantRequest';
import mongoose from 'mongoose';
import { AppError } from '../../utils/appError';
import { Order } from '../../models/order';
import {
  OrderStatusEnum,
  RequestStatusEnum,
  RestaurantVerificationStatusEnum,
  RoleEnums,
} from '../../interface/enums/enums';
import { emailQueue } from '../email/queue';
import { ExpiredRestaurantRequest } from '../../utils/EmailTemplate/expiredRestaurantRequest';
import { stripe } from '../../config/stripe';
import Stripe from 'stripe';
import { DriverRequest } from '../../models/driverRequest';
import { Driver } from '../../models/driver';
import { Restaurant } from '../../models/restaurant';
import { expiredRequestQueue } from './queue';
import { CustomerNoDriverFind } from '../../utils/EmailTemplate/customerNoDriver';
import { RestaurantNoDriver } from '../../utils/EmailTemplate/restaurantNoDriver';
import { retryFindDriverQueue } from '../retryFindingDrivers/queue';
import { previousDriversManager } from '../../utils/redisPreviousDriversManager';
import { handleRefundedAndTransfer } from '../../utils/helper';
import { retryRefundPayment } from '../retryRefundPayment/queue';

interface ExpiredRequestData {
  orderId: IOrder['_id'];
  requestId: IBaseRequest['_id'];
  requestType: 'Restaurant' | 'Driver';
}

const expiredRequestWorker = new Worker(
  'expiredRequest',
  async (job: Job<ExpiredRequestData>) => {
    const { requestId, requestType, orderId } = job.data;
    try {
      if (requestType === 'Restaurant') {
        const request = await RestaurantRequest.findOne({
          _id: new mongoose.Types.ObjectId(requestId),
        });

        if (!request) {
          throw new AppError('Request was not found', 404);
        }

        const order = await Order.findOne({
          _id: new mongoose.Types.ObjectId(orderId),
        });

        if (!order) {
          throw new AppError('order was not found', 404);
        }

        // if the restaurant request is still pending after expired request time, update the request to expired and also send customer a email and also refunded the customer
        if (request.requestStatus === RequestStatusEnum.pending) {
          const updatedRequest = await RestaurantRequest.updateOne(
            {
              _id: new mongoose.Types.ObjectId(requestId),
            },
            {
              $set: {
                requestStatus: RequestStatusEnum.expired,
              },
              $unset: {
                requestJobId: 1,
              },
            }
          );

          if (!updatedRequest) {
            throw new AppError('Unable to update restaurant Request', 400);
          }

          // send email to customer that their order request has expired.
          const html = ExpiredRestaurantRequest({
            orderId: order._id,
            restaurantName: order.restaurantDetails.name,
            totalAmount: order.pricing.total,
            expiredTime: new Date().toDateString(),
            itemCount: order.items.length,
          });

          await emailQueue.add('Request Expired', {
            to: order.customerDetails.email,
            subject: 'Order Request Expired',
            body: html,
            template: 'Order Request Expired ',
          });

          // refunded the customer back their money
          let refundCustomer = null;
          try {
            if (order.payment.stripePaymentintentId) {
              refundCustomer = await stripe.refunds.create(
                {
                  payment_intent: order.payment.stripePaymentintentId,
                  amount: Math.round(order.pricing.total * 100),
                  reason: 'requested_by_customer',
                  metadata: {
                    order_id: order._id.toString(),
                    refund_reason: 'expired_restaurant_request',
                  },
                },
                {
                  idempotencyKey: `refund_${order._id.toString()}_expired_restaurant_request`,
                }
              );
            }

            // update order to status to cancelled
            await Order.updateOne(
              {
                _id: order._id,
              },
              {
                $set: {
                  status: OrderStatusEnum.cancelled,
                  cancellation: {
                    cancelledBy: RoleEnums.Admin,
                    reason: 'Restaurant request expired',
                    cancelledAt: new Date(),
                    refundedAmount: order.pricing.total,
                  },
                  'payout.refundId': refundCustomer?.id,
                  'payout.retryNeeded': false,
                  'payout.lastAttempt': new Date(),
                  'payout.retryCount': 0,
                },
              }
            );
          } catch (error: any) {
            await Order.updateOne(
              {
                _id: order._id,
              },
              {
                $set: {
                  'payout.retryNeeded': true,
                  'payout.lastAttempt': new Date(),
                },
                $inc: {
                  'payout.retryCount': 1,
                },
              }
            );

            await retryRefundPayment.add(
              'retryRefundPayment',
              {
                orderId: order._id,
                refundType: 'full_refund',
              },
              {
                delay: 15 * 60 * 1000,
              }
            );
          }
        }
      } else if (requestType === 'Driver') {
        const order = await Order.findOne({
          _id: new mongoose.Types.ObjectId(orderId),
        });

        if (!order) {
          throw new AppError('order was not found', 404);
        }

        const request = await DriverRequest.findOne({
          _id: new mongoose.Types.ObjectId(requestId),
        });

        if (!request) {
          throw new AppError('Driver request not found ', 404);
        }

        const restaurant = await Restaurant.findById(order.restaurantId);

        if (!restaurant) {
          throw new AppError('Restaurant was not found ', 404);
        }

        if (request.requestStatus === RequestStatusEnum.pending) {
          await DriverRequest.updateOne(
            {
              _id: new mongoose.Types.ObjectId(requestId),
            },
            {
              $set: {
                requestStatus: RequestStatusEnum.expired,
              },
              $unset: {
                requestJobId: 1,
              },
            }
          );

          // Add this driver to previous driver list

          await previousDriversManager.addDriver(
            order._id.toString(),
            request.driver.toString()
          );

          //get all previous drivers
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

          // if no driver found around, check retry limit
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

            // Retry after 15 minutes
            await retryFindDriverQueue.add(
              'retryFindDriver',
              {
                orderId: order._id,
                restaurantId: restaurant._id,
              },
              {
                delay: 15 * 60 * 1000, // 15 minutes
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
          } else {
            // Driver found - create new request
            const driverRequest = await DriverRequest.create({
              orderId: order._id,
              requestStatus: RequestStatusEnum.pending,
              driver: nearByDriver[0]._id,
              restaurantLocation: restaurant.traceableLocation,
              distanceToCustomer: order.deliveryMetrics.distanceKm,
              estimatedPickupTime: 15,
            });

            // Add current driver to previous drivers list
            const updatedPreviousDrivers = [
              ...previousDrivers,
              nearByDriver[0]._id.toString(),
            ];

            const requestJobId = await expiredRequestQueue.add(
              'expiredRequest',
              {
                orderId: order._id,
                requestId: driverRequest._id,
                requestType: 'Driver',
                previousDrivers: updatedPreviousDrivers,
              },
              {
                delay: new Date(driverRequest.expiresAt).getTime() - Date.now(),
              }
            );

            const updateDriverRequest = await DriverRequest.updateOne(
              {
                _id: driverRequest._id,
              },
              {
                $set: {
                  requestJobId: requestJobId.id,
                },
              }
            );

            if (!updateDriverRequest) {
              throw new AppError('Unable to update Driver request', 400);
            }
          }
        }
      }

      return {
        success: true,
        message: 'expired request processed successfully',
      };
    } catch (error: any) {
      console.error(
        `Failed to process expired request with Id ${requestId}`,
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

expiredRequestWorker.on('completed', (job) => {
  console.log(`expiredRequestJob with id ${job.id} completed`);
});

expiredRequestWorker.on('failed', (job, err) => {
  console.error(`expiredRequestJob with id ${job?.id} failed`, err);
});

expiredRequestWorker.on('progress', (job, progress) => {
  console.log(`expiredRequestJob with id ${job.id} progress: ${progress}%`);
});

process.on('SIGTERM', async () => {
  console.log(`Shutting down expired request worker`);
  await expiredRequestWorker.close();
  await redisConnection.quit();
});

export { expiredRequestWorker };
