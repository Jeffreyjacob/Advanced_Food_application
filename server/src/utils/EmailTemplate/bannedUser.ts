import { RoleEnums } from '../../interface/enums/enums';

export const BannedUserHtml = ({
  userName,
  userType,
  rejectionCount,
  suspendedAt,
  suspensionEnds,
}: {
  userName: string;
  userType: RoleEnums;
  rejectionCount: number;
  suspendedAt: string;
  suspensionEnds: string;
}) => {
  return `
    
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Account Temporarily Suspended</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: white;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #ff6b6b, #ff5252);
            color: white;
            padding: 30px 40px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        .content {
            padding: 40px;
        }
        .warning-box {
            background-color: #fef2f2;
            border-left: 4px solid #ef4444;
            padding: 20px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
        }
        .info-box {
            background-color: #f0f9ff;
            border: 1px solid #0ea5e9;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
        }
        .details-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            background-color: #fafafa;
            border-radius: 8px;
            overflow: hidden;
        }
        .details-table th, .details-table td {
            padding: 12px 16px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
        }
        .details-table th {
            background-color: #f3f4f6;
            font-weight: 600;
            color: #374151;
        }
        .button {
            display: inline-block;
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            color: white;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 600;
            text-align: center;
            margin: 20px 0;
        }
        .footer {
            background-color: #f9fafb;
            padding: 30px 40px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
        }
        .countdown {
            font-size: 18px;
            font-weight: 600;
            color: #dc2626;
            text-align: center;
            margin: 20px 0;
        }
        @media (max-width: 600px) {
            .container {
                margin: 10px;
                border-radius: 8px;
            }
            .header, .content, .footer {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Account Temporarily Suspended</h1>
        </div>
        
        <div class="content">
            <div class="warning-box">
                <h3 style="margin: 0 0 10px 0; color: #dc2626;">Important Notice</h3>
                <p style="margin: 0;">Your account has been temporarily suspended due to exceeding the daily order rejection limit.</p>
            </div>

            <p>Dear ${userName},</p>

            <p>We're writing to inform you that your ${userType} account has been temporarily suspended for 24 hours due to policy violations.</p>

            <table class="details-table">
                <tr>
                    <th>Suspension Details</th>
                    <th>Information</th>
                </tr>
                <tr>
                    <td>Reason</td>
                    <td>Exceeded daily rejection limit (${rejectionCount} rejections)</td>
                </tr>
                <tr>
                    <td>Suspended At</td>
                    <td>${suspendedAt}</td>
                </tr>
                <tr>
                    <td>Suspension Ends</td>
                    <td>${suspensionEnds}</td>
                </tr>
                <tr>
                    <td>Account Type</td>
                    <td>${userType}</td>
                </tr>
            </table>

            <div class="countdown">
                Time Remaining: Approximately 24 hours
            </div>

            <div class="info-box">
                <h4 style="margin: 0 0 10px 0; color: #0ea5e9;">What This Means:</h4>
                <ul style="margin: 0; padding-left: 20px;">
                    <li>You cannot accept new orders during this period</li>
                    <li>Your account will be automatically reactivated after 24 hours</li>
                    <li>This suspension is temporary and will not affect your long-term standing</li>
                </ul>
            </div>

            <h3>Why Was My Account Suspended?</h3>
            <p>Our platform maintains quality standards to ensure the best experience for customers. When {{userType}}s reject more than 5 orders in a single day, it affects:</p>
            <ul>
                <li>Customer satisfaction and experience</li>
                <li>Overall platform reliability</li>
                <li>Order fulfillment efficiency</li>
            </ul>

            <h3>How to Avoid Future Suspensions:</h3>
            <ul>
                <li>Only accept orders you can fulfill completely</li>
                <li>Update your availability status when you cannot take orders</li>
                <li>Communicate any issues with our support team promptly</li>
                <li>Review order details carefully before accepting</li>
            </ul>

            <div style="text-align: center; margin: 30px 0;">
                <a href="{{supportUrl}}" class="button">Contact Support</a>
            </div>

            <p>If you believe this suspension was applied in error, please contact our support team immediately. We're here to help and ensure fair treatment for all partners.</p>

            <p>Thank you for your understanding and cooperation.</p>

            <p style="margin-top: 30px;">
                Best regards,<br>
                <strong>JetFood Team</strong>
            </p>
        </div>

        <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>For support, visit <a href="{{supportUrl}}" style="color: #3b82f6;">{{supportUrl}}</a> or email {{supportEmail}}</p>
            <p>&copy; ${new Date().getFullYear()} JetFood. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `;
};
