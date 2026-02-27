import {
  pgTable,
  text,
  timestamp,
  boolean,
  uuid,
  pgEnum,
  real,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const roleEnum = pgEnum("role", ["USER", "ADMIN", "PAYROLL_MANAGER"]);
export const invoiceRecurrenceEnum = pgEnum("invoice_recurrence", [
  "WEEKLY",
  "BIWEEKLY",
  "MONTHLY",
  "CUSTOM",
]);
export const invoiceStatusEnum = pgEnum("invoice_status", [
  "DRAFT",
  "SENT",
  "APPROVED",
]);

export const users = pgTable("user", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  role: roleEnum("role").default("USER").notNull(),
});

export const invoiceDeadlineSettings = pgTable("invoice_deadline_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  recurrence: invoiceRecurrenceEnum("recurrence").notNull(),
  customIntervalDays: integer("custom_interval_days"),
});

export const categories = pgTable("category", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
});

export const paymentSchedules = pgTable("payment_schedule", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  daysDue: integer("days_due").notNull(),
});

export const invoices = pgTable("invoice", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceDate: timestamp("invoice_date", { mode: "date" }).notNull(),
  dueDate: timestamp("due_date", { mode: "date" }).notNull(),
  status: invoiceStatusEnum("status").default("DRAFT").notNull(),
  totalHours: real("total_hours").default(0).notNull(),
  totalCost: real("total_cost").default(0).notNull(),
  submittedDate: timestamp("submitted_date", { mode: "date" }),
  approvedDate: timestamp("approved_date", { mode: "date" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  paymentScheduleId: uuid("payment_schedule_id")
    .notNull()
    .references(() => paymentSchedules.id),
});

export const invoiceItems = pgTable("invoice_item", {
  id: uuid("id").primaryKey().defaultRandom(),
  description: text("description").notNull(),
  hours: real("hours").notNull(),
  rate: real("rate").notNull(),
  invoiceId: uuid("invoice_id")
    .notNull()
    .references(() => invoices.id),
  categoryId: uuid("category_id").references(() => categories.id),
});

export const notifications = pgTable("notification", {
  id: uuid("id").primaryKey().defaultRandom(),
  message: text("message").notNull(),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  invoices: many(invoices),
  notifications: many(notifications),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  invoiceItems: many(invoiceItems),
}));

export const paymentSchedulesRelations = relations(paymentSchedules, ({ many }) => ({
  invoices: many(invoices),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  user: one(users, {
    fields: [invoices.userId],
    references: [users.id],
  }),
  paymentSchedule: one(paymentSchedules, {
    fields: [invoices.paymentScheduleId],
    references: [paymentSchedules.id],
  }),
  items: many(invoiceItems),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
  category: one(categories, {
    fields: [invoiceItems.categoryId],
    references: [categories.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));
