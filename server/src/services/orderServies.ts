import Stripe from 'stripe';
import { IOrderMutation } from '../interface/interface/interface';
import {
  ICustomer,
  IOrder,
  IRestaurantOwner,
  IRestaurantRequest,
} from '../interface/models/models';
import { Cart } from '../models/cart';
import { AppError } from '../utils/appError';
import mongoose from 'mongoose';
import { Order } from '../models/order';
import { Customer } from '../models/customer';
import { Restaurant } from '../models/restaurant';
import { RestaurantOwner } from '../models/restaurantOwner';
import { calculateDeliveryRate } from '../utils/helper';
import {
  OrderStatusEnum,
  RequestStatusEnum,
  RoleEnums,
  StripePaymentStatus,
} from '../interface/enums/enums';
import { stripe } from '../config/stripe';
import { emailQueue } from '../queue/email/queue';
import { CreateOrderHTML } from '../utils/EmailTemplate/createOrder';
import { expiredCheckoutSession } from '../queue/expiredCheckoutSession/queue';
import { RestaurantRequest } from '../models/restaurantRequest';
import { expiredRequestQueue } from '../queue/expiredRequest/queue';
import { OrderAccepted } from '../utils/EmailTemplate/orderAccepted';
import { retryRefundPayment } from '../queue/retryRefundPayment/queue';
import { RejectedTracker } from '../models/rejectedTracker';
import { BannedUser } from '../queue/bannedUser/queue';
import { BannedUserHtml } from '../utils/EmailTemplate/bannedUser';
import { WarningBanEmailHTML } from '../utils/EmailTemplate/warningBanEmail';
import { OrderRejectedEmailHTMl } from '../utils/EmailTemplate/orderjected';

