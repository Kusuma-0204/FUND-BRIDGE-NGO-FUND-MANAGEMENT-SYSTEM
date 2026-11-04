import nodemailer from 'nodemailer';

export interface SendEmailResult {
  success: boolean;
  sentVia: 'smtp' | 'ethereal' | 'none';
  message: string;
  previewUrl?: string | false;
  recipient: string;
  resetLink: string;
}

function createTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS;
  const port = Number(process.env.SMTP_PORT || 587);

  if (!user || !pass) {
    throw new Error('SMTP_USER and SMTP_PASSWORD must be configured.');
  }

  return {
    user,
    transporter: nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    })
  };
}

export async function sendPasswordResetEmail(
  recipientEmail: string,
  resetLink: string
): Promise<SendEmailResult> {
  try {
    const { user, transporter } = createTransporter();

    await transporter.sendMail({
      from: process.env.MAIL_FROM || `"Fund Bridge Support" <${user}>`,
      to: recipientEmail,
      subject: 'Password Reset - Fund Bridge',
      text: `You requested a password reset. Use this link:\n${resetLink}\n\nIf you did not request this, ignore this email.`,
      html: `
        <div style="font-family:Arial,sans-serif;padding:24px">
          <h2>Fund Bridge - Password Reset</h2>
          <p>You requested a password reset.</p>
          <p>
            <a href="${resetLink}">Reset your password</a>
          </p>
          <p>If you did not request this, ignore this email.</p>
        </div>
      `
    });

    return {
      success: true,
      sentVia: 'smtp',
      message: 'Password reset email sent successfully.',
      recipient: recipientEmail,
      resetLink
    };
  } catch (error: any) {
    console.error('[Password Reset Email Error]', error);

    return {
      success: false,
      sentVia: 'none',
      message: 'Email delivery failed. Check the SMTP configuration.',
      recipient: recipientEmail,
      resetLink
    };
  }
}

export async function sendPasswordResetOtpEmail(
  recipientEmail: string,
  otp: string
): Promise<SendEmailResult> {
  try {
    const { user, transporter } = createTransporter();

    await transporter.sendMail({
      from: process.env.MAIL_FROM || `"Fund Bridge Support" <${user}>`,
      to: recipientEmail,
      subject: 'Your Fund Bridge Verification Code',
      text: `Your password reset verification code is ${otp}. It expires in 1 hour. Do not share this code with anyone.`,
      html: `
        <div style="font-family:Arial,sans-serif;padding:24px">
          <h2>Fund Bridge - Password Recovery</h2>
          <p>Your verification code is:</p>
          <h1 style="letter-spacing:8px">${otp}</h1>
          <p>This code expires in 1 hour.</p>
          <p>Do not share this code with anyone.</p>
        </div>
      `
    });

    return {
      success: true,
      sentVia: 'smtp',
      message: 'Verification code sent successfully.',
      recipient: recipientEmail,
      resetLink: ''
    };
  } catch (error: any) {
    console.error('[OTP Email Error]', error);

    return {
      success: false,
      sentVia: 'none',
      message: 'OTP delivery failed. Check the SMTP configuration.',
      recipient: recipientEmail,
      resetLink: ''
    };
  }
}
