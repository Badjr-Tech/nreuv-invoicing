import {
  pgTable,
  text,
  timestamp,
  boolean,
  uuid,
  pgEnum,
  real,
  integer,
  serial,
} from "drizzle-orm/pg-core";
import { relations, type InferInsertModel } from "drizzle-orm";

export const roleEnum = pgEnum("role", ["USER", "ADMIN", "PAYROLL_MANAGER", "EMPLOYEE"]);
export const invoiceRecurrenceEnum = pgEnum("invoice_recurrence", [
  "WEEKLY",
  "BIWEEKLY",
  "MONTHLY",
  "CUSTOM",
]);
export const invoiceStatusEnum = pgEnum("invoice_status", [
  "DRAFT",
  "SENT",
  "PENDING_MANAGER",
  "PENDING_ADMIN",
  "APPROVED",
]);

export const accountRequestStatusEnum = pgEnum("account_request_status", [
  "PENDING",
  "APPROVED",
  "DENIED",
]);

export const users = pgTable("user", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(), // Made name not null
  role: roleEnum("role").default("USER").notNull(),
  emailVerified: timestamp("email_verified", { mode: "date" }), // Added emailVerified
  hourlyRate: real("hourly_rate").default(0).notNull(), // Added hourlyRate
  managerId: uuid("manager_id").references((): any => users.id),
});

export type InsertUser = InferInsertModel<typeof users>;

export const invoiceDeadlineSettings = pgTable("invoice_deadline_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  recurrence: invoiceRecurrenceEnum("recurrence").notNull(),
  customIntervalDays: integer("custom_interval_days"),
  startDate: timestamp("start_date", { mode: "date" }), // New field for start date of the schedule
  billingPeriodLengthDays: integer("billing_period_length_days"),
  billingPeriodEndOffsetDays: integer("billing_period_end_offset_days"), // Days before the invoice date that the billing period ends
});

export const categories = pgTable("category", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
});

export const invoices = pgTable("invoice", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceNumber: serial("invoice_number").notNull(),
  invoiceDate: timestamp("invoice_date", { mode: "date" }).notNull(),
  dueDate: timestamp("due_date", { mode: "date" }).notNull(), // dueDate will be fixed to InvoiceDate + 15 days
  status: invoiceStatusEnum("status").default("DRAFT").notNull(),
  totalHours: real("total_hours").default(0).notNull(),
  totalCost: real("total_cost").default(0).notNull(),
  submittedDate: timestamp("submitted_date", { mode: "date" }),
  approvedDate: timestamp("approved_date", { mode: "date" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
});

export const invoiceItems = pgTable("invoice_item", {
  id: uuid("id").primaryKey().defaultRandom(),
  date: timestamp("date", { mode: "date" }).notNull().defaultNow(),
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

export const accountRequests = pgTable("account_request", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password"), // Made nullable
  message: text("message"),
  status: accountRequestStatusEnum("status").default("PENDING").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  processedAt: timestamp("processed_at", { mode: "date" }), // New column to store processing time
});



// Update existing relations
export const usersRelations = relations(users, ({ many }) => ({
  invoices: many(invoices),
  notifications: many(notifications),
  employees: many(users, { relationName: "manager" }),
  categoryBundles: many(userCategoryBundles),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  invoiceItems: many(invoiceItems),
  categoryBundles: many(categoryBundleCategories),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  user: one(users, {
    fields: [invoices.userId],
    references: [users.id],
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

export const categoryBundles = pgTable("category_bundle", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
});

export const categoryBundleCategories = pgTable("category_bundle_category", {
  id: uuid("id").primaryKey().defaultRandom(),
  bundleId: uuid("bundle_id")
    .notNull()
    .references(() => categoryBundles.id, { onDelete: "cascade" }),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "cascade" }),
});

export const userCategoryBundles = pgTable("user_category_bundle", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  bundleId: uuid("bundle_id")
    .notNull()
    .references(() => categoryBundles.id, { onDelete: "cascade" }),
});

// Relations for new tables
export const categoryBundlesRelations = relations(categoryBundles, ({ many }) => ({
  categories: many(categoryBundleCategories),
  users: many(userCategoryBundles),
}));

export const categoryBundleCategoriesRelations = relations(categoryBundleCategories, ({ one }) => ({
  bundle: one(categoryBundles, {
    fields: [categoryBundleCategories.bundleId],
    references: [categoryBundles.id],
  }),
  category: one(categories, {
    fields: [categoryBundleCategories.categoryId],
    references: [categories.id],
  }),
}));

export const userCategoryBundlesRelations = relations(userCategoryBundles, ({ one }) => ({
  user: one(users, {
    fields: [userCategoryBundles.userId],
    references: [users.id],
  }),
  bundle: one(categoryBundles, {
    fields: [userCategoryBundles.bundleId],
    references: [categoryBundles.id],
  }),
}));


