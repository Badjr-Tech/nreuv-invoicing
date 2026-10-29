// All transactional email goes through Brevo (https://api.brevo.com).
// If BREVO_API_KEY is missing, emails are logged instead of sent.

const FALLBACK_FROM_EMAIL_ADDRESS = "noreply@nreuv.com";

async function sendEmail(
  to: string,
  subject: string,
  htmlBody: string,
  attachments?: { name: string; contentBase64: string }[],
  replyTo?: string
) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.warn(`BREVO_API_KEY is not set. Simulating email to ${to}: "${subject}"`);
    return;
  }

  const senderEmail = process.env.BREVO_FROM_EMAIL || FALLBACK_FROM_EMAIL_ADDRESS;

  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 560px; margin: 0 auto; color: #1e293b;">
      ${htmlBody}
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0 12px;" />
      <p style="color: #94a3b8; font-size: 12px;">NREUV Invoicing — this is an automated message.</p>
    </div>
  `;

  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        sender: { name: "NREUV Invoicing", email: senderEmail },
        to: [{ email: to }],
        subject,
        htmlContent: html,
        ...(attachments?.length
          ? { attachment: attachments.map((a) => ({ name: a.name, content: a.contentBase64 })) }
          : {}),
        ...(replyTo ? { replyTo: { email: replyTo } } : {}),
      }),
    });
    if (!res.ok) {
      console.error(`Brevo email to ${to} failed (${res.status}):`, await res.text());
    } else {
      console.log(`Email sent to ${to}: "${subject}"`);
    }
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error);
  }
}

const button = (href: string, label: string) =>
  `<p style="margin: 20px 0;"><a href="${href}" style="display: inline-block; background: #7f1d1d; color: #ffffff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold;">${label}</a></p>`;

export const sendWelcomeEmail = async (to: string, name: string, passwordLink: string) => {
  await sendEmail(
    to,
    "Welcome to NREUV Invoicing — set your password",
    `<h2 style="color: #7f1d1d;">Welcome, ${name}!</h2>
     <p>An account has been created for you on NREUV Invoicing. Click below to set your password and get started.</p>
     ${button(passwordLink, "Set My Password")}
     <p style="color: #64748b; font-size: 13px;">If the button doesn't work, copy this link into your browser:<br/>${passwordLink}</p>`
  );
};

export const sendInvoiceReminderEmail = async (to: string, name: string, invoiceLink: string) => {
  await sendEmail(
    to,
    "Reminder: your invoice is due soon",
    `<h2 style="color: #7f1d1d;">Invoice reminder</h2>
     <p>Hi ${name},</p>
     <p>This is a friendly reminder that your invoice submission deadline is coming up. Please submit your invoice on time so it can be included in the next payroll run.</p>
     ${button(invoiceLink, "Submit My Invoice")}`
  );
};

export const sendLateInvoiceEmail = async (to: string, name: string, invoiceLink: string, dueDateAndTime: string) => {
  await sendEmail(
    to,
    "Your invoice is late",
    `<h2 style="color: #b91c1c;">Invoice overdue</h2>
     <p>Hi ${name},</p>
     <p>Your invoice was due <strong>${dueDateAndTime}</strong> and hasn't been submitted yet. Please submit it as soon as possible so your payment isn't delayed.</p>
     ${button(invoiceLink, "Submit My Invoice Now")}`
  );
};

export const sendAdminInvoiceSubmittedEmail = async (to: string, userName: string, invoiceNumber: string | number) => {
  await sendEmail(
    to,
    `Invoice #${invoiceNumber} submitted by ${userName}`,
    `<h2 style="color: #7f1d1d;">New invoice submitted</h2>
     <p><strong>${userName}</strong> has submitted invoice <strong>#${invoiceNumber}</strong> for review.</p>
     ${button(process.env.NEXT_PUBLIC_APP_URL || "https://nreuv-invoicing.vercel.app", "Review Invoices")}`
  );
};

export const sendAdminLateSubmissionEmail = async (to: string, userName: string, invoiceNumber: string | number, daysLate: number) => {
  await sendEmail(
    to,
    `Late invoice: ${userName} is ${daysLate} day${daysLate === 1 ? "" : "s"} overdue`,
    `<h2 style="color: #b91c1c;">Late submission</h2>
     <p><strong>${userName}</strong> has not submitted invoice <strong>#${invoiceNumber}</strong> — it is now <strong>${daysLate} day${daysLate === 1 ? "" : "s"}</strong> past the deadline.</p>
     ${button(process.env.NEXT_PUBLIC_APP_URL || "https://nreuv-invoicing.vercel.app", "Open Dashboard")}`
  );
};

export const sendPayrollApprovalRequestEmail = async (
  to: string,
  approverName: string,
  payDate: string,
  notes: string | null,
  deadline: string,
  reviewLink: string,
  attachments?: { name: string; contentBase64: string }[] | null,
) => {
  // Deliberately no dollar amount: the attached payroll-system screenshots are
  // the source of truth the approver reviews.
  await sendEmail(
    to,
    `Payroll for ${payDate} is ready for your approval — approve by ${deadline}`,
    `<h2 style="color: #7f1d1d;">Payroll is ready for your approval</h2>
     <p>Hi ${approverName},</p>
     <p>The payroll run for <strong>${payDate}</strong> has been compiled and is waiting for your review.</p>
     <p style="font-weight: bold; color: #b91c1c;">Please approve by ${deadline}.</p>
     ${notes ? `<p style="background: #f8fafc; border-left: 3px solid #94a3b8; padding: 10px 14px;"><strong>Note from the admin:</strong><br/>${notes}</p>` : ""}
     ${attachments?.length ? `<p>📎 The payroll entry ${attachments.length === 1 ? "screenshot is" : "screenshots are"} attached to this email.</p>` : ""}
     <p style="background: #ecfdf5; border-left: 3px solid #059669; padding: 10px 14px; font-weight: bold;">
       ✅ To approve: simply reply to this email with &ldquo;Approved&rdquo;. Your reply goes to djmj@nreuv.com.
     </p>
     ${button(reviewLink, "Review in the App (optional)")}`,
    attachments || undefined,
    "djmj@nreuv.com"
  );
};

export const sendDraftReminderEmail = async (
  to: string,
  name: string,
  draftCount: number,
  invoicesLink: string,
) => {
  await sendEmail(
    to,
    "Don't forget to submit your invoice",
    `<h2 style="color: #7f1d1d;">You have ${draftCount === 1 ? "an unsubmitted invoice" : `${draftCount} unsubmitted invoices`}</h2>
     <p>Hi ${name},</p>
     <p>You have ${draftCount === 1 ? "a draft invoice" : `${draftCount} draft invoices`} that ${draftCount === 1 ? "hasn't" : "haven't"} been submitted yet. Drafts are <strong>not included in payroll</strong> — if you don't submit before the deadline, you won't be paid for ${draftCount === 1 ? "it" : "them"} this period.</p>
     ${button(invoicesLink, "Review & Submit My Invoice")}`
  );
};
