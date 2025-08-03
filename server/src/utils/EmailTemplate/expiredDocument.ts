import { RestaurantDocumentTypeEnum } from '../../interface/enums/enums';

export const ExpiryDocumentHTML = ({
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
  <title>Document Expired</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f9fafb; padding: 20px;">

  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
    <tr>
      <td style="background-color: #dc2626; padding: 20px; text-align: center; color: #ffffff;">
        <h2 style="margin: 0;">Your Document Has Expired</h2>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px; color: #111827;">
        <p>Hi <strong>${ownerName}</strong>,</p>
        <p>We wanted to let you know that your <strong>${documentType}</strong> for your restaurant <strong>${restaurantName}</strong> expired on <strong>${expiryDate}</strong>.</p>
        <p>Your restaurant’s verification status is now <strong>inactive</strong> until you upload a valid document.</p>

        <p style="text-align: center; margin-top: 30px;">
          please login your account to upload new validate document.
        </p>

        <p style="margin-top: 30px;">Thank you,<br>The Verification Team</p>
      </td>
    </tr>
  </table>

</body>
</html>

    `;
};
