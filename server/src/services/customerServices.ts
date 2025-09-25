import mongoose from 'mongoose';
import {
  ICustomerMutation,
  ICustomerQuery,
} from '../interface/interface/interface';
import {
  IAddress,
  ICustomer,
  IMenuCategory,
  IRestaurant,
} from '../interface/models/models';
import { Customer } from '../models/customer';
import { AppError } from '../utils/appError';
import { Restaurant } from '../models/restaurant';
import MenuCategory from '../models/menuCategory';
import { MenuItem } from '../models/menuItem';

export class CustomerService {
  async GetCustomerInfo({ userId }: { userId: ICustomer['_id'] }) {
    const customer = await Customer.findById(userId);

    if (!customer) {
      throw new AppError('customer info not found', 404);
    }

    return {
      data: customer,
    };
  }

  async updateCustomerInfo({
    userId,
    data,
  }: {
    userId: ICustomer['_id'];
    data: ICustomerMutation['updateAddress'];
  }) {
    const updateData: any = {};
    Object.entries(data).forEach(([key, value]) => {
      if (['locationCoord'].includes(key)) {
        updateData[`traceableLocation.coordinates`] = value;
      } else if (['country'].includes(key)) {
        updateData['country'] = value;
      } else {
        updateData[key] = value;
      }
    });

    const updateCustomer = await Customer.findOneAndUpdate(
      {
        _id: userId,
      },
      {
        $set: updateData,
      },
      {
        runValidators: true,
        new: true,
      }
    );

    if (!updateCustomer) {
      throw new AppError(
        'unable to update customer info right now, try again later',
        400
      );
    }

    return {
      message: 'Your information has been updated successfully!',
      data: updateCustomer,
    };
  }

  async addAddress({
    userId,
    data,
  }: {
    userId: ICustomer['_id'];
    data: ICustomerMutation['addAddress'];
  }) {
    const updateCustomerAddress = await Customer.findOneAndUpdate(
      {
        _id: userId,
      },
      {
        $addToSet: {
          address: data,
        },
      },
      {
        runValidators: true,
        new: true,
      }
    );

    if (!updateCustomerAddress) {
      throw new AppError("Can't update customer address at the moment", 400);
    }

    return {
      message: 'A new address has been added',
      data: updateCustomerAddress,
    };
  }

