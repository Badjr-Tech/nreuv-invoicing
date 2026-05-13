"use server";

import { put, del } from "@vercel/blob";
import { db } from "@/db";
import { onboardingCategories, onboardingTasks } from "@/db/schema";
import { auth } from "@/auth";
import { asc, eq, gt, lt, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Forbidden: Admin only.");
  }
  return session;
}

function bump() {
  revalidatePath("/admin/onboarding");
  revalidatePath("/admin/onboarding/manage");
  revalidatePath("/onboarding");
  revalidatePath("/");
}

// ─── Categories ────────────────────────────────────────────────────────
export async function createOnboardingCategory(name: string) {
  await requireAdmin();
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Category name is required.");

  const existing = await db
    .select({ value: onboardingCategories.sortOrder })
    .from(onboardingCategories)
    .orderBy(desc(onboardingCategories.sortOrder))
    .limit(1);
  const nextOrder = (existing[0]?.value ?? -1) + 1;

  await db
    .insert(onboardingCategories)
    .values({ name: trimmed, sortOrder: nextOrder });
  bump();
}

export async function renameOnboardingCategory(id: string, name: string) {
  await requireAdmin();
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Category name is required.");
  await db.update(onboardingCategories).set({ name: trimmed }).where(eq(onboardingCategories.id, id));
  bump();
}

export async function deleteOnboardingCategory(id: string) {
  await requireAdmin();
  // Cascade-deletes tasks via FK on delete cascade. Blob files for those
  // tasks' attachments will be orphaned — clean them up first.
  const tasks = await db
    .select({ attachmentUrl: onboardingTasks.attachmentUrl })
    .from(onboardingTasks)
    .where(eq(onboardingTasks.categoryId, id));
  for (const t of tasks) {
    if (t.attachmentUrl) {
      try {
        await del(t.attachmentUrl);
      } catch (err) {
        console.warn("Failed to delete blob during category delete:", err);
      }
    }
  }
  await db.delete(onboardingCategories).where(eq(onboardingCategories.id, id));
  bump();
}

export async function moveOnboardingCategory(id: string, direction: "up" | "down") {
  await requireAdmin();
  const [current] = await db
    .select()
    .from(onboardingCategories)
    .where(eq(onboardingCategories.id, id))
    .limit(1);
  if (!current) throw new Error("Category not found.");

  const [neighbor] = await db
    .select()
    .from(onboardingCategories)
    .where(
      direction === "up"
        ? lt(onboardingCategories.sortOrder, current.sortOrder)
        : gt(onboardingCategories.sortOrder, current.sortOrder),
    )
    .orderBy(direction === "up" ? desc(onboardingCategories.sortOrder) : asc(onboardingCategories.sortOrder))
    .limit(1);
  if (!neighbor) return; // already at edge

  await db.update(onboardingCategories).set({ sortOrder: neighbor.sortOrder }).where(eq(onboardingCategories.id, current.id));
  await db.update(onboardingCategories).set({ sortOrder: current.sortOrder }).where(eq(onboardingCategories.id, neighbor.id));
  bump();
}

// ─── Tasks ─────────────────────────────────────────────────────────────
interface TaskInput {
  categoryId: string;
  title: string;
  description?: string | null;
  groupName?: string | null;
  externalUrl?: string | null;
}

export async function createOnboardingTask(input: TaskInput) {
  await requireAdmin();
  if (!input.title.trim()) throw new Error("Task title is required.");
  if (!input.categoryId) throw new Error("Category is required.");

  const existing = await db
    .select({ sortOrder: onboardingTasks.sortOrder })
    .from(onboardingTasks)
    .where(eq(onboardingTasks.categoryId, input.categoryId))
    .orderBy(desc(onboardingTasks.sortOrder))
    .limit(1);
  const nextOrder = (existing[0]?.sortOrder ?? -1) + 1;

  await db.insert(onboardingTasks).values({
    categoryId: input.categoryId,
    title: input.title.trim(),
    description: input.description?.trim() || null,
    groupName: input.groupName?.trim() || null,
    externalUrl: input.externalUrl?.trim() || null,
    sortOrder: nextOrder,
  });
  bump();
}

