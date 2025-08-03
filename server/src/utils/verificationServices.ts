import moment from 'moment';
import axios from 'axios';
import qs from 'qs';
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
      const payload = qs.stringify({
        url: imageUrl,
        apiKey: this.ocrApiKey,
        language: 'eng',
        isOverlayRequired: false,
        detectOrientation: true,
        isTable: true,
        filetype: 'pdf',
      });

      const response = await axios.post(this.ocrApiUrl, payload, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (response.data.IsErroredOnProcessing) {
        throw new Error(`OCR Error: ${response.data.ErrorMessage}`);
      }

      return response.data.ParsedResults[0]?.ParsedText || '';
    } catch (error: any) {
      console.error('OCR extraction failed:', error);
      throw new Error('Failed to extract text from document');
    }
  }

  async verifyBusinessLicense(
    documentUrl: string,
    businessName: string
  ): Promise<IVerifyDocument> {
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
        /(?:business\/restaurant|business name|company)[\s:]*([\w&',.\-\s]{2,100})/i,
      issueDate:
        /(?:issued?|effective)[\s:]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
      expiryDate:
        /(?:expiry date|expires? date|valid until|expires?)\s*:?\s*((?:(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)(?:\s+\d{1,2},\s+\d{4}))|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
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
      const date = new Date(verification.extractedData.expiryDate);
      const expiryDate = moment(date, [
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
    } else {
      verification.score += 20;
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
    console.log(extractedText);
    const verification: IVerifyDocument = {
      isValid: false,
      expiryDate: '',
      extractedData: {},
      issues: [],
      score: 0,
    };
    const patterns = {
      taxId: [
        /(?:tax identification number|tin|tax id|federal id|taxpayer id|business license number|license number|registration number|certificate number)[\s\n\r]*:?[\s\n\r]*([A-Z0-9\-]{6,20})/i,
        /(?:business\s+license|license)\s+(?:number|no|#)[\s\n\r]*:?[\s\n\r]*([A-Z0-9\-]{6,20})/i,
        /tax identification\s*number[\s\n\r]*:?[\s\n\r]*([A-Z0-9\-]{6,20})/i,
        /\b([A-Z]{2}[0-9]{6,12})\b/i, // State prefix format like TX123456789
        /\b([0-9]{8}-[0-9]{4})\b/i, // Format like 12345678-1234
        /\b([0-9]{10,15})\b/i, // Plain numeric IDs
        /\b(BL-[0-9]{4}-[0-9]{6})\b/i, // Business license format
      ],

      businessName: [
        /(?:taxpayer name|business name|company name|entity name|legal name|dba name|d\/b\/a name)[\s\n\r]*:?[\s\n\r]*([A-Za-z0-9\s&',.\-\(\)]{3,100}?)(?:\s*(?:limited|ltd|inc|corp|llc|llp|pllc|corporation|company|co\.)|$|\n|\r)/i,
        /(?:business|company|entity|legal)\s+name[\s\n\r]*:?[\s\n\r]*([A-Za-z0-9\s&',.\-\(\)]{3,100}?)(?:\s*(?:limited|ltd|inc|corp|llc)|$|\n|\r)/i,
        /taxpayer name[\s\n\r]*:?[\s\n\r]*([A-Za-z0-9\s&',.\-\(\)]{3,100}?)(?:\s*(?:limited|ltd|inc|corp|llc)|$|\n|\r)/i,
        /(?:^|\n)name[\s\n\r]*:?[\s\n\r]*([A-Za-z0-9\s&',.\-\(\)]{3,100}?)(?:\n|\r|$)/i,
      ],

      issueDate: [
        /(?:issued on|issue date|date issued|date of issue|issued|issued date)[\s\n\r]*:?[\s\n\r]*(\d{1,2}\s+(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4})/i,
        /(?:issued on|issue date|date issued|date of issue|issued|issued date)[\s\n\r]*:?[\s\n\r]*(\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4})/i,
        /(?:issued on|issue date|date issued|date of issue|issued|issued date)[\s\n\r]*:?[\s\n\r]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
        /(?:issued on|issue date|date issued)[\s\n\r]*:?[\s\n\r]*(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/i,
        /issued on[\s\n\r]+(\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4})/i,
        /(?:date|issued)[\s\S]{0,20}?(\d{1,2}\/\d{1,2}\/\d{4})/i,
      ],

      expiryDate: [
        // VERY flexible patterns - these should catch almost anything
        /(?:expiry date|expires? date|valid until|expires?)\s*:?\s*((?:(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)(?:\s+\d{1,2},\s+\d{4}))|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
        /expiry[^:]*?:?\s*([a-z]+ \d{1,2}, \d{4})/i, // "Expiry Date: January 14, 2026"
        /expiry[^:]*?:?\s*(\d{1,2} [a-z]+ \d{4})/i, // "Expiry Date: 14 January 2026"
        /expiry[^:]*?:?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i, // "Expiry Date: 14/01/2026"

        // Even more flexible - look for "expiry" anywhere with a date nearby
        /expiry[\s\S]{0,50}?(\d{1,2}\s+(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4})/i,
        /expiry[\s\S]{0,50}?(\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4})/i,

        // Original patterns as fallback
        /(?:expires?\s+on|expiry\s+date|expiration\s+date|valid\s+until|valid\s+through|expires?)[\s\n\r]*:?[\s\n\r]*(\d{1,2}\s+(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4})/i,
        /(?:expires?\s+on|expiry\s+date|expiration\s+date|valid\s+until|valid\s+through|expires?)[\s\n\r]*:?[\s\n\r]*(\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4})/i,
        /(?:expires?\s+on|expiry\s+date|expiration\s+date|valid\s+until|valid\s+through|expires?)[\s\n\r]*:?[\s\n\r]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
      ],

      taxYear: [
        // Tax year patterns
        /(?:tax year covered|assessment year|tax year|for year|year|tax period)[\s\n\r]*:?[\s\n\r]*(\d{4})/i,
        /(\d{4})\s+(?:assessment year|tax year)/i,
        /(?:for the year|year ending|tax period)[\s\n\r]*:?[\s\n\r]*(\d{4})/i,
        /assessment\s+year[\s\n\r]*:?[\s\n\r]*(\d{4})/i,
      ],
    };

    Object.entries(patterns).forEach(([key, patternArray]) => {
      if (!verification.extractedData[key]) {
        for (const pattern of patternArray) {
          const match = extractedText.match(pattern);
          if (match && match[1]) {
            verification.extractedData[key] = match[1].trim();
            verification.score += 20;
            break;
          }
        }
      }
    });

    if (verification.extractedData.expiryDate) {
      const date = new Date(verification.extractedData.expiryDate);
      const expiryDate = moment(date, [
        'MM/DD/YYYY',
        'DD/MM/YYYY',
        'MM-DD-YYYY',
        'DD-MM-YYYY',
      ]);

      if (expiryDate.isValid()) {
        if (expiryDate.isBefore(moment())) {
          verification.issues.push('Tax certificate has expired');
        } else {
          verification.score += 20;
          verification.expiryDate = verification.extractedData.expiryDate;
        }
      } else {
        verification.issues.push('Invalid expire data format');
      }
    } else {
      verification.issues.push('Expiry date not found');
    }

    if (!verification.extractedData.taxId) {
      verification.issues.push('Tax ID not found');
    } else {
      verification.score += 20;
    }

    verification.isValid =
      verification.score >= 80 && verification.issues.length === 0;

    return verification;
  }

  async verifyFoodHandlerPermit(documentUrl: string, businessName: string) {
    const extractedText = await this.extractTextFromDocument(documentUrl);
    const verification: IVerifyDocument = {
      isValid: false,
      expiryDate: '',
      extractedData: {},
      issues: [],
      score: 0,
    };

    const patterns = {
      permitNumber: [
        // Standard permit/license number patterns
        /(?:permit|license|certificate|card)\s+(?:number|no|#|id)[\s:]*([A-Z0-9\-\.]{5,30})/i,
        /(?:food\s+)?(?:handler|safety)\s+(?:permit|license|certificate)\s+(?:number|no|#)[\s:]*([A-Z0-9\-\.]{5,30})/i,
        /(?:certificate|permit)\s+(?:number|no|#)[\s:]*([A-Z0-9\-\.]{5,30})/i,

        // Specific format patterns (common across jurisdictions)
        /\b(FH-\d{4}-[A-Z0-9\-]{4,15})\b/i, // FH-2024-CR-567890
        /\b(FSC-\d{4}-[A-Z0-9\-]{4,15})\b/i, // FSC-2024-001234
        /\b(FHP-\d{6,10})\b/i, // FHP-1234567
        /\b([A-Z]{2,3}\d{6,12})\b/i, // CA123456789, NYC1234567
        /\b(\d{8,12})\b/i, // Plain numeric IDs
      ],

      holderName: [
        // Look for name after various labels
        /(?:permit\s+holder|card\s+holder|name|employee|worker)[\s:]*\n?\s*([A-Za-z][A-Za-z\s,.'-]{4,60})(?=\n[A-Z]|\n\n|$|(?:business|employer|restaurant|certificate|permit|valid|expire))/i,
        /(?:full\s+name|legal\s+name|employee\s+name)[\s:]*\n?\s*([A-Za-z][A-Za-z\s,.'-]{4,60})(?=\n[A-Z]|\n\n|$)/i,
        /(?:first|last)\s+name[\s\S]{0,50}?([A-Za-z][A-Za-z\s,.'-]{8,60})(?=\n[A-Z]|\n\n|$)/i,

        // Common name patterns (flexible)
        /name[\s:]*\n?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,4})(?=\n|$|business|employer)/i,

        // Fallback - any capitalized name pattern
        /([A-Z][a-z]{2,15}(?:\s+[A-Z][a-z]{2,15}){1,3})(?=\s*\n(?:business|employer|restaurant|address|phone|email))/i,
      ],

      businessName: [
        // Various business/employer labels
        /(?:business|employer|restaurant|establishment|company)[\s\/]*(?:name)?[\s:]*\n?\s*([A-Za-z0-9\s&',.\-\(\)]{3,100})(?=\n[A-Z]|\n\n|$|address|phone|permit|certificate)/i,
        /(?:place\s+of\s+employment|work\s+location|employer)[\s:]*\n?\s*([A-Za-z0-9\s&',.\-\(\)]{3,100})(?=\n[A-Z]|\n\n|$)/i,
        /(?:dba|d\/b\/a|doing\s+business\s+as)[\s:]*\n?\s*([A-Za-z0-9\s&',.\-\(\)]{3,100})(?=\n[A-Z]|\n\n|$)/i,

        // Common restaurant/food business patterns
        /([A-Za-z0-9\s&',.\-]{3,50}(?:restaurant|cafe|deli|market|kitchen|food|grill|bar|bistro|eatery))(?=\n|$|address)/i,
        /([A-Za-z0-9\s&',.\-]{3,50}(?:inc|llc|corp|ltd|co\.))(?=\n|$|address)/i,
      ],

      issueDate: [
        // Issue/effective date patterns
        /(?:issue|issued|effective|granted|certified)[\s\w]*(?:date|on)?[\s:]*\n?\s*([A-Za-z]+ \d{1,2},? \d{4})/i,
        /(?:date\s+(?:issued|granted|certified|effective))[\s:]*\n?\s*([A-Za-z]+ \d{1,2},? \d{4})/i,
        /(?:certificate|permit)\s+(?:date|issued)[\s:]*\n?\s*([A-Za-z]+ \d{1,2},? \d{4})/i,

        // Numeric date formats
        /(?:issue|issued|effective|granted)[\s\w]*(?:date|on)?[\s:]*\n?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
        /(?:date\s+(?:issued|granted|effective))[\s:]*\n?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
      ],

      expiryDate: [
        // Expiry/expiration patterns - most comprehensive
        /(?:expir(?:y|ation|es?)\s+date|valid\s+(?:until|through|till)|expires?\s+on)[\s:]*\n?\s*([A-Za-z]+ \d{1,2},? \d{4})/i,
        /(?:expir(?:y|ation|es?)|valid)[\s\w]*(?:date|until|through|on)?[\s:]*\n?\s*([A-Za-z]+ \d{1,2},? \d{4})/i,

        // Look for future dates (typically 1-5 years from now)
        /([A-Za-z]+ \d{1,2},? (?:202[5-9]|203[0-5]))/i, // 2025-2035 range

        // Numeric expiry formats
        /(?:expir(?:y|ation|es?)\s+date|valid\s+(?:until|through)|expires?\s+on)[\s:]*\n?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
        /(?:expir(?:y|ation|es?)|valid)[\s:]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,

        // Very flexible - any date context with expiry words
        /expir[\s\S]{0,30}?([A-Za-z]+ \d{1,2},? \d{4})/i,
        /valid[\s\S]{0,30}?([A-Za-z]+ \d{1,2},? \d{4})/i,
      ],

      authority: [
        // Issuing authority patterns
        /(?:issued\s+by|authorized\s+by|certifying\s+authority)[\s:]*\n?\s*([A-Za-z\s&,.'-]{8,100})(?=\n\n|\n[A-Z]{2,}|$|conditions|notice|training)/i,
        /(?:health\s+department|food\s+safety|public\s+health)[\s\w]*([A-Za-z\s&,.'-]{8,80})(?=\n\n|$|phone|contact)/i,

        // Common authority patterns
        /([A-Za-z\s&,.'-]*(?:health\s+department|food\s+safety|sanitatio|environmental|public\s+health)[A-Za-z\s&,.'-]*)/i,
        /((?:city|county|state|province)\s+of\s+[A-Za-z\s&,.'-]{5,50})/i,

        // Department/agency patterns
        /([A-Za-z\s&,.'-]*(?:department|agency|board|bureau|division)[A-Za-z\s&,.'-]*(?:health|food|safety|environmental)[A-Za-z\s&,.'-]*)/i,
      ],

      // Additional useful fields
      certificateType: [
        /(?:certificate|permit)\s+type[\s:]*([A-Za-z\s&,.'-]{5,50})(?=\n|$)/i,
        /(food\s+handler|food\s+safety|servsafe|haccp|manager|supervisor)(?:\s+(?:certificate|permit|card|training))?/i,
      ],

      trainingDate: [
        /(?:training|course|class)[\s\w]*(?:date|completed|on)[\s:]*\n?\s*([A-Za-z]+ \d{1,2},? \d{4})/i,
        /(?:completed|finished|attended)[\s\w]*(?:training|course)[\s:]*\n?\s*([A-Za-z]+ \d{1,2},? \d{4})/i,
        /(?:date\s+(?:completed|finished|trained))[\s:]*\n?\s*([A-Za-z]+ \d{1,2},? \d{4})/i,
      ],
    };

    Object.entries(patterns).forEach(([key, patternArray]) => {
      for (const patterns of patternArray) {
        const match = extractedText.match(patterns);

        if (match && match[1]) {
          verification.extractedData[key] = match[1].trim();
          verification.score += 20;
          break;
        }
      }
    });

    console.log(verification.extractedData);
    if (verification.extractedData.expiryDate) {
      const dateString = verification.extractedData.expiryDate.trim();
      console.log('Parsing expiry date:', dateString);

      // Use moment with multiple date formats
      const expiryDate = moment(
        dateString,
        [
          'MMMM DD, YYYY', // March 14, 2027
          'MMM DD, YYYY', // Mar 14, 2027
          'DD MMMM YYYY', // 14 March 2027
          'DD MMM YYYY', // 14 Mar 2027
          'MM/DD/YYYY', // 03/14/2027
          'DD/MM/YYYY', // 14/03/2027
          'YYYY-MM-DD', // 2027-03-14
        ],
        true
      );

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
          console.log(expiryDate);
        }
      }
    } else {
      verification.issues.push(
        'No expiry date found - required for food permit '
      );
    }

    verification.isValid =
      verification.score >= 60 && verification.issues.length === 0;
    return verification;
  }
}
