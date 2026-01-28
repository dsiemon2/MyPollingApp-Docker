export type EmailTemplateType =
  | 'welcome'
  | 'passwordReset'
  | 'subscriptionActivated'
  | 'subscriptionCancelled'
  | 'paymentReceipt'
  | 'paymentFailed'
  | 'pollCreated'
  | 'pollClosed'
  | 'pollResults';

export interface TemplateData {
  userName?: string;
  email?: string;
  resetUrl?: string;
  planName?: string;
  endDate?: string;
  amount?: string;
  invoiceId?: string;
  date?: string;
  pollTitle?: string;
  pollUrl?: string;
  totalVotes?: string;
  results?: string;
  [key: string]: string | undefined;
}

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

const businessName = process.env.SMTP_FROM_NAME || 'PoligoPro';
const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:8610';

// Base HTML template wrapper
function wrapHtml(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${businessName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f5; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .card { background: #fff; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
    .header { text-align: center; margin-bottom: 32px; }
    .logo { font-size: 24px; font-weight: bold; color: #0d7a3e; }
    h1 { color: #1f2937; font-size: 24px; margin: 0 0 16px; }
    p { color: #4b5563; margin: 0 0 16px; }
    .button { display: inline-block; background: #0d7a3e; color: #fff !important; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; margin: 16px 0; }
    .button:hover { background: #0a6332; }
    .footer { text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 14px; }
    .highlight { background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0; }
    .success { color: #059669; }
    .warning { color: #d97706; }
    .error { color: #dc2626; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="logo">${businessName}</div>
      </div>
      ${content}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ${businessName}. All rights reserved.</p>
      <p><a href="${baseUrl}" style="color: #0d7a3e;">Visit our website</a></p>
    </div>
  </div>
</body>
</html>`;
}

// Template definitions
const templates: Record<EmailTemplateType, (data: TemplateData) => EmailTemplate> = {
  welcome: (data) => ({
    subject: `Welcome to ${businessName}!`,
    html: wrapHtml(`
      <h1>Welcome, ${data.userName}!</h1>
      <p>Thank you for joining ${businessName}. We're excited to have you on board!</p>
      <p>With ${businessName}, you can:</p>
      <ul style="color: #4b5563; margin: 16px 0;">
        <li>Create engaging polls and surveys</li>
        <li>Collect valuable feedback from your audience</li>
        <li>Analyze results with AI-powered insights</li>
        <li>Share polls across social media and websites</li>
      </ul>
      <p style="text-align: center;">
        <a href="${baseUrl}/admin" class="button">Get Started</a>
      </p>
      <p>If you have any questions, feel free to reach out to our support team.</p>
    `),
    text: `Welcome to ${businessName}!

Hi ${data.userName},

Thank you for joining ${businessName}. We're excited to have you on board!

With ${businessName}, you can:
- Create engaging polls and surveys
- Collect valuable feedback from your audience
- Analyze results with AI-powered insights
- Share polls across social media and websites

Get started: ${baseUrl}/admin

If you have any questions, feel free to reach out to our support team.`
  }),

  passwordReset: (data) => ({
    subject: `Reset Your ${businessName} Password`,
    html: wrapHtml(`
      <h1>Password Reset Request</h1>
      <p>Hi ${data.userName},</p>
      <p>We received a request to reset your password. Click the button below to create a new password:</p>
      <p style="text-align: center;">
        <a href="${data.resetUrl}" class="button">Reset Password</a>
      </p>
      <p>This link will expire in 1 hour.</p>
      <p style="color: #9ca3af; font-size: 14px;">If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
    `),
    text: `Password Reset Request

Hi ${data.userName},

We received a request to reset your password. Click the link below to create a new password:

${data.resetUrl}

This link will expire in 1 hour.

If you didn't request a password reset, you can safely ignore this email.`
  }),

  subscriptionActivated: (data) => ({
    subject: `Your ${data.planName} Plan is Now Active!`,
    html: wrapHtml(`
      <h1 class="success">Subscription Activated!</h1>
      <p>Hi ${data.userName},</p>
      <p>Great news! Your <strong>${data.planName}</strong> plan is now active.</p>
      <div class="highlight">
        <p style="margin: 0;"><strong>Plan:</strong> ${data.planName}</p>
        <p style="margin: 8px 0 0;"><strong>Status:</strong> <span class="success">Active</span></p>
      </div>
      <p>You now have access to all the features included in your plan. Start exploring!</p>
      <p style="text-align: center;">
        <a href="${baseUrl}/admin/my-subscription" class="button">View My Subscription</a>
      </p>
    `),
    text: `Subscription Activated!

Hi ${data.userName},

Great news! Your ${data.planName} plan is now active.

Plan: ${data.planName}
Status: Active

You now have access to all the features included in your plan.

View your subscription: ${baseUrl}/admin/my-subscription`
  }),

  subscriptionCancelled: (data) => ({
    subject: `Your ${businessName} Subscription Has Been Cancelled`,
    html: wrapHtml(`
      <h1>Subscription Cancelled</h1>
      <p>Hi ${data.userName},</p>
      <p>Your <strong>${data.planName}</strong> subscription has been cancelled.</p>
      <div class="highlight">
        <p style="margin: 0;"><strong>Access until:</strong> ${data.endDate}</p>
      </div>
      <p>You'll continue to have access to your plan features until the end of your current billing period.</p>
      <p>Changed your mind? You can resubscribe at any time.</p>
      <p style="text-align: center;">
        <a href="${baseUrl}/admin/pricing" class="button">View Plans</a>
      </p>
    `),
    text: `Subscription Cancelled

Hi ${data.userName},

Your ${data.planName} subscription has been cancelled.

Access until: ${data.endDate}

You'll continue to have access to your plan features until the end of your current billing period.

Changed your mind? You can resubscribe at any time: ${baseUrl}/admin/pricing`
  }),

  paymentReceipt: (data) => ({
    subject: `Payment Receipt - $${data.amount}`,
    html: wrapHtml(`
      <h1>Payment Receipt</h1>
      <p>Hi ${data.userName},</p>
      <p>Thank you for your payment. Here are the details:</p>
      <div class="highlight">
        <p style="margin: 0;"><strong>Amount:</strong> $${data.amount}</p>
        <p style="margin: 8px 0 0;"><strong>Plan:</strong> ${data.planName}</p>
        <p style="margin: 8px 0 0;"><strong>Date:</strong> ${data.date}</p>
        <p style="margin: 8px 0 0;"><strong>Invoice ID:</strong> ${data.invoiceId}</p>
      </div>
      <p>This receipt confirms that your payment has been processed successfully.</p>
    `),
    text: `Payment Receipt

Hi ${data.userName},

Thank you for your payment. Here are the details:

Amount: $${data.amount}
Plan: ${data.planName}
Date: ${data.date}
Invoice ID: ${data.invoiceId}

This receipt confirms that your payment has been processed successfully.`
  }),

  paymentFailed: (data) => ({
    subject: `Payment Failed - Action Required`,
    html: wrapHtml(`
      <h1 class="error">Payment Failed</h1>
      <p>Hi ${data.userName},</p>
      <p>We were unable to process your payment for the <strong>${data.planName}</strong> plan.</p>
      <p>Please update your payment method to avoid any interruption to your service.</p>
      <p style="text-align: center;">
        <a href="${baseUrl}/admin/my-subscription" class="button">Update Payment Method</a>
      </p>
      <p style="color: #9ca3af; font-size: 14px;">If you believe this is an error, please contact our support team.</p>
    `),
    text: `Payment Failed - Action Required

Hi ${data.userName},

We were unable to process your payment for the ${data.planName} plan.

Please update your payment method to avoid any interruption to your service.

Update payment: ${baseUrl}/admin/my-subscription

If you believe this is an error, please contact our support team.`
  }),

  pollCreated: (data) => ({
    subject: `Poll Created: ${data.pollTitle}`,
    html: wrapHtml(`
      <h1>Poll Created!</h1>
      <p>Hi ${data.userName},</p>
      <p>Your poll "<strong>${data.pollTitle}</strong>" has been created successfully.</p>
      <p style="text-align: center;">
        <a href="${data.pollUrl}" class="button">View Poll</a>
      </p>
      <p>Share this poll with your audience to start collecting responses!</p>
    `),
    text: `Poll Created!

Hi ${data.userName},

Your poll "${data.pollTitle}" has been created successfully.

View poll: ${data.pollUrl}

Share this poll with your audience to start collecting responses!`
  }),

  pollClosed: (data) => ({
    subject: `Poll Closed: ${data.pollTitle}`,
    html: wrapHtml(`
      <h1>Poll Closed</h1>
      <p>Hi ${data.userName},</p>
      <p>Your poll "<strong>${data.pollTitle}</strong>" has been closed.</p>
      <div class="highlight">
        <p style="margin: 0;"><strong>Total Votes:</strong> ${data.totalVotes}</p>
      </div>
      <p style="text-align: center;">
        <a href="${data.pollUrl}" class="button">View Results</a>
      </p>
    `),
    text: `Poll Closed

Hi ${data.userName},

Your poll "${data.pollTitle}" has been closed.

Total Votes: ${data.totalVotes}

View results: ${data.pollUrl}`
  }),

  pollResults: (data) => ({
    subject: `Results for: ${data.pollTitle}`,
    html: wrapHtml(`
      <h1>Poll Results</h1>
      <p>Hi ${data.userName},</p>
      <p>Here are the results for your poll "<strong>${data.pollTitle}</strong>":</p>
      <div class="highlight">
        ${data.results}
      </div>
      <p style="text-align: center;">
        <a href="${data.pollUrl}" class="button">View Full Results</a>
      </p>
    `),
    text: `Poll Results

Hi ${data.userName},

Here are the results for your poll "${data.pollTitle}":

${data.results}

View full results: ${data.pollUrl}`
  })
};

export function getEmailTemplate(
  type: EmailTemplateType,
  data: TemplateData
): EmailTemplate {
  const templateFn = templates[type];
  if (!templateFn) {
    throw new Error(`Unknown email template type: ${type}`);
  }
  return templateFn(data);
}
