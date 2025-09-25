export const PaymentSucessfulEmailHTML = ({
  orderId,
  restaurantName,
  customerName,
  subtotal,
  total,
  deliveryFee,
}: {
  orderId: string;
  restaurantName: string;
  customerName: string;
  subtotal: number;
  total: number;
  deliveryFee: number;
}) => {
  return `
    
    
    <!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Payment Successful</title>
  </head>
  <body style="margin:0; padding:0; font-family:Arial, sans-serif; background:#f7f7f7;">
    <table width="100%" cellspacing="0" cellpadding="0" style="background:#f7f7f7; padding:20px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="20" cellspacing="0" style="background:#ffffff; border-radius:8px;">
            <tr>
              <td align="center" style="font-size:20px; font-weight:bold; color:#4CAF50;">
                ✅ Payment Successful!
              </td>
            </tr>
            <tr>
              <td style="font-size:16px; color:#333;">
                Hi <strong>${customerName}</strong>, <br /><br />
                Your payment for order <strong>${orderId}</strong> has been
                successfully processed. 🎉
              </td>
            </tr>
            <tr>
              <td>
                <table width="100%" style="border-collapse: collapse;">
                  <tr>
                    <td style="padding:8px; border:1px solid #ddd;">Restaurant</td>
                    <td style="padding:8px; border:1px solid #ddd;">${restaurantName}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px; border:1px solid #ddd;">Subtotal</td>
                    <td style="padding:8px; border:1px solid #ddd;">${subtotal}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px; border:1px solid #ddd;">Delivery Fee</td>
                    <td style="padding:8px; border:1px solid #ddd;">${deliveryFee}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px; border:1px solid #ddd; font-weight:bold;">Total</td>
                    <td style="padding:8px; border:1px solid #ddd; font-weight:bold;">${total}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="font-size:14px; color:#555;">
                You will receive updates as your order is being prepared and out for delivery. 🚀
              </td>
            </tr>
            <tr>
              <td align="center">
                <a href="{{orderTrackingUrl}}" 
                   style="display:inline-block; padding:10px 20px; background:#4CAF50; color:#fff; text-decoration:none; border-radius:5px;">
                  Track Your Order
                </a>
              </td>
            </tr>
            <tr>
              <td align="center" style="font-size:12px; color:#aaa;">
                Thank you for ordering with JetFood ❤️
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>

    `;
};
