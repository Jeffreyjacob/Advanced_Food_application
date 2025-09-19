export const OrderRejectedEmailHTMl = ({
  customerName,
  orderId,
  restaurantName,
}: {
  customerName: string;
  orderId: string;
  restaurantName: string;
}) => {
  return `
    <!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Order Rejected</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f8f9fa;
        margin: 0;
        padding: 0;
      }
      .container {
        max-width: 600px;
        margin: 20px auto;
        background: #ffffff;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        overflow: hidden;
      }
      .header {
        background: #e63946;
        color: #ffffff;
        text-align: center;
        padding: 20px;
      }
      .header h1 {
        margin: 0;
        font-size: 22px;
      }
      .content {
        padding: 25px;
        color: #333333;
        line-height: 1.6;
      }
      .content h2 {
        color: #e63946;
        font-size: 20px;
        margin-top: 0;
      }
      .button {
        display: inline-block;
        margin: 20px 0;
        padding: 12px 20px;
        background: #e63946;
        color: #ffffff;
        text-decoration: none;
        border-radius: 8px;
        font-weight: bold;
      }
      .footer {
        background: #f1f1f1;
        padding: 15px;
        text-align: center;
        font-size: 12px;
        color: #666666;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Order Rejected</h1>
      </div>
      <div class="content">
        <h2>Hello ${customerName},</h2>
        <p>
          Unfortunately, <strong>${restaurantName}</strong> has rejected your order 
          <strong>${orderId}</strong>.
        </p>
        <p>
          Don’t worry, the payment will be refunded to your original payment method. 
          Depending on your bank, it may take <strong>3–7 business days</strong> to reflect.
        </p>
        <p>
          You can browse other amazing restaurants in your area and place a new order right away.
        </p>
        <a href="{{appLink}}" class="button">Order Again</a>
        <p>
          We’re sorry for the inconvenience and appreciate your understanding.  
        </p>
        <p>
          –  JetFood Team
        </p>
      </div>
      <div class="footer">
        © ${new Date().getFullYear()} JetFood. All rights reserved.
      </div>
    </div>
  </body>
</html>

    `;
};
