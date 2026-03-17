import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  pgEnum,
  real,
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
  // New fields for user profile
  address: varchar("address", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  profilePictureUrl: varchar("profile_picture_url", { length: 255 }),
});

export type InsertUser = InferInsertModel<typeof users>;

export const invoiceDeadlineSettings = pgTable("invoice_deadline_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  recurrence: invoiceRecurrenceEnum("recurrence").notNull(),
  customIntervalDays: integer("custom_interval_days"),
  startDate: timestamp("start_date", { mode: "date" }), // New field for start date of the schedule
  billingPeriodLengthDays: integer("billing_period_length_days"), // This is now Coverage Period Length
  // billingPeriodEndOffsetDays: integer("billing_period_end_offset_days"), // Removed
  submissionOffsetDays: integer("submission_offset_days"), // Days before Payment Date that invoice must be submitted
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

export const documents = pgTable("document", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileUrl: text("file_url").notNull(), // Stored URL from Vercel Blob
  uploadedById: uuid("uploaded_by_id").references(() => users.id), // Admin who uploaded it
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

// Update existing relations
export const passwordResetTokens = pgTable("password_reset_token", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expiresAt", { mode: "date" }).notNull(),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  invoices: many(invoices),
  notifications: many(notifications),
  employees: many(users, { relationName: "manager" }),
  categoryBundles: many(userCategoryBundles),
  documents: many(documents), // Add documents relation
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

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, {
    fields: [passwordResetTokens.userId],
    references: [users.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  user: one(users, {
    fields: [documents.userId],
    references: [users.id],
  }),
  uploadedBy: one(users, {
    fields: [documents.uploadedById],
    references: [users.id],
    relationName: "uploaded_documents", // To differentiate from the user relation
  }),
}));


