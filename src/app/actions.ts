"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { invoices, invoiceItems, invoiceDeadlineSettings, invoiceRecurrenceEnum, notifications, accountRequests, users, InsertUser, categories, categoryBundles, categoryBundleCategories, userCategoryBundles, onboardingTasks, userOnboardingProgress } from "@/db/schema";
import bcrypt from "bcryptjs";
import { and, eq, desc, asc, gte, lte, inArray, notInArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import InvoicePdfDocument from "@/lib/pdf-generator";
import { renderToBuffer } from "@react-pdf/renderer";
import { addDays, format } from "date-fns";
import { sendWelcomeEmail, sendAdminInvoiceSubmittedEmail, sendInvoiceIssueEmail, sendAccountRequestConfirmationEmail, sendAdminAccountRequestEmail } from "@/lib/email";
import { generatePayPeriods, mondayBeforePayment } from "@/lib/schedule-utils";
import { toCalendarDate } from "@/lib/date-utils";
import { generatePasswordResetToken } from "@/lib/auth-utils";

// New interfaces for deadline and payment schedule settings
interface CreateOrUpdateInvoiceDeadlineSettingData {
  id?: string;
  recurrence: "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "CUSTOM";
  customIntervalDays?: number;
  startDate?: Date;
  billingPeriodLengthDays?: number; // This is now Coverage Period Length
  // billingPeriodEndOffsetDays is removed
  submissionOffsetDays?: number; // Days before Payment Date that invoice must be submitted
}





// ... (existing createInvoice, updateInvoice, updateInvoiceStatus, generateInvoicePdf, generateInvoicesCsv functions)

export async function createOrUpdateInvoiceDeadlineSetting(data: CreateOrUpdateInvoiceDeadlineSettingData) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized or Forbidden: Only Admin can manage deadline settings.");
  }

  if (data.recurrence === "CUSTOM" && (!data.customIntervalDays || data.customIntervalDays <= 0)) {
    throw new Error("Custom recurrence requires a positive custom interval in days.");
  }

  if (data.id) {
    // Update existing setting
    await db
      .update(invoiceDeadlineSettings)
      .set({
        recurrence: data.recurrence,
        customIntervalDays: data.customIntervalDays || null,
        startDate: data.startDate || null,
        billingPeriodLengthDays: data.billingPeriodLengthDays || null,
        // billingPeriodEndOffsetDays: data.billingPeriodEndOffsetDays || null, // Removed
        submissionOffsetDays: data.submissionOffsetDays || null,
      })
      .where(eq(invoiceDeadlineSettings.id, data.id));
  } else {
    // Create new setting
    await db.insert(invoiceDeadlineSettings).values({
      recurrence: data.recurrence,
      customIntervalDays: data.customIntervalDays || null,
      startDate: data.startDate || null,
      billingPeriodLengthDays: data.billingPeriodLengthDays || null,
      // billingPeriodEndOffsetDays: data.billingPeriodEndOffsetDays || null, // Removed
      submissionOffsetDays: data.submissionOffsetDays || null,
    });
  }

  revalidatePath("/admin/settings"); // Revalidate a hypothetical admin settings page
  revalidatePath("/"); // Revalidate home page if affected
}

export async function createCategory(name: string) {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "PAYROLL_MANAGER")) {
    throw new Error("Unauthorized or Forbidden: Only Admin or Payroll Manager can manage categories.");
  }
  if (!name.trim()) {
    throw new Error("Category name cannot be empty.");
  }
  await db.insert(categories).values({ name: name.trim() });
  revalidatePath("/admin/settings");
  revalidatePath("/invoices/new"); // For category dropdowns
  revalidatePath("/invoices/[id]/edit"); // For category dropdowns
}

export async function updateCategory(id: string, name: string) {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "PAYROLL_MANAGER")) {
    throw new Error("Unauthorized or Forbidden: Only Admin or Payroll Manager can manage categories.");
  }
  if (!name.trim()) {
    throw new Error("Category name cannot be empty.");
  }
  await db.update(categories).set({ name: name.trim() }).where(eq(categories.id, id));
  revalidatePath("/admin/settings");
  revalidatePath("/invoices/new");
  revalidatePath("/invoices/[id]/edit");
}

export async function deleteCategory(id: string) {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "PAYROLL_MANAGER")) {
    throw new Error("Unauthorized or Forbidden: Only Admin or Payroll Manager can manage categories.");
  }
  await db.delete(categories).where(eq(categories.id, id));
  revalidatePath("/admin/settings");
  revalidatePath("/invoices/new");
  revalidatePath("/invoices/[id]/edit");
}




// New interfaces for notifications
interface CreateNotificationData {
  userId: string;
  message: string;
}

export async function createNotification(data: CreateNotificationData) {
  const session = await auth();

  // Only Admin can create notifications for others, users can theoretically create for themselves (e.g. system generated)
  if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.id !== data.userId)) {
    throw new Error("Unauthorized or Forbidden: Only Admin can create notifications for other users.");
  }

  if (!data.userId || !data.message) {
    throw new Error("Missing required notification data (userId, message).");
  }

  await db.insert(notifications).values({
    userId: data.userId,
    message: data.message,
  });

  revalidatePath("/"); // Revalidate home page for notification badge updates
  revalidatePath(`/dashboard/user`); // Revalidate specific user dashboard
}

