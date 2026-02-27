"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { invoices, invoiceItems, paymentSchedules, invoiceDeadlineSettings, invoiceRecurrenceEnum, notifications } from "@/db/schema";
import { and, eq, desc, asc, gte, lte, inArray, notInArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import InvoicePdfDocument from "@/lib/pdf-generator";
import { renderToBuffer } from "@react-pdf/renderer";
import { addDays, format } from "date-fns";

// ... (existing interfaces for NewInvoiceItem, NewInvoiceData, UpdateInvoiceItem, UpdateInvoiceData)

// New interfaces for deadline and payment schedule settings
interface CreateOrUpdateInvoiceDeadlineSettingData {
  id?: string; // Optional for creation
  recurrence: typeof invoiceRecurrenceEnum.enumValues[number];
  customIntervalDays?: number;
}

interface CreateOrUpdatePaymentScheduleData {
  id?: string; // Optional for creation
  name: string;
  daysDue: number;
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
      })
      .where(eq(invoiceDeadlineSettings.id, data.id));
  } else {
    // Create new setting
    await db.insert(invoiceDeadlineSettings).values({
      recurrence: data.recurrence,
      customIntervalDays: data.customIntervalDays || null,
    });
  }

  revalidatePath("/admin/settings"); // Revalidate a hypothetical admin settings page
  revalidatePath("/"); // Revalidate home page if affected
}

export async function createOrUpdatePaymentSchedule(data: CreateOrUpdatePaymentScheduleData) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized or Forbidden: Only Admin can manage payment schedules.");
  }

  if (!data.name || data.daysDue === undefined || data.daysDue < 0) {
    throw new Error("Missing required payment schedule data (name, daysDue).");
  }

  if (data.id) {
    // Update existing schedule
    await db
      .update(paymentSchedules)
      .set({
        name: data.name,
        daysDue: data.daysDue,
      })
      .where(eq(paymentSchedules.id, data.id));
  } else {
    // Create new schedule
    await db.insert(paymentSchedules).values({
      name: data.name,
      daysDue: data.daysDue,
    });
  }

  revalidatePath("/admin/settings"); // Revalidate a hypothetical admin settings page
  revalidatePath("/"); // Revalidate home page if affected
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

interface NewInvoiceItem {
  description: string;
  hours: number;
  rate: number;
  categoryId?: string;
}

interface NewInvoiceData {
  invoiceDate: Date;
  paymentScheduleId: string;
  items: NewInvoiceItem[];
}

interface UpdateInvoiceItem extends NewInvoiceItem {
  id?: string; // id is optional for new items being added during an update
}

interface UpdateInvoiceData {
  id: string; // Invoice ID is required for updates
  invoiceDate: Date;
  paymentScheduleId: string;
  items: UpdateInvoiceItem[];
}

