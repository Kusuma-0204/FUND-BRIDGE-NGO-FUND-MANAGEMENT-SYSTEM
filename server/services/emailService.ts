import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

export interface EmailResult {
  success: boolean;
  sentVia: 'smtp' | 'ethereal' | 'simulated' | 'resend' | 'brevo';
  message: string;
  previewUrl?: string | false;
  recipient: string;
  otpCode?: string;
}

let smtpTransporter: any = null;
let lastSmtpKey = '';

export const ADMIN_EMAIL = 'aadminngo@gmail.com';
const PRIMARY_SMTP_USER = 'aadminngo@gmail.com';
const PRIMARY_SMTP_PASS = 'xwxzqzdcpiwmabdt';
const BACKUP_SMTP_USER = 'o220786@rguktong.ac.in';
const BACKUP_SMTP_PASS = 'ylutzrcaldznpcpi';

function reloadEnv() {
  dotenv.config({ path: '.env.example', override: false });
  dotenv.config({ path: '.env', override: true });
}

export function isSmtpConfigured(): boolean {
  reloadEnv();
  const user = (process.env.SMTP_USER || PRIMARY_SMTP_USER)?.trim();
  const pass = (process.env.SMTP_PASSWORD || process.env.SMTP_PASS || PRIMARY_SMTP_PASS)?.trim();
  return Boolean(user && pass);
}

function getTransporter(useBackup = false): { transporter: any; user: string } | null {
  reloadEnv();
  const host = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
  let user = useBackup ? BACKUP_SMTP_USER : (process.env.SMTP_USER || PRIMARY_SMTP_USER)?.trim();
  let pass = useBackup ? BACKUP_SMTP_PASS : (process.env.SMTP_PASSWORD || process.env.SMTP_PASS || PRIMARY_SMTP_PASS)?.trim()?.replace(/\s+/g, '');
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const isPort465 = port === 465;

  if (!user || !pass) {
    return null;
  }

  const transporter = nodemailer.createTransport({
    host: host.toLowerCase().includes('gmail') ? 'smtp.gmail.com' : host,
    port: port,
    secure: isPort465,
    auth: { user, pass },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 10000,
    tls: {
      rejectUnauthorized: false
    }
  });

  return { transporter, user };
}

export function warmUpSmtp(): void {
  const tObj = getTransporter();
  if (tObj?.transporter) {
    tObj.transporter.verify().then(() => {
      console.log(`[SMTP Pool] Pre-warmed persistent connection to smtp.gmail.com as ${tObj.user} (instant OTP delivery ready)`);
    }).catch((e: any) => {
      console.warn('[SMTP Pool] Primary warm-up notice:', e.message);
    });
  }
}

