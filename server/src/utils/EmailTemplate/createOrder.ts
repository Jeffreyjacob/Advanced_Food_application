import { ICartItem } from '../../interface/models/models';

export const CreateOrderHTML = ({
  customerName,
  orderId,
  restaurantName,
  items,
  subtotal,
  deliveryFee,
  tip,
  total,
}: {
  customerName: string;
  orderId: string;
  restaurantName: string;
  items: ICartItem[];
  subtotal: number;
  deliveryFee: number;
  tip: number;
  total: number;
}) => {
  // generate rows for items
  const itemRows = items
    .map(
      (item) => `
      <tr>
        <td style="padding:8px 0; vertical-align:middle;">
          <img src="${item.image}" alt="${item.name}" width="40" height="40" style="border-radius:6px; vertical-align:middle; margin-right:8px;">
          ${item.name}
        </td>
        <td align="center">${item.quantity}</td>
        <td align="right">$${(item.basePrice * item.quantity).toFixed(2)}</td>
      </tr>`
    )
    .join('');

  return `
  <!doctype html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Order Confirmation</title>
  </head>
  <body style="font-family: Arial, sans-serif; background:#f9fafb; padding:20px;">
    <table role="presentation" width="100%" style="max-width:600px; margin:auto; background:#fff; border-radius:8px; padding:20px; border:1px solid #eee;">
      <tr>
        <td>
          <h2 style="margin-top:0;">Hi ${customerName}, your order is confirmed 🎉</h2>
          <p>Order <strong>#${orderId}</strong> has been placed at <strong>${restaurantName}</strong>.</p>

          <h3 style="margin-top:24px;">Items</h3>
          <table role="presentation" width="100%" style="border-collapse:collapse;">
            <thead>
              <tr style="border-bottom:1px solid #ddd;">
                <th align="left">Item</th>
                <th align="center">Qty</th>
                <th align="right">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemRows}
            </tbody>
          </table>

          <h3 style="margin-top:24px;">Summary</h3>
          <table role="presentation" width="100%">
            <tr>
              <td>Subtotal</td>
              <td align="right">$${subtotal}</td>
            </tr>
            <tr>
              <td>Delivery Fee</td>
              <td align="right">$${deliveryFee}</td>
            </tr>
            <tr>
              <td>Tip</td>
              <td align="right">$${tip}</td>
            </tr>
            <tr style="font-weight:bold; border-top:1px solid #ddd;">
              <td>Total</td>
              <td align="right">$${total}</td>
            </tr>
          </table>

          <p style="margin-top:24px; font-size:14px; color:#555;">
            Thanks for ordering with JetFood 🚀  
          </p>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
};
