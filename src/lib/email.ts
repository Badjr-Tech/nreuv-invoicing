import sgMail from '@sendgrid/mail';

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  console.warn('SENDGRID_API_KEY is not set. Emails will not be sent.');
}

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@nreuv.com'; // Change this to your verified sender

export const sendWelcomeEmail = async (to: string, name: string) => {
  if (!process.env.SENDGRID_API_KEY) {
    console.log(`Simulating welcome email to ${to}`);
    return;
  }

  const msg = {
    to,
    from: FROM_EMAIL,
    templateId: 'd-cd12896632844af0a362cb0bf9e6c7ec',
    dynamicTemplateData: {
      name: name,
      // Add other variables if your template expects them (e.g., login_url: 'https://nreuv-invoicing.vercel.app/auth/signin')
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

export const sendInvoiceReminderEmail = async (to: string, name: string) => {
  if (!process.env.SENDGRID_API_KEY) {
    console.log(`Simulating invoice reminder email to ${to}`);
    return;
  }

  const msg = {
    to,
    from: FROM_EMAIL,
    templateId: 'd-3df719ef3cfb435ab8325dc316cdddec',
    dynamicTemplateData: {
      name: name,
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

export const sendLateInvoiceEmail = async (to: string, name: string) => {
  if (!process.env.SENDGRID_API_KEY) {
    console.log(`Simulating late invoice email to ${to}`);
    return;
  }

  const msg = {
    to,
    from: FROM_EMAIL,
    templateId: 'd-6ad80364f38c47b683fe4058da7f826a',
    dynamicTemplateData: {
      name: name,
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

  const msg = {
    to,
    from: FROM_EMAIL,
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