export async function markNotificationAsRead(notificationId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const notificationRecord = await db.query.notifications.findFirst({
    where: eq(notifications.id, notificationId),
  });

  if (!notificationRecord) {
    throw new Error("Notification not found.");
  }

  // Only the owner or an ADMIN can mark a notification as read
  if (notificationRecord.userId !== session.user.id && session.user.role !== "ADMIN") {
    throw new Error("Forbidden: You can only mark your own notifications as read.");
  }

  revalidatePath("/"); // Revalidate home page for notification badge updates
  revalidatePath(`/dashboard/user`); // Revalidate specific user dashboard
}

export async function markAllNotificationsAsRead() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const userId = session.user.id;

  await db
    .update(notifications)
    .set({ read: true })
    .where(eq(notifications.userId, userId));

  revalidatePath("/"); // Revalidate home page for notification badge updates
  revalidatePath(`/dashboard/user`); // Revalidate specific user dashboard
}

// Interface for account request data
interface AccountRequestData {
  email: string;
  name: string;
  message: string;
}

export async function requestAccount(data: AccountRequestData) {
  // In a real application, you would:
  // 1. Validate data more thoroughly (e.g., check for existing email)
  // 2. Notify an administrator (e.g., via email)
  // 3. Implement rate limiting to prevent spam

  if (!data.email || !data.name || !data.message) {
    throw new Error("Missing required fields for account request.");
  }

  // Insert the request into the accountRequests table
  await db.insert(accountRequests).values({
    name: data.name,
    email: data.email,
    message: data.message,
  });

  // Fire both notifications — never let an email failure break the request.
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nreuv-invoicing.vercel.app";
  const adminLink = `${appUrl}/admin/account-requests`;

  try {
    await sendAccountRequestConfirmationEmail(data.email, data.name);
  } catch (err) {
    console.error("requestAccount: confirmation email failed", err);
  }

  try {
    const admins = await db.query.users.findMany({
      where: eq(users.role, "ADMIN"),
    });
    await Promise.all(
      admins
        .filter((a) => !!a.email)
        .map((a) =>
          sendAdminAccountRequestEmail(
            a.email!,
            data.name,
            data.email,
            data.message,
            adminLink,
          ).catch((err) => console.error("requestAccount: admin email failed", { admin: a.email, err })),
        ),
    );
  } catch (err) {
    console.error("requestAccount: admin fanout failed", err);
  }

  revalidatePath("/admin/account-requests"); // Revalidate admin page for requests

  return { success: true, message: "Account request submitted successfully." };
}

// Function to approve an account request
export async function approveAccountRequest(requestId: string) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized or Forbidden: Only Admin can approve account requests.");
  }

  const request = await db.query.accountRequests.findFirst({
    where: eq(accountRequests.id, requestId),
  });

  if (!request) {
    throw new Error("Account request not found.");
  }

  if (request.status !== "PENDING") {
    throw new Error("Only pending requests can be approved.");
  }

  // 1. Create a new user with a temporary password
  // In a real app, you'd send an email to the user to set their password.
  const tempPassword = Math.random().toString(36).slice(-10); // Generate a random string
  const hashedPassword = await bcrypt.hash(tempPassword, 10);

  await db.insert(users).values({
    name: request.name,
    email: request.email,
    password: hashedPassword,
    role: "USER", // Default role for approved accounts
    emailVerified: new Date(), // Mark as verified since admin approved
  });

  const newUserRecord = await db.query.users.findFirst({
    where: eq(users.email, request.email),
  });

  if (!newUserRecord) {
    throw new Error("Failed to retrieve new user record after creation.");
  }

  const token = await generatePasswordResetToken(newUserRecord.id);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nreuv-invoicing.vercel.app';
  const passwordLink = `${appUrl}/auth/set-password?token=${token}`;
  console.log('Generated Password Link for approveAccountRequest:', passwordLink);

  // Send the welcome email
  await sendWelcomeEmail(request.email, request.name, passwordLink);

  // 2. Update the account request status
  await db
    .update(accountRequests)
    .set({ status: "APPROVED", processedAt: new Date() })
    .where(eq(accountRequests.id, requestId));

  revalidatePath("/admin/account-requests"); // Revalidate the admin account requests page
  revalidatePath("/admin/users"); // Revalidate the admin users page
  
  // TODO: Send email to the user with their temporary password and instructions to set a new one.
  return { success: true, message: "Account request approved and user created." };
}

