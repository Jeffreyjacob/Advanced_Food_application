import mongoose from 'mongoose';
import { IRestaurantMutation } from '../interface/interface/interface';
import { IRestaurant, IRestaurantOwner } from '../interface/models/models';
import { Restaurant } from '../models/restaurant';
import { AppError } from '../utils/appError';
import { DocumentStatusEnum } from '../interface/enums/enums';
import { DocumentValidatorQueue } from '../queue/documentValidator/queue';
import { RestaurantOwner } from '../models/restaurantOwner';

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

    if (findRestaurant.documents[data.documentType].url) {
      throw new AppError(
        `${data.documentType} document already exist in your document report, You can only update document`,
        400
      );
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
        businessName: findRestaurant.name,
      },
      {
        delay: 4 * 60 * 1000,
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
    userId: IRestaurantOwner['_id'];
    data: IRestaurantMutation['updateRestaurantDocument'];
  }) {
    const findRestaurant = await Restaurant.findOne({
      owner: new mongoose.Types.ObjectId(userId),
    });

    if (!findRestaurant) {
      throw new AppError("a restaurant can't be found for this user", 404);
    }

    if (!findRestaurant.documents[data.documentType].url) {
      throw new AppError(
        'you have no document file to update, please add new document before updating ',
        400
      );
    }

    const expiryDate =
      findRestaurant.documents[data.documentType] &&
      findRestaurant.documents[data.documentType].expiryDate;
    const documentExpiryDate = expiryDate ? new Date(expiryDate) : null;
    let oneMonthBeforeExpiryDate: Date | null = null;
    if (documentExpiryDate) {
      oneMonthBeforeExpiryDate = new Date(
        documentExpiryDate.getFullYear(),
        documentExpiryDate.getMonth() - 1,
        documentExpiryDate.getDate()
      );
    }

    // only update approved document, when it's one month before the document expiry date
    if (
      oneMonthBeforeExpiryDate &&
      findRestaurant.documents[data.documentType].status ===
        DocumentStatusEnum.Approved &&
      new Date().getTime() >= oneMonthBeforeExpiryDate.getTime()
    ) {
      const updateDocument = await Restaurant.findOneAndUpdate(
        {
          owner: new mongoose.Types.ObjectId(userId),
        },
        {
          $set: {
            [`documents.${data.documentType}.url`]: data.url,
          },
        },
        {
          new: true,
          runValidators: true,
        }
      );

      if (!updateDocument) {
        throw new AppError('Unable to update document, try again', 400);
      }

      await DocumentValidatorQueue.add('verify document ', {
        userId: userId,
        DocumentData: data,
        businessName: findRestaurant.name,
      });
    } else if (
      findRestaurant.documents[data.documentType].status !==
      DocumentStatusEnum.Approved
    ) {
      const updateDocument = await Restaurant.findOneAndUpdate(
        {
          owner: new mongoose.Types.ObjectId(userId),
        },
        {
          $set: {
            [`documents.${data.documentType}.url`]: data.url,
          },
        },
        {
          new: true,
          runValidators: true,
        }
      );

      if (!updateDocument) {
        throw new AppError('Unable to update document, try again', 400);
      }

      await DocumentValidatorQueue.add(
        'verify document ',
        {
          userId: userId,
          DocumentData: data,
          businessName: findRestaurant.name,
        },
        {
          delay: 4 * 60 * 100,
        }
      );
    } else if (
      oneMonthBeforeExpiryDate &&
      findRestaurant.documents[data.documentType].status ===
        DocumentStatusEnum.Approved &&
      new Date().getTime() < oneMonthBeforeExpiryDate.getTime()
    ) {
      throw new AppError(
        "You can't updated approved document or else it's one month before the document expiry date",
        400
      );
    }

    return {
      message: 'Document updated successfuly, will be revalidated',
    };
  }

  async getRestaurantDetail({
    userId,
  }: {
    userId: IRestaurantOwner['_id'];
  }): Promise<IRestaurant> {
    const findRestaurantOwner = await RestaurantOwner.findOne({
      _id: new mongoose.Types.ObjectId(userId),
    });

    if (!findRestaurantOwner) {
      throw new AppError('Restaurant owner not found', 404);
    }

    const findRestaurant = await Restaurant.findOne({
      owner: findRestaurantOwner._id,
    }).populate({ path: 'owner', select: 'email firstName lastName _id' });

    if (!findRestaurant) {
      throw new AppError('Restaurant not found ', 404);
    }

    return findRestaurant;
  }
}
