import { RestaurantDocumentTypeEnum } from '../../interface/enums/enums';

export const ReminderExpiredDocuments = ({
  ownerName,
  documentType,
  restaurantName,
  expiryDate,
}: {
  ownerName: string;
  documentType: RestaurantDocumentTypeEnum;
  restaurantName: string;
  expiryDate: string | undefined;
}) => {
  return `
    <!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Document Expiry Reminder</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f9fafb; padding: 20px;">

  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
    <tr>
      <td style="background-color: #2563eb; padding: 20px; text-align: center; color: #ffffff;">
        <h2 style="margin: 0;">Document Expiry Reminder</h2>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px; color: #111827;">
        <p>Hi <strong>${ownerName}</strong>,</p>
        <p>This is a friendly reminder that your <strong>${documentType}</strong> for your restaurant <strong>${restaurantName}</strong> will expire on <strong>${expiryDate}</strong>.</p>
        <p>To avoid losing your restaurant’s verification status, please upload a renewed document before the expiry date.</p>

     

        <p style="margin-top: 30px;">Thank you,<br>The Verification Team</p>
      </td>
    </tr>
  </table>

</body>
</html>

    `;
};