// Function to deny an account request
export async function denyAccountRequest(requestId: string) {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      throw new Error("Unauthorized or Forbidden: Only Admin can deny account requests.");
    }

    const request = await db.query.accountRequests.findFirst({
      where: eq(accountRequests.id, requestId),
    });

    if (!request) {
      throw new Error("Account request not found.");
    }

    // Idempotent: if it's already DENIED, treat as success rather than
    // throwing — avoids confusing errors on double-click / stale UI.
    if (request.status === "DENIED") {
      return { success: true, message: "Account request was already denied." };
    }

    if (request.status !== "PENDING") {
      throw new Error(`Cannot deny a request with status ${request.status}.`);
    }

    await db
      .update(accountRequests)
      .set({ status: "DENIED", processedAt: new Date() })
      .where(eq(accountRequests.id, requestId));

    // Revalidate, but don't let a downstream render error mask the success
    // of the DB write or surface as a generic "Server Components render" error.
    try {
      revalidatePath("/admin/account-requests");
    } catch (revalErr) {
      console.error("denyAccountRequest: revalidatePath failed", revalErr);
    }

    return { success: true, message: "Account request denied." };
  } catch (err: any) {
    // Log the real error to server logs and rethrow a clean message so the
    // client alert shows something actionable instead of the production
    // Server Components render placeholder.
    console.error("denyAccountRequest failed", { requestId, err });
    throw new Error(err?.message || "Failed to deny account request.");
  }
}

// Hard-delete an account request. Removes the row entirely — use for
// cleanup after deny, or for spam requests.
export async function deleteAccountRequest(requestId: string) {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      throw new Error("Unauthorized or Forbidden: Only Admin can delete account requests.");
    }

    await db.delete(accountRequests).where(eq(accountRequests.id, requestId));

    try {
      revalidatePath("/admin/account-requests");
    } catch (revalErr) {
      console.error("deleteAccountRequest: revalidatePath failed", revalErr);
    }

    return { success: true, message: "Account request deleted." };
  } catch (err: any) {
    console.error("deleteAccountRequest failed", { requestId, err });
    throw new Error(err?.message || "Failed to delete account request.");
  }
}

interface NewInvoiceItem {
  date: Date;
  description: string;
  hours: number;
  categoryId?: string;
}

interface NewInvoiceData {
  invoiceDate: Date;
  items: NewInvoiceItem[];
}

interface UpdateInvoiceItem extends NewInvoiceItem {
  id?: string; // id is optional for new items being added during an update
}

interface UpdateInvoiceData {
  id: string; // Invoice ID is required for updates
  invoiceDate: Date;
  items: UpdateInvoiceItem[];
}

export async function createInvoice(invoiceData: NewInvoiceData) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Basic validation (can be enhanced with a library like Zod)
  if (!invoiceData.invoiceDate || !invoiceData.items.length) {
    throw new Error("Missing required invoice data.");
  }

  // Every line item's description must be substantive — server-side guard
  // matching the client-side rule so the UI can't be bypassed.
  for (const item of invoiceData.items) {
    if ((item.description?.trim().length ?? 0) < 10) {
      throw new Error("Each item's description must be at least 10 characters.");
    }
    if (!item.categoryId) {
      throw new Error("Each item must have a category assigned.");
    }
  }

  const userId = session.user.id;
  const userRecord = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!userRecord) {
    throw new Error("User not found.");
  }
  
  const userRate = userRecord.hourlyRate;

  // The invoiceData.invoiceDate from the form is now the Payment Date
  const paymentDate = invoiceData.invoiceDate;

  // Fetch active schedule to determine submission deadline
  const schedule = await db.query.invoiceDeadlineSettings.findFirst({
    where: (settings, { isNotNull }) => isNotNull(settings.startDate),
    orderBy: (settings, { desc }) => [desc(settings.startDate)],
  });

  // Deadline is the Monday of the payroll week (business rule); the offset
  // days on invoiceDeadlineSettings is no longer consulted.
  const submissionDeadline = mondayBeforePayment(paymentDate);
  
  let totalHours = 0;
  let totalCost = 0;

  for (const item of invoiceData.items) {
    if (item.hours <= 0) {
      throw new Error("Invoice item hours must be a positive number.");
    }
    totalHours += item.hours;
    totalCost += item.hours * userRate;
  }

  const [newInvoice] = await db
    .insert(invoices)
    .values({
      userId: userId,
      invoiceDate: paymentDate, // This is the actual Payment Date
      dueDate: submissionDeadline, // This is the actual Submission Deadline
      totalHours: totalHours,
      totalCost: totalCost,
    })
    .returning();

  if (!newInvoice) {
    throw new Error("Failed to create invoice.");
  }

  const itemsToInsert = invoiceData.items.map((item) => ({
    ...item,
    rate: userRate,
    invoiceId: newInvoice.id,
  }));

  await db.insert(invoiceItems).values(itemsToInsert);

  if (!newInvoice) {
    throw new Error("Failed to create invoice.");
  }

  revalidatePath("/invoices"); // Revalidate the invoices list page
  revalidatePath("/"); // Revalidate the home page (where dashboards might be)
  
  return newInvoice.id;
}

