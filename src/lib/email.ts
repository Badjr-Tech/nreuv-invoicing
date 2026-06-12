import { BrevoClient } from '@getbrevo/brevo';

// ── Setup ──────────────────────────────────────────────────────────────
const FALLBACK_FROM_EMAIL_ADDRESS = 'ap@nreuv.com';
const FROM_NAME = 'NREUV Invoicing';

if (!process.env.BREVO_API_KEY) {
  console.warn('BREVO_API_KEY is not set. Emails will not be sent.');
}

// Reuse one client across requests. The SDK constructor accepts an empty
// key and throws lazily at send-time, but we already short-circuit above
// in sendBrevoMail when the key is missing.
const brevo = new BrevoClient({ apiKey: process.env.BREVO_API_KEY ?? 'unset' });

interface SendArgs {
  to: string;
  subject: string;
  html: string;
  label: string; // for log messages
}

async function sendBrevoMail({ to, subject, html, label }: SendArgs): Promise<void> {
  if (!process.env.BREVO_API_KEY) {
    console.log(`Simulating ${label} email to ${to} (no BREVO_API_KEY).`);
    return;
  }

  const senderEmail = process.env.BREVO_FROM_EMAIL || FALLBACK_FROM_EMAIL_ADDRESS;

  try {
    await brevo.transactionalEmails.sendTransacEmail({
      subject,
      htmlContent: html,
      sender: { name: FROM_NAME, email: senderEmail },
      to: [{ email: to }],
    });
    console.log(`${label} email sent successfully to ${to}`);
  } catch (error: any) {
    console.error(`Error sending ${label} email`);
    console.error(error?.body ?? error?.message ?? error);
  }
}

// ── Shared HTML primitives ─────────────────────────────────────────────
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const LOGO_PRIMARY =
  'http://cdn.mcauto-images-production.sendgrid.net/01d1d01d73ba5b78/be6bfc4c-17a3-4713-8dd3-9fe63cb24710/1455x253.jpg';
const LOGO_SECONDARY =
  'http://cdn.mcauto-images-production.sendgrid.net/01d1d01d73ba5b78/57a57b7e-38a7-4ba6-aa53-b71ae61401bb/901x332.png';

interface UserShellOpts {
  title: string;
  headerBg?: string;
  body: string; // already-escaped HTML
  cta?: { label: string; href: string; bg?: string };
  signoff?: string;
}

