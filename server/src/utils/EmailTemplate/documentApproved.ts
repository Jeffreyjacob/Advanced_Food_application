import { RestaurantDocumentTypeEnum } from '../../interface/enums/enums';

export const DocumentApprovedHTML = ({
  username,
  documentType,
  year,
}: {
  username: string;
  documentType: RestaurantDocumentTypeEnum | 'VehicleRegistrationDocument';
  year: number;
}) => {
  return `
    <!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Document Approved</title>
  <style>
    body { font-family: Arial, sans-serif; color: #333; line-height: 1.5; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4CAF50; color: white; padding: 10px; text-align: center; }
    .content { padding: 20px; }
    .button {
      display: inline-block;
      margin-top: 20px;
      padding: 12px 24px;
      background-color: #4CAF50;
      color: #fff;
      text-decoration: none;
      border-radius: 4px;
    }
    .footer { margin-top: 30px; font-size: 12px; color: #777; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Congratulations!</h1>
    </div>
    <div class="content">
      <p>Hi ${username},</p>
      <p>We’re excited to let you know that your <strong>${documentType}</strong> has been <span style="color: #4CAF50;">approved</span>!</p>
      <p>You can now view it in your dashboard and continue with your next steps.</p>
    </div>
    <div class="footer">
      <p>If you have any questions, feel free to reply to this email or contact our support team.</p>
      <p>© ${year} YourCompany, Inc. All rights reserved.</p>
    </div>
  </div>
</body>
</html>

    `;
};
