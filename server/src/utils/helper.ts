import Stripe from 'stripe';
import {
  StripeAccountStatusEnum,
  VehicleTypeEnum,
} from '../interface/enums/enums';
import { stripe } from '../config/stripe';

export const generateOtp = () => {
  return Math.floor(10000 + Math.random() * 90000);
};

export const mapStripeAccountStatus = (
  account: Stripe.Account
): { status: StripeAccountStatusEnum; reasons: string[] } => {
  const reasons: string[] = [];

  if (account.charges_enabled && account.payouts_enabled) {
    if (account.requirements?.pending_verification?.length) {
      reasons.push('Account enabled but has pending verification');
      return { status: StripeAccountStatusEnum.pending, reasons };
    }

    if (
      account.requirements?.currently_due?.length ||
      account.requirements?.past_due?.length
    ) {
      reasons.push('Account enabled but has outstanding requirements');
      return { status: StripeAccountStatusEnum.restricted, reasons };
    }

    return { status: StripeAccountStatusEnum.enabled, reasons };
  }

  if (account.requirements?.disabled_reason) {
    reasons.push(
      `Account disabled due to:`,
      account.requirements.disabled_reason
    );

    switch (account.requirements.disabled_reason) {
      case 'requirements.past_due':
        return { status: StripeAccountStatusEnum.restricted, reasons };
      case 'requirements.pending_verification':
        return { status: StripeAccountStatusEnum.pending, reasons };
      case 'rejected.fraud':
      case 'rejected.listed':
      case 'rejected.terms_of_service':
        return { status: StripeAccountStatusEnum.disabled, reasons };
      default:
        return { status: StripeAccountStatusEnum.disabled, reasons };
    }
  }

  if (account.requirements?.past_due?.length) {
    reasons.push('Account has past due requirments');
    return { status: StripeAccountStatusEnum.restricted, reasons };
  }

  if (account.requirements?.currently_due?.length) {
    reasons.push(
      `Account has current requirements ${account.requirements.currently_due.join(' ')}`
    );
    return { status: StripeAccountStatusEnum.restricted, reasons };
  }

  // Check partial enablement
  if (account.charges_enabled || account.payouts_enabled) {
    reasons.push('Account partially enabled');
    return { status: StripeAccountStatusEnum.pending, reasons };
  }

  return { status: StripeAccountStatusEnum.disabled, reasons };
};

export const getSelfieRejectionReason = (selfie: any) => {
  if (selfie.error) {
    switch (selfie.error.code) {
      case 'selfie_document_missing_photo':
        return 'No photo found on your driver license. Please ensure your license has clear photo.';
      case 'selfie_face_mismatch':
        return 'Your selfie does not match the photo on your driver license. Please retake your selfie';
      case 'selfie_unverified_other':
        return 'Selfie could not be verified. Please ensure good listening and look directly at the camera';
      case 'selfie_manipulated':
        return 'Selfie appears to have been altered. Please take a natural, unedited selfie.';
      default:
        return `Selfie verification failed:${selfie.error.code}. Please take a clear selfie that match your license photo.`;
    }
  }
  return 'Photo verification failed. Please take a clear selfie that matches your driver license photo.';
};

export const getDocumentRejectionReason = (document: any): string => {
  if (document.errorhandler) {
    switch (document.error.code) {
      case 'document_unverified_other':
        return 'Document could not be verified. Please ensure your driver license is clear, unobscured and valid.';
      case 'document_corrupt':
        return 'Document image is corrupted or unreadable. Please take a clearer photo of your driver license.';
      case 'document_failed_copy':
        return 'Document appears to be a photocopy. Please provide an original driver license.';
      case 'document_fraudulent':
        return 'Document verification failed security checks. Please ensure you are using a valid, unaltered driver license.';
      case 'document_invalid':
        return 'Invalid document provided. Please ensure you are uploading a valid driver license.';
      case 'document_manipulated':
        return 'Document appears to have been altered. Please provide an unaltered driver license.';
      case 'document_missing_back':
        return 'Both front and back of the driver license are required.';
      case 'document_missing_front':
        return 'Front of the driver license is required.';
      case 'document_not_uploaded':
        return 'Driver license was not uploaded. Please try again.';
      case 'document_photo_mismatch':
        return 'The photo on your driver license does not match your selfie. Please ensure you are using your own document.';
      case 'document_too_large':
        return 'Document file is too large. Please upload a smaller image.';
      case 'document_type_not_supported':
        return 'Document type not supported. Please upload a valid driver license.';
      default:
        return `Document verification failed: ${document.error.code}. Please try uploading a clear photo of your valid driver license.`;
    }
  }

  return 'Driver license verificiation failed. Please ensure your document is clear, valid and unaltered.';
};

