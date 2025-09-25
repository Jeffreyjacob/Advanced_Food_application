export const PaymentFailedEmailHTML = ({
  customerName,
  orderId,
}: {
  customerName: string;
  orderId: string;
}) => {
  return `
    <!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Payment Failed</title>
  </head>
  <body style="margin:0; padding:0; font-family:Arial, sans-serif; background:#f7f7f7;">
    <table width="100%" cellspacing="0" cellpadding="0" style="background:#f7f7f7; padding:20px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="20" cellspacing="0" style="background:#ffffff; border-radius:8px;">
            <tr>
              <td align="center" style="font-size:20px; font-weight:bold; color:#e53935;">
                ❌ Payment Failed
              </td>
            </tr>
            <tr>
              <td style="font-size:16px; color:#333;">
                Hi <strong>${customerName}</strong>, <br /><br />
                Unfortunately, your payment for order <strong>${orderId}</strong> could not be processed.  
              </td>
            </tr>
            <tr>
              <td style="font-size:15px; color:#444;">
                Possible reasons:
                <ul>
                  <li>Insufficient funds</li>
                  <li>Expired or invalid card</li>
                  <li>Bank declined transaction</li>
                </ul>
              </td>
            </tr>
            <tr>
              <td style="font-size:14px; color:#555;">
                If you continue to face issues, please contact our support team for assistance.
              </td>
            </tr>
            <tr>
              <td align="center" style="font-size:12px; color:#aaa;">
                We're here to help — JetFood Support Team
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
