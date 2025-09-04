import Stripe from 'stripe';
import { IOrderMutation } from '../interface/interface/interface';
import { ICustomer, IOrder } from '../interface/models/models';
import { Cart } from '../models/cart';
import { AppError } from '../utils/appError';
import mongoose from 'mongoose';
import { Order } from '../models/order';
import { Customer } from '../models/customer';
import { Restaurant } from '../models/restaurant';
import { RestaurantOwner } from '../models/restaurantOwner';
import { calculateDeliveryRate } from '../utils/helper';
import { OrderStatusEnum } from '../interface/enums/enums';
import { RestaurantRequest } from '../models/restaurantRequest';
import { expiredRequestQueue } from '../queue/expiredRequest/queue';
import { stripe } from '../config/stripe';
import config from '../config/config';
import { emailQueue } from '../queue/email/queue';
import { CreateOrderHTML } from '../utils/EmailTemplate/createOrder';
import { expiredCheckoutSession } from '../queue/expiredCheckoutSession/queue';

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
            deliveryAddress: data.address,
            pricing: {
              subtotal: subTotal,
              deliveryFee: deliveryFee,
              total: totalCost,
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

      // creating request which would be sent to the restaurant

      const createRestaurantRequest = await RestaurantRequest.create({
        orderId: order._id,
        restauarantId: restaurant._id,
        estimatedPrepTime: estimatedPrepTime,
        restaurantOwner: restaurantOwner?._id,
        requestStatus: OrderStatusEnum.pending_restaurant_acceptance,
      });

      // schedule worker to update the reques to expired and refunded customer, if request is accepted / rejected by the restaurant before the specificed request time
      const requestJobId = await expiredRequestQueue.add('expiredRequest', {
        orderId: order._id,
        requestId: createRestaurantRequest._id,
        requestType: 'Restaurant',
      });

      // update requestJoId

      await RestaurantRequest.updateOne(
        {
          _id: createRestaurantRequest._id,
        },
        {
          requestJobId: requestJobId,
        }
      );

      const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
        await Promise.all(
          cart.items.map(async (cartItem) => {
            return {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: cartItem.name,
                  variantName: cartItem.variantName,
                  images: cartItem.image ? [cartItem.image] : undefined,
                  metadata: {
                    itemId: cartItem.menuItemId.toString(),
                    restaurantId: order.restaurantId.toString(),
                    variantId: cartItem.variantId?.toString() || '',
                  },
                },
                unit_amount: Math.round((cartItem.itemTotal || 0) * 100),
              },
              quantity: cartItem.quantity,
            };
          })
        );

      if (deliveryFee > 0) {
        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Delivery Fee',
              metadata: {
                type: 'delivery_fee',
                orderId: order._id.toString(),
              },
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
          success_url: `${config.frontendUrls}/api/v1/order/successUrl`,
          cancel_url: `${config.frontendUrls}/cart?cancelled=true`,
          metadata: {
            orderId: userId.toString(),
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
        restaurantName: order.customerDetails.name,
        items: order.items,
        subtotal: order.pricing.subtotal,
        deliveryFee: order.pricing.deliveryFee,
        tip: order.pricing.tip,
        total: order.pricing.total,
      });

      await emailQueue.add('email', {
        to: order.customerDetails.email,
        subject: 'Order Created',
        body: html,
        template: 'Order Created',
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
}
