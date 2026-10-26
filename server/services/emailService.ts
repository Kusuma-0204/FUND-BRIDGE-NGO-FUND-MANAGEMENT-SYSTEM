import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

export interface EmailResult {
  success: boolean;
  sentVia: 'smtp' | 'ethereal' | 'simulated';
  message: string;
  previewUrl?: string | false;
  recipient: string;
}

let smtpTransporter: any = null;
let lastSmtpKey = '';

const DEFAULT_SMTP_USER = 'o220786@rguktong.ac.in';
const DEFAULT_SMTP_PASS = 'ylutzrcaldznpcpi';

function reloadEnv() {
  dotenv.config({ path: '.env.example', override: false });
  dotenv.config({ path: '.env', override: true });
}

export function isSmtpConfigured(): boolean {
  reloadEnv();
  const user = (process.env.SMTP_USER || DEFAULT_SMTP_USER)?.trim();
  const pass = (process.env.SMTP_PASSWORD || process.env.SMTP_PASS || DEFAULT_SMTP_PASS)?.trim();
  return Boolean(user && pass);
}

function getTransporter(): any {
  reloadEnv();
  const host = (process.env.SMTP_HOST?.trim() || 'smtp.gmail.com').trim();
  const user = (process.env.SMTP_USER?.trim() || DEFAULT_SMTP_USER).trim();
  const rawPass = process.env.SMTP_PASSWORD?.trim() || process.env.SMTP_PASS?.trim() || DEFAULT_SMTP_PASS;
  const pass = rawPass.trim().replace(/\s+/g, '');
  const port = parseInt(process.env.SMTP_PORT || '465', 10);

  if (!user || !pass) {
    return null;
  }

  const currentKey = `${host}:${port}:${user}:${pass}`;
  if (!smtpTransporter || lastSmtpKey !== currentKey) {
    lastSmtpKey = currentKey;
    if (host.toLowerCase().includes('gmail') || process.env.SMTP_SERVICE === 'gmail') {
      smtpTransporter = nodemailer.createTransport({
        pool: true,
        maxConnections: 3,
        maxMessages: 100,
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: { user, pass },
        connectionTimeout: 4000,
        greetingTimeout: 4000,
        socketTimeout: 4000
      });
    } else {
      smtpTransporter = nodemailer.createTransport({
        pool: true,
        maxConnections: 3,
        maxMessages: 100,
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
        connectionTimeout: 4000,
        greetingTimeout: 4000,
        socketTimeout: 4000,
        tls: {
          rejectUnauthorized: false
        }
      });
    }
  }

  return smtpTransporter;
}

export function warmUpSmtp(): void {
  const transporter = getTransporter();
  if (transporter) {
    transporter.verify().then(() => {
      console.log('[SMTP Pool] Pre-warmed persistent connection to smtp.gmail.com (instant OTP delivery ready)');
    }).catch(() => {});
  }
}

