import { Request, Response } from 'express';
import Stripe from 'stripe';
import { stripe } from '../config/stripe';
import { Driver } from '../models/driver';
import {
  DocumentStatusEnum,
  expiryDocumentTypeEnum,
  IdentityVerificationStatusEnum,
  RestaurantVerificationStatusEnum,
} from '../interface/enums/enums';
import {
  getDocumentRejectionReason,
  getDocumentUrls,
  getSelfieRejectionReason,
} from '../utils/helper';
import { ExpiryDocumentQueue } from '../queue/expiryDocument/queue';
import { reminderExpiredDocumentQueue } from '../queue/reminderExpiryDocument/queue';
import { getConfig } from '../config/config';

const config = getConfig();
const updateDriverVerificationStatus = async (
  session: Stripe.Identity.VerificationSession
) => {
  const driverId = session.metadata?.driver_id;
  if (!driverId) return;

  const driver = await Driver.findById(driverId);
  if (!driver) return;

  const verificationReports = await stripe.identity.verificationReports.list({
    verification_session: session.id,
  });

  const report = verificationReports.data[0];

  const updateData: any = {};

  if (report) {
    updateData['stripeVerificationStatus'] =
      IdentityVerificationStatusEnum.verified;
  }

  if (report.document) {
    if (report.document.status === DocumentStatusEnum.Verified) {
      updateData['documents.driverLicense.status'] =
        DocumentStatusEnum.Verified;
      updateData['documents.driverLicense.stripeVerificationReportId'] =
        report.id;
      updateData['documents.driverLicense.rejectionReason'] = undefined;
      console.log(report.document.expiration_date);
      if (report.document.expiration_date) {
        const expiryDate = new Date(
          report.document.expiration_date.year!,
          report.document.expiration_date.month! - 1,
          report.document.expiration_date.day!
        );

        updateData['documents.driverLicense.expiryDate'] = expiryDate;

        const oldExpiryJobId = driver.documents['driverLicense'].expiryJobId;

        // remove the oldExpiryJob using expiryJob id which was saved db, if there is one
        if (oldExpiryJobId) {
          const oldExpiryJob = await ExpiryDocumentQueue.getJob(oldExpiryJobId);
          if (oldExpiryJob) {
            await oldExpiryJob.remove();
          }
        }

        // scheduling the job to update the driverLicense document status to expired, on the date it's expires

        const scheduleExpiryJob = await ExpiryDocumentQueue.add(
          'expired driverlicense',
          {
            documentType: expiryDocumentTypeEnum.driverLicense,
            userType: 'Driver',
            driverId: driver._id,
          },
          {
            delay: expiryDate.getTime() - Date.now(),
          }
        );

        // update expiryJobId in driverlicense document report in database
        driver.documents.driverLicense.expiryJobId = scheduleExpiryJob.id;
        await driver.save();

        const oneMonthDate = new Date(
          expiryDate.getTime() - 30 * 24 * 60 * 60 * 1000
        );

        const delay = oneMonthDate.getTime() - Date.now();

        if (delay > 0) {
          // scheduling one month reminder email to be sent to the driver because their driver license expires

          //removing old reminder job, if there is one using reminderJobId saved in driver license document reports in the database
          const oldReminderJobId = driver.documents.driverLicense.reminderJobId;

          if (oldReminderJobId) {
            const oldRemiderJob =
              await reminderExpiredDocumentQueue.getJob(oldReminderJobId);
            if (oldRemiderJob) {
              await oldRemiderJob.remove();
            }
          }

          // schedule reminder job to send emai to driver one month before their driver license expires

          const scheduleReminderJob = await reminderExpiredDocumentQueue.add(
            'reminder driver license',
            {
              driverId: driver._id,
              documentType: expiryDocumentTypeEnum.driverLicense,
              userType: 'Driver',
            },
            {
              delay,
            }
          );

          // update reminderjob id in the database

          driver.documents.driverLicense.reminderJobId = scheduleReminderJob.id;
          await driver.save();
        }
      }
    } else {
      updateData['documents.driverLicense.status'] =
        DocumentStatusEnum.Rejected;
      updateData['documents.driverLicense.stripeVerificationReportId'] =
        report.id;
      updateData['documents.driverLicense.rejectionReason'] =
        getDocumentRejectionReason(report.document);
    }
    const documentUrls = await getDocumentUrls(report.id, 'document');
    if (documentUrls.length > 0) {
      updateData['documents.driverLicense.url'] = documentUrls[0];
    }
  }

  if (report.selfie) {
    if (report.selfie.status === DocumentStatusEnum.Verified) {
      updateData['documents.profilePhoto.status'] = DocumentStatusEnum.Verified;
      updateData['documents.profilePhoto.stripeVerificationReportId'] =
        report.id;
      updateData['documents.profilePhoto.rejectionReason'] = undefined;
    } else {
      updateData['documents.profilePhoto.status'] = DocumentStatusEnum.Rejected;
      updateData['documents.profilePhoto.stripeVerificationReportId'] =
        report.id;
      updateData['documents.profilePhoto.rejectionReason'] =
        getSelfieRejectionReason(report.selfie);
    }

    const documentUrls = await getDocumentUrls(report.id, 'selfie');

    if (documentUrls.length > 0) {
      updateData['documents.profilePhoto.url'] = documentUrls[0];
    }
  }

  const bothVerified =
    report.document?.status === DocumentStatusEnum.Verified &&
    report.selfie?.status === DocumentStatusEnum.Verified;

  if (bothVerified) {
    updateData.stripeVerificationStatus =
      IdentityVerificationStatusEnum.verified;
  } else {
    updateData.stripeVerificationStatus =
      IdentityVerificationStatusEnum.requires_input;
  }

  try {
    await Driver.findOneAndUpdate(
      {
        _id: driver._id,
      },
      {
        $set: updateData,
      },
      {
        new: true,
      }
    );
    console.log(`Driver ${driverId} verification status updated successfully`);
  } catch (error: any) {
    console.error(`Failed to update driver ${driverId}:`, error);
    throw error;
  }
};

