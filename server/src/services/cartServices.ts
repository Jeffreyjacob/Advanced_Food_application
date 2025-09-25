import mongoose from 'mongoose';
import { ICartMutation } from '../interface/interface/interface';
import { ICart, ICartItem, ICustomer } from '../interface/models/models';
import { Restaurant } from '../models/restaurant';
import { AppError } from '../utils/appError';
import { MenuItem } from '../models/menuItem';
import { Cart } from '../models/cart';
import { updateCartItemTypeEnum } from '../interface/enums/enums';

export class CartService {
  async addToCart({
    userId,
    data,
  }: {
    userId: ICustomer['_id'];
    data: ICartMutation['addToCart'];
  }) {
    const { restaurantId } = data;

    const restaurant = await Restaurant.findOne({
      _id: new mongoose.Types.ObjectId(restaurantId),
    });

    if (!restaurant) {
      throw new AppError('restaurant was not found', 404);
    }

    const cartItems: ICartItem[] = [];

    if (data.items && data.items.length > 0) {
      const menuItemIds = data.items.map((item) => item.menuItemId);
      const checkMenuItemId = await MenuItem.find({
        _id: { $in: menuItemIds },
      });

      const foundMenuItemId = checkMenuItemId.map((menuItem) =>
        menuItem._id.toString()
      );

      const notFoundMenuItemId = data.items.filter(
        (item) => !foundMenuItemId.includes(item.menuItemId.toString())
      );

      if (notFoundMenuItemId && notFoundMenuItemId.length > 0) {
        throw new AppError(
          `menuitemid ${notFoundMenuItemId.join(', ')} was not found `,
          404
        );
      }

      let invalidVariantId: string[] = [];

      data.items.forEach((item) => {
        if (item.variantId) {
          const menuItem = checkMenuItemId.find(
            (m) => m._id.toString() === item.menuItemId.toString()
          );

          const variantExist = menuItem?.variants.some(
            (v) => v._id?.toString() === item.variantId?.toString()
          );

          if (!variantExist) {
            invalidVariantId.push(item.variantId.toString());
          }

          const variant = menuItem?.variants.find(
            (v) => v._id?.toString() === item.variantId?.toString()
          );

          cartItems.push({
            ...item,
            itemTotal:
              (item.basePrice + (item.variantPrice || 0)) * item.quantity,
          });
        } else {
          cartItems.push({
            ...item,
            itemTotal: item.basePrice * item.quantity,
          });
        }
      });

      if (invalidVariantId.length > 0) {
        throw new AppError(
          `Variant id ${invalidVariantId.join(', ')} was not found `,
          404
        );
      }
    }

    const findCart = await Cart.findOne({
      customerId: new mongoose.Types.ObjectId(userId),
    });

    if (findCart) {
      if (findCart.restaurantId.toString() !== data.restaurantId.toString()) {
        findCart.items = [];
        await findCart.save();
        const updateCart = await Cart.findOneAndUpdate(
          {
            customerId: userId,
          },
          {
            $set: {
              restaurantId: data.restaurantId,
              items: cartItems,
            },
          },
          {
            new: true,
          }
        );

        if (!updateCart) {
          throw new AppError('Unable to update cart', 400);
        }

        return {
          message: 'Cart updated successfully!',
          data: updateCart,
        };
      } else if (
        findCart.restaurantId.toString() === data.restaurantId.toString()
      ) {
        console.log('customer and restaurant existing');
        // same restaurant  - merge items efficiently in memory
        const itemsMap = new Map();

        // add existing items to map

        findCart.items.forEach((item: any) => {
          const key = `${item.menuItemId}_${item.variantId || null}`;
          itemsMap.set(key, { ...item.toObject() });
        });

        // Process new Items

        cartItems.forEach((newItem: any) => {
          const key = `${newItem.menuItemId}_${newItem.variantId || null}`;

          if (itemsMap.has(key)) {
            itemsMap.get(key).quantity += newItem.quantity;
            itemsMap.get(key).itemTotal +=
              newItem.basePrice + (newItem.variantPrice || 0);
          } else {
            itemsMap.set(key, newItem);
          }
        });

        const mergedItems = Array.from(itemsMap.values());

        const updateCart = await Cart.findOneAndUpdate(
          {
            customerId: userId,
          },
          {
            $set: { items: mergedItems },
          },
          {
            new: true,
          }
        );

        if (!updateCart) {
          throw new AppError('Unable to update cart', 400);
        }

        return {
          message: 'Cart updated successfully!',
          data: updateCart,
        };
      }
    } else {
      const createCart = await Cart.create({
        customerId: userId,
        restaurantId,
        items: cartItems,
      });

      return {
        message: 'Cart updated successfully!',
        data: createCart,
      };
    }
  }

  async updateCartItem({
    userId,
    cartItemId,
    data,
  }: {
    userId: ICustomer['_id'];
    cartItemId: ICartItem['_id'];
    data: ICartMutation['updateCartItem'];
  }) {
    const { updateCartItemType } = data;
    const customerId = new mongoose.Types.ObjectId(userId);
    const restaurantId = new mongoose.Types.ObjectId(data.restaurantId);

    const findCart = await Cart.findOne({
      customerId,
      restaurantId,
    });

    console.log(findCart, 'find  user cart', data.quantity, updateCartItemType);

    if (!findCart) {
      throw new AppError('User cart not found ', 404);
    }

    if (
      updateCartItemType === updateCartItemTypeEnum.updateQuantity &&
      data.quantity &&
      data.quantity > 0
    ) {
      const cartItem = findCart.items.find(
        (item) => item._id?.toString() === cartItemId?.toString()
      );

      if (!cartItem) {
        throw new AppError('Cart item not found', 404);
      }

      const totalPricePerItem =
        (cartItem?.variantPrice || 0) + (cartItem?.basePrice || 0);

      const newItemTotal = totalPricePerItem * data.quantity;

      const updateResult = await Cart.updateOne(
        {
          customerId,
          restaurantId,
          'items._id': cartItemId,
        },
        {
          $set: {
            'items.$.quantity': data.quantity,
            'items.$.itemTotal': newItemTotal,
          },
        },
        {
          new: true,
        }
      );

      if (!updateResult) {
        throw new AppError('unable to update cart item quantity', 400);
      }
    } else if (updateCartItemType === updateCartItemTypeEnum.removeCartItem) {
      const removeCartItem = await Cart.updateOne(
        {
          'items._id': new mongoose.Types.ObjectId(cartItemId),
        },
        {
          $pull: {
            items: { _id: new mongoose.Types.ObjectId(cartItemId) },
          },
        }
      );

      if (!removeCartItem) {
        throw new AppError('Unable to update cart ', 400);
      }
    }

    return {
      message: 'User cart update successfully!',
    };
  }

  async getCart({ userId }: { userId: ICustomer['_id'] }): Promise<ICart> {
    const carts = await Cart.findOne({
      customerId: new mongoose.Types.ObjectId(userId),
    }).populate({ path: 'restaurantId', select: '_id name cuisineType' });

    if (!carts) {
      throw new AppError('Unable to find user cart', 404);
    }

    return carts;
  }
}
