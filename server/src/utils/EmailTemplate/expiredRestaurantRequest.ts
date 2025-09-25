import { IOrder } from '../../interface/models/models';

export const ExpiredRestaurantRequest = ({
  orderId,
  restaurantName,
  expiredTime,
  totalAmount,
  itemCount,
}: {
  orderId: IOrder['_id'];
  restaurantName: string;
  expiredTime: string;
  totalAmount: number;
  itemCount: number;
}) => {
  return `
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Expired - Complete Your Purchase</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f5f5f5;
            line-height: 1.6;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 30px 20px;
            text-align: center;
        }
        
        .logo {
            color: white;
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        .header-text {
            color: rgba(255, 255, 255, 0.9);
            font-size: 16px;
            margin: 0;
        }
        
        .content {
            padding: 40px 30px;
        }
        
        .icon-container {
            text-align: center;
            margin-bottom: 30px;
        }
        
        .clock-icon {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #ff6b6b, #ffa726);
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 40px;
            color: white;
        }
        
        .main-heading {
            text-align: center;
            color: #2c3e50;
            font-size: 28px;
            margin: 0 0 15px 0;
            font-weight: 600;
        }
        
        .subtitle {
            text-align: center;
            color: #7f8c8d;
            font-size: 16px;
            margin: 0 0 30px 0;
        }
        
        .order-info {
            background: #f8f9fa;
            border-radius: 12px;
            padding: 25px;
            margin: 30px 0;
            border-left: 4px solid #3498db;
        }
        
        .order-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 1px solid #ecf0f1;
        }
        
        .order-row:last-child {
            margin-bottom: 0;
            border-bottom: none;
            padding-bottom: 0;
        }
        
        .order-label {
            font-weight: 600;
            color: #2c3e50;
        }
        
        .order-value {
            color: #34495e;
        }
        
        .restaurant-name {
            color: #e74c3c;
            font-weight: 600;
        }
        
        .expired-notice {
            background: linear-gradient(135deg, #ff6b6b, #ee5a52);
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            margin: 25px 0;
        }
        
        .expired-notice h3 {
            margin: 0 0 10px 0;
            font-size: 18px;
        }
        
        .expired-notice p {
            margin: 0;
            opacity: 0.9;
        }
        
        .cta-section {
            text-align: center;
            margin: 35px 0;
        }
        
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #4CAF50, #45a049);
            color: white;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 50px;
            font-weight: 600;
            font-size: 16px;
            transition: transform 0.2s ease;
            box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
        }
        
        .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
        }
        
        .secondary-cta {
            text-align: center;
            margin: 20px 0;
        }
        
        .secondary-link {
            color: #3498db;
            text-decoration: none;
            font-weight: 500;
        }
        
        .help-section {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin: 30px 0;
            text-align: center;
        }
        
        .help-section h3 {
            color: #2c3e50;
            margin: 0 0 10px 0;
        }
        
        .contact-info {
            color: #7f8c8d;
            margin: 5px 0;
        }
        
        .footer {
            background: #34495e;
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        
        .footer-links {
            margin: 20px 0;
        }
        
        .footer-links a {
            color: #bdc3c7;
            text-decoration: none;
            margin: 0 15px;
            font-size: 14px;
        }
        
        .social-links {
            margin: 20px 0;
        }
        
        .social-links a {
            display: inline-block;
            margin: 0 10px;
            color: #bdc3c7;
            font-size: 20px;
            text-decoration: none;
        }
        
        .copyright {
            color: #95a5a6;
            font-size: 12px;
            margin-top: 20px;
        }
        
        @media (max-width: 600px) {
            .content {
                padding: 30px 20px;
            }
            
            .order-info {
                padding: 20px 15px;
            }
            
            .main-heading {
                font-size: 24px;
            }
            
            .cta-button {
                padding: 14px 28px;
                font-size: 15px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header -->
        <div class="header">
            <div class="logo">FoodieExpress</div>
            <p class="header-text">Your favorite meals, delivered fast</p>
        </div>
        
        <!-- Main Content -->
        <div class="content">
            <div class="icon-container">
                <div class="clock-icon">⏰</div>
            </div>
            
            <h1 class="main-heading">Restaurant Request Expired</h1>
            <p class="subtitle">The restaurant didn't respond in time, but we're here to help!</p>
            
            <!-- Order Information -->
            <div class="order-info">
                <div class="order-row">
                    <span class="order-label">Order ID:</span>
                    <span class="order-value">${orderId}</span>
                </div>
                <div class="order-row">
                    <span class="order-label">Restaurant:</span>
                    <span class="order-value restaurant-name">${restaurantName}</span>
                </div>
                <div class="order-row">
                    <span class="order-label">Items:</span>
                    <span class="order-value">${itemCount} items</span>
                </div>
                <div class="order-row">
                    <span class="order-label">Total:</span>
                    <span class="order-value">$ ${totalAmount}</span>
                </div>
                <div class="order-row">
                    <span class="order-label">Request expired at:</span>
                    <span class="order-value">${expiredTime}</span>
                </div>
            </div>
            
            <!-- Expiry Notice -->
            <div class="expired-notice">
                <h3>⏰ Restaurant Response Timeout</h3>
                <p>Unfortunately, {{RESTAURANT_NAME}} didn't accept or decline your order within the required time frame. This happens sometimes during busy periods.</p>
            </div>
            
        
        
            
            <!-- Help Section -->
            <div class="help-section">
                <h3>What happens next?</h3>
                <p style="color: #2c3e50; margin-bottom: 15px;">• Your payment has been refunded automatically</p>
                <p style="color: #2c3e50; margin-bottom: 15px;">• Your cart items are still saved for easy reordering</p>
                <p style="color: #2c3e50; margin-bottom: 20px;">• Try other nearby restaurants with faster response times</p>
                
                <h3>Need Help?</h3>
                <p class="contact-info">📞 Customer Support: {{SUPPORT_PHONE}}</p>
                <p class="contact-info">📧 Email: {{SUPPORT_EMAIL}}</p>
                <p class="contact-info">💬 Live Chat: Available 24/7 on our app</p>
            </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <div class="footer-links">
                <a href="{{WEBSITE_URL}}">Home</a>
                <a href="{{HELP_URL}}">Help Center</a>
                <a href="{{PRIVACY_URL}}">Privacy Policy</a>
                <a href="{{TERMS_URL}}">Terms of Service</a>
            </div>
            
            <div class="social-links">
                <a href="{{FACEBOOK_URL}}">📘</a>
                <a href="{{TWITTER_URL}}">🐦</a>
                <a href="{{INSTAGRAM_URL}}">📷</a>
            </div>
            
            <p class="copyright">
                © 2025 FoodieExpress. All rights reserved.<br>
                {{COMPANY_ADDRESS}}
            </p>
        </div>
    </div>
</body>
</html>
    `;
};
