import nodemailer from 'nodemailer';

export interface SendEmailResult {
  success: boolean;
  sentVia: 'smtp' | 'ethereal' | 'none';
  message: string;
  previewUrl?: string | false;
  recipient: string;
  resetLink: string;
}

export async function sendPasswordResetEmail(
  recipientEmail: string,
  resetLink: string
): Promise<SendEmailResult> {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = Number(process.env.SMTP_PORT || 587);
  const from = process.env.SMTP_FROM || (user ? `"Fund Bridge Support" <${user}>` : '"Fund Bridge Security" <noreply@ngofunds.org>');

  // 1. If real SMTP credentials are provided in .env, send live email
  if (host && user && pass) {
    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });

      await transporter.sendMail({
        from,
        to: recipientEmail,
        subject: `Password Reset Request for User: ${recipientEmail}`,
        text: `Hello,\n\nYou requested to reset your password on the Fund Bridge NGO Portal.\n\nClick the link below to reset your password and login directly into your dashboard:\n${resetLink}\n\nThis reset email was sent directly to user: ${recipientEmail} (not administration).\n\nFund Bridge Security Team`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 28px; background-color: #0f172a; color: #f8fafc; border-radius: 16px; border: 1px solid #334155;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #14b8a6; margin: 0; font-size: 22px; letter-spacing: 1px;">FUND BRIDGE</h1>
              <p style="color: #94a3b8; font-size: 12px; margin-top: 4px;">NGO Fund Management System</p>
            </div>
            
            <div style="background-color: #1e293b; padding: 24px; border-radius: 12px; border: 1px solid #334155; margin-bottom: 20px;">
              <div style="display: inline-block; background-color: rgba(20, 184, 166, 0.15); color: #2dd4bf; font-size: 11px; font-weight: bold; text-transform: uppercase; padding: 4px 10px; border-radius: 9999px; margin-bottom: 12px;">
                User Password Recovery
              </div>
              <h2 style="color: #ffffff; font-size: 18px; margin: 0 0 12px 0;">Reset Your Password</h2>
              <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
                This password reset request was sent directly to user account: <strong>${recipientEmail}</strong> (not to administration). Click the button below to choose a new password and immediately log in to your dashboard.
              </p>
              
              <div style="text-align: center; margin: 24px 0;">
                <a href="${resetLink}" style="background: linear-gradient(135deg, #0d9488, #059669); color: #ffffff; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 10px; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(13, 148, 136, 0.3);">
                  Reset Password &amp; Login to User Dashboard &rarr;
                </a>
              </div>
              
              <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin-top: 24px; padding-top: 16px; border-top: 1px solid #334155;">
                Or copy and paste this link in your browser:<br/>
                <a href="${resetLink}" style="color: #2dd4bf; word-break: break-all; font-size: 11px;">${resetLink}</a>
              </p>
            </div>
            
            <div style="text-align: center; color: #64748b; font-size: 11px; line-height: 1.5;">
              <p style="margin: 0;">Recipient: ${recipientEmail} | User Account</p>
              <p style="margin: 4px 0 0 0;">This reset link expires in 15 minutes.</p>
            </div>
          </div>
        `,
      });

      return {
        success: true,
        sentVia: 'smtp',
        message: `Live email dispatched directly to user: ${recipientEmail} via SMTP. Please check your inbox and spam folder.`,
        recipient: recipientEmail,
        resetLink,
      };
    } catch (err: any) {
      console.error('SMTP send error:', err);
      return {
        success: false,
        sentVia: 'none',
        message: `SMTP delivery failed: ${err.message || 'Connection failed'}.`,
        recipient: recipientEmail,
        resetLink,
      };
    }
  }

  // 2. Fallback if no SMTP configured: Generate Ethereal live preview
  try {
    const testAccount = await nodemailer.createTestAccount();
    const testTransporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    const info = await testTransporter.sendMail({
      from: '"Fund Bridge Security" <noreply@ngofunds.org>',
      to: recipientEmail,
      subject: 'Password Reset Request - Fund Bridge NGO Portal',
      text: `Hello,\n\nYou requested to reset your password for ${recipientEmail}.\n\nReset link:\n${resetLink}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #0f172a; color: #f8fafc; border-radius: 12px;">
          <h2 style="color: #14b8a6;">Password Reset Request</h2>
          <p>Recipient: <strong>${recipientEmail}</strong></p>
          <a href="${resetLink}" style="background-color: #0d9488; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none;">Reset Password &amp; Login</a>
        </div>
      `,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    return {
      success: false,
      sentVia: 'ethereal',
      message: `SMTP credentials (SMTP_HOST, SMTP_USER, SMTP_PASS) are not yet configured in .env, so external delivery to ${recipientEmail} was routed to an online test preview.`,
      previewUrl: previewUrl || false,
      recipient: recipientEmail,
      resetLink,
    };
  } catch (err) {
    return {
      success: false,
      sentVia: 'none',
      message: `SMTP credentials are not configured in .env. The password reset link was generated for ${recipientEmail}.`,
      recipient: recipientEmail,
      resetLink,
    };
  }
}
