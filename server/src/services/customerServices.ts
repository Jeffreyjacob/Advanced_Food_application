import mongoose from 'mongoose';
import { ICustomerMutation } from '../interface/interface/interface';
import { IAddress, ICustomer } from '../interface/models/models';
import { Customer } from '../models/customer';
import { AppError } from '../utils/appError';

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
}
