import { Request, Response } from 'express';
import Stripe from 'stripe';
import { stripe } from '../config/stripe';
import { Order } from '../models/order';
import mongoose from 'mongoose';
import { Cart } from '../models/cart';
import {
  OrderStatusEnum,
  RequestStatusEnum,
  RoleEnums,
  StripePaymentStatus,
} from '../interface/enums/enums';
import { AppError } from '../utils/appError';
import { expiredCheckoutSession } from '../queue/expiredCheckoutSession/queue';
import { emailQueue } from '../queue/email/queue';
import { RestaurantRequest } from '../models/restaurantRequest';
import { Restaurant } from '../models/restaurant';
import { RestaurantOwner } from '../models/restaurantOwner';
import { expiredRequestQueue } from '../queue/expiredRequest/queue';
import { PaymentSucessfulEmailHTML } from '../utils/EmailTemplate/paymentSuccessful';
import { PaymentFailedEmailHTML } from '../utils/EmailTemplate/paymentFailed';
import { retryRefundPayment } from '../queue/retryRefundPayment/queue';
import { getConfig } from '../config/config';

const config = getConfig();
async function handleCheckoutSessionCompleted(event: Stripe.Event) {
  const sessions = event.data.object as Stripe.Checkout.Session;

  console.log(`Checkout session completed`, sessions.id);

  const { orderId, userId } = sessions.metadata!;

  if (!orderId) {
    console.error('No order id found in session metadata');
    return;
  }

  const mongoSession = await mongoose.startSession();
  mongoSession.startTransaction();

  try {
    const order = await Order.findById(new mongoose.Types.ObjectId(orderId));

    if (!order) {
      console.error(`Order ${orderId} not found`);
      return;
    }

    if (sessions.payment_intent) {
      const paymentIntent = await stripe.paymentIntents.retrieve(
        sessions.payment_intent as string
      );

      order.payment.stripePaymentintentId = paymentIntent.id;

      if (paymentIntent.latest_charge) {
        order.payment.stripeChargeId = paymentIntent.latest_charge as string;
      }
      order.payment.paymentStatus = StripePaymentStatus.succeeded;
      order.payment.paidAt = new Date();
      order.status = OrderStatusEnum.pending_restaurant_acceptance;
      order.statusHistory.push({
        status: OrderStatusEnum.pending_restaurant_acceptance,
        note: 'Order payment confirmed and request has been sent to restaurant',
        timestamp: new Date(),
      });

      await order.save({ session: mongoSession });
    }

    // const findRestaurant

    const restaurant = await Restaurant.findById(order.restaurantId);

    if (!restaurant) {
      console.log('Unable to find restaurant');
      return;
    }

    const restaurantOwner = await RestaurantOwner.findById(restaurant.owner);

    if (!restaurantOwner) {
      console.log('Unable to find restaurant owner');
      return;
    }

    // creating request which would be sent to the restaurant

    const newRestaurantRequest = await RestaurantRequest.create(
      [
        {
          orderId: order._id,
          restaurantId: restaurant._id,
          estimatedPrepTime: order.deliveryMetrics.estimatedPreptime,
          restaurantOwner: restaurantOwner?._id,
          requestStatus: RequestStatusEnum.pending,
        },
      ],
      {
        session: mongoSession,
      }
    );

    const createRestaurantRequest = newRestaurantRequest[0];

    // schedule worker to update the reques to expired and refunded customer, if request is accepted / rejected by the restaurant before the specificed request time
    const requestJobId = await expiredRequestQueue.add(
      'expiredRequest',
      {
        orderId: order._id,
        requestId: createRestaurantRequest._id,
        requestType: 'Restaurant',
      },
      {
        delay:
          new Date(createRestaurantRequest.expiresAt).getTime() - Date.now(),
      }
    );

    // update requestJoId

    await RestaurantRequest.updateOne(
      {
        _id: createRestaurantRequest._id,
      },
      {
        requestJobId: requestJobId?.id,
      },
      {
        session: mongoSession,
      }
    );

    // clear the user cart
    await Cart.findOneAndUpdate(
      {
        customerId: new mongoose.Types.ObjectId(userId),
      },
      {
        $set: {
          items: [],
        },
      },
      { session: mongoSession }
    );

    // remove expiredSession job

    if (order.sessionExpirationJobId) {
      const sessionExpiredJob = await expiredCheckoutSession.getJob(
        order.sessionExpirationJobId
      );
      if (sessionExpiredJob) {
        await sessionExpiredJob.remove();
      }
    }

    await mongoSession.commitTransaction();

    const html = PaymentSucessfulEmailHTML({
      customerName: order.customerDetails.name,
      restaurantName: order.restaurantDetails.name,
      orderId: order._id.toString(),
      subtotal: order.pricing.subtotal,
      total: order.pricing.total,
      deliveryFee: order.pricing.deliveryFee,
    });

    await emailQueue.add('email', {
      to: order.customerDetails.email,
      subject: 'order payment successfully!',
      body: html,
      template: 'order payment successfully!',
    });

    console.log(`Order ${orderId} confirmed successfully`);
  } catch (error: any) {
    console.error(`Error processing completed checkout session`, error);
    await mongoSession.abortTransaction();
    throw new AppError('Error processing completed checkout session', 400);
  } finally {
    mongoSession.endSession();
  }
}