export class OrderServices {
  async createCheckoutSession({
    userId,
    data,
  }: {
    userId: ICustomer['_id'];
    data: IOrderMutation['createCheckoutSession'];
  }): Promise<{ checkoutSession: Stripe.Checkout.Session; order: IOrder }> {
    const customer = await Customer.findOne({
      _id: userId,
    });

    if (!customer) {
      throw new AppError('user with id was not found', 404);
    }
    const cart = await Cart.findOne({
      customerId: userId,
    }).populate({
      path: 'items.menuItemId',
      select: 'preparationTime name price',
    });

    if (!cart) {
      throw new AppError("user cart can't be found", 404);
    }

    if (cart.items.length === 0) {
      throw new AppError('Cart is empty', 400);
    }

    const restaurant = await Restaurant.findById(cart.restaurantId);

    if (!restaurant) {
      throw new AppError('Restaurant was not found', 404);
    }

    const restaurantOwner = await RestaurantOwner.findById(restaurant.owner);

    if (restaurant.isOpen !== true && restaurant.isAcceptingOrders !== true) {
      throw new AppError(
        "You can't make an order the restaurant is currently Closed or not taking orders",
        400
      );
    }
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const subTotal = cart.items.reduce(
        (accum, item) => accum + item.itemTotal,
        0
      );

      // find the distance in kilometer between the customer and restaurant, so i can use it to calculate the delivery fee

      const customerDistanceFromRestaurant = await Customer.aggregate([
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: restaurant.traceableLocation.coordinates as [
                number,
                number,
              ], // [lng, lat]
            },
            distanceField: 'distance', // distance will be added in meters
            spherical: true,
            query: { _id: customer._id },
          },
        },
        {
          $project: {
            name: 1,
            distanceInKm: { $divide: ['$distance', 1000] }, // convert meters → km
          },
        },
      ]);

      const deliveryFee = calculateDeliveryRate(
        customerDistanceFromRestaurant[0].distanceInKm
      );

      const totalCost = subTotal + deliveryFee;

      const totalDishesPreparationTime = cart.items.reduce(
        (accum, item: any) => {
          const menuItem = item.menuItemId;
          return accum + (menuItem?.preparationTime || 0) * item.quantity; // Multiply by quantity for accurate time
        },
        0
      );

      const itemCount = cart.items.length;

      const estimatedPrepTime = Math.ceil(
        totalDishesPreparationTime / itemCount
      );

      const totalDistance =
        customerDistanceFromRestaurant[0].distanceInKm * 1000; // convert distance to m from km
      const speed = 5; // speed is 5 m/s

      // using formula for speed which is distance/ time to find the delivery time with the provided distance

      // Calculate delivery time in seconds, then convert to minutes
      const estimatedDeliveryTimeSeconds = Math.ceil(totalDistance / speed);
      const estimatedDeliveryTime = Math.ceil(
        estimatedDeliveryTimeSeconds / 60
      );

      // creating the order
      const CreateOrder = await Order.create(
        [
          {
            customerId: userId,
            customerDetails: {
              name: customer.firstName,
              phone: customer.phone,
              email: customer.email,
            },
            restaurantId: restaurant._id,
            restaurantDetails: {
              name: restaurant.name,
              address: restaurant.address,
              phone: restaurantOwner?.phone,
            },
            items: cart.items,
            deliveryAddress: {
              ...data.address,
            },
            pricing: {
              subtotal: subTotal,
              deliveryFee: Math.round(deliveryFee),
              total: Math.round(totalCost),
            },
            deliveryMetrics: {
              distanceKm: customerDistanceFromRestaurant[0].distanceInKm,
              estimatedPreptime: estimatedPrepTime,
              estimatedDeliveryTime: estimatedDeliveryTime,
            },
            status: OrderStatusEnum.awaiting_payment,
            statusHistory: [
              {
                status: OrderStatusEnum.awaiting_payment,
                notes: 'Order was just created',
                timestamp: new Date(),
              },
            ],
            orderPlacedAt: new Date(),
          },
        ],
        { session }
      );

      const order = CreateOrder[0];

      const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
        cart.items.map((cartItem) => {
          const unitprice =
            cartItem.variantId && cartItem.variantPrice
              ? cartItem.basePrice + cartItem.variantPrice
              : cartItem.basePrice;
          return {
            price_data: {
              currency: 'usd',
              product_data: {
                name: cartItem.name,
                images: cartItem.image ? [cartItem.image] : undefined,
                description: `variant: ${cartItem.variantName}`,
                metadata: {
                  itemId: cartItem.menuItemId.toString(),
                  restaurantId: order.restaurantId.toString(),
                  variantId: cartItem.variantId?.toString() || '',
                  variantName: cartItem.variantName || '',
                },
              },
              unit_amount: Math.round((unitprice || 0) * 100),
            },
            quantity: cartItem.quantity,
          };
        });

      if (deliveryFee > 0) {
        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Delivery Fee',
              description: 'Delivery fee',
            },
            unit_amount: Math.round(deliveryFee * 100),
          },
          quantity: 1,
        });
      }

      const checkoutSession: Stripe.Checkout.Session =
        await stripe.checkout.sessions.create({
          mode: 'payment',
          payment_method_types: ['card'],
          line_items: lineItems,
          expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
          success_url: `http://localhost:8000/api/v1/order/successUrl`,
          cancel_url: `http://localhost:3000/cart?cancelled=true`,
          metadata: {
            orderId: order._id.toString(),
            userId: userId.toString(),
          },
          payment_intent_data: {
            metadata: {
              userId: userId.toString(),
              orderId: order._id.toString(),
            },
            description: `Order ${order._id} for user ${userId}`,
          },
        });

      const sessionExpirationJobId = await expiredCheckoutSession.add(
        'expiredCheckoutSession',
        {
          orderId: order._id.toString(),
          sessionId: checkoutSession.id,
        },
        {
          delay: 30 * 60 * 1000,
        }
      );

      order.payment.stripeSessionId = checkoutSession.id;
      order.sessionExpirationJobId = sessionExpirationJobId?.id;
      await order.save({ session });

      await session.commitTransaction();

      const html = CreateOrderHTML({
        customerName: order.customerDetails.name,
        orderId: order._id.toString(),
        restaurantName: order.restaurantDetails.name,
        items: order.items,
        subtotal: order.pricing.subtotal,
        deliveryFee: order.pricing.deliveryFee,
        tip: order.pricing.tip ? order.pricing.tip : 0,
        total: order.pricing.total,
      });

      await emailQueue.add('email', {
        to: order.customerDetails.email,
        subject: 'order placed',
        body: html,
        template: 'order placed',
      });

      return { checkoutSession: checkoutSession, order };
    } catch (error: any) {
      console.log(error);
      await session.abortTransaction();
      throw new AppError('Unable to create checkout session', 400);
    } finally {
      session.endSession();
    }
  }

  async updateRestaurantRequest({
    userId,
    requestId,
    data,
  }: {
    userId: IRestaurantOwner['_id'];
    requestId: IRestaurantRequest['_id'];
    data: IOrderMutation['updateRestaurantRequest'];
  }) {
    const request = await RestaurantRequest.findById(requestId);

    if (!request) {
      throw new AppError('Request was not found', 404);
    }

    // check if the request has expired
    if (request.requestStatus === RequestStatusEnum.expired) {
      throw new AppError(
        `This request has expired, you can't updated it anymore`,
        400
      );
    }

    const order = await Order.findById(request.orderId);

    if (!order) {
      throw new AppError('Order was not found', 404);
    }

    const restaurant = await Restaurant.findById(order.restaurantId);

    if (!restaurant) {
      throw new AppError('Restaurant was not found', 404);
    }

    const restaurntOwner = await RestaurantOwner.findById(restaurant.owner);

    if (
      restaurant.banned &&
      (data.status === RequestStatusEnum.accepted ||
        data.status === RequestStatusEnum.rejected)
    ) {
      throw new AppError(
        "You can't accepted or rejected request at the moment, your account is currenctly under 24 hours banned. ",
        400
      );
    }

    if (
      data.status === RequestStatusEnum.accepted &&
      request.requestStatus === RequestStatusEnum.pending &&
      order.status === OrderStatusEnum.pending_restaurant_acceptance
    ) {
      const updateRequest = await RestaurantRequest.findOneAndUpdate(
        {
          _id: request._id,
        },
        {
          $set: {
            requestStatus: RequestStatusEnum.accepted,
          },
        }
      );

      if (!updateRequest) {
        throw new AppError('Unable to update request', 400);
      }

      // remove expired request job

      if (request.requestJobId) {
        const requestJob = await expiredRequestQueue.getJob(
          request.requestJobId
        );

        if (requestJob) {
          await requestJob.remove();
        }
      }

      // update Order

      await Order.updateOne(
        {
          _id: order._id,
        },
        {
          $set: {
            status: OrderStatusEnum.preparing,
            acceptedAt: new Date(),
          },
          $push: {
            statusHistory: {
              status: OrderStatusEnum.preparing,
              note: 'Restaurant accepted order',
              timestamp: new Date(),
            },
          },
        }
      );

      const html = OrderAccepted({
        restaurantName: order.restaurantDetails.name,
        customerName: order.customerDetails.name,
        preparationTime: request.estimatedPrepTime,
        orderId: order._id.toString(),
      });

      await emailQueue.add('order accepted', {
        to: order.customerDetails.email,
        subject: `Your Order has been accepted from ${order.restaurantDetails.name}`,
        body: html,
        template: 'Your Order has been accepted',
      });
    } else if (
      data.status === RequestStatusEnum.rejected &&
      request.requestStatus === RequestStatusEnum.pending &&
      order.status === OrderStatusEnum.pending_restaurant_acceptance
    ) {
      const updateRequest = await RestaurantRequest.findOneAndUpdate(
        {
          _id: request._id,
        },
        {
          $set: {
            requestStatus: RequestStatusEnum.rejected,
            rejectionReason: data.reason ? data.reason : 'restaurant rejected',
          },
        }
      );

      if (!updateRequest) {
        throw new AppError('Unable to update request', 404);
      }

      // refund the customer money back to them

      let refund: Stripe.Response<Stripe.Refund> | null = null;
      try {
        if (
          order.payment.stripePaymentintentId &&
          order.payment.paymentStatus === StripePaymentStatus.succeeded
        ) {
          refund = await stripe.refunds.create(
            {
              payment_intent: order.payment.stripePaymentintentId,
              amount: Math.round(order.pricing.total),
              reason: 'requested_by_customer',
              metadata: {
                order_id: order._id.toString(),
                refund_reason: data.reason || 'restaurant reject request',
              },
            },
            {
              idempotencyKey: `refund_${order._id}_restaurant_request_rejected`,
            }
          );
        }

        await Order.updateOne(
          {
            _id: order._id,
          },
          {
            $set: {
              status: OrderStatusEnum.cancelled,
              cancellation: {
                cancelledBy: RoleEnums.Restaurant_Owner,
                reason: 'Restaurant request rejected',
                cancelledAt: new Date(),
                refundedAmount: order.pricing.total,
              },
              'payout.refundId': refund?.id,
              'payout.retryNeeded': false,
              'payout.lastAttempt': new Date(),
              'payout.retryCount': 0,
            },
            $push: {
              statusHistory: {
                status: OrderStatusEnum.cancelled,
                note: 'Restaurant rejected request',
                timestamp: new Date(),
              },
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

        await retryRefundPayment.add('retryRefundPayment', {
          orderId: order._id,
          refundType: 'full_refund',
          reason: 'restaurant_request_rejected',
        });
      }

      // remove expired request job

      if (request.requestJobId) {
        const requestJob = await expiredRequestQueue.getJob(
          request.requestJobId
        );

        if (requestJob) {
          await requestJob.remove();
        }
      }

      // add reject order to restaurant list

      const newRejectedRequest = await RejectedTracker.create({
        userId: restaurant.owner,
        userType: RoleEnums.Restaurant_Owner,
        orderId: order._id,
      });

      const today = new Date();
      const startofDay = new Date(today).setHours(0, 0, 0, 0);
      const endofDay = new Date(today).setHours(23, 59, 59, 999);

      const rejectedRequestForTheDay = await RejectedTracker.countDocuments({
        userId: restaurant.owner,
        rejectedAt: {
          $gte: startofDay,
          $lte: endofDay,
        },
      });

      // sending warning email to restaurant
      if (rejectedRequestForTheDay == 3) {
        const warningBanHtml = WarningBanEmailHTML({
          userName: restaurntOwner?.firstName || '',
          userType: RoleEnums.Restaurant_Owner,
          rejectionCount: 3,
        });
        await emailQueue.add('email', {
          to: restaurntOwner?.email,
          subject: 'Warning Ban',
          body: warningBanHtml,
          template: 'Warning Ban',
        });
      }

      // update restaurant to banned and also setting the worker to unbanned the restaurant after 24 hourd
      if (rejectedRequestForTheDay >= 5) {
        await Restaurant.updateOne(
          {
            _id: restaurant._id,
          },
          {
            $set: {
              banned: true,
            },
          }
        );

        const bannedHtml = BannedUserHtml({
          userName: order.restaurantDetails.name,
          userType: RoleEnums.Restaurant_Owner,
          rejectionCount: 5,
          suspendedAt: newRejectedRequest.rejectedAt.toDateString(),
          suspensionEnds: new Date(
            newRejectedRequest.rejectedAt.getTime() + 24 * 60 * 60 * 1000
          ).toDateString(),
        });

        await emailQueue.add('email', {
          to: restaurntOwner?.email,
          subject: 'Restaurant has been banned for 24 hours',
          body: bannedHtml,
          template: 'Restaurant has been banned for 24 hours',
        });

        await BannedUser.add(
          'bannedUserWorker',
          {
            userId: restaurant.owner,
            userType: RoleEnums.Restaurant_Owner,
          },
          {
            delay: 24 * 60 * 60 * 1000,
          }
        );
      }

      // notify customer by email that order was rejected

      const rejectedRequestHtml = OrderRejectedEmailHTMl({
        customerName: order.customerDetails.name,
        restaurantName: order.restaurantDetails.name,
        orderId: order._id.toString(),
      });

      await emailQueue.add('email', {
        to: order.customerDetails.email,
        subject: 'Order rejected by Restaurant',
        body: rejectedRequestHtml,
        template: 'Order rejected by Restaurant',
      });
    } else {
      throw new AppError(
        "I'm sorry, you can update this request at the moment, check request or order status",
        400
      );
    }
  }

  async updateOrder({}: {}) {}
}