export async function updateInvoice(invoiceData: UpdateInvoiceData) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Basic validation
  if (!invoiceData.id || !invoiceData.invoiceDate || !invoiceData.items.length) {
    throw new Error("Missing required invoice data for update.");
  }

  for (const item of invoiceData.items) {
    if ((item.description?.trim().length ?? 0) < 10) {
      throw new Error("Each item's description must be at least 10 characters.");
    }
    if (!item.categoryId) {
      throw new Error("Each item must have a category assigned.");
    }
  }

  const userId = session.user.id;
  const userRecord = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!userRecord) {
    throw new Error("User not found.");
  }
  
  const userRate = userRecord.hourlyRate;

  // Fetch existing invoice and check permissions
  const existingInvoice = await db.query.invoices.findFirst({
    where: eq(invoices.id, invoiceData.id),
    with: {
      items: true,
    },
  });

  if (!existingInvoice) {
    throw new Error("Invoice not found.");
  }

  // Authorization: Only the owner or an ADMIN can edit, and only if DRAFT
  if (existingInvoice.userId !== userId && session.user.role !== "ADMIN") {
    throw new Error("Forbidden: You can only edit your own invoices.");
  }
      if (existingInvoice.status !== "DRAFT") {
        throw new Error("Forbidden: Only DRAFT invoices can be edited.");
      }
    
      // The invoiceData.invoiceDate from the form is now the Payment Date
      const paymentDate = invoiceData.invoiceDate;
    
      // Fetch active schedule to determine submission deadline
      const schedule = await db.query.invoiceDeadlineSettings.findFirst({
        where: (settings, { isNotNull }) => isNotNull(settings.startDate),
        orderBy: (settings, { desc }) => [desc(settings.startDate)],
      });
    
      // Deadline is the Monday of the payroll week (business rule).
      const submissionDeadline = mondayBeforePayment(paymentDate);
      
      let newTotalHours = 0;
      let newTotalCost = 0;
    
      for (const item of invoiceData.items) {
        if (item.hours <= 0) {
          throw new Error("Invoice item hours must be a positive number.");
        }
        newTotalHours += item.hours;
        newTotalCost += item.hours * userRate;
      }
    
      // Update invoice details
      await db
        .update(invoices)
        .set({
          invoiceDate: paymentDate, // This is the actual Payment Date
          dueDate: submissionDeadline, // This is the actual Submission Deadline
          totalHours: newTotalHours,
          totalCost: newTotalCost,
          // Status remains DRAFT unless explicitly changed by updateInvoiceStatus
        })
        .where(eq(invoices.id, invoiceData.id));
  const existingItemIds = existingInvoice.items.map((item) => item.id);
  const updatedItemIds = invoiceData.items.filter((item) => item.id).map((item) => item.id!);

  // Delete items that are no longer present
  if (existingItemIds.length > 0 && updatedItemIds.length > 0) {
    await db
      .delete(invoiceItems)
      .where(
        and(
          eq(invoiceItems.invoiceId, invoiceData.id),
          notInArray(invoiceItems.id, updatedItemIds)
        )
      );
  } else if (existingItemIds.length > 0 && updatedItemIds.length === 0) {
    // If all items are removed
    await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceData.id));
  }


  for (const item of invoiceData.items) {
    if (item.id) {
      // Update existing item
      await db
        .update(invoiceItems)
        .set({
          date: item.date,
          description: item.description,
          hours: item.hours,
          rate: userRate,
          categoryId: item.categoryId || null,
        })
        .where(and(eq(invoiceItems.id, item.id), eq(invoiceItems.invoiceId, invoiceData.id)));
    } else {
      // Insert new item
      await db.insert(invoiceItems).values({
        invoiceId: invoiceData.id,
        date: item.date,
        description: item.description,
        hours: item.hours,
        rate: userRate,
        categoryId: item.categoryId || null,
      });
    }
  }

  revalidatePath(`/invoices/${invoiceData.id}`); // Revalidate the specific invoice page
  revalidatePath("/invoices"); // Revalidate the invoices list page
  revalidatePath("/"); // Revalidate the home page
}