async function handlePaymentIntentFailedd(event: Stripe.Event) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;

  console.log('Payment intent failed', paymentIntent.id);

  const { orderId } = paymentIntent.metadata!;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await Order.findById(orderId);

    if (!order) {
      console.error(`Order ${orderId}`);
      return;
    }

    await Order.updateOne(
      {
        _id: order?._id,
      },
      {
        $set: {
          status: OrderStatusEnum.cancelled,
          payment: {
            paymentStatus: StripePaymentStatus.failed,
          },
          cancellation: {
            cancelledBy: RoleEnums.Admin,
            reason: 'Payment failed',
            cancelledAt: new Date(),
          },
        },
        $push: {
          statusHistory: {
            status: StripePaymentStatus.failed,
            note: 'Payment failed',
            timestamp: new Date(),
          },
        },
      },
      {
        session,
      }
    );

    if (order.sessionExpirationJobId) {
      const sessionExpiredJob = await expiredCheckoutSession.getJob(
        order.sessionExpirationJobId
      );
      if (sessionExpiredJob) {
        await sessionExpiredJob.remove();
      }
    }

    await session.commitTransaction();

    const html = PaymentFailedEmailHTML({
      customerName: order.customerDetails.name,
      orderId: order._id.toString(),
    });

    await emailQueue.add('email', {
      to: order.customerDetails.email,
      subject: 'order Payment failed',
      body: html,
      template: 'order Payment failed',
    });

    console.log(`Order with id ${order._id.toString()} failed`);
  } catch (error: any) {
    console.error(`Error processing failed payment `, error);
    await session.abortTransaction();
    throw new AppError('Error processing failed payment ', 400);
  } finally {
    session.endSession();
  }
}

async function handlePaymentIntentCancelled(event: Stripe.Event) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;

  const { orderId, userId } = paymentIntent.metadata!;

  if (!orderId) {
    console.error('No OrderId found in canceled payment intent metadata');
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const order = await Order.findById(orderId);

    if (!order) {
      console.log('Order was not found');
      return;
    }

    if (
      order.status !== OrderStatusEnum.pending_restaurant_acceptance &&
      order.status !== OrderStatusEnum.payment_expired
    ) {
      console.log("You can't cancel already prepared order");
      return;
    }

    if (
      order.payment.paymentStatus === StripePaymentStatus.succeeded &&
      order.payment.stripeChargeId
    ) {
      try {
        await stripe.refunds.create({
          charge: order.payment.stripeChargeId,
          metadata: {
            orderId: order._id.toString(),
            reason: 'Order payment cancelled',
          },
        });
      } catch (error: any) {
        console.log('Unable to refund payment, would retry shortly');

        await Order.updateOne(
          {
            _id: order._id,
          },
          {
            $set: {
              'payout.retryNeeded': true,
              'payment.lastAttempt': new Date(),
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
            reason: 'order_cancelled_customer',
          },
          {
            delay: 15 * 60 * 1000,
          }
        );
      }
    }

    await Order.updateOne(
      {
        _id: order._id,
      },
      {
        $set: {
          status: OrderStatusEnum.cancelled,
          payment: {
            paymentStauts: StripePaymentStatus.cancelled,
          },
          cancellation: {
            cancelledBy: RoleEnums.Admin,
            reason: 'order cancelled by customer',
            cancelledAt: new Date(),
          },
        },
      },
      { session }
    );

    console.log('order cancelled succesfully!');
  } catch (error: any) {
    await session.abortTransaction();
    throw new AppError('Unable to cancel order', 404);
  } finally {
    session.endSession();
  }
}

async function handleChargedFailed(event: Stripe.Event) {
  const charge = event.data.object as Stripe.Charge;
  console.log('Charged failed', charge.id);

  const order = await Order.findOne({
    'payment.stripePaymentintentId': charge.payment_intent,
  });

  if (order && order.payment.paymentStatus !== StripePaymentStatus.failed) {
    order.payment.paymentStatus = StripePaymentStatus.failed;
    order.cancellation.cancelledAt = new Date();
    ((order.cancellation.cancelledBy = RoleEnums.Customer), await order.save());
  }
}

export const handleStripeWebhookPayment = async (
  req: Request,
  res: Response
) => {
  let event: Stripe.Event;

  try {
    const sig = req.headers['stripe-signature'] as string;
    const endpointSecret = config.stripe.stripe_webhook_payment!;

    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (error: any) {
    console.log(`Payment Webhook signature verification failed.`, error);
    return res.status(400).send(`Payment webhook Error:${error}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailedd(event);
        break;

      case 'payment_intent.canceled':
        await handlePaymentIntentCancelled(event);
        break;

      case 'charge.failed':
        await handleChargedFailed(event);
        break;
    }

    res.json({ recieved: true });
  } catch (error: any) {
    console.error(`Error handling webhook ${event.type}:`, error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
};
