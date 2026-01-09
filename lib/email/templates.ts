export const EmailTemplates = {
  // Triggered when Tech clicks "START JOB"
  jobStarted: (customerName: string, vehicle: string) => `
    <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #000;">🚗 We're getting to work!</h1>
      <p>Hi ${customerName},</p>
      <p>Our technician has just started working on your <strong>${vehicle}</strong>.</p>
      <p>We will notify you again as soon as the service is complete.</p>
      <br/>
      <p style="color: #666; font-size: 12px;">- The Revlet Team</p>
    </div>
  `,

  /// ... inside EmailTemplates ...
  invoicePaid: (customerName: string, vehicle: string, total: string, invoiceId: string) => `
    <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
      <h1 style="color: green;">✅ Payment Received</h1>
      <p>Hi ${customerName},</p>
      <p>Thank you! We have received your payment of <strong>$${total}</strong> for the service on your <strong>${vehicle}</strong>.</p>
      <br/>
      
      <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/portal/invoice/${invoiceId}" 
         style="background: black; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
         View Digital Invoice
      </a>

      <br/><br/>
      <p style="color: #666; font-size: 12px;">- The Revlet Team</p>
    </div>
  `
};