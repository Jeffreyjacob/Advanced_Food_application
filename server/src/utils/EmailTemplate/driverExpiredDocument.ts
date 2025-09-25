import { expiryDocumentTypeEnum } from '../../interface/enums/enums';

export const LicenseExpiredNotificationHTML = ({
  driverName,
  expiryDate,
  documentType,
}: {
  driverName: string;
  expiryDate: string | undefined;
  documentType: expiryDocumentTypeEnum;
}) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>License Expired</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f3f4f6; padding: 20px;">

  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
    <tr>
      <td style="background-color: #dc2626; padding: 20px; text-align: center; color: #ffffff;">
        <h2 style="margin: 0;">Your License Has Expired</h2>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px; color: #1f2937;">
        <p>Hi <strong>${driverName}</strong>,</p>
        <p>Our records show your <strong>${documentType}</strong> expired on <strong>${expiryDate}</strong> and is no longer valid.</p>
        <p>Please renew your license as soon as possible to continue driving without interruption.</p>
        <p style="margin-top: 30px;">If you’ve already renewed, please update your profile with the new expiry date.</p>
        <p style="margin-top: 30px;">Thank you,<br/>The Verification Team</p>
      </td>
    </tr>
  </table>

</body>
</html>
`;
