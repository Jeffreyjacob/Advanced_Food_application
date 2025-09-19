import { RoleEnums } from '../../interface/enums/enums';

export const WarningBanEmailHTML = ({
  userName,
  rejectionCount,
  userType,
}: {
  userName: string;
  rejectionCount: number;
  userType: RoleEnums;
}) => {
  return `
    
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Important Warning - Order Rejections</title>
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
            background: linear-gradient(135deg, #f59e0b, #d97706);
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
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 20px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
        }
        .danger-box {
            background-color: #fef2f2;
            border: 1px solid #ef4444;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
        }
        .progress-bar {
            background-color: #e5e7eb;
            border-radius: 10px;
            padding: 3px;
            margin: 20px 0;
        }
        .progress-fill {
            background: linear-gradient(90deg, #f59e0b, #ef4444);
            height: 20px;
            border-radius: 8px;
            width: 60%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 600;
            font-size: 12px;
        }
        .stats-container {
            display: flex;
            justify-content: space-between;
            margin: 25px 0;
            gap: 15px;
        }
        .stat-box {
            flex: 1;
            background-color: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            border: 1px solid #e2e8f0;
        }
        .stat-number {
            font-size: 32px;
            font-weight: 700;
            color: #dc2626;
        }
        .stat-number.warning {
            color: #f59e0b;
        }
        .stat-label {
            font-size: 14px;
            color: #64748b;
            margin-top: 5px;
        }
        .button {
            display: inline-block;
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            color: white;
            text-decoration: none;
            padding: 14px 28px;
            border-radius: 8px;
            font-weight: 600;
            text-align: center;
            margin: 20px 0;
            font-size: 16px;
        }
        .tips-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin: 25px 0;
        }
        .tip-item {
            background-color: #f0f9ff;
            padding: 15px;
            border-radius: 8px;
            border-left: 3px solid #0ea5e9;
        }
        .tip-title {
            font-weight: 600;
            color: #0c4a6e;
            margin-bottom: 5px;
        }
        .tip-desc {
            font-size: 14px;
            color: #0369a1;
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
            font-size: 16px;
            font-weight: 600;
            color: #dc2626;
            text-align: center;
            margin: 20px 0;
            padding: 15px;
            background-color: #fef2f2;
            border-radius: 8px;
            border: 1px solid #fecaca;
        }
        @media (max-width: 600px) {
            .container {
                margin: 10px;
                border-radius: 8px;
            }
            .header, .content, .footer {
                padding: 20px;
            }
            .stats-container {
                flex-direction: column;
            }
            .tips-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⚠️ Important Warning Notice</h1>
        </div>
        
        <div class="content">
            <div class="warning-box">
                <h3 style="margin: 0 0 10px 0; color: #d97706;">Action Required</h3>
                <p style="margin: 0;">You're approaching the daily order rejection limit. Please read this important notice carefully.</p>
            </div>

            <p>Dear ${userName},</p>

            <p>We're reaching out with an important warning regarding your recent order rejection activity on our platform.</p>

            <div class="stats-container">
                <div class="stat-box">
                    <div class="stat-number">5</div>
                    <div class="stat-label">REJECTIONS TODAY</div>
                </div>
                <div class="stat-box">
                    <div class="stat-number warning">2</div>
                    <div class="stat-label">REMAINING BEFORE BAN</div>
                </div>
            </div>

            <div class="progress-bar">
                <div class="progress-fill">
                    ${rejectionCount} of 5 Rejections
                </div>
            </div>

            <div class="danger-box">
                <h4 style="margin: 0 0 15px 0; color: #dc2626;">Critical Alert</h4>
                <p style="margin: 0;">If you reject <strong>2 more orders</strong> today, your ${userType} account will be automatically suspended for 24 hours. During this time, you won't be able to receive or accept any new orders.</p>
            </div>

            <h3>What This Means for You:</h3>
            <ul>
                <li><strong>Current Status:</strong> Your account is still active</li>
                <li><strong>Rejections Today:</strong> ${rejectionCount} out of 5 allowed</li>
                <li><strong>Risk Level:</strong> High - Only 2 rejections remaining</li>
            </ul>

            <div class="countdown">
                ⏰ Daily limit resets in approximately 24 hours
            </div>

            <h3>Immediate Action Steps:</h3>
            <div class="tips-grid">
                <div class="tip-item">
                    <div class="tip-title">Review Carefully</div>
                    <div class="tip-desc">Check order details thoroughly before accepting</div>
                </div>
                <div class="tip-item">
                    <div class="tip-title">Update Status</div>
                    <div class="tip-desc">Set yourself as unavailable if you cannot fulfill orders</div>
                </div>
                <div class="tip-item">
                    <div class="tip-title">Plan Ahead</div>
                    <div class="tip-desc">Consider your capacity before going online</div>
                </div>
                <div class="tip-item">
                    <div class="tip-title">Contact Support</div>
                    <div class="tip-desc">Reach out if you're experiencing technical issues</div>
                </div>
            </div>

            <h3>Why Do We Have This Policy?</h3>
            <p>Our rejection limits help ensure:</p>
            <ul>
                <li>Consistent service quality for customers</li>
                <li>Fair distribution of orders among all partners</li>
                <li>Reliable platform experience for everyone</li>
                <li>Better customer satisfaction and retention</li>
            </ul>

        

            <h3>Need Help?</h3>
            <p>If you're experiencing issues that are causing rejections, please contact our support team immediately:</p>
            <ul>
                <li>📧 <strong>Email:</strong> {{supportEmail}}</li>
                <li>💬 <strong>Live Chat:</strong> Available in your dashboard</li>
                <li>📱 <strong>Phone:</strong> {{supportPhone}}</li>
            </ul>

            <p>We want to help you succeed on our platform. This warning is intended to help you avoid a temporary suspension and maintain your ability to serve customers.</p>

            <p style="margin-top: 30px;">
                Thank you for your attention to this matter.<br>
                <strong>JetFood Partner Success Team</strong>
            </p>
        </div>

        <div class="footer">
            <p>This is an automated warning notification. Please take action to avoid account suspension.</p>
            <p>For immediate assistance, visit <a href="{{supportUrl}}" style="color: #3b82f6;">{{supportUrl}}</a> or email {{supportEmail}}</p>
            <p>&copy;${new Date().getFullYear()} JetFood. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `;
};
