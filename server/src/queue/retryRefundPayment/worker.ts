import { Job, Worker } from 'bullmq';
import { IOrder } from '../../interface/models/models';
import { redisConnection } from '../../config/redisConfig';
import config from '../../config/config';
import { Order } from '../../models/order';
import { stripe } from '../../config/stripe';
import { AppError } from '../../utils/appError';
import { OrderStatusEnum, RoleEnums } from '../../interface/enums/enums';
import { retryRefundPayment } from './queue';
import Stripe from 'stripe';

interface RetryRefundData {
  orderId: IOrder['_id'];
  refundType: 'full_refund' | 'delivery_refund';
  reason?: string;
}

const retryRefundPaymentWorker = new Worker(
  'retryRefundPayment',
  async (job: Job<RetryRefundData>) => {
    const { orderId, refundType, reason } = job.data;

    const order = await Order.findById(orderId);
    if (!order) {
      throw new AppError('order was not found', 404);
    }

    if (!order.payout.retryNeeded) {
      console.log(`Order ${orderId} refund already processed or cancelled`);
      return;
    }
    if (order.payout.refundId) {
      console.log(
        `Order ${orderId} already has refundId=${order.payout.refundId}`
      );
      return;
    }
    try {
      let refund: Stripe.Response<Stripe.Refund> | null = null;
      if (refundType === 'full_refund' && order.payout.retryNeeded) {
        if (order.payment.stripePaymentintentId) {
          refund = await stripe.refunds.create(
            {
              payment_intent: order.payment.stripePaymentintentId,
              amount: Math.round(order.pricing.total * 100),
              reason:
                (reason as Stripe.RefundCreateParams.Reason) ||
                'requested_by_customer',
              metadata: {
                order_id: order._id.toString(),
                refund_reason: reason || 'expired_restaurant_request',
              },
            },
            {
              idempotencyKey: `refund_${order._id}_${reason || 'expired_restaurant_request'}`,
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
                reason: reason ? reason : 'Restaurant request expired',
                cancelledAt: new Date(),
                refundedAmount: order.pricing.total,
              },
              'payout.refundId': refund?.id,
              'payout.retryNeeded': false,
              'payout.retryCount': 0,
              'payout.lastAttempt': new Date(),
            },
          }
        );
        return { success: 'success refund retry' };
      } else if (refundType === 'delivery_refund' && order.payout.retryNeeded) {
        if (order.payment.stripePaymentintentId) {
          refund = await stripe.refunds.create(
            {
              payment_intent: order.payment.stripePaymentintentId,
              amount: Math.round(order.pricing.deliveryFee * 100),
              reason:
                (reason as Stripe.RefundCreateParams.Reason) ||
                'requested_by_customer',
              metadata: {
                order_id: order._id.toString(),
                refund_reason: reason || 'no_driver_available_pickup',
              },
            },
            {
              idempotencyKey: `refund_${order._id}_${reason || 'no_driver_available_pickup'}`,
            }
          );

          await Order.updateOne(
            {
              _id: order._id,
            },
            {
              $set: {
                'payout.refundId': refund?.id,
                'payout.lastAttempt': new Date(),
                'payout.retryNeeded': false,
                'payout.retryCount': 0,
              },
            }
          );
        }
      }
    } catch (error: any) {
      if (order.payout.retryCount >= 5) {
        console.error(`Refund failed permanently for order ${orderId}`);
        await Order.updateOne(
          { _id: orderId },
          {
            $set: {
              'payout.retryNeeded': false, // stop retrying
            },
          }
        );
        return; // exit this retry attempt
      } else {
        await Order.updateOne(
          { _id: orderId },
          { $inc: { 'payout.retryCount': 1 } }
        );

        await retryRefundPayment.add(
          'retryRefundPayment',
          {
            orderId: order._id,
            refundType: refundType,
          },
          {
            delay: 15 * 60 * 1000,
          }
        );
      }
    }
  },
  {
    connection: redisConnection,
    concurrency: config.bullmq.concurrency,
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  }
);

retryRefundPaymentWorker.on('completed', (job) => {
  console.log(`retryRefundPaymentWorker with id completed`);
});

retryRefundPaymentWorker.on('failed', (Job, error) => {
  console.error(`retryRefundPaymentWorker with ${Job?.id} failed`, error);
});

retryRefundPaymentWorker.on('progress', (job, progress) => {
  console.log(
    `retryRefundPaymentWorker with id ${job?.id} progress: ${progress}`
  );
});

process.on('SIGTERM', async () => {
  console.log('Shutting down retry find driver worker');
  await retryRefundPaymentWorker.close();
  await redisConnection.quit();
});

export { retryRefundPaymentWorker };
