import { Server, Socket } from 'socket.io';

import cookie from 'cookie';
import { VerifyAccessToken } from './utils/token.utils';
import { RoleEnums } from './interface/enums/enums';
import { ICustomer, IRestaurantOwner } from './interface/models/models';
import { emailQueue } from './queue/email/queue';
import { Customer } from './models/customer';
import { OrderAccepted } from './utils/EmailTemplate/orderAccepted';
import { getConfig } from './config/config';

const config = getConfig();
interface CustomSocket extends Socket {
  userId?: string;
  userType?: RoleEnums;
  isAuthenticated?: boolean;
}

interface OrderPlaced {
  customerId: ICustomer['_id'];
  restaurantOwner: IRestaurantOwner['_id'];
  orderId: string;
}

interface OrderCancelled {
  customerId: ICustomer['_id'];
  restaurantOwner: IRestaurantOwner['_id'];
  orderId: string;
  reason?: string;
}

interface OrderAccepted {
  customerId: ICustomer['_id'];
  restaurantOwner: IRestaurantOwner['_id'];
  orderId: string;
  restaurantName: string;
  preparationTime: number;
  message: 'Great your order has been accepted.';
  timeStamp: Date;
}

interface OrderRejected {
  customerId: ICustomer['_id'];
  restaurantOwner: IRestaurantOwner['_id'];
  orderId: string;
  reason: string;
}

interface OrderReadyForPickup {
  orderId: string;
  restaurantOwner: IRestaurantOwner['_id'];
  restaurantName: string;
  restaurantAddress: string;
  customerId: ICustomer['_id'];
  customerAddress: string;
}

let io: Server;
let onlineUsers = new Map(); //userId -> userInfo + socket details

const setupCustomerEvent = (socket: CustomSocket) => {
  socket.on('order:place', async (orderData: OrderPlaced) => {
    console.log(` customer ${socket.userId} placed order`);

    try {
      // Send to specific restaurant

      io.to(`${RoleEnums.Restaurant_Owner}:${orderData.restaurantOwner}`).emit(
        'order:new_incoming',
        {
          ...orderData,
          message: 'New Order recieved! Please accept or reject.',
          soundAlert: true,
        }
      );

      console.log('Notifed restaurant about new order');
    } catch (error: any) {
      console.error('Error placing order:', error);
    }
  });

  socket.on('order:cancel', async (data: OrderCancelled) => {
    console.log(`Customer ${socket.userId} cancelling order ${data.orderId}`);

    io.to(`${RoleEnums.Restaurant_Owner}:${data.restaurantOwner}`).emit(
      'order:cancelled_by_customer',
      {
        orderId: data.orderId,
        customerId: data.customerId,
        reason: data?.reason,
      }
    );
  });
};

const setupDriverEvents = (socket: CustomSocket) => {};

const setupRestaurantEvents = (socket: CustomSocket) => {
  console.log('setting up restaurant events');

  socket.on('order:accept', async (data: OrderAccepted) => {
    console.log(`Restaurant ${socket.userId} accepted order ${data.orderId}`);

    try {
      io.to(`${RoleEnums.Customer}:${data.customerId}`).emit(
        'order:accepted_by_restaurant',
        {
          ...data,
        }
      );

      const findCustomer = await Customer.findById(data.customerId);

      if (findCustomer) {
        const html = OrderAccepted({
          restaurantName: data.restaurantName,
          customerName: findCustomer.firstName,
          preparationTime: data.preparationTime,
          orderId: data.orderId,
        });

        await emailQueue.add('order accepted', {
          to: findCustomer.email,
          subject: `Your Order has been accepted from ${data.restaurantName}`,
          body: html,
          template: 'Your Order has been accepted',
        });
      }

      if (!findCustomer) {
        console.log(
          'Unable to find customer information after accepting order'
        );
      }
    } catch (error: any) {
      console.error('❌ Error accepting order:', error);
      socket.emit('order:error', {
        message: 'Failed to accept order. Please try again.',
      });
    }
  });

  socket.on('order:reject', async (data: OrderRejected) => {
    console.log(
      `Restaurant ${data.restaurantOwner} rejected rejected order ${data.orderId}`
    );

    try {
      io.to(`${RoleEnums.Customer}:${data.customerId}`).emit(
        'order:rejected_by_restaurant',
        {
          ...data,
          soundAlert: true,
        }
      );
    } catch (error: any) {
      console.error('❌ Error rejecting order:', error);
    }
  });

  socket.on('order:ready_for_pickup', async (data: OrderReadyForPickup) => {
    try {
      // notify customer that order is ready and looking for driver to pick it up
      io.to(`${RoleEnums.Customer}:${data.customerId}`).emit(
        'order:ready_for_pickup',
        {
          ...data,
        }
      );
    } catch (error: any) {}
  });
};

