import sgMail from '@sendgrid/mail';

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  console.warn('SENDGRID_API_KEY is not set. Emails will not be sent.');
}

const FALLBACK_FROM_EMAIL_ADDRESS = 'noreply@nreuv.com'; // Fallback email address

export const sendWelcomeEmail = async (to: string, name: string, passwordLink: string) => {
  if (!process.env.SENDGRID_API_KEY) {
    console.log(`Simulating welcome email to ${to} with link: ${passwordLink}`);
    return;
  }

  const senderEmail = process.env.SENDGRID_FROM_EMAIL || FALLBACK_FROM_EMAIL_ADDRESS;

  const msg = {
    to,
    from: {
      name: "NREUV Invoicing",
      email: senderEmail,
    },
    templateId: 'd-cd12896632844af0a362cb0bf9e6c7ec',
    dynamicTemplateData: {
      name: name,
      PASSWORD_LINK: passwordLink,
    },
  };

  try {
    await sgMail.send(msg);
    console.log(`Welcome email sent successfully to ${to}`);
  } catch (error: any) {
    console.error('Error sending welcome email');
    console.error(error);
    if (error.response) {
      console.error(error.response.body);
    }
  }
};

export const sendInvoiceReminderEmail = async (to: string, name: string, invoiceLink: string) => {
  if (!process.env.SENDGRID_API_KEY) {
    console.log(`Simulating invoice reminder email to ${to} for invoice link: ${invoiceLink}`);
    return;
  }

  const senderEmail = process.env.SENDGRID_FROM_EMAIL || FALLBACK_FROM_EMAIL_ADDRESS;

  const msg = {
    to,
    from: {
      name: "NREUV Invoicing",
      email: senderEmail,
    },
    templateId: 'd-3df719ef3cfb435ab8325dc316cdddec',
    dynamicTemplateData: {
      name: name,
      INVOICE_LINK: invoiceLink,
    },
  };

  try {
    await sgMail.send(msg);
    console.log(`Invoice reminder email sent successfully to ${to}`);
  } catch (error: any) {
    console.error('Error sending invoice reminder email');
    console.error(error);
    if (error.response) {
      console.error(error.response.body);
    }
  }
};

export const sendLateInvoiceEmail = async (to: string, name: string, invoiceLink: string, dueDateAndTime: string) => {
  if (!process.env.SENDGRID_API_KEY) {
    console.log(`Simulating late invoice email to ${to} for invoice link: ${invoiceLink}, due: ${dueDateAndTime}`);
    return;
  }

  const senderEmail = process.env.SENDGRID_FROM_EMAIL || FALLBACK_FROM_EMAIL_ADDRESS;

  const msg = {
    to,
    from: {
      name: "NREUV Invoicing",
      email: senderEmail,
    },
    templateId: 'd-6ad80364f38c47b683fe4058da7f826a',
    dynamicTemplateData: {
      name: name,
      INVOICE_LINK: invoiceLink,
      DUEDATE_TIME: dueDateAndTime,
    },
  };

  try {
    await sgMail.send(msg);
    console.log(`Late invoice email sent successfully to ${to}`);
  } catch (error: any) {
    console.error('Error sending late invoice email');
    console.error(error);
    if (error.response) {
      console.error(error.response.body);
    }
  }
};

export const sendAdminInvoiceSubmittedEmail = async (to: string, userName: string, invoiceNumber: string | number) => {
  if (!process.env.SENDGRID_API_KEY) {
    console.log(`Simulating admin invoice submitted email to ${to} for user ${userName}`);
    return;
  }

  const senderEmail = process.env.SENDGRID_FROM_EMAIL || FALLBACK_FROM_EMAIL_ADDRESS;

  const msg = {
    to,
    from: {
      name: "NREUV Invoicing",
      email: senderEmail,
    },
    templateId: 'd-abfea38b0bb846a3b430c243500f79db',
    dynamicTemplateData: {
      user_name: userName,
      invoice_number: invoiceNumber,
    },
  };

  try {
    await sgMail.send(msg);
    console.log(`Admin invoice submitted email sent successfully to ${to}`);
  } catch (error: any) {
    console.error('Error sending admin invoice submitted email');
    console.error(error);
    if (error.response) {
      console.error(error.response.body);
    }
  }
};

export const sendAdminLateSubmissionEmail = async (to: string, userName: string, invoiceNumber: string | number, daysLate: number) => {
  if (!process.env.SENDGRID_API_KEY) {
    console.log(`Simulating admin late submission email to ${to} for user ${userName}, invoice ${invoiceNumber} (${daysLate} days late)`);
    return;
  }

  const senderEmail = process.env.SENDGRID_FROM_EMAIL || FALLBACK_FROM_EMAIL_ADDRESS;

  const msg = {
    to,
    from: {
      name: "NREUV Invoicing",
      email: senderEmail,
    },
    templateId: 'd-115673158869494785d8a4d8d1017831',
    dynamicTemplateData: {
      user_name: userName,
      invoice_number: invoiceNumber,
      days_late: daysLate,
    },
  };

  try {
    await sgMail.send(msg);
    console.log(`Admin late submission email sent successfully to ${to}`);
  } catch (error: any) {
    console.error('Error sending admin late submission email');
    console.error(error);
    if (error.response) {
      console.error(error.response.body);
    }
  }
};

export const sendPayrollApprovalRequestEmail = async (
  to: string,
  approverName: string,
  payDate: string,
  grandTotal: number,
  invoiceCount: number,
  notes: string | null,
  deadline: string,
  reviewLink: string,
) => {
  if (!process.env.SENDGRID_API_KEY) {
    console.log(`Simulating payroll approval email to ${to} for pay date ${payDate}`);
    return;
  }

  const senderEmail = process.env.SENDGRID_FROM_EMAIL || FALLBACK_FROM_EMAIL_ADDRESS;

  const msg = {
    to,
    from: {
      name: "NREUV Invoicing",
      email: senderEmail,
    },
    subject: `Payroll for ${payDate} is ready for your approval`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #1e293b;">
        <h2 style="color: #7f1d1d;">Payroll is ready for your approval</h2>
        <p>Hi ${approverName},</p>
        <p>The payroll run for <strong>${payDate}</strong> has been compiled and is waiting for your review.</p>
        <table style="border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 4px 12px 4px 0; color: #64748b;">Total amount</td><td style="padding: 4px 0; font-weight: bold;">$${grandTotal.toFixed(2)}</td></tr>
          <tr><td style="padding: 4px 12px 4px 0; color: #64748b;">Invoices included</td><td style="padding: 4px 0;">${invoiceCount}</td></tr>
          <tr><td style="padding: 4px 12px 4px 0; color: #64748b;">Approve by</td><td style="padding: 4px 0; font-weight: bold; color: #b91c1c;">${deadline}</td></tr>
        </table>
        ${notes ? `<p style="background: #f8fafc; border-left: 3px solid #94a3b8; padding: 10px 14px;"><strong>Note from the admin:</strong><br/>${notes}</p>` : ""}
        <p><a href="${reviewLink}" style="display: inline-block; background: #7f1d1d; color: #ffffff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold;">Review &amp; Approve Payroll</a></p>
        <p style="color: #64748b; font-size: 13px;">Sign in to review each invoice PDF and approve the run.</p>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log(`Payroll approval email sent successfully to ${to}`);
  } catch (error: any) {
    console.error('Error sending payroll approval email');
    console.error(error);
    if (error.response) {
      console.error(error.response.body);
    }
  }
};
