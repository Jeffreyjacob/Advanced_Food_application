export const EmailVerificationHTMl = ({
  firstname,
  companyName,
  otp,
  expiryTime,
  url,
}: {
  firstname: string;
  companyName: string;
  otp: number;
  expiryTime: string;
  url: string;
}) => {
  return `
    <!-- File: src/utils/templates/verifyEmail/verifyEmail.html -->
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Email Verification</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      body {
        font-family: 'Segoe UI', sans-serif;
        background-color: #f6f6f6;
        padding: 20px;
        color: #333;
      }
      .container {
        max-width: 600px;
        margin: auto;
        background: #ffffff;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      }
      .header {
        background-color: #2ecc71;
        color: white;
        padding: 20px;
        text-align: center;
      }
      .content {
        padding: 30px;
      }
      .otp-box {
        background-color: #ecfdf5;
        color: #2ecc71;
        font-size: 28px;
        font-weight: bold;
        text-align: center;
        padding: 15px;
        margin: 20px 0;
        letter-spacing: 4px;
        border-radius: 5px;
        border: 2px dashed #2ecc71;
      }
      .footer {
        text-align: center;
        font-size: 12px;
        color: #888;
        padding: 20px;
      }
      .button {
        display: inline-block;
        background-color: #2ecc71;
        color: white;
        padding: 12px 20px;
        border-radius: 5px;
        text-decoration: none;
        margin-top: 20px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>${companyName}</h1>
      </div>
      <div class="content">
        <h2>Hello ${firstname},</h2>
        <p>Thank you for signing up with <strong>${companyName}</strong>.</p>
        <p>Please use the OTP below to verify your email address:</p>
        <div class="otp-box">${otp}</div>
        <p>This OTP is valid until <strong>${expiryTime}</strong>.</p>
         <p>To continue, click the button below and enter your OTP:</p>
        <a
          href="${url}"
          class="verify-button"
          target="_blank"
          rel="noopener noreferrer"
        >
          Verify Email
        </a>
        <p>If you didn’t request this, you can safely ignore this email.</p>
        <p>— The ${companyName} Team</p>
      </div>
      <div class="footer">
        © ${companyName} . All rights reserved.
      </div>
    </div>
  </body>
</html>

    
    `;
};
