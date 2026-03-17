"use server";

import { put, del } from '@vercel/blob';
import { db } from "@/db";
import { documents } from "@/db/schema";
import { auth } from '@/auth';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function uploadUserDocument(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized: Only Admin can upload documents.");
  }

  const userId = formData.get('userId') as string;
  const file = formData.get('file') as File;

  if (!userId || !file) {
    throw new Error("Missing userId or file for upload.");
  }

  // Sanitize filename for storage
  const fileName = file.name.normalize("NFC").replace(/[^a-zA-Z0-9.\-_]/g, "");

  const blob = await put(fileName, file, {
    access: 'public', // Documents are public for now, can be changed to 'private' with signed URLs later
    addRandomSuffix: true,
  });

  // Store metadata in your database
  await db.insert(documents).values({
    userId: userId,
    fileName: file.name, // Keep original filename for display
    fileUrl: blob.url,
    uploadedById: session.user.id,
    createdAt: new Date(),
  });

  revalidatePath(`/admin/users/${userId}/profile`);
  return { success: true, url: blob.url, fileName: file.name };
}

export async function deleteUserDocument(documentId: string, blobUrl: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized: Only Admin can delete documents.");
  }

  // Delete from Vercel Blob storage
  await del(blobUrl);

  // Delete metadata from your database
  await db.delete(documents).where(eq(documents.id, documentId));

  // Revalidate the page
  revalidatePath(`/admin/users/${session.user.id}/profile`);
  return { success: true };
}