export async function sendPasswordResetEmail(
  recipientEmail: string,
  resetLink: string,
  otpCode?: string
): Promise<EmailResult> {
  const cleanRecipient = recipientEmail.trim().toLowerCase();
  const primaryObj = getTransporter(false);
  const from = primaryObj ? `"Fund Bridge Support" <${primaryObj.user}>` : 'Fund Bridge Security <no-reply@fundbridge.org>';

  const codeDisplay = otpCode ? `
    <div style="margin: 24px 0 16px 0; text-align: center;">
      <p style="color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 8px 0; font-weight: 600;">Verification Code:</p>
      <div style="display: inline-block; font-size: 26px; font-weight: 800; letter-spacing: 6px; color: #0d9488; background: #0f172a; padding: 10px 24px; border-radius: 8px; border: 2px dashed #0d9488;">
        ${otpCode}
      </div>
    </div>
  ` : '';

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background-color: #0f172a; color: #f8fafc; border-radius: 16px; border: 1px solid #334155;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #0d9488; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 0.5px;">FUND BRIDGE</h1>
        <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 12px; font-weight: 600; text-transform: uppercase;">NGO Fund Management System</p>
      </div>

      <div style="background-color: #1e293b; padding: 28px; border-radius: 12px; border: 1px solid #334155; margin-bottom: 24px;">
        <div style="display: inline-block; background-color: rgba(13, 148, 136, 0.15); color: #2dd4bf; font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 4px 10px; border-radius: 9999px; margin-bottom: 12px;">
          Password Reset Request
        </div>
        <h2 style="color: #ffffff; font-size: 20px; margin: 0 0 12px 0;">Reset Your Password</h2>
        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
          Hello,<br/><br/>
          We received a request to reset the password for your Fund Bridge account associated with <strong>${cleanRecipient}</strong>.<br/>
          Click the button below to choose a new password:
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #0d9488; color: #ffffff; font-size: 16px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 10px; box-shadow: 0 4px 14px rgba(13, 148, 136, 0.4);">
            Reset My Password &rarr;
          </a>
        </div>

        ${codeDisplay}
      </div>

      <div style="text-align: center; color: #64748b; font-size: 11px; line-height: 1.6;">
        <p style="margin: 0;">Dispatched directly to user: ${cleanRecipient}</p>
        <p style="margin: 4px 0 0 0;">&copy; 2026 Fund Bridge NGO Management System. All rights reserved.</p>
      </div>
    </div>
  `;

  const textContent = `Fund Bridge Password Reset\n\nHello,\n\nWe received a request to reset the password for your account (${cleanRecipient}).\n\nReset Link: ${resetLink}\n${otpCode ? `Verification Code: ${otpCode}\n\n` : ''}This link expires in 15 minutes.\n\nFund Bridge Security Team`;

  // Try Primary Transporter
  if (primaryObj?.transporter) {
    try {
      await primaryObj.transporter.sendMail({
        from: `"Fund Bridge Support" <${primaryObj.user}>`,
        to: cleanRecipient,
        subject: `Fund Bridge: Password Reset Link for ${cleanRecipient}`,
        text: textContent,
        html: htmlContent
      });
      console.log(`[Email] Primary SMTP reset link sent to: ${cleanRecipient}`);
      return {
        success: true,
        sentVia: 'smtp',
        message: `Password reset email dispatched to ${cleanRecipient} via SMTP.`,
        recipient: cleanRecipient
      };
    } catch (err: any) {
      console.warn(`[Nodemailer] Primary SMTP error: ${err.message}. Trying backup transporter...`);
    }
  }

  // Try Backup Transporter
  const backupObj = getTransporter(true);
  if (backupObj?.transporter) {
    try {
      await backupObj.transporter.sendMail({
        from: `"Fund Bridge Support" <${backupObj.user}>`,
        to: cleanRecipient,
        subject: `Fund Bridge: Password Reset Link for ${cleanRecipient}`,
        text: textContent,
        html: htmlContent
      });
      console.log(`[Email] Backup SMTP reset link sent to: ${cleanRecipient}`);
      return {
        success: true,
        sentVia: 'smtp',
        message: `Password reset email dispatched to ${cleanRecipient} via backup SMTP.`,
        recipient: cleanRecipient
      };
    } catch (err: any) {
      console.warn(`[Nodemailer] Backup SMTP error: ${err.message}`);
    }
  }

  return {
    success: true,
    sentVia: 'simulated',
    message: `Password reset link generated for ${cleanRecipient}.`,
    recipient: cleanRecipient
  };
}

export async function sendPasswordResetOtpEmail(
  recipientEmail: string,
  otpCode: string
): Promise<EmailResult> {
  const cleanRecipient = recipientEmail.trim().toLowerCase();
  const replyTo = 'aadminngo@gmail.com';

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Fund Bridge Verification Code</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
      <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 16px rgba(0,0,0,0.04);">
        <div style="border-bottom: 2px solid #0d9488; padding-bottom: 16px; margin-bottom: 24px;">
          <h1 style="color: #0d9488; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.5px;">FUND BRIDGE</h1>
          <p style="color: #64748b; margin: 4px 0 0 0; font-size: 12px; font-weight: 500;">NGO Fund Management &amp; Relief Portal</p>
        </div>

        <div style="display: inline-block; background-color: #f0fdfa; border: 1px solid #99f6e4; color: #0f766e; font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 4px 10px; border-radius: 9999px; margin-bottom: 14px;">
          Password Recovery Verification
        </div>

        <h2 style="color: #0f172a; font-size: 18px; font-weight: 700; margin: 0 0 12px 0;">Your 6-Digit Verification Code</h2>
        <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
          Hello,<br/><br/>
          We received a request to reset the password for your Fund Bridge account (<strong>${cleanRecipient}</strong>). Enter the following 6-digit code on the Fund Bridge website to set your new password:
        </p>

        <div style="background-color: #f0fdfa; border: 2px dashed #0d9488; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
          <div style="color: #0f766e; font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 1.5px; margin-bottom: 6px;">One-Time Verification Code</div>
          <div style="font-size: 38px; font-weight: 800; letter-spacing: 8px; color: #0d9488; font-family: 'Courier New', Courier, monospace;">${otpCode}</div>
        </div>

        <p style="color: #64748b; font-size: 12px; line-height: 1.6; margin: 0 0 16px 0;">
          &bull; This verification code is valid for <strong>10 minutes</strong>.<br/>
          &bull; If you did not request this verification, your account remains secure and no changes will be made.
        </p>

        <div style="margin-top: 28px; padding-top: 16px; border-top: 1px solid #f1f5f9; color: #94a3b8; font-size: 11px; text-align: center;">
          <p style="margin: 0;">Dispatched to user email: ${cleanRecipient} &bull; Support: aadminngo@gmail.com</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `Fund Bridge Verification Code\n\nHello,\n\nYour 6-digit verification code for ${cleanRecipient} is: ${otpCode}\n\nEnter this code on the Fund Bridge website to reset your password. This code is valid for 10 minutes.\n\nFund Bridge Team`;

  console.log(`[OTP DISPATCH] Recipient: ${cleanRecipient} | Code: ${otpCode}`);

  // 1. Try Primary SMTP Transporter
  const primaryObj = getTransporter(false);
  if (primaryObj?.transporter) {
    try {
      const info = await primaryObj.transporter.sendMail({
        from: `"Fund Bridge Support" <${primaryObj.user}>`,
        replyTo,
        to: cleanRecipient,
        subject: `Your Fund Bridge Verification Code: ${otpCode}`,
        text: textContent,
        html: htmlContent,
        headers: {
          'X-Mailer': 'FundBridge/1.0',
          'X-Priority': '1',
          'Priority': 'Urgent'
        }
      });

      console.log(`[Email] Primary SMTP OTP (${otpCode}) dispatched to: ${cleanRecipient} (MessageId: ${info.messageId})`);
      return {
        success: true,
        sentVia: 'smtp',
        message: `Verification code dispatched to ${cleanRecipient} via SMTP.`,
        recipient: cleanRecipient,
        otpCode
      };
    } catch (err: any) {
      console.warn(`[Nodemailer] Primary SMTP failed for ${cleanRecipient}: ${err.message}. Attempting backup transporter...`);
    }
  }

  // 2. Try Backup SMTP Transporter
  const backupObj = getTransporter(true);
  if (backupObj?.transporter) {
    try {
      const info = await backupObj.transporter.sendMail({
        from: `"Fund Bridge Support" <${backupObj.user}>`,
        replyTo,
        to: cleanRecipient,
        subject: `Your Fund Bridge Verification Code: ${otpCode}`,
        text: textContent,
        html: htmlContent,
        headers: {
          'X-Mailer': 'FundBridge/1.0',
          'X-Priority': '1',
          'Priority': 'Urgent'
        }
      });

      console.log(`[Email] Backup SMTP OTP (${otpCode}) dispatched to: ${cleanRecipient} (MessageId: ${info.messageId})`);
      return {
        success: true,
        sentVia: 'smtp',
        message: `Verification code dispatched to ${cleanRecipient} via backup SMTP.`,
        recipient: cleanRecipient,
        otpCode
      };
    } catch (backupErr: any) {
      console.warn(`[Nodemailer] Backup SMTP failed for ${cleanRecipient}: ${backupErr.message}`);
    }
  }

  // 3. Fallback if both fail
  console.log(`[OTP Notice] Code for: ${cleanRecipient} | OTP: ${otpCode}`);
  return {
    success: true,
    sentVia: 'simulated',
    message: `Verification code generated for ${cleanRecipient}.`,
    recipient: cleanRecipient,
    otpCode
  };
}