/** Branded shell used for user-facing emails (signin, reminder, overdue, issue). */
function userShell({
  title,
  headerBg = '#730404',
  body,
  cta,
  signoff = 'NREUV Team',
}: UserShellOpts): string {
  const ctaBlock = cta
    ? `
  <tr>
    <td align="center" style="padding:30px 40px 34px 40px;">
      <table cellpadding="0" cellspacing="0">
        <tr>
          <td style="background:${cta.bg ?? '#d11c21'}; border-radius:6px;">
            <a href="${cta.href}" target="_blank"
              style="display:inline-block; padding:16px 34px; color:#ffffff; font-size:16px; font-weight:bold; text-decoration:none;">
              ${cta.label}
            </a>
          </td>
        </tr>
      </table>
    </td>
  </tr>`
    : '';

  return `<!DOCTYPE html><html><head><title>${title}</title></head>
<body style="margin:0; padding:0; background:#f2f2f2; font-family:Arial, Helvetica, sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px;">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:10px; box-shadow:0 4px 14px rgba(0,0,0,0.06);">
  <tr>
    <td align="center" style="padding:28px 20px 18px 20px;">
      <table cellpadding="0" cellspacing="0"><tr>
        <td style="padding-right:18px;"><img src="${LOGO_PRIMARY}" style="height:36px; width:auto; display:block;"></td>
        <td style="padding-left:18px;"><img src="${LOGO_SECONDARY}" style="height:36px; width:auto; display:block;"></td>
      </tr></table>
    </td>
  </tr>
  <tr>
    <td style="background:${headerBg}; padding:20px 30px; text-align:center;">
      <h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:bold;">${title}</h1>
    </td>
  </tr>
  <tr><td style="height:28px;"></td></tr>
  <tr>
    <td style="padding:0 42px; color:#333333; font-size:16px; line-height:26px;">
      ${body}
    </td>
  </tr>
  ${ctaBlock}
  <tr><td style="padding:0 42px;"><div style="height:1px; background:#e6e6e6;"></div></td></tr>
  <tr>
    <td style="padding:26px 42px 34px 42px; color:#333333; font-size:16px; line-height:26px;">
      Timely submission helps ensure accurate processing and payment coordination.
      <p style="margin:22px 0 0 0;">${signoff}</p>
    </td>
  </tr>
  <tr><td style="background:#bababa; padding:16px; text-align:center; font-size:12px;">
    Secure platform access for invoicing and coordination.
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

/** Compact shell used for admin notifications (dark header, no CTA images). */
interface AdminShellOpts {
  title: string;
  body: string; // already-escaped HTML
  cta?: { label: string; href: string };
}

function adminShell({ title, body, cta }: AdminShellOpts): string {
  const ctaBlock = cta
    ? `
  <tr>
    <td align="center" style="padding:28px 40px 32px 40px;">
      <table cellpadding="0" cellspacing="0">
        <tr><td style="background:#111111; border-radius:5px;">
          <a href="${cta.href}" target="_blank"
            style="display:inline-block; padding:14px 30px; color:#ffffff; font-size:14px; font-weight:bold; text-decoration:none;">
            ${cta.label}
          </a>
        </td></tr>
      </table>
    </td>
  </tr>`
    : '';

  return `<!DOCTYPE html><html><head><title>${title}</title></head>
<body style="margin:0; padding:0; background:#eeeeee; font-family:Arial, Helvetica, sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px;">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:10px; box-shadow:0 4px 14px rgba(0,0,0,0.05);">
  <tr>
    <td align="center" style="padding:26px 20px 16px 20px;">
      <img src="${LOGO_PRIMARY}" style="height:34px; width:auto;">
    </td>
  </tr>
  <tr>
    <td style="background:#2b2b2b; padding:18px 30px; text-align:center;">
      <h1 style="margin:0; color:#ffffff; font-size:22px; font-weight:600;">${title}</h1>
    </td>
  </tr>
  <tr><td style="height:26px;"></td></tr>
  <tr>
    <td style="padding:0 42px; color:#222222; font-size:15px; line-height:24px;">
      ${body}
    </td>
  </tr>
  ${ctaBlock}
  <tr><td style="padding:0 42px;"><div style="height:1px; background:#e9e9e9;"></div></td></tr>
  <tr><td style="padding:22px 42px 30px 42px; font-size:13px; color:#666;">
    Automated platform notification.
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

// ── Emails ─────────────────────────────────────────────────────────────
export const sendWelcomeEmail = async (to: string, name: string, passwordLink: string) => {
  const html = userShell({
    title: 'Platform Access Invitation',
    body: `
      <p style="margin-top:0;">You have been invited to access the NREUV invoicing platform.</p>
      <p>This secure portal allows you to submit invoices, manage hourly timesheets, and submit timely invoices seamlessly.</p>
      <p>To begin${name ? `, <strong>${escapeHtml(name)}</strong>` : ''}, please activate your account by setting your password.</p>
    `,
    cta: { label: 'Set Your Password', href: passwordLink },
    signoff: 'NREUV Team',
  });

  await sendBrevoMail({
    to,
    subject: 'Set Your NREUV Invoicing Password',
    html,
    label: 'welcome',
  });
};

export const sendInvoiceReminderEmail = async (to: string, name: string, invoiceLink: string) => {
  const html = userShell({
    title: 'Invoice Deadline Reminder',
    body: `
      <p style="margin:0 0 16px 0;">
        ${name ? `${escapeHtml(name)}, your` : 'Your'} invoice is due in
        <span style="color:#d11c21; font-weight:bold;">3 days.</span>
      </p>
      <p style="margin:0 0 16px 0;">
        Please log in to the invoicing platform and submit any outstanding invoices before the deadline to avoid delays in processing.
      </p>
      <p style="margin:0;">
        If you have already submitted your invoice, no further action is needed.
      </p>
    `,
    cta: { label: 'Submit Your Invoice', href: invoiceLink },
  });

  await sendBrevoMail({
    to,
    subject: 'Invoice Deadline Reminder',
    html,
    label: 'invoice reminder',
  });
};

export const sendLateInvoiceEmail = async (
  to: string,
  name: string,
  invoiceLink: string,
  dueDateAndTime: string,
) => {
  const html = userShell({
    title: 'Invoice Overdue',
    body: `
      <p style="margin:0 0 16px 0;">
        ${name ? `${escapeHtml(name)}, your` : 'Your'} invoice is now
        <span style="color:#d11c21; font-weight:bold;">LATE.</span>
      </p>
      <p style="margin:0 0 16px 0;">
        If your invoice is not submitted by
        <span style="color:#d11c21; font-weight:bold;">${escapeHtml(dueDateAndTime)}</span>,
        your payment will be deferred until the next payroll cycle.
      </p>
      <p style="margin:0;">
        Please log in to the invoicing platform and submit your invoice as soon as possible.
      </p>
    `,
    cta: { label: 'Submit Invoice Now', href: invoiceLink },
  });

  await sendBrevoMail({
    to,
    subject: 'Invoice Overdue Notice',
    html,
    label: 'late invoice',
  });
};

export const sendAdminInvoiceSubmittedEmail = async (
  to: string,
  userName: string,
  invoiceNumber: string | number,
  userEmail: string,
  amount: number,
  submittedDate: Date,
  adminLink: string,
) => {
  const amountFormatted = `$${amount.toFixed(2)}`;
  const submittedFormatted = submittedDate.toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const html = adminShell({
    title: 'New Invoice Submitted',
    body: `
      <p style="margin:0 0 16px 0;">A new invoice has been submitted through the platform.</p>
      <p style="margin:0 0 18px 0;">
        <span style="color:#777;">User:</span> <strong>${escapeHtml(userName)}</strong><br>
        <span style="color:#777;">Email:</span> ${escapeHtml(userEmail)}<br>
        <span style="color:#777;">Invoice #:</span> ${escapeHtml(String(invoiceNumber))}<br>
        <span style="color:#777;">Amount:</span> <strong>${amountFormatted}</strong><br>
        <span style="color:#777;">Submitted:</span> ${escapeHtml(submittedFormatted)}
      </p>
      <p style="margin:0;">Log in to review and process the invoice.</p>
    `,
    cta: { label: 'Review Invoice', href: adminLink },
  });

  await sendBrevoMail({
    to,
    subject: 'New Invoice Submitted',
    html,
    label: 'admin invoice submitted',
  });
};

export const sendAdminLateSubmissionEmail = async (
  to: string,
  userName: string,
  invoiceNumber: string | number,
  userEmail: string,
  amount: number,
  submittedDate: Date | null,
  adminLink: string,
) => {
  const amountFormatted = `$${amount.toFixed(2)}`;
  const submittedFormatted = submittedDate
    ? submittedDate.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
    : 'Not yet submitted';

  const html = adminShell({
    title: 'LATE Invoice Submitted',
    body: `
      <p style="margin:0 0 16px 0;">A new invoice has been submitted through the platform. Defer to next week.</p>
      <p style="margin:0 0 18px 0;">
        <span style="color:#777;">User:</span> <strong>${escapeHtml(userName)}</strong><br>
        <span style="color:#777;">Email:</span> ${escapeHtml(userEmail)}<br>
        <span style="color:#777;">Amount:</span> <strong>${amountFormatted}</strong><br>
        <span style="color:#777;">Submitted (LATE):</span> ${escapeHtml(submittedFormatted)}
      </p>
      <p style="margin:0;">Log in to review and process the invoice.</p>
    `,
    cta: { label: 'Review Invoice', href: adminLink },
  });

  await sendBrevoMail({
    to,
    subject: 'LATE Invoice Submitted',
    html,
    label: 'admin late submission',
  });
};

/**
 * Sent when an admin or payroll manager requests changes to an invoice.
 * Includes their typed feedback verbatim and a CTA back to the invoice.
 */
export const sendInvoiceIssueEmail = async (
  to: string,
  userName: string,
  reviewerName: string,
  invoiceNumber: string | number,
  issueDetails: string,
  invoiceLink: string,
) => {
  // Preserve line breaks from the textarea; escape everything else.
  const issueHtml = escapeHtml(issueDetails).replace(/\n/g, '<br>');

  const html = userShell({
    title: 'Invoice Needs Changes',
    body: `
      <p style="margin:0 0 16px 0;">
        ${name(userName)}<strong>${escapeHtml(reviewerName)}</strong> has reviewed
        Invoice <strong>#${escapeHtml(String(invoiceNumber))}</strong> and flagged
        some issues that need your attention before it can be approved.
      </p>
      <div style="margin:18px 0; padding:16px 18px; background:#fbeaea; border-left:4px solid #d11c21; border-radius:4px; color:#222;">
        <div style="font-size:12px; font-weight:bold; color:#d11c21; letter-spacing:0.4px; text-transform:uppercase; margin-bottom:6px;">
          Reviewer notes
        </div>
        <div style="font-size:15px; line-height:24px;">${issueHtml}</div>
      </div>
      <p style="margin:0;">
        Please open the invoice, make the requested changes, and re-submit when ready.
      </p>
    `,
    cta: { label: 'Open Invoice', href: invoiceLink },
  });

  await sendBrevoMail({
    to,
    subject: `Action needed: Invoice #${invoiceNumber} requires changes`,
    html,
    label: 'invoice issue',
  });
};

// Small helper so the "Hi {name}, ..." opener works whether name is empty or not.
function name(n: string): string {
  return n ? `Hi <strong>${escapeHtml(n)}</strong> — ` : '';
}
