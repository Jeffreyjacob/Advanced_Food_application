import moment from 'moment';
import axios from 'axios';
import config from '../config/config';
import { IVerifyDocument } from '../interface/interface/interface';

export class DocumentVerificationService {
  private ocrApiKey: string;
  private ocrApiUrl: string;

  constructor() {
    this.ocrApiKey = config.OCR.API_KEY;
    this.ocrApiUrl = config.OCR.URL!;
  }

  async extractTextFromDocument(imageUrl: string) {
    try {
      const response = await axios.post(
        this.ocrApiUrl,
        {
          url: imageUrl,
          apiKey: this.ocrApiKey,
          language: 'eng',
          isOverlayRequired: false,
          detectOrientation: true,
          isTable: true,
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      if (response.data.IsErroredOnProcessing) {
        throw new Error(`OCR Error: ${response.data.ErrorMessage}`);
      }

      return response.data.ParsedResults[0]?.ParsedText || '';
    } catch (error: any) {
      console.error('OCR extraction failed:', error);
      throw new Error('Failed to extract text from document');
    }
  }

  async verifyBusinessLicense(documentUrl: string): Promise<IVerifyDocument> {
    const extractedText = await this.extractTextFromDocument(documentUrl);
    const verification: IVerifyDocument = {
      isValid: false,
      expiryDate: '' as string,
      extractedData: {} as { [key: string]: string },
      issues: [] as string[],
      score: 0,
    };

    const patterns = {
      licenseNumber:
        /(?:license|permit|registration)[\s#:]*([A-Z0-9\-]{5,20})/i,
      businessName:
        /(?:business name|company|entity)[\s:]*([A-Za-z\s&,.'-]{2,50})/i,
      issueDate:
        /(?:issued?|effective)[\s:]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
      expiryDate:
        /(?:expir|valid until|expires?)[\s:]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
      authority:
        /(?:issued by|authority|department|city of|state of)[\s:]*([A-Za-z\s&,.'-]{5,50})/i,
    };

    Object.entries(patterns).forEach(([key, pattern]) => {
      const match = extractedText.match(pattern);

      if (match) {
        verification.extractedData[key] = match[1].trim();
        verification.score += 20;
      }
    });

    if (verification.extractedData.expiryDate) {
      const expiryDate = moment(verification.extractedData.expiryDate, [
        'MM/DD/YYYY',
        'DD/MM/YYYY',
        'MM-DD-YYYY',
        'DD-MM-YYYY',
      ]);

      if (expiryDate.isValid()) {
        if (expiryDate.isBefore(moment())) {
          verification.issues.push('Business license has expired');
        } else {
          verification.score += 20;
          verification.expiryDate = verification.extractedData.expiryDate;
        }
      } else {
        verification.issues.push('Invalid expire data format');
      }
    } else {
      verification.issues.push('No expiry date found');
    }

    if (!verification.extractedData.licenseNumber) {
      verification.issues.push('License number not found');
    }

    if (!verification.extractedData.businessName) {
      verification.issues.push('Business name not found');
    }

    verification.isValid =
      verification.score >= 60 && verification.issues.length == 0;

    return verification;
  }

  async verifyTaxCertificate(documentUrl: string): Promise<IVerifyDocument> {
    const extractedText = await this.extractTextFromDocument(documentUrl);
    const verification: IVerifyDocument = {
      isValid: false,
      expiryDate: '',
      extractedData: {},
      issues: [],
      score: 0,
    };

    const patterns = {
      taxId: /(?:tax id|ein|federal id|taxpayer id)[\s#:]*([0-9\-]{8,15})/i,
      businessName:
        /(?:business name|legal name|entity)[\s:]*([A-Za-z\s&,.'-]{2,50})/i,
      issueDate:
        /(?:issued?|certified)[\s:]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
      expiryDate:
        /(?:expir|valid until|expires?)[\s:]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
      taxYear: /(?:tax year|for year)[\s:]*(\d{4})/i,
    };

    Object.entries(patterns).forEach(([key, pattern]) => {
      const match = extractedText.match(pattern);

      if (match) {
        verification.extractedData[key] = match[1].trim();
        verification.score += 20;
      }
    });

    if (verification.extractedData.expiryDate) {
      const expiryDate = moment(verification.extractedData.expiryDate, [
        'MM/DD/YYYY',
        'DD/MM/YYYY',
      ]);
      if (expiryDate.isValid() && expiryDate.isBefore(moment())) {
        verification.issues.push('Tax certificate has expired');
      } else {
        verification.expiryDate = verification.extractedData.expiryDate;
      }
    }

    if (!verification.extractedData.taxId) {
      verification.issues.push('Tax ID not found');
    }

    verification.isValid =
      verification.score >= 60 && verification.issues.length === 0;

    return verification;
  }

  async verifyFoodHandlerPermit(documentUrl: string) {
    const extractedText = await this.extractTextFromDocument(documentUrl);
    const verification: IVerifyDocument = {
      isValid: false,
      expiryDate: '',
      extractedData: {},
      issues: [],
      score: 0,
    };

    const patterns = {
      permitNumber: /(?:permit|certificate|license)[\s#:]*([A-Z0-9\-]{5,20})/i,
      holderName: /(?:name|holder|certified)[\s:]*([A-Za-z\s,.'-]{2,50})/i,
      issueDate:
        /(?:issued?|certified|effective)[\s:]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
      expiryDate:
        /(?:expir|valid until|expires?)[\s:]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
      authority:
        /(?:health department|food safety|public health)[\s:]*([A-Za-z\s&,.'-]{5,50})/i,
    };

    Object.entries(patterns).forEach(([key, pattern]) => {
      const match = extractedText.match(pattern);
      if (match) {
        verification.extractedData[key] = match[1].trim();
        verification.score += 20;
      }
    });

    if (verification.extractedData.expiryDate) {
      const expiryDate = moment(verification.extractedData.expiryDate, [
        'MM/DD/YYYY',
        'DD/MM/YYYY',
      ]);

      if (expiryDate.isValid()) {
        if (expiryDate.isBefore(moment())) {
          verification.issues.push('Food handler permit has expired');
        } else if (expiryDate.isBefore(moment().add(30, 'days'))) {
          verification.issues.push(
            'Food handler permit expires within 30 days'
          );
        } else {
          verification.score += 20;
          verification.expiryDate = verification.extractedData.expiryDate;
        }
      }
    } else {
      verification.issues.push(
        'No expiry date found - required for food permit '
      );
    }

    verification.isValid =
      verification.score >= 80 && verification.issues.length === 0;
    return verification;
  }
}