const joinUserToRooms = (socket: CustomSocket) => {
  const personalRoom = `${socket.userType?.toLowerCase()}:${socket.userId}`;
  socket.join(personalRoom);

  socket.join(`${socket.userType?.toLowerCase()}s`);

  if (socket.userType === RoleEnums.Driver) {
    socket.join('available_drivers');
    console.log('Driver joined available drivers rooms');
  }

  if (socket.userType === RoleEnums.Restaurant_Owner) {
    socket.join('active_restaurants');
    console.log('Restaurant joined active restaurants room');
  }

  console.log(
    `User joined rooms: ${personalRoom}, ${socket.userType?.toLowerCase()}s`
  );
};

const setupUserEvents = (socket: CustomSocket) => {
  if (socket.userType === RoleEnums.Customer) {
    setupCustomerEvent(socket);
  } else if (socket.userType === RoleEnums.Driver) {
    setupDriverEvents(socket);
  } else if (socket.userType === RoleEnums.Restaurant_Owner) {
    setupRestaurantEvents(socket);
  }
};

const setupCommonEvents = (socket: CustomSocket) => {};

const handleDisconnect = (socket: CustomSocket) => {
  if (socket.userId) {
    onlineUsers.delete(socket.userId);
    console.log(`User ${socket.userId} removed from online users`);
  }
};

const setUpAuthentication = () => {
  console.log('Settinh up authentication...');

  io.use(async (socket: CustomSocket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie;
      if (!cookieHeader) {
        throw new Error('No Cookie found');
      }

      const cookies = cookie.parse(cookieHeader);
      const token = cookies.accessToken;

      if (!token) {
        throw new Error('No auth token found');
      }

      const decoded = VerifyAccessToken(token);

      socket.userId = decoded.id;
      socket.userType = decoded.userType;
      socket.isAuthenticated = true;

      console.log(`User authenticated: ${socket.userType}:${socket.userId}`);
      next();
    } catch (error: any) {
      console.log('Auth failed', error.mesage);
      next(new Error('Authentication failed'));
    }
  });
};

const setupConnectionHander = () => {
  console.log('setting up connection handlers...');

  io.on('connection', (socket: CustomSocket) => {
    console.log(`${socket.userType} connected: ${socket.userId}`);

    onlineUsers.set(socket.userId, {
      userId: socket.userId,
      userTpe: socket.userType,
      socketId: socket.id,
      joinedAt: new Date(),
    });

    joinUserToRooms(socket);
    setupCommonEvents(socket);
    setupUserEvents(socket);

    socket.on('disconnect', (reason) => {
      console.log(
        ` ${socket.userType}: ${socket.userId} disconnected  - ${reason}`
      );

      handleDisconnect(socket);
    });
  });
};

const setupSocket = (server: any) => {
  console.log('Setting up socket.IO server (single server mode)....');

  io = new Server(server, {
    cors: {
      origin: config.security.cors.origin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  setUpAuthentication();
  setupConnectionHander();
};
