// lib/email/sendPdf.ts
import nodemailer from "nodemailer";

export async function sendPdfEmail({
  to,
  subject,
  html,
  pdfBuffer,
  filename = "service-request.pdf",
}: {
  to: string;
  subject: string;
  html: string;
  pdfBuffer: Buffer;
  filename?: string;
}) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST!,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM!,
    to,
    subject,
    html,
    attachments: [
      {
        filename,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });
}
