import nodemailer from 'nodemailer';
import logger from '@/utils/logger';
import { getEmailTemplate, EmailTemplateType, TemplateData } from './emailTemplates';

// Email configuration from environment variables
const config = {
  host: process.env.SMTP_HOST || 'smtp.example.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  },
  fromName: process.env.SMTP_FROM_NAME || 'MyPollingApp',
  fromEmail: process.env.SMTP_FROM_EMAIL || 'noreply@mypollingapp.com'
};

// Create transporter
function createTransporter() {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth.user ? config.auth : undefined
  });
}

// Check if email is configured
export function isEmailConfigured(): boolean {
  return !!(config.auth.user && config.auth.pass && config.host);
}

// Send email
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<boolean> {
  if (!isEmailConfigured()) {
    logger.warn({ to, subject }, 'Email not configured - skipping email send');
    return false;
  }

  try {
    const transporter = createTransporter();

    const result = await transporter.sendMail({
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '') // Strip HTML for text version
    });

    logger.info({ messageId: result.messageId, to, subject }, 'Email sent successfully');
    return true;
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : String(error), to, subject }, 'Failed to send email');
    return false;
  }
}

// Send templated email
export async function sendTemplatedEmail(
  to: string,
  templateType: EmailTemplateType,
  data: TemplateData
): Promise<boolean> {
  const template = getEmailTemplate(templateType, data);
  return sendEmail(to, template.subject, template.html, template.text);
}

// Convenience functions for common email types

export async function sendWelcomeEmail(user: { email: string; name?: string | null }): Promise<boolean> {
  return sendTemplatedEmail(user.email, 'welcome', {
    userName: user.name || 'there',
    email: user.email
  });
}

export async function sendPasswordResetEmail(
  user: { email: string; name?: string | null },
  resetToken: string
): Promise<boolean> {
  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`;
  return sendTemplatedEmail(user.email, 'passwordReset', {
    userName: user.name || 'there',
    resetUrl
  });
}

export async function sendSubscriptionActivatedEmail(
  user: { email: string; name?: string | null },
  planName: string
): Promise<boolean> {
  return sendTemplatedEmail(user.email, 'subscriptionActivated', {
    userName: user.name || 'there',
    planName
  });
}

export async function sendSubscriptionCancelledEmail(
  user: { email: string; name?: string | null },
  planName: string,
  endDate: Date
): Promise<boolean> {
  return sendTemplatedEmail(user.email, 'subscriptionCancelled', {
    userName: user.name || 'there',
    planName,
    endDate: endDate.toLocaleDateString()
  });
}

export async function sendPaymentReceiptEmail(
  user: { email: string; name?: string | null },
  amount: number,
  planName: string,
  invoiceId?: string
): Promise<boolean> {
  return sendTemplatedEmail(user.email, 'paymentReceipt', {
    userName: user.name || 'there',
    amount: amount.toFixed(2),
    planName,
    invoiceId: invoiceId || 'N/A',
    date: new Date().toLocaleDateString()
  });
}

export async function sendPaymentFailedEmail(
  user: { email: string; name?: string | null },
  planName: string
): Promise<boolean> {
  return sendTemplatedEmail(user.email, 'paymentFailed', {
    userName: user.name || 'there',
    planName
  });
}

export async function sendPollCreatedEmail(
  user: { email: string; name?: string | null },
  poll: { title: string; id: string }
): Promise<boolean> {
  const pollUrl = `${process.env.NEXTAUTH_URL}/polls/${poll.id}`;
  return sendTemplatedEmail(user.email, 'pollCreated', {
    userName: user.name || 'there',
    pollTitle: poll.title,
    pollUrl
  });
}

export async function sendPollClosedEmail(
  user: { email: string; name?: string | null },
  poll: { title: string; id: string },
  totalVotes: number
): Promise<boolean> {
  const pollUrl = `${process.env.NEXTAUTH_URL}/polls/${poll.id}`;
  return sendTemplatedEmail(user.email, 'pollClosed', {
    userName: user.name || 'there',
    pollTitle: poll.title,
    pollUrl,
    totalVotes: String(totalVotes)
  });
}

export async function sendPollResultsEmail(
  user: { email: string; name?: string | null },
  poll: { title: string; id: string },
  results: string
): Promise<boolean> {
  const pollUrl = `${process.env.NEXTAUTH_URL}/polls/${poll.id}`;
  return sendTemplatedEmail(user.email, 'pollResults', {
    userName: user.name || 'there',
    pollTitle: poll.title,
    pollUrl,
    results
  });
}

// Test email connection
export async function testEmailConnection(): Promise<{ success: boolean; message: string }> {
  if (!isEmailConfigured()) {
    return { success: false, message: 'Email not configured' };
  }

  try {
    const transporter = createTransporter();
    await transporter.verify();
    return { success: true, message: 'Email connection successful' };
  } catch (error) {
    return {
      success: false,
      message: `Email connection failed: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}