export async function updateInvoiceStatus(invoiceId: string, newStatus: "PENDING_MANAGER" | "PENDING_ADMIN" | "APPROVED") {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const { role, id: userId } = session.user;

  const invoiceRecord = await db.query.invoices.findFirst({
    where: eq(invoices.id, invoiceId),
    with: { user: true },
  });

  if (!invoiceRecord) {
    throw new Error("Invoice not found.");
  }

  if (newStatus === "APPROVED") {
    if (role !== "ADMIN") {
      throw new Error("Forbidden: Only Admin can finalize approval of invoices.");
    }
  } else if (newStatus === "PENDING_ADMIN") {
    if (role === "PAYROLL_MANAGER" && invoiceRecord.user.managerId !== userId) {
      throw new Error("Forbidden: You are not the manager for this employee.");
    }
    if (role !== "ADMIN" && role !== "PAYROLL_MANAGER" && invoiceRecord.userId !== userId) {
      throw new Error("Forbidden: You can only submit your own invoices.");
    }
  } else if (newStatus === "PENDING_MANAGER") {
    if (invoiceRecord.userId !== userId) {
      throw new Error("Forbidden: You can only submit your own invoices.");
    }
  }

  // Block any forward transition (submit/pre-approve/approve) if a line
  // item still has no category — handles legacy invoices created before
  // the category rule was added.
  if (newStatus === "PENDING_MANAGER" || newStatus === "PENDING_ADMIN" || newStatus === "APPROVED") {
    const items = await db
      .select({ id: invoiceItems.id, categoryId: invoiceItems.categoryId })
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, invoiceId));

    const uncategorizedCount = items.filter((it) => !it.categoryId).length;
    if (uncategorizedCount > 0) {
      throw new Error(
        `Cannot proceed: ${uncategorizedCount} line item${uncategorizedCount === 1 ? "" : "s"} ${uncategorizedCount === 1 ? "is" : "are"} missing a category. Open the invoice in edit mode and assign one to every row.`,
      );
    }
  }

  // Define allowed status transitions
  const allowedTransitions: Record<string, string[]> = {
    DRAFT: ["PENDING_MANAGER", "PENDING_ADMIN"], // PENDING_ADMIN if no manager
    PENDING_MANAGER: ["PENDING_ADMIN", "APPROVED"],
    PENDING_ADMIN: ["APPROVED"],
    APPROVED: [], // Once approved, it's permanently locked
    SENT: ["PENDING_ADMIN", "APPROVED"], // For backward compatibility with older "SENT" status
  };

  if (!allowedTransitions[invoiceRecord.status].includes(newStatus)) {
    throw new Error(`Invalid status transition from ${invoiceRecord.status} to ${newStatus}`);
  }

  let updateData: any = { status: newStatus };
  if (newStatus === "APPROVED") {
    updateData.approvedDate = new Date();
  } else if (newStatus === "PENDING_MANAGER" || newStatus === "PENDING_ADMIN") {
    // Only set submittedDate if it's the first time submitting
    if (invoiceRecord.status === "DRAFT") {
      updateData.submittedDate = new Date();
      
      // Notify admins
      try {
        const admins = await db.query.users.findMany({
          where: eq(users.role, "ADMIN"),
        });
        
        const userName = invoiceRecord.user?.name || invoiceRecord.user?.email || "Unknown User";
        const userEmail = invoiceRecord.user?.email || "";
        const invoiceNumber = invoiceRecord.invoiceNumber || invoiceRecord.id.substring(0, 8);
        const amount = Number(invoiceRecord.totalCost || 0);
        const submittedDate = updateData.submittedDate ?? new Date();
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nreuv-invoicing.vercel.app';
        const adminLink = `${appUrl}/invoices/${invoiceRecord.id}`;

        for (const admin of admins) {
          if (admin.email) {
            await sendAdminInvoiceSubmittedEmail(
              admin.email,
              userName,
              invoiceNumber,
              userEmail,
              amount,
              submittedDate,
              adminLink,
            );
          }
        }
      } catch (error) {
        console.error("Failed to send admin notification email:", error);
      }
    }
  }

  await db.update(invoices).set(updateData).where(eq(invoices.id, invoiceId));

  revalidatePath("/"); // Revalidate the home page to reflect changes
}

export async function deferInvoice(invoiceId: string) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized or Forbidden: Only Admin can defer invoices.");
  }

  const invoiceRecord = await db.query.invoices.findFirst({
    where: eq(invoices.id, invoiceId),
  });

  if (!invoiceRecord) {
    throw new Error("Invoice not found.");
  }

  const schedule = await db.query.invoiceDeadlineSettings.findFirst({
    where: (settings, { isNotNull }) => isNotNull(settings.startDate),
    orderBy: (settings, { desc }) => [desc(settings.startDate)],
  });

  if (!schedule || !schedule.startDate) {
    throw new Error("No active payroll schedule found to calculate next pay cycle.");
  }

  // Generate enough pay periods to find the next one
  const periods = generatePayPeriods(schedule as any, 100); 
  const currentInvoiceDate = new Date(invoiceRecord.invoiceDate).getTime();
  
  // Find the first period whose payment date is strictly after the current invoice's payment date
  const nextPeriod = periods.find(p => new Date(p.invoiceDate).getTime() > currentInvoiceDate);

  if (!nextPeriod) {
    throw new Error("Could not determine the next pay cycle.");
  }

  await db.update(invoices).set({
    invoiceDate: nextPeriod.invoiceDate,
    dueDate: nextPeriod.submissionDeadline,
    status: "DRAFT", // Moving it back to DRAFT so the user knows it needs attention, or could leave it PENDING. Let's keep it DRAFT so they can adjust hours if needed.
  }).where(eq(invoices.id, invoiceId));

  revalidatePath("/");
  revalidatePath(`/invoices/${invoiceId}`);
}