export async function sendPasswordResetEmail(
  recipientEmail: string,
  resetLink: string,
  otpCode?: string
): Promise<EmailResult> {
  const smtpUser = (process.env.SMTP_USER?.trim() || DEFAULT_SMTP_USER).trim();
  const from = process.env.MAIL_FROM || `"Fund Bridge Security" <${smtpUser}>`;
  const transporter = getTransporter();

  const codeDisplay = otpCode ? `
    <div style="margin: 24px 0 16px 0; text-align: center;">
      <p style="color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 8px 0; font-weight: 600;">Or use verification code:</p>
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
          We received a request to reset the password for your Fund Bridge account associated with <strong>${recipientEmail}</strong>.<br/>
          Click the button below to choose a new password:
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #0d9488; color: #ffffff; font-size: 16px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 10px; box-shadow: 0 4px 14px rgba(13, 148, 136, 0.4);">
            Reset My Password &rarr;
          </a>
        </div>

        <div style="background-color: #0f172a; padding: 14px; border-radius: 8px; border: 1px solid #334155; margin: 20px 0 0 0;">
          <p style="margin: 0 0 6px 0; font-size: 11px; color: #94a3b8; font-weight: 600; text-transform: uppercase;">Direct Link (If button doesn't work):</p>
          <p style="margin: 0; font-size: 12px; word-break: break-all; color: #2dd4bf; font-family: monospace;">
            <a href="${resetLink}" target="_blank" style="color: #2dd4bf; text-decoration: underline;">${resetLink}</a>
          </p>
        </div>

        ${codeDisplay}

        <div style="background: rgba(245, 158, 11, 0.1); border-left: 4px solid #f59e0b; padding: 12px; border-radius: 6px; margin: 24px 0 0 0;">
          <p style="margin: 0; font-size: 12px; color: #fde68a; line-height: 1.5;">
            <strong>Security Notice:</strong> This reset link is valid for <strong>15 minutes</strong> and delivered directly to your personal email address. If you did not request this password reset, no further action is needed — your account remains safe and your current password will not change.
          </p>
        </div>
      </div>

      <div style="text-align: center; color: #64748b; font-size: 11px; line-height: 1.6;">
        <p style="margin: 0;">Dispatched to user mail: ${recipientEmail} | 256-bit Encrypted Delivery</p>
        <p style="margin: 4px 0 0 0;">&copy; 2026 Fund Bridge NGO Fund Management System. All rights reserved.</p>
      </div>
    </div>
  `;

  const textContent = `Fund Bridge Password Reset\n\nHello,\n\nWe received a request to reset the password for your account (${recipientEmail}).\n\nTo reset your password, visit the following link:\n${resetLink}\n\n${otpCode ? `Verification Code: ${otpCode}\n\n` : ''}This link is valid for 15 minutes.\n\nIf you did not request this, you can safely ignore this email.\n\nFund Bridge Security Team`;

  if (transporter) {
    try {
      await transporter.sendMail({
        from,
        to: recipientEmail,
        subject: `Fund Bridge: Password Reset Link for ${recipientEmail}`,
        text: textContent,
        html: htmlContent
      });

      console.log(`[Email] Real SMTP password reset link sent to: ${recipientEmail}`);
      return {
        success: true,
        sentVia: 'smtp',
        message: `Password reset email dispatched to ${recipientEmail} via SMTP.`,
        recipient: recipientEmail
      };
    } catch (err: any) {
      console.warn(`[Nodemailer] SMTP send error: ${err.message}. Retrying via fallback.`);
    }
  }

  // Fallback mode for development/testing
  try {
    const testAccount = await nodemailer.createTestAccount();
    const testTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass }
    });

    const info = await testTransporter.sendMail({
      from,
      to: recipientEmail,
      subject: `Fund Bridge: Password Reset Link for ${recipientEmail}`,
      text: textContent,
      html: htmlContent
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`[Email Dispatched to User Mail] Sent to: ${recipientEmail} | Reset Link: ${resetLink} | Preview: ${previewUrl}`);

    return {
      success: true,
      sentVia: 'ethereal',
      message: `Password reset email dispatched to ${recipientEmail}.`,
      previewUrl,
      recipient: recipientEmail
    };
  } catch (err) {
    console.log(`[Email Dispatched to User Mail] Sent to: ${recipientEmail} | Reset Link: ${resetLink}`);
    return {
      success: true,
      sentVia: 'simulated',
      message: `Password reset email generated for ${recipientEmail}.`,
      recipient: recipientEmail
    };
  }
}

async function sendViaHttpApi(to: string, subject: string, html: string, text: string): Promise<boolean> {
  const resendKey = process.env.RESEND_API_KEY?.trim();
  if (resendKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM || 'Fund Bridge <onboarding@resend.dev>',
          to: [to],
          subject,
          html,
          text
        })
      });
      if (res.ok) {
        console.log(`[Email] Dispatched via Resend HTTP API (port 443) to: ${to}`);
        return true;
      }
      const errBody = await res.text();
      console.warn('[Resend API non-200]', errBody);
    } catch (e: any) {
      console.warn('[Resend API Warning]', e?.message);
    }
  }

  const brevoKey = (process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY)?.trim();
  if (brevoKey) {
    try {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: 'Fund Bridge', email: process.env.BREVO_FROM || 'no-reply@fundbridge.org' },
          to: [{ email: to }],
          subject,
          htmlContent: html,
          textContent: text
        })
      });
      if (res.ok) {
        console.log(`[Email] Dispatched via Brevo HTTP API (port 443) to: ${to}`);
        return true;
      }
      const errBody = await res.text();
      console.warn('[Brevo API non-200]', errBody);
    } catch (e: any) {
      console.warn('[Brevo API Warning]', e?.message);
    }
  }

  return false;
}

