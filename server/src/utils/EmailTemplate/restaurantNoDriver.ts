import { IOrder } from '../../interface/models/models';

export const RestaurantNoDriver = ({
  restaurantName,
  orderId,
  customerName,
}: {
  restaurantName: string;
  orderId: IOrder['_id'];
  customerName: string;
}) => {
  return `
  <!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Driver Unavailable</title>
  </head>
  <body style="margin:0; padding:0; font-family: Arial, sans-serif; background-color:#f9f9f9;">
    <table align="center" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:12px; box-shadow:0 4px 12px rgba(0,0,0,0.08); overflow:hidden;">
      <tr>
        <td style="background-color:#b19cd9; padding:20px; text-align:center; color:white;">
          <h1 style="margin:0; font-size:22px;">Delivery Alert</h1>
        </td>
      </tr>
      <tr>
        <td style="padding:20px; color:#333;">
          <h2 style="margin-top:0;">No driver available</h2>
          <p>
            Hello <strong>${restaurantName}</strong>, unfortunately, we couldn’t find a driver for a recent order.  
            The order has been refunded to the customer, who will now pick it up directly from your restaurant.
          </p>

          <!-- Order Info -->
          <h3 style="margin-top:25px; color:#555;">Order Info</h3>
          <p><strong>Order ID:</strong> ${orderId}</p>
          <p><strong>Customer:</strong>${customerName}</p>

          <div style="text-align:center; margin-top:30px;">
            <a href="{{orderLink}}" style="background:#b19cd9; color:white; text-decoration:none; padding:12px 24px; border-radius:6px; font-weight:bold;">View Order Details</a>
          </div>
        </td>
      </tr>
      <tr>
        <td style="background:#f0f0f5; padding:15px; text-align:center; font-size:12px; color:#666;">
          We appreciate your cooperation 💜 <br />
          — The JetFood Team
        </td>
      </tr>
    </table>
  </body>
</html>

  `;
};