const handleVerificationRequiresInput = async (
  session: Stripe.Identity.VerificationSession
) => {
  const driverId = session.metadata?.driver_id;

  if (!driverId) return;

  const verificationReports = await stripe.identity.verificationReports.list({
    verification_session: session.id,
  });

  const report = verificationReports.data[0];
  const updateData: any = {};

  updateData['stripeVerificationStatus'] =
    IdentityVerificationStatusEnum.requires_input;

  updateData['verificationStatus'] = RestaurantVerificationStatusEnum.Rejected;

  if (report) {
    if (
      report.document &&
      report.document.status !== IdentityVerificationStatusEnum.verified
    ) {
      updateData['documents.driverLicense.status'] =
        DocumentStatusEnum.Rejected;
      updateData['documents.driverLicense.stripeVerificationReportId'] =
        report.id;
      updateData['documents.driverLicense.expiryDate'] = null;
      updateData['documents.driverLicense.rejectionReason'] =
        getDocumentRejectionReason(report.document);
    }

    if (
      report.selfie &&
      report.selfie.status !== IdentityVerificationStatusEnum.verified
    ) {
      updateData['documents.profilePhoto.status'] = DocumentStatusEnum.Rejected;
      updateData['documents.profilePhoto.stripeVerificationReportId'] =
        report.id;
      updateData['documents.profilePhoto.rejectionReason'] =
        getSelfieRejectionReason(report.selfie);
    }
  }

  await Driver.findByIdAndUpdate(driverId, updateData);
  return { success: true };
};

const handleVerificationCancelled = async (
  session: Stripe.Identity.VerificationSession
) => {
  const driverId = session.metadata?.driver_id;
  if (!driverId) return;

  await Driver.findByIdAndUpdate(driverId, {
    stripeVerificationStatus: IdentityVerificationStatusEnum.cancelled,
    verificationStatus: RestaurantVerificationStatusEnum.Pending,
    'documents.driverLicense.status': DocumentStatusEnum.Pending,
    'documents.profilePhoto.status': DocumentStatusEnum.Pending,
    'documents.driverLicense.expiryDate': null,
    'documents.driverLicense.rejectionReason':
      'Verification process was cancelled',
    'documents.profilePhoto.rejectionReason':
      'Verification process was cancelled',
  });

  return { success: true };
};

export const handleVerificationIdentityWebhook = async (
  req: Request,
  res: Response
) => {
  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;

  const endpointSecret = config.stripe.stripe_webhook_identity as string;
  console.log(config.stripe.stripe_webhook_identity, 'webhook secret');
  console.log(sig, 'signature');
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig as string,
      endpointSecret
    );
  } catch (error: any) {
    console.log(`Webhook signature verification failed.`, error);
    return res.status(400).send(`Webhook Error: ${error}`);
  }

  try {
    switch (event.type) {
      case 'identity.verification_session.verified':
        await updateDriverVerificationStatus(event.data.object);
        break;
      case 'identity.verification_session.requires_input':
        await handleVerificationRequiresInput(event.data.object);
        break;
      case 'identity.verification_session.canceled':
        await handleVerificationCancelled(event.data.object);
        break;
    }
  } catch (error: any) {
    console.error('Webhook handler failed:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
};
