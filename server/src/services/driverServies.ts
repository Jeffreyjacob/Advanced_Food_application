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

export class DriverServices {
  async createVerificationSession(driverId: IDriver['_id']) {
    const driver = await Driver.findById(driverId);

    if (!driver) throw new AppError('Driver not found', 404);

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
}
