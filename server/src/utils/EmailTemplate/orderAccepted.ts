export const OrderAccepted = ({
  restaurantName,
  customerName,
  preparationTime,
  orderId,
}: {
  restaurantName: string;
  customerName: string;
  preparationTime: number;
  orderId: string;
}) => {
  return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Order Accepted</title>
  <style>
    body,table,td,a { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
    table { border-collapse:collapse !important; }
    img { border:0; height:auto; line-height:100%; outline:none; text-decoration:none; display:block; }
    a { color:#1a73e8; text-decoration:none; }
    body { background:#f4f6f8; margin:0; padding:24px; font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial; color:#111827; }
    .card { max-width:640px; margin:0 auto; background:#fff; border-radius:8px; overflow:hidden; box-shadow:0 6px 18px rgba(17,24,39,0.06); }
    .header { padding:18px 20px; background:linear-gradient(90deg,#ff7a18,#ff4e50); color:#fff; }
    .brand { font-weight:700; font-size:18px; }
    .body { padding:20px; }
    .h1 { margin:0 0 10px; font-size:20px; font-weight:700; }
    .muted { color:#6b7280; font-size:14px; line-height:1.4; }
    .eta { display:inline-block; margin-top:10px; padding:10px 14px; border-radius:999px; background:#fffbe6; border:1px solid #ffecb5; color:#92400e; font-weight:700; }
    .cta { display:inline-block; margin-top:16px; padding:10px 16px; border-radius:8px; background:#111827; color:#fff; text-decoration:none; font-weight:600; }
    .footer { padding:16px 20px; background:#fafbfc; color:#6b7280; font-size:13px; text-align:center; }
    @media (max-width:480px){ .body{ padding:14px } .header{ padding:14px } }
  </style>
</head>
<body>
  <table width="100%" role="presentation">
    <tr>
      <td align="center">
        <table class="card" role="presentation" width="100%">
          <tr>
            <td class="header" align="left">
              <div class="brand">${restaurantName}</div>
              <div style="opacity:0.95; margin-top:6px; font-size:13px;">Order accepted • #{{orderNumber}}</div>
            </td>
          </tr>

          <tr>
            <td class="body">
              <h1 class="h1">Your order has been accepted 🎉</h1>
              <p class="muted">
                Hi <strong>${customerName}</strong>,<br />
                {{restaurantName}} has accepted your order (${orderId}). The kitchen is preparing your meal now.
              </p>

              <div style="margin-top:14px;">
                <div style="font-size:13px; color:#6b7280;">Estimated preparation time</div>
                <div class="eta">${preparationTime}</div>
              </div>

        

              <p class="muted" style="margin-top:16px;">
                Note: Estimated prep time is the restaurant's current estimate and may change slightly. To update or cancel, contact the restaurant immediately.
              </p>

        
            </td>
          </tr>

          <tr>
            <td class="footer">
              <div><strong>${restaurantName}</strong></div>
              <div style="margin-top:6px;">If you didn't place this order, reply to this email or contact support immediately.</div>
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