export const getDocumentUrls = async (
  reportId: string,
  documentType: 'document' | 'selfie'
): Promise<string[]> => {
  try {
    const report = await stripe.identity.verificationReports.retrieve(
      reportId,
      {
        expand: ['document.files', 'selfie.files'],
      }
    );

    const urls: string[] = [];

    if (documentType === 'document' && report.document?.files) {
      for (const fileId of report.document.files) {
        const fileUrl = await stripe.files.retrieve(fileId);
        if (fileUrl.url) urls.push(fileUrl.url);
      }
    } else if (documentType === 'selfie' && report.selfie?.selfie) {
      for (const fileId of report.selfie.selfie) {
        const fileUrl = await stripe.files.retrieve(fileId);
        if (fileUrl.url) urls.push(fileUrl.url);
      }
    }

    return urls;
  } catch (error: any) {
    console.error(`Error getting ${documentType} URLs:`, error);
    return [];
  }
};

export const findVehicleType = (vehicle: string): VehicleTypeEnum => {
  let vehicleType: string = '';
  if (
    [
      'sedan',
      'coupe',
      'hatchback',
      'suv',
      'convertible',
      'wagon',
      'pickup',
    ].includes(vehicle.toLowerCase())
  ) {
    vehicleType = VehicleTypeEnum.Car;
  } else if (['motorcycle'].includes(vehicle)) {
    vehicleType = VehicleTypeEnum.Bike;
  } else if (['rv', 'trailer', 'truck', 'van'].includes(vehicle)) {
    vehicleType = VehicleTypeEnum.BigVehicle;
  }
  return vehicleType as VehicleTypeEnum;
};

export const BodyParsing = async (reqBody: any) => {
  const formData = reqBody;

  const parsedbody: any = {};

  const variantMatch: Record<number, Record<string, any>> = {};

  const variantRegex = /^variants\[(\d+)\]\.([A-Za-z0-9_]+)$/;

  const tagsMatch: Record<number, string> = {};

  const tagRegex = /^tags\[(\d+)\]\.([A-Za-z0-9_]+)$/;

  Object.entries(formData).forEach(([key, value]) => {
    if (['name', 'description', 'menuCategoryId'].includes(key)) {
      parsedbody[key] = String(value);
    } else if (['price', 'preparationTime'].includes(key)) {
      parsedbody[key] = parseInt(value as string, 10);
    } else if (['isVegetarian', 'isVegan', 'isSpicy'].includes(key)) {
      parsedbody[key] =
        value === 'true' ? true : value === 'false' ? false : undefined;
    } else if (key === 'tags') {
      parsedbody[key] = value;
    }

    const match = variantRegex.exec(key);

    if (match && match[1] && match[2]) {
      const idx = parseInt(match[1], 10);
      const props = match[2];

      if (!variantMatch[idx]) {
        variantMatch[idx] = {};
      }

      if (props === 'name') {
        variantMatch[idx].name = String(value);
      } else if (props === 'price') {
        variantMatch[idx].price = parseInt(value as string);
      } else if (props === 'description') {
        variantMatch[idx].description = String(value);
      } else {
        variantMatch[idx][props] = value;
      }
    }

    const variantIndices = Object.keys(variantMatch)
      .map((k) => Number(k))
      .sort((a, b) => a - b);

    if (variantIndices.length > 1) {
      parsedbody.variants = variantIndices.map((i) => {
        return variantMatch[i];
      });
    }
  });

  return parsedbody;
};

export const parseQueryParams = () => {
  const getString = (value: any) => {
    const newValue = Array.isArray(value) ? value[0] : value;
    return String(newValue);
  };

  const getNumber = (value: any) => {
    const newValue = Array.isArray(value) ? value[0] : value;
    return Number(newValue);
  };

  const getBoolean = (value: any) => {
    const newValue = Array.isArray(value) ? value[0] : value;
    const isBoolean =
      newValue === 'true' ? true : newValue === 'false' ? false : undefined;
    return Boolean(isBoolean);
  };

  return { getString, getNumber, getBoolean };
};
