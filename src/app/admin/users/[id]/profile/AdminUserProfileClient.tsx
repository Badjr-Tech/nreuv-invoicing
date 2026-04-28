"use client";

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { updateUserProfile } from '@/app/actions'; // Reusing from contractor profile
import { uploadUserDocument, deleteUserDocument } from '@/app/actions/documents';
import Link from 'next/link';

interface Document {
  id: string;
  fileName: string;
  fileUrl: string;
  createdAt: Date; // Changed from string to Date
  uploadedBy: {
    name: string | null;
    email: string;
  } | null;
}

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  address: string | null;
  phone: string | null;
  profilePictureUrl: string | null;
  documents: Document[];
}

interface AdminUserProfileClientProps {
  user: UserProfile;
  currentAdminId: string;
}

export default function AdminUserProfileClient({ user, currentAdminId }: AdminUserProfileClientProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user.name || '');
  const [address, setAddress] = useState(user.address || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [profilePictureUrl, setProfilePictureUrl] = useState(user.profilePictureUrl || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [documentSuccess, setDocumentSuccess] = useState<string | null>(null);

  // --- Profile Update ---
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileError(null);
    setProfileSuccess(null);

    try {
      await updateUserProfile(user.id, { name, address, phone, profilePictureUrl });
      setProfileSuccess("User profile updated successfully!");
      router.refresh();
    } catch (err: any) {
      setProfileError(err.message || "Failed to update user profile.");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // --- Document Upload ---
  const handleDocumentUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUploadingDocument(true);
    setDocumentError(null);
    setDocumentSuccess(null);

    const formData = new FormData(e.currentTarget);
    const file = formData.get('documentFile') as File;

    if (!file || file.size === 0) {
      setDocumentError("Please select a file to upload.");
      setIsUploadingDocument(false);
      return;
    }
    const allowedTypes = ["application/pdf"];
    const allowedExtensions = [".pdf"];
    const fileExtension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      setDocumentError("Only PDF files are allowed.");
      setIsUploadingDocument(false);
      return;
    }
    if (file.size > 3 * 1024 * 1024) { // 3MB limit
        setDocumentError("File size limit is 3MB.");
        setIsUploadingDocument(false);
        return;
    }

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('userId', user.id);
      uploadFormData.append('file', file);

      await uploadUserDocument(uploadFormData);
      setDocumentSuccess("Document uploaded successfully!");
      if (fileInputRef.current) fileInputRef.current.value = ''; // Clear file input
      router.refresh();
    } catch (err: any) {
      setDocumentError(err.message || "Failed to upload document.");
    } finally {
      setIsUploadingDocument(false);
    }
  };

  // --- Document Delete ---
  const handleDocumentDelete = async (docId: string, blobUrl: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    setDocumentError(null);
    setDocumentSuccess(null);

    try {
      await deleteUserDocument(docId, blobUrl);
      setDocumentSuccess("Document deleted successfully!");
      router.refresh();
    } catch (err: any) {
      setDocumentError(err.message || "Failed to delete document.");
    }
  };


  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-nreuv-black">User Profile: {user.name || user.email}</h1>
        <Link href="/admin/users" className="text-nreuv-primary hover:underline font-medium">
          ← Back to Users
        </Link>
      </div>

      {profileError && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg text-sm font-medium">
          {profileError}
        </div>
      )}
      {profileSuccess && (
        <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
          {profileSuccess}
        </div>
      )}
      {documentError && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg text-sm font-medium">
          {documentError}
        </div>
      )}
      {documentSuccess && (
        <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
          {documentSuccess}
        </div>
      )}

      {/* User Profile Details */}
      <div className="bg-white shadow-sm border border-slate-100 rounded-xl p-8 mb-8">
        <h2 className="text-xl font-semibold text-nreuv-black mb-4">Personal Information</h2>
        <form onSubmit={handleProfileSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col">
              <label htmlFor="name" className="text-sm font-semibold text-slate-700 mb-2">Full Name</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-nreuv-accent outline-none"
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="email" className="text-sm font-semibold text-slate-700 mb-2">Email Address</label>
              <input
                type="email"
                id="email"
                value={user.email}
                readOnly
                className="border border-slate-300 rounded-lg p-2.5 bg-slate-100 text-slate-500 cursor-not-allowed outline-none"
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="address" className="text-sm font-semibold text-slate-700 mb-2">Address</label>
              <input
                type="text"
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-nreuv-accent outline-none"
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="phone" className="text-sm font-semibold text-slate-700 mb-2">Phone Number</label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-nreuv-accent outline-none"
              />
            </div>
            <div className="flex flex-col md:col-span-2">
              <label htmlFor="profilePictureUrl" className="text-sm font-semibold text-slate-700 mb-2">Profile Picture URL</label>
              <input
                type="url"
                id="profilePictureUrl"
                value={profilePictureUrl}
                onChange={(e) => setProfilePictureUrl(e.target.value)}
                className="border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-nreuv-accent outline-none"
                placeholder="e.g., https://example.com/my-avatar.jpg"
              />
            </div>
          </div>
          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={isUpdatingProfile}
              className="bg-nreuv-primary hover:opacity-90 text-white font-bold py-2.5 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-nreuv-accent transition-colors disabled:opacity-50"
            >
              {isUpdatingProfile ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </form>
      </div>

      {/* Documents Upload & List */}
      <div className="bg-white shadow-sm border border-slate-100 rounded-xl p-8">
        <h2 className="text-xl font-semibold text-nreuv-black mb-4">Uploaded Documents</h2>
        
        {/* Upload Form */}
        <form onSubmit={handleDocumentUpload} className="mb-6 pb-6 border-b border-slate-100">
          <input type="hidden" name="userId" value={user.id} />
          <div className="flex flex-col gap-2">
            <label htmlFor="documentFile" className="text-sm font-semibold text-slate-700 mb-1">Upload New Document (PDF, max 3MB)</label>
            <input 
              type="file" 
              id="documentFile" 
              name="documentFile" 
              accept="application/pdf"
              required 
              ref={fileInputRef}
              className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-nreuv-accent/10 file:text-nreuv-primary hover:file:bg-nreuv-accent/20 cursor-pointer"
            />
            <button
              type="submit"
              disabled={isUploadingDocument}
              className="mt-3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50 self-start"
            >
              {isUploadingDocument ? "Uploading..." : "Upload Document"}
            </button>
          </div>
        </form>

        {/* Documents List */}
        {user.documents.length === 0 ? (
          <p className="text-slate-500">No documents uploaded for this user.</p>
        ) : (
          <div className="space-y-4">
            {user.documents.map((doc) => (
              <div key={doc.id} className="flex flex-wrap sm:flex-nowrap justify-between items-center p-4 border border-slate-200 rounded-lg bg-slate-50">
                <div className="flex-grow min-w-0 mb-2 sm:mb-0">
                  <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-nreuv-primary hover:underline font-medium truncate block">
                    {doc.fileName}
                  </a>
                  <p className="text-xs text-slate-500 mt-1 truncate">Uploaded by {doc.uploadedBy?.name || doc.uploadedBy?.email || 'Admin'} on {new Date(doc.createdAt).toLocaleDateString()}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDocumentDelete(doc.id, doc.fileUrl)}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold py-1.5 px-4 rounded-lg text-sm transition-colors disabled:opacity-50 flex-shrink-0"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