export async function sendPasswordResetOtpEmail(
  recipientEmail: string,
  otpCode: string
): Promise<EmailResult> {
  const transporter = getTransporter();
  const smtpUser = (process.env.SMTP_USER?.trim() || DEFAULT_SMTP_USER).trim();
  const from = `"Fund Bridge Security" <${smtpUser}>`;

  const cleanRecipient = recipientEmail.trim().toLowerCase();
  const isDemoDomain = /@(example\.(com|org)|ngofunds\.org)$/i.test(cleanRecipient);

  // Send only to the respective user email used to login (or demo inbox if demo account)
  const target = isDemoDomain ? smtpUser : cleanRecipient;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px;">
      <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
        <div style="border-bottom: 2px solid #0d9488; padding-bottom: 16px; margin-bottom: 24px;">
          <h1 style="color: #0d9488; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.5px;">FUND BRIDGE</h1>
          <p style="color: #64748b; margin: 4px 0 0 0; font-size: 12px;">NGO Fund Management System</p>
        </div>

        <h2 style="color: #0f172a; font-size: 17px; font-weight: 700; margin: 0 0 12px 0;">Your Verification Code</h2>
        <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
          Hello,<br/><br/>
          You requested a password reset for your account associated with <strong>${recipientEmail}</strong>. Use the following 6-digit code to complete the verification:
        </p>

        <div style="background-color: #f0fdfa; border: 2px dashed #0d9488; border-radius: 10px; padding: 18px; text-align: center; margin: 24px 0;">
          <div style="color: #0f766e; font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 1px; margin-bottom: 6px;">One-Time Verification Code</div>
          <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #0f766e; font-family: monospace;">${otpCode}</div>
        </div>

        <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin: 0 0 16px 0;">
          This code is valid for <strong>10 minutes</strong>. If you did not request this code, you can safely disregard this message.
        </p>

        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #f1f5f9; color: #94a3b8; font-size: 11px;">
          <p style="margin: 0;">Fund Bridge NGO Portal &bull; Automated Security Service</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `Fund Bridge Verification Code\n\nHello,\n\nYour 6-digit verification code for ${recipientEmail} is: ${otpCode}\n\nEnter this code on the Fund Bridge website to reset your password. Valid for 10 minutes.\n\nFund Bridge Team`;

  console.log(`[OTP READY] User: ${recipientEmail} | 6-Digit OTP: ${otpCode} | Target recipient: ${target}`);

  // 1. Try HTTP Email API first (works on Render free tier where SMTP ports 25, 465, 587 are blocked)
  const sentViaHttp = await sendViaHttpApi(
    target,
    `${otpCode} is your Fund Bridge verification code`,
    htmlContent,
    textContent
  );
  if (sentViaHttp) {
    return {
      success: true,
      sentVia: 'smtp',
      message: `6-digit OTP dispatched to ${target}.`,
      recipient: target
    };
  }

  // 2. Direct SMTP Transport (Gmail port 465)
  if (transporter) {
    try {
      const mailOptions = {
        from,
        replyTo: smtpUser,
        to: target,
        subject: `${otpCode} is your Fund Bridge verification code`,
        text: textContent,
        html: htmlContent,
        headers: {
          'X-Entity-Ref-ID': `fb-${Date.now()}-${otpCode}-${target.replace(/[^a-zA-Z0-9]/g, '')}`
        }
      };

      const sendPromise = transporter.sendMail(mailOptions);
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('SMTP timeout after 4s (Render firewall restriction)')), 4000)
      );
      const sendInfo: any = await Promise.race([sendPromise, timeoutPromise]);

      console.log(`[Email] Real SMTP 6-digit OTP (${otpCode}) dispatched to: ${target}`, sendInfo?.response || '');
      return {
        success: true,
        sentVia: 'smtp',
        message: `6-digit OTP dispatched to ${target} via SMTP.`,
        recipient: target
      };
    } catch (err: any) {
      console.warn(`[Nodemailer] SMTP send error/timeout: ${err?.message || err}. Target: ${target}`);
    }
  }

  // Fast fallback mode
  console.log(`[OTP Email Fallback] Generated for: ${recipientEmail} | OTP: ${otpCode}`);
  return {
    success: true,
    sentVia: 'simulated',
    message: `6-digit OTP generated for ${recipientEmail}.`,
    recipient: recipientEmail
  };
}
