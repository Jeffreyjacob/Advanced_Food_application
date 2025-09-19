import mongoose from 'mongoose';
import config from '../config/config';
import { stripe } from '../config/stripe';
import { IDriver } from '../interface/models/models';
import { Driver } from '../models/driver';
import { AppError } from '../utils/appError';
import {
  DocumentStatusEnum,
  IdentityVerificationStatusEnum,
  RestaurantVerificationStatusEnum,
} from '../interface/enums/enums';
import { IDriverMutation } from '../interface/interface/interface';
import { Wallets } from '../models/wallet';
import { DriverVehicleValidatorQueue } from '../queue/driverValidator/queue';

export class DriverServices {
  async createVerificationSession(driverId: IDriver['_id']) {
    const driver = await Driver.findById(driverId);

    if (!driver) throw new AppError('Driver not found', 404);
    if (driver.stripeIdentitySetup === true) {
      throw new AppError(
        'You already have a stripe identity verification, you can only restart the verification process, click on the restart vertification endpoint',
        400
      );
    }

    const verificationSession =
      await stripe.identity.verificationSessions.create({
        type: 'document',
        metadata: {
          driver_id: driver._id.toString(),
        },
        options: {
          document: {
            allowed_types: ['driving_license'],
            require_id_number: true,
            require_live_capture: true,
            require_matching_selfie: true,
          },
        },
        return_url: `${config.frontendUrls.baseUrl}/driver/verification/complete`,
      });

    await Driver.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(driverId),
      },
      {
        stripeVerificationSessionId: verificationSession.id,
        stripeVerificationStatus: IdentityVerificationStatusEnum.pending,
        stripeIdentitySetup: true,
      }
    );

    return {
      sessionId: verificationSession.id,
      clientSecret: verificationSession.client_secret,
      url: verificationSession.url,
    };
  }

  async restartVerification(driverId: IDriver['_id']) {
    await Driver.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(driverId),
      },
      {
        $set: {
          stripeVerificationStatus: IdentityVerificationStatusEnum.pending,
          verificationStatus: RestaurantVerificationStatusEnum.Pending,
          'documents.driverLicense.status': DocumentStatusEnum.Pending,
          'documents.profilePhoto.status': DocumentStatusEnum.Pending,
        },
        $unset: {
          'documents.driverLicense.rejectionReason': 1,
          'documents.driverLicense.stripeVerificationReportId': 1,
          'documents.profilePhoto.rejectionReason': 1,
          'documents.profilePhoto.stripeVerificationReportId': 1,
        },
      }
    );

    return await this.createVerificationSession(driverId);
  }

  async getVerificationSession(sessionId: string) {
    return await stripe.identity.verificationSessions.retrieve(sessionId);
  }

  async UpdateDriverInfo({
    userId,
    data,
  }: {
    userId: IDriver['_id'];
    data: IDriverMutation['updateDriver'];
  }) {
    const personalInfo: any = {};

    console.log(data, 'data');

    Object.entries(data).forEach(([key, value]) => {
      if (
        [
          'firstName',
          'lastName',
          'phone',
          'country',
          'avaliableForPickup',
        ].includes(key)
      ) {
        personalInfo[key] = value;
      }
    });

    console.log(personalInfo, 'personalInfo');

    // find driver
    const driver = await Driver.findById(userId);

    if (!driver) {
      throw new AppError('Driver not found', 404);
    }

    // check if driver has created a wallet and update their information on stripe as well

    // const wallet = await Wallets.findOne({
    //   userId: new mongoose.Types.ObjectId(userId),
    // });

    // if (
    //   driver.walletCreated &&
    //   wallet?.stripeAccountId &&
    //   Object.keys(personalInfo).length > 0
    // ) {
    //   if (Object.keys(personalInfo).length > 0) {
    //     await stripe.accounts.update(wallet.stripeAccountId, {
    //       individual: {
    //         ...(personalInfo.firstName && {
    //           first_name: personalInfo.firstName,
    //         }),
    //         ...(personalInfo.lastName && {
    //           last_name: personalInfo.lastName,
    //         }),
    //         ...(personalInfo.phone && {
    //           phone: personalInfo.phone,
    //         }),
    //         ...(personalInfo.country && {
    //           address: {
    //             country: personalInfo.country,
    //           },
    //         }),
    //       },
    //     });
    //   }
    // }

    const updateUserInfo = await Driver.findByIdAndUpdate(
      driver._id,
      {
        $set: personalInfo,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updateUserInfo) {
      throw new AppError('Unable to update user info', 400);
    }

    return {
      message: 'Driver information updated successfully!',
    };
  }

  async updateDriverVehicleRegisteration({
    userId,
    data,
  }: {
    userId: IDriver['_id'];
    data: IDriverMutation['updateVehicleRegisteration'];
  }) {
    const updateDriver = await Driver.findByIdAndUpdate(
      userId,
      {
        $set: {
          [`documents.vehicleRegistration.url`]: data.url,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updateDriver) {
      throw new AppError('Unable to update driver document', 400);
    }

    console.log('start processing');

    await DriverVehicleValidatorQueue.add('vehicleValidator', {
      userId: userId,
      documentUrl: data.url,
    });

    return {
      message: 'Document update successfully!',
    };
  }

  async getDriverInfo({
    userId,
  }: {
    userId: IDriver['_id'];
  }): Promise<IDriver> {
    const driver = await Driver.findById(userId);

    if (!driver) {
      throw new AppError("Driver can't not found", 404);
    }

    return driver;
  }
}
