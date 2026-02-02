import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// ✅ Default Shop Name (Change this to your actual Business Name)
const DEFAULT_SHOP_NAME = "Big O Tires Mobile Services";

export async function sendApprovalEmail(email: string, name: string, shopName: string = DEFAULT_SHOP_NAME) {
  if (!email) return;
  
  try {
    const { data, error } = await resend.emails.send({
      from: 'Revlet Notifications <onboarding@resend.dev>', // Update this domain when you go live
      to: [email],
      subject: `✅ Approved: Connect to ${shopName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                .header { background-color: #000000; padding: 20px 40px; text-align: left; }
                .logo { color: #ffffff; font-size: 24px; font-weight: 900; font-style: italic; letter-spacing: -1px; margin: 0; }
                .logo span { background-color: #333; padding: 2px 6px; border-radius: 4px; margin-right: 4px; font-size: 18px; font-style: normal; }
                .content { padding: 40px; color: #333333; line-height: 1.6; }
                .btn { display: inline-block; background-color: #000000; color: #ffffff !important; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; }
                .footer { background-color: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #999999; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo"><span>R</span> REVLET</div>
                </div>

                <div class="content">
                    <h2 style="margin-top: 0; color: #000;">Account Approved</h2>
                    <p>Hello <strong>${name || 'Partner'}</strong>,</p>
                    
                    <p>Good news! <strong>${shopName}</strong> has approved your fleet account request.</p>
                    
                    <p>You can now use the <strong>Revlet Shop Management System</strong> to:</p>
                    <ul style="color: #555; padding-left: 20px;">
                        <li>📍 Track vehicle status in real-time</li>
                        <li>🔧 Approve estimates & repairs</li>
                        <li>📄 View invoices & service history</li>
                    </ul>

                    <center>
                        <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/login" class="btn">
                            Access Fleet Portal
                        </a>
                    </center>
                </div>

                <div class="footer">
                    <p>Powered by Revlet Shop Management<br/>
                    Connecting you to ${shopName}</p>
                </div>
            </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error("❌ Email Error:", error);
      return false;
    }

    console.log("✅ Approval Email Sent to:", email);
    return true;
  } catch (e) {
    console.error("❌ Email Exception:", e);
    return false;
  }
}