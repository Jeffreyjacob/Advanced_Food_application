import { IOrder } from '../../interface/models/models';

export const CustomerNoDriverFind = ({
  orderId,
  restauarantName,
  customerName,
}: {
  orderId: IOrder['_id'];
  restauarantName: string;
  customerName: string;
}) => {
  return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Your Order is Ready for Pickup!</h2>
        
        <p>Hi ${customerName},</p>
        
        <p>We couldn't find an available driver for your order, but don't worry!</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #28a745; margin-top: 0;">Good News:</h3>
          <ul style="margin: 10px 0;">
            <li>✅ Your delivery fee has been refunded</li>
            <li>✅ Your food is being prepared by ${restauarantName}</li>
            <li>✅ You can pick up your order directly from the restaurant</li>
          </ul>
        </div>
        
        <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4 style="margin-top: 0;">Pickup Details:</h4>
          <p><strong>Restaurant:</strong> ${restauarantName}</p>
          <p><strong>Order ID:</strong> ${orderId}</p>
          <p><strong>Estimated Pickup Time:</strong> 20-30 minutes</p>
        </div>
        
        <p>Please show this email or your order ID when collecting your food.</p>
        
        <p>We apologize for any inconvenience and appreciate your understanding!</p>
        
        <p>Best regards,<br>Your JetFood Team</p>
      </div>
    `;
};