// Admin / payroll-manager flow: flag an invoice as needing changes.
// Emails the contractor with the reviewer's notes, drops an in-app
// notification, and (optionally) resets the invoice to DRAFT.
export async function requestInvoiceChanges(
  invoiceId: string,
  message: string,
  sendBackToDraft: boolean,
) {
  const session = await auth();

  if (
    !session?.user?.id ||
    (session.user.role !== "ADMIN" && session.user.role !== "PAYROLL_MANAGER")
  ) {
    throw new Error("Forbidden: Only Admins or Payroll Managers can request changes.");
  }

  const trimmed = message.trim();
  if (trimmed.length < 10) {
    throw new Error("Please describe the issue in at least 10 characters.");
  }

  const invoice = await db.query.invoices.findFirst({
    where: eq(invoices.id, invoiceId),
    with: { user: true },
  });

  if (!invoice) {
    throw new Error("Invoice not found.");
  }
  if (!invoice.user?.email) {
    throw new Error("Invoice owner has no email on file.");
  }

  // Payroll managers can only request changes on invoices for their own reports.
  if (
    session.user.role === "PAYROLL_MANAGER" &&
    invoice.user.managerId !== session.user.id
  ) {
    throw new Error("Forbidden: You are not the manager for this employee.");
  }

  const reviewerName = session.user.name || session.user.email || "A reviewer";
  const ownerName = invoice.user.name || invoice.user.email || "Contractor";
  const invoiceNumber = invoice.invoiceNumber || invoice.id.substring(0, 8);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nreuv-invoicing.vercel.app";
  const invoiceLink = `${appUrl}/invoices/${invoice.id}`;

  // 1) Email
  try {
    await sendInvoiceIssueEmail(
      invoice.user.email,
      ownerName,
      reviewerName,
      invoiceNumber,
      trimmed,
      invoiceLink,
    );
  } catch (err) {
    console.error("requestInvoiceChanges: email failed", err);
    // Don't abort the action — the in-app notification still gives them a paper trail.
  }

  // 2) In-app notification
  try {
    await db.insert(notifications).values({
      userId: invoice.userId,
      message: `${reviewerName} requested changes on Invoice #${invoiceNumber}: ${trimmed.length > 140 ? trimmed.substring(0, 137) + "…" : trimmed}`,
    });
  } catch (err) {
    console.error("requestInvoiceChanges: notification failed", err);
  }

  // 3) Optionally reset to DRAFT so the contractor can edit and re-submit.
  if (sendBackToDraft) {
    await db.update(invoices).set({ status: "DRAFT" }).where(eq(invoices.id, invoiceId));
  }

  revalidatePath("/");
  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath("/notifications");

  return { success: true };
}

// Admin-only soft-archive. Sets archivedAt timestamp; reversible via
// unarchiveInvoice. Archived invoices are hidden from default list views.
export async function archiveInvoice(invoiceId: string) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized or Forbidden: Only Admin can archive invoices.");
  }

  const [existing] = await db
    .select({ id: invoices.id, archivedAt: invoices.archivedAt })
    .from(invoices)
    .where(eq(invoices.id, invoiceId))
    .limit(1);

  if (!existing) {
    throw new Error("Invoice not found.");
  }
  if (existing.archivedAt) {
    return { success: true, message: "Invoice was already archived." };
  }

  await db.update(invoices).set({ archivedAt: new Date() }).where(eq(invoices.id, invoiceId));

  revalidatePath("/");
  revalidatePath("/invoices");
  revalidatePath(`/invoices/${invoiceId}`);
  return { success: true, message: "Invoice archived." };
}

export async function unarchiveInvoice(invoiceId: string) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized or Forbidden: Only Admin can unarchive invoices.");
  }

  await db.update(invoices).set({ archivedAt: null }).where(eq(invoices.id, invoiceId));

  revalidatePath("/");
  revalidatePath("/invoices");
  revalidatePath(`/invoices/${invoiceId}`);
  return { success: true, message: "Invoice unarchived." };
}

// Admin-only hard delete. Removes the invoice and its line items.
export async function deleteInvoice(invoiceId: string) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized or Forbidden: Only Admin can delete invoices.");
  }

  const invoiceRecord = await db.query.invoices.findFirst({
    where: eq(invoices.id, invoiceId),
  });

  if (!invoiceRecord) {
    throw new Error("Invoice not found.");
  }

  // No ON DELETE CASCADE on invoice_item → invoice, so delete items first.
  // The neon-http driver doesn't support transactions, so we do this
  // sequentially and log clearly if the second step fails.
  try {
    await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
    await db.delete(invoices).where(eq(invoices.id, invoiceId));
  } catch (err) {
    console.error("deleteInvoice failed", { invoiceId, err });
    throw new Error("Failed to delete invoice. Please try again.");
  }

  revalidatePath("/");
  revalidatePath("/invoices");
  revalidatePath("/my-invoices");
}

export async function generateInvoicePdf(invoiceId: string) {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const invoiceRecord = await db.query.invoices.findFirst({
    where: eq(invoices.id, invoiceId),
    with: {
      user: true,
      items: {
        with: {
          category: true,
        },
      },
    },
  });

  if (!invoiceRecord) {
    throw new Error("Invoice not found.");
  }

  // Ensure all necessary fields are present for PDF generation
  if (!invoiceRecord.user || !invoiceRecord.items) {
    throw new Error("Invoice data is incomplete for PDF generation.");
  }

  const pdfBuffer = await renderToBuffer(InvoicePdfDocument({ invoice: invoiceRecord as any }));

  return pdfBuffer.toString('base64');
}

