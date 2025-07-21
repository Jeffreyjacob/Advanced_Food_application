import mongoose from 'mongoose';
import { IRestaurantMutation } from '../interface/interface/interface';
import { IRestaurantOwner } from '../interface/models/models';
import { Restaurant } from '../models/restaurant';
import { AppError } from '../utils/appError';
import {
  DocumentStatusEnum,
  RestaurantDocumentTypeEnum,
} from '../interface/enums/enums';
import { DocumentVerificationService } from '../utils/verificationServices';
import { flowProducer } from '../queue/flows';
import { documentValidatorWorker } from '../queue/documentValidator/worker';
import { DocumentValidatorQueue } from '../queue/documentValidator/queue';

export class RestaurantServies {
  async updateRestaurantInfo({
    restaurantOwnerId,
    data,
  }: {
    restaurantOwnerId: IRestaurantOwner['_id'];
    data: IRestaurantMutation['updateRestaurant'];
  }) {
    const updateData: any = {};
    Object.entries(data).forEach(([key, value]) => {
      if (['locationCoord'].includes(key)) {
        updateData['traceableLocation.coordinates'] = value;
      } else {
        updateData[key] = value;
      }
    });

    const updateRestaurant = await Restaurant.findOneAndUpdate(
      {
        owner: restaurantOwnerId,
      },
      {
        $set: updateData,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updateRestaurant) {
      throw new AppError(
        'Unable to update restaurant at the moment, try again later',
        400
      );
    }

    return {
      message: 'resturant info updated',
      data: updateRestaurant,
    };
  }

  async createRestaurantDocument({
    userId,
    data,
  }: {
    userId: IRestaurantOwner['_id'];
    data: IRestaurantMutation['addRestaurantDocument'];
  }) {
    const findRestaurant = await Restaurant.findOne({
      owner: new mongoose.Types.ObjectId(userId),
    });

    if (!findRestaurant) {
      throw new AppError("a restaurant can't be found for this user", 404);
    }

    const documents: any = {};

    documents[`documents.${data.documentType}.url`] = data.url;
    documents[`documents.${data.documentType}.status`] =
      DocumentStatusEnum.Pending;

    const updateRestaurantDocument = await Restaurant.findByIdAndUpdate(
      findRestaurant._id,
      {
        $set: documents,
      },
      {
        runValidators: true,
        new: true,
      }
    );

    if (!updateRestaurantDocument) {
      throw new AppError('Unable to update restaurant document', 400);
    }

    await DocumentValidatorQueue.add(
      'verify document ',
      {
        userId: userId,
        DocumentData: data,
      },
      {
        delay: 4 * 60 * 100,
      }
    );

    return {
      message: 'Document has been uploaded',
    };
  }

  async updateRestaurantDocument({
    userId,
    data,
  }: {
    userId: IRestaurantMutation['addRestaurantDocument'];
    data: IRestaurantMutation['updateRestaurantDocument'];
  }) {}
}