export async function createInvoice(invoiceData: NewInvoiceData) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Basic validation (can be enhanced with a library like Zod)
  if (!invoiceData.invoiceDate || !invoiceData.paymentScheduleId || !invoiceData.items.length) {
    throw new Error("Missing required invoice data.");
  }

  const userId = session.user.id;

  // Fetch payment schedule to calculate due date
  const paymentSchedule = await db.query.paymentSchedules.findFirst({
    where: eq(paymentSchedules.id, invoiceData.paymentScheduleId),
  });

  if (!paymentSchedule) {
    throw new Error("Payment schedule not found.");
  }

  const dueDate = addDays(invoiceData.invoiceDate, paymentSchedule.daysDue);

  let totalHours = 0;
  let totalCost = 0;

  for (const item of invoiceData.items) {
    if (item.hours <= 0 || item.rate <= 0) {
      throw new Error("Invoice item hours and rate must be positive numbers.");
    }
    totalHours += item.hours;
    totalCost += item.hours * item.rate;
  }

  const [newInvoice] = await db.transaction(async (tx) => {
    const [invoice] = await tx
      .insert(invoices)
      .values({
        userId: userId,
        invoiceDate: invoiceData.invoiceDate,
        dueDate: dueDate,
        paymentScheduleId: invoiceData.paymentScheduleId,
        totalHours: totalHours,
        totalCost: totalCost,
      })
      .returning();

    if (!invoice) {
      tx.rollback();
      throw new Error("Failed to create invoice.");
    }

    const itemsToInsert = invoiceData.items.map((item) => ({
      ...item,
      invoiceId: invoice.id,
    }));

    await tx.insert(invoiceItems).values(itemsToInsert);

    return [invoice];
  });

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
  if (!invoiceData.id || !invoiceData.invoiceDate || !invoiceData.paymentScheduleId || !invoiceData.items.length) {
    throw new Error("Missing required invoice data for update.");
  }

  const userId = session.user.id;

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

  // Fetch payment schedule to calculate due date if it changed
  const paymentSchedule = await db.query.paymentSchedules.findFirst({
    where: eq(paymentSchedules.id, invoiceData.paymentScheduleId),
  });

  if (!paymentSchedule) {
    throw new Error("Payment schedule not found.");
  }

  const newDueDate = addDays(invoiceData.invoiceDate, paymentSchedule.daysDue);

  let newTotalHours = 0;
  let newTotalCost = 0;

  for (const item of invoiceData.items) {
    if (item.hours <= 0 || item.rate <= 0) {
      throw new Error("Invoice item hours and rate must be positive numbers.");
    }
    newTotalHours += item.hours;
    newTotalCost += item.hours * item.rate;
  }

  await db.transaction(async (tx) => {
    // Update invoice details
    await tx
      .update(invoices)
      .set({
        invoiceDate: invoiceData.invoiceDate,
        dueDate: newDueDate,
        paymentScheduleId: invoiceData.paymentScheduleId,
        totalHours: newTotalHours,
        totalCost: newTotalCost,
        // Status remains DRAFT unless explicitly changed by updateInvoiceStatus
      })
      .where(eq(invoices.id, invoiceData.id));

    const existingItemIds = existingInvoice.items.map((item) => item.id);
    const updatedItemIds = invoiceData.items.filter((item) => item.id).map((item) => item.id!);

    // Delete items that are no longer present
    if (existingItemIds.length > 0 && updatedItemIds.length > 0) {
      await tx
        .delete(invoiceItems)
        .where(
          and(
            eq(invoiceItems.invoiceId, invoiceData.id),
            notInArray(invoiceItems.id, updatedItemIds)
          )
        );
    } else if (existingItemIds.length > 0 && updatedItemIds.length === 0) {
      // If all items are removed
      await tx.delete(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceData.id));
    }


    for (const item of invoiceData.items) {
      if (item.id) {
        // Update existing item
        await tx
          .update(invoiceItems)
          .set({
            description: item.description,
            hours: item.hours,
            rate: item.rate,
            categoryId: item.categoryId || null,
          })
          .where(and(eq(invoiceItems.id, item.id), eq(invoiceItems.invoiceId, invoiceData.id)));
      } else {
        // Insert new item
        await tx.insert(invoiceItems).values({
          invoiceId: invoiceData.id,
          description: item.description,
          hours: item.hours,
          rate: item.rate,
          categoryId: item.categoryId || null,
        });
      }
    }
  });

  revalidatePath(`/invoices/${invoiceData.id}`); // Revalidate the specific invoice page
  revalidatePath("/invoices"); // Revalidate the invoices list page
  revalidatePath("/"); // Revalidate the home page
}

export async function updateInvoiceStatus(invoiceId: string, newStatus: "SENT" | "APPROVED") {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const { role } = session.user;

  if (role !== "ADMIN" && role !== "PAYROLL_MANAGER") {
    throw new Error("Forbidden: Only Admin or Payroll Manager can update invoice status.");
  }


  const invoiceRecord = await db.query.invoices.findFirst({
    where: eq(invoices.id, invoiceId),
  });

  if (!invoiceRecord) {
    throw new Error("Invoice not found.");
  }

  // Define allowed status transitions
  const allowedTransitions: Record<string, string[]> = {
    DRAFT: ["SENT"],
    SENT: ["APPROVED"],
    APPROVED: [], // Once approved, it's permanently locked
  };

  if (!allowedTransitions[invoiceRecord.status].includes(newStatus)) {
    throw new Error(`Invalid status transition from ${invoiceRecord.status} to ${newStatus}`);
  }

  let updateData: any = { status: newStatus };
  if (newStatus === "APPROVED") {
    updateData.approvedDate = new Date();
  } else if (newStatus === "SENT") {
    updateData.submittedDate = new Date();
  }

  await db.update(invoices).set(updateData).where(eq(invoices.id, invoiceId));

  revalidatePath("/"); // Revalidate the home page to reflect changes
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
      items: true,
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

  return pdfBuffer;
}

export async function generateInvoicesCsv(searchParams?: {
  sortField?: string;
  sortOrder?: "asc" | "desc";
  filterUser?: string;
  filterStatus?: "DRAFT" | "SENT" | "APPROVED" | "";
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
    format(new Date(invoice.invoiceDate), "yyyy-MM-dd"),
    format(new Date(invoice.dueDate), "yyyy-MM-dd"),
    invoice.status,
    invoice.totalHours,
    invoice.totalCost.toFixed(2),
    invoice.submittedDate ? format(new Date(invoice.submittedDate), "yyyy-MM-dd") : "",
    invoice.approvedDate ? format(new Date(invoice.approvedDate), "yyyy-MM-dd") : "",
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  return csvContent;
}