export async function generateInvoicesCsv(searchParams?: {
  sortField?: string;
  sortOrder?: "asc" | "desc";
  filterUser?: string;
  filterStatus?: "DRAFT" | "PENDING_MANAGER" | "PENDING_ADMIN" | "APPROVED" | "";
  filterInvoiceDateStart?: string;
  filterInvoiceDateEnd?: string;
  filterDueDateStart?: string;
  filterDueDateEnd?: string;
}) {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  if (session.user.role !== "ADMIN") {
    throw new Error("Forbidden: Only Admin can export CSV.");
  }

  const sortField = searchParams?.sortField || "invoiceDate";
  const sortOrder = searchParams?.sortOrder || "desc";
  // Import 'asc' from drizzle-orm if not already imported
  const orderBy = sortOrder === "asc" ? asc : desc;

  let whereClause = [];

  if (searchParams?.filterUser) {
    whereClause.push(eq(invoices.userId, searchParams.filterUser));
  }

  if (searchParams?.filterStatus) {
    whereClause.push(eq(invoices.status, searchParams.filterStatus));
  }

  if (searchParams?.filterInvoiceDateStart) {
    whereClause.push(gte(invoices.invoiceDate, new Date(searchParams.filterInvoiceDateStart)));
  }
  if (searchParams?.filterInvoiceDateEnd) {
    whereClause.push(lte(invoices.invoiceDate, new Date(searchParams.filterInvoiceDateEnd)));
  }

  if (searchParams?.filterDueDateStart) {
    whereClause.push(gte(invoices.dueDate, new Date(searchParams.filterDueDateStart)));
  }
  if (searchParams?.filterDueDateEnd) {
    whereClause.push(lte(invoices.dueDate, new Date(searchParams.filterDueDateEnd)));
  }

  const filteredAndSortedInvoices = await db.query.invoices.findMany({
    where: and(...whereClause),
    with: { user: true },
    orderBy: [orderBy((invoices as any)[sortField])],
  });

  const headers = [
    "Employee Name",
    "Invoice Date",
    "Due Date",
    "Status",
    "Total Hours",
    "Total Cost",
    "Submitted Date",
    "Approved Date",
  ];

  const rows = filteredAndSortedInvoices.map((invoice) => [
    invoice.user?.name || invoice.user?.email || "Unknown",
    format(toCalendarDate(invoice.invoiceDate), "yyyy-MM-dd"),
    format(toCalendarDate(invoice.dueDate), "yyyy-MM-dd"),
    invoice.status,
    invoice.totalHours,
    invoice.totalCost.toFixed(2),
    invoice.submittedDate ? format(toCalendarDate(invoice.submittedDate), "yyyy-MM-dd") : "",
    invoice.approvedDate ? format(toCalendarDate(invoice.approvedDate), "yyyy-MM-dd") : "",
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  return csvContent;
}

export async function updateUserRole(userId: string, newRole: "ADMIN" | "PAYROLL_MANAGER" | "USER" | "EMPLOYEE") {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized or Forbidden: Only Admin can manage users.");
  }

  // Ensure we don't accidentally remove the last admin
  if (newRole !== "ADMIN") {
    const adminCountResponse = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.role, "ADMIN"));
    
    const adminCount = Number(adminCountResponse[0].count);
    const targetUser = await db.query.users.findFirst({ where: eq(users.id, userId) });

    if (targetUser?.role === "ADMIN" && adminCount <= 1) {
      throw new Error("Cannot change the role of the last admin.");
    }
  }

  await db.update(users).set({ role: newRole }).where(eq(users.id, userId));
  revalidatePath("/admin/users");
}

export async function updateUserRate(userId: string, newRate: number) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized or Forbidden: Only Admin can manage users.");
  }

  if (newRate < 0) {
    throw new Error("Rate cannot be negative.");
  }

  await db.update(users).set({ hourlyRate: newRate }).where(eq(users.id, userId));
  revalidatePath("/admin/users");
}

export async function updateUserManager(userId: string, managerId: string | null) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized or Forbidden: Only Admin can manage users.");
  }

  await db.update(users).set({ managerId: managerId }).where(eq(users.id, userId));
  revalidatePath("/admin/users");
}

export async function resetUserPassword(userId: string, newPassword: string) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized or Forbidden: Only Admin can reset passwords.");
  }

  if (newPassword.length < 8) {
    throw new Error("Password must be at least 8 characters long.");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await db.update(users).set({ password: hashedPassword }).where(eq(users.id, userId));
  revalidatePath("/admin/users");
}

export async function resetOwnPassword(currentPassword: string, newPassword: string) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  if (newPassword.length < 8) {
    throw new Error("New password must be at least 8 characters long.");
  }

  const userRecord = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });

  if (!userRecord) {
    throw new Error("User not found.");
  }

  const isPasswordValid = await bcrypt.compare(currentPassword, userRecord.password);
  if (!isPasswordValid) {
    throw new Error("Current password is incorrect.");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await db.update(users).set({ password: hashedPassword }).where(eq(users.id, session.user.id));
}

interface UpdateUserProfileData {
  name?: string;
  address?: string;
  phone?: string;
  profilePictureUrl?: string;
}

export async function updateUserProfile(userIdToUpdate: string, data: UpdateUserProfileData) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // A user can only update their own profile, unless they are an ADMIN
  if (session.user.id !== userIdToUpdate && session.user.role !== "ADMIN") {
    throw new Error("Forbidden: You can only update your own profile.");
  }
  
  await db.update(users)
    .set({
      name: data.name,
      address: data.address,
      phone: data.phone,
      profilePictureUrl: data.profilePictureUrl,
    })
    .where(eq(users.id, userIdToUpdate)); // Use userIdToUpdate here

  revalidatePath(`/profile`); // Revalidate the user's own profile page
  revalidatePath(`/admin/users/${userIdToUpdate}/profile`); // Revalidate admin view of user's profile
  revalidatePath("/"); // Revalidate home page if user info is displayed there
}

