import { expiryDocumentTypeEnum } from '../../interface/enums/enums';

export const LicenseExpiryReminderHTML = ({
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
  <title>License Expiry Reminder</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f3f4f6; padding: 20px;">

  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
    <tr>
      <td style="background-color: #2563eb; padding: 20px; text-align: center; color: #ffffff;">
        <h2 style="margin: 0;">Reminder: Your License Expires Soon</h2>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px; color: #1f2937;">
        <p>Hi <strong>${driverName}</strong>,</p>
        <p>This is a friendly reminder that your <strong>${documentType}</strong> will expire on <strong>${expiryDate}</strong>, one month from today.</p>
        <p>To keep your driving privileges active, please renew your license before it expires.</p>
        <p style="margin-top: 30px;">If you’ve already renewed, please disregard this reminder.</p>
        <p style="margin-top: 30px;">Thank you,<br/>The Verification Team</p>
      </td>
    </tr>
  </table>

</body>
</html>
`;
