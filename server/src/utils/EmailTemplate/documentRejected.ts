import { RestaurantDocumentTypeEnum } from '../../interface/enums/enums';

export const DocumentRejectedHTML = ({
  username,
  documentType,
  year,
  rejectedReasons,
}: {
  username: string;
  documentType: RestaurantDocumentTypeEnum;
  year: number;
  rejectedReasons: string[];
}): string => {
  // build the <p> list
  const reasonsHtml = rejectedReasons
    .map((reason) => `<p>${reason}</p>`)
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Document Rejected</title>
  <style>
    body { font-family: Arial, sans-serif; color: #333; line-height: 1.5; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #F44336; color: white; padding: 10px; text-align: center; }
    .content { padding: 20px; }
    .button {
      display: inline-block;
      margin-top: 20px;
      padding: 12px 24px;
      background-color: #F44336;
      color: #fff;
      text-decoration: none;
      border-radius: 4px;
    }
    .reason-box {
      background-color: #fdd;
      border: 1px solid #f99;
      padding: 10px;
      margin-top: 10px;
      border-radius: 4px;
    }
    .footer { margin-top: 30px; font-size: 12px; color: #777; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Document Rejected</h1>
    </div>
    <div class="content">
      <p>Hi ${username},</p>
      <p>We’re sorry to inform you that your <strong>${documentType}</strong> has been <span style="color: #F44336;">rejected</span>.</p>
      <div class="reason-box">
        <strong>Reason(s):</strong>
        ${reasonsHtml}
      </div>
      <p>Please log in to your project to review the details and make any necessary corrections.</p>
    </div>
    <div class="footer">
      <p>If you have questions or need help resolving these issues, just reply to this email.</p>
      <p>© ${year} YourCompany, Inc. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
};