export async function updateOnboardingTask(
  id: string,
  input: Partial<TaskInput>,
) {
  await requireAdmin();
  const patch: Record<string, unknown> = {};
  if (input.title !== undefined) {
    const t = input.title.trim();
    if (!t) throw new Error("Task title cannot be empty.");
    patch.title = t;
  }
  if (input.description !== undefined) patch.description = input.description?.trim() || null;
  if (input.groupName !== undefined) patch.groupName = input.groupName?.trim() || null;
  if (input.externalUrl !== undefined) patch.externalUrl = input.externalUrl?.trim() || null;
  if (input.categoryId !== undefined) patch.categoryId = input.categoryId;

  if (Object.keys(patch).length === 0) return;
  await db.update(onboardingTasks).set(patch).where(eq(onboardingTasks.id, id));
  bump();
}

export async function deleteOnboardingTask(id: string) {
  await requireAdmin();
  const [task] = await db
    .select({ attachmentUrl: onboardingTasks.attachmentUrl })
    .from(onboardingTasks)
    .where(eq(onboardingTasks.id, id))
    .limit(1);
  if (task?.attachmentUrl) {
    try {
      await del(task.attachmentUrl);
    } catch (err) {
      console.warn("Failed to delete blob during task delete:", err);
    }
  }
  await db.delete(onboardingTasks).where(eq(onboardingTasks.id, id));
  bump();
}

export async function moveOnboardingTask(id: string, direction: "up" | "down") {
  await requireAdmin();
  const [current] = await db
    .select()
    .from(onboardingTasks)
    .where(eq(onboardingTasks.id, id))
    .limit(1);
  if (!current) throw new Error("Task not found.");

  const [neighbor] = await db
    .select()
    .from(onboardingTasks)
    .where(
      direction === "up"
        ? lt(onboardingTasks.sortOrder, current.sortOrder)
        : gt(onboardingTasks.sortOrder, current.sortOrder),
    )
    .orderBy(direction === "up" ? desc(onboardingTasks.sortOrder) : asc(onboardingTasks.sortOrder))
    .limit(1);
  if (!neighbor) return;
  // Only swap within the same category — neighbor may be in another category.
  if (neighbor.categoryId !== current.categoryId) return;

  await db.update(onboardingTasks).set({ sortOrder: neighbor.sortOrder }).where(eq(onboardingTasks.id, current.id));
  await db.update(onboardingTasks).set({ sortOrder: current.sortOrder }).where(eq(onboardingTasks.id, neighbor.id));
  bump();
}

// ─── Attachments ───────────────────────────────────────────────────────
const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024; // 25 MB

export async function uploadOnboardingTaskAttachment(formData: FormData) {
  await requireAdmin();
  const taskId = formData.get("taskId") as string;
  const file = formData.get("file") as File;
  if (!taskId || !file) throw new Error("Missing task or file.");
  if (file.size > MAX_ATTACHMENT_BYTES) {
    throw new Error("File is too large (25 MB limit).");
  }

  const [existing] = await db
    .select({ attachmentUrl: onboardingTasks.attachmentUrl })
    .from(onboardingTasks)
    .where(eq(onboardingTasks.id, taskId))
    .limit(1);
  if (!existing) throw new Error("Task not found.");

  const safeName = file.name.normalize("NFC").replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const blob = await put(`onboarding/${taskId}/${safeName}`, file, {
    access: "public",
    addRandomSuffix: true,
  });

  // Replace existing attachment if any
  if (existing.attachmentUrl) {
    try {
      await del(existing.attachmentUrl);
    } catch (err) {
      console.warn("Failed to delete prior attachment:", err);
    }
  }

  await db
    .update(onboardingTasks)
    .set({ attachmentUrl: blob.url })
    .where(eq(onboardingTasks.id, taskId));
  bump();
  return { success: true, url: blob.url };
}

export async function removeOnboardingTaskAttachment(taskId: string) {
  await requireAdmin();
  const [task] = await db
    .select({ attachmentUrl: onboardingTasks.attachmentUrl })
    .from(onboardingTasks)
    .where(eq(onboardingTasks.id, taskId))
    .limit(1);
  if (!task?.attachmentUrl) return;

  try {
    await del(task.attachmentUrl);
  } catch (err) {
    console.warn("Failed to delete attachment blob:", err);
  }
  await db
    .update(onboardingTasks)
    .set({ attachmentUrl: null })
    .where(eq(onboardingTasks.id, taskId));
  bump();
}