export async function addUserManually(data: any) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized or Forbidden: Only Admin can add users manually.");
  }

  if (!data.email || !data.name || !data.password) {
    throw new Error("Missing required fields for new user.");
  }

  if (data.password.length < 8) {
    throw new Error("Password must be at least 8 characters long.");
  }

  // Check if email already exists
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, data.email),
  });

  if (existingUser) {
    throw new Error("A user with this email already exists.");
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const [newUser] = await db.insert(users).values({
    name: data.name,
    email: data.email,
    password: hashedPassword,
    role: data.role || "EMPLOYEE",
    emailVerified: new Date(), // Auto-verify manually added users
  } as InsertUser).returning();

  const token = await generatePasswordResetToken(newUser.id);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nreuv-invoicing.vercel.app';
  const passwordLink = `${appUrl}/auth/set-password?token=${token}`;
  console.log('Generated Password Link for addUserManually:', passwordLink);

  // Send the welcome email
  await sendWelcomeEmail(data.email, data.name, passwordLink);

  revalidatePath("/admin/users");
  return newUser;
}

export async function createCategoryBundle(name: string) {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "PAYROLL_MANAGER")) {
    throw new Error("Unauthorized or Forbidden: Only Admin or Payroll Manager can manage category bundles.");
  }
  if (!name.trim()) {
    throw new Error("Category bundle name cannot be empty.");
  }
  await db.insert(categoryBundles).values({ name: name.trim() });
  revalidatePath("/admin/settings");
}

export async function updateCategoryBundle(id: string, name: string) {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "PAYROLL_MANAGER")) {
    throw new Error("Unauthorized or Forbidden: Only Admin or Payroll Manager can manage category bundles.");
  }
  if (!name.trim()) {
    throw new Error("Category bundle name cannot be empty.");
  }
  await db.update(categoryBundles).set({ name: name.trim() }).where(eq(categoryBundles.id, id));
  revalidatePath("/admin/settings");
}

export async function deleteCategoryBundle(id: string) {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "PAYROLL_MANAGER")) {
    throw new Error("Unauthorized or Forbidden: Only Admin or Payroll Manager can manage category bundles.");
  }
  await db.delete(categoryBundles).where(eq(categoryBundles.id, id));
  revalidatePath("/admin/settings");
}

export async function assignCategoryToBundle(bundleId: string, categoryId: string) {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "PAYROLL_MANAGER")) {
    throw new Error("Unauthorized or Forbidden: Only Admin or Payroll Manager can manage category bundles.");
  }
  await db.insert(categoryBundleCategories).values({ bundleId, categoryId });
  revalidatePath("/admin/settings");
}

export async function unassignCategoryFromBundle(bundleId: string, categoryId: string) {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "PAYROLL_MANAGER")) {
    throw new Error("Unauthorized or Forbidden: Only Admin or Payroll Manager can manage category bundles.");
  }
  await db.delete(categoryBundleCategories).where(
    and(
      eq(categoryBundleCategories.bundleId, bundleId),
      eq(categoryBundleCategories.categoryId, categoryId)
    )
  );
  revalidatePath("/admin/settings");
}

export async function assignBundleToUser(userId: string, bundleId: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized or Forbidden: Only Admin can manage user category bundles.");
  }
  // Check if user already has this bundle
  const existing = await db.query.userCategoryBundles.findFirst({
    where: and(eq(userCategoryBundles.userId, userId), eq(userCategoryBundles.bundleId, bundleId)),
  });
  if (existing) {
    throw new Error("User already has this bundle assigned.");
  }
  await db.insert(userCategoryBundles).values({ userId, bundleId });
  revalidatePath("/admin/users"); // Revalidate user management page
}

export async function unassignBundleFromUser(userId: string, bundleId: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized or Forbidden: Only Admin can manage user category bundles.");
  }
  await db.delete(userCategoryBundles).where(
    and(
      eq(userCategoryBundles.userId, userId),
      eq(userCategoryBundles.bundleId, bundleId)
    )
  );
  revalidatePath("/admin/users"); // Revalidate user management page
}

// ─── Onboarding checklist ───────────────────────────────────────────────
export async function toggleOnboardingTask(taskId: string, completed: boolean) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  const userId = session.user.id;

  // Verify the task exists (cheap guard against arbitrary IDs).
  const [task] = await db
    .select({ id: onboardingTasks.id })
    .from(onboardingTasks)
    .where(eq(onboardingTasks.id, taskId))
    .limit(1);
  if (!task) {
    throw new Error("Task not found");
  }

  if (completed) {
    // Idempotent insert — ignore if already marked.
    const existing = await db
      .select({ id: userOnboardingProgress.id })
      .from(userOnboardingProgress)
      .where(
        and(
          eq(userOnboardingProgress.userId, userId),
          eq(userOnboardingProgress.taskId, taskId),
        ),
      )
      .limit(1);
    if (existing.length === 0) {
      await db.insert(userOnboardingProgress).values({
        userId,
        taskId,
        completedAt: new Date(),
      });
    }
  } else {
    await db
      .delete(userOnboardingProgress)
      .where(
        and(
          eq(userOnboardingProgress.userId, userId),
          eq(userOnboardingProgress.taskId, taskId),
        ),
      );
  }

  revalidatePath("/onboarding");
  revalidatePath("/");
}