  async updateAddress({
    userId,
    addressId,
    data,
  }: {
    userId: ICustomer['_id'];
    addressId: IAddress['_id'];
    data: ICustomerMutation['updateAddress'];
  }) {
    const updateData: any = {};

    Object.entries(data).forEach(([key, value]) => {
      updateData[`address.$.${key}`] = value;
    });

    const updateAddress = await Customer.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(userId),
        'address._id': new mongoose.Types.ObjectId(addressId),
      },
      {
        $set: updateData,
      },
      {
        runValidators: true,
        new: true,
      }
    );

    if (!updateAddress) {
      throw new AppError('Unable to update the address at the moment', 400);
    }

    return {
      message: 'Address updated successfully!',
      data: updateAddress,
    };
  }

  async getRestaurants({
    userId,
    data,
  }: {
    userId: ICustomer['_id'];
    data: ICustomerQuery['getRestaurant'];
  }): Promise<{
    data: IRestaurant[];
    currentPage: number;
    total: number;
    totalPages: number;
  }> {
    const user = await Customer.findById(userId);

    if (!user) {
      throw new AppError('user not found', 404);
    }

    const nearBy = data.nearBy
      ? {
          traceableLocation: {
            $near: {
              $geometry: {
                type: 'Point',
                coordinates: user.traceableLocation.coordinates,
              },
              $maxDistance: 5000, // 5km around the customer
            },
          },
        }
      : {};

    const name = data.name
      ? {
          name: { $regex: data.name, $options: 'i' },
        }
      : {};

    const cusine = data.cusine
      ? {
          cuisineType: { $regex: data.cusine, $options: 'i' },
        }
      : {};

    const page = data.page || 1;
    const limit = data.limit || 10;

    const skip = (page - 1) * limit;
    const totalCount = await Restaurant.countDocuments({
      ...name,
      ...cusine,
    });
    const totalPages = Math.ceil(totalCount / limit);

    const restaurant = await Restaurant.find({
      isOpen: true,
      isAcceptingOrders: true,
      banned: false,
      ...nearBy,
      ...name,
      ...cusine,
    })
      .skip(skip)
      .limit(limit);

    console.log(restaurant);

    return {
      data: restaurant,
      currentPage: page,
      total: totalCount,
      totalPages,
    };
  }

  async getRestaurantById({
    restaurantId,
  }: {
    restaurantId: IRestaurant['_id'];
  }) {
    const restaurant = await Restaurant.findById(restaurantId);

    if (!restaurant) {
      throw new AppError('restaurant not found ', 404);
    }

    return restaurant;
  }

  async getRestaurantMenuCategories({
    restaurantId,
    data,
  }: {
    restaurantId: IRestaurant['_id'];
    data: ICustomerQuery['getRestaurantMenuCategories'];
  }) {
    const name = data.name && {
      name: { $regex: data.page, $options: 'i' },
    };

    const page = data.page || 1;
    const limit = data.limit || 10;

    const findRestaurant = await Restaurant.findById(restaurantId);

    if (!findRestaurant) {
      throw new AppError('restaurant was found', 404);
    }

    const query = {
      ...name,
      restaurantId: findRestaurant._id,
    };

    const skip = (page - 1) * limit;
    const totalCount = await MenuCategory.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    const menuCategory = await MenuCategory.find(query)
      .skip(skip)
      .sort({ displayOrder: -1 })
      .limit(limit);

    return {
      data: menuCategory,
      currentPage: page,
      total: totalCount,
      totalPages,
    };
  }
  async getRestaurantMenuItemByCategoryId({
    restaurantId,
    categoryId,
    data,
  }: {
    restaurantId: IRestaurant['_id'];
    categoryId: IMenuCategory['_id'];
    data: ICustomerQuery['getRestaurantMenuItembyCategoryId'];
  }) {
    const findRestaurant = await Restaurant.findById(restaurantId);

    if (!findRestaurant) {
      throw new AppError('restaurant was found', 404);
    }

    const page = data.page || 1;
    const limit = data.limit || 10;
    const skip = (page - 1) * limit;

    const query = {
      categoryId: new mongoose.Types.ObjectId(categoryId),
      restaurantId: new mongoose.Types.ObjectId(restaurantId),
    };

    const totalCount = await MenuItem.countDocuments(query);
    const totalPage = Math.ceil(totalCount / limit);

    const menuItems = await MenuItem.find(query)
      .skip(skip)
      .sort({ displayOrder: -1 })
      .limit(limit)
      .populate({ path: 'categoryId', select: 'name _id description' });

    return {
      data: menuItems,
      currentPage: page,
      totalPage,
      total: totalCount,
    };
  }
  async getRestaurantAllMenuItems({
    restaurantId,
    data,
  }: {
    restaurantId: IRestaurant['_id'];
    data: ICustomerQuery['getRestaurantMenuItems'];
  }) {
    const findRestaurant = await Restaurant.findById(restaurantId);

    if (!findRestaurant) {
      throw new AppError('restaurant  was not  found', 404);
    }

    const name = data.name && {
      name: { $regex: data.name, $options: 'i' },
    };

    const page = data.page || 1;
    const limit = data.limit || 10;
    const skip = (page - 1) * limit;

    const query = {
      ...name,
      restaurantId: new mongoose.Types.ObjectId(restaurantId),
    };

    const totalCount = await MenuItem.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    const menuItems = await MenuItem.find(query)
      .skip(skip)
      .sort({ displayOrder: -1 })
      .limit(limit)
      .populate({ path: 'categoryId', select: 'name _id description' });

    return {
      data: menuItems,
      currentPage: page,
      total: totalCount,
      totalPages,
    };
  }
}
