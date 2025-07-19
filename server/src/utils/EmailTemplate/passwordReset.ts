export const ForgetPasswordHTML = ({
  firstName,
  resetUrl,
  expiryTime,
}: {
  firstName: string;
  resetUrl: string;
  expiryTime: string;
}) => {
  return `

    <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Reset Your Password</title>
  <style>
    /* Fallback system font stack */
    body, table, td, a {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Ubuntu, "Helvetica Neue", sans-serif;
    }
    body {
      margin: 0;
      padding: 20px;
      background-color: #f4f4f4;
    }
    .container {
      max-width: 600px;
      margin: auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 8px rgba(0,0,0,0.05);
    }
    .header {
      background-color: #2e7d32; /* Primary green */
      padding: 20px;
      text-align: center;
      color: #ffffff;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: normal;
    }
    .content {
      padding: 30px;
      color: #333333;
      line-height: 1.5;
    }
    .btn {
      display: inline-block;
      padding: 12px 24px;
      margin: 20px 0;
      background-color: #43a047; /* Slightly lighter green */
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 4px;
      font-size: 16px;
    }
    .footer {
      background-color: #f4f4f4;
      padding: 20px;
      text-align: center;
      color: #999999;
      font-size: 12px;
    }
    /* Mobile responsiveness */
    @media screen and (max-width: 480px) {
      .content {
        padding: 20px;
      }
      .btn {
        width: 100% !important;
        box-sizing: border-box;
        text-align: center;
      }
    }
  </style>
</head>
<body>
  <div class="container" role="article" aria-labelledby="email-heading">
    <div class="header">
      <h1 id="email-heading">Reset Your Password</h1>
    </div>
    <div class="content">
      <p>Hi ${firstName}</p>
      <p>We received a request to reset your password. Click the button below to choose a new one:</p>
      <p style="text-align: center;">
        <a href="${resetUrl}" class="btn" target="_blank" rel="noopener">Reset Password</a>
      </p>
      <p>If the button above doesn’t work, copy and paste this link into your browser:</p>
      <p><a href="${resetUrl}" target="_blank" rel="noopener">${resetUrl}</a></p>
      <p>This link will expire in ${expiryTime}. If you didn’t request a password reset, you can safely ignore this email.</p>
      <p>Thanks,<br>The JetFoods Team</p>
    </div>
    <div class="footer">
      <p>If you’re having trouble, contact us at <a href="mailto:support@jetfoods.com">support@jetfoods.com</a>.</p>
      <p>&copy; 2025 JetFoods. All rights reserved.</p>
    </div>
  </div>
</body>
</html>

    
    `;
};
