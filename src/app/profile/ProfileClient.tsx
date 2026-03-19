"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateUserProfile } from '@/app/actions';
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

interface ProfileClientProps {
  user: UserProfile;
}

export default function ProfileClient({ user }: ProfileClientProps) {
  const router = useRouter();
  const [name, setName] = useState(user.name || '');
  const [address, setAddress] = useState(user.address || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [profilePictureUrl, setProfilePictureUrl] = useState(user.profilePictureUrl || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setError(null);
    setSuccess(null);

    try {
      await updateUserProfile(user.id, { name, address, phone, profilePictureUrl });
      setSuccess("Profile updated successfully!");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to update profile.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-nreuv-black mb-6">My Profile</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg text-sm font-medium">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
          {success}
        </div>
      )}

      <div className="bg-white shadow-sm border border-slate-100 rounded-xl p-8 mb-8">
        <form onSubmit={handleSubmit} className="space-y-6">
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
              disabled={isUpdating}
              className="bg-nreuv-primary hover:opacity-90 text-white font-bold py-2.5 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-nreuv-accent transition-colors disabled:opacity-50"
            >
              {isUpdating ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </form>
      </div>

      {/* Documents Section */}
      <div className="bg-white shadow-sm border border-slate-100 rounded-xl p-8">
        <h2 className="text-xl font-semibold text-nreuv-black mb-4">My Documents</h2>
        {user.documents.length === 0 ? (
          <p className="text-slate-500">No documents uploaded for your profile.</p>
        ) : (
          <div className="space-y-4">
            {user.documents.map((doc) => (
              <div key={doc.id} className="flex justify-between items-center p-4 border border-slate-200 rounded-lg bg-slate-50">
                <div>
                  <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-nreuv-primary hover:underline font-medium">
                    {doc.fileName}
                  </a>
                  <p className="text-xs text-slate-500 mt-1">Uploaded by {doc.uploadedBy?.name || doc.uploadedBy?.email || 'Admin'} on {new Date(doc.createdAt).toLocaleDateString()}</p>
                </div>
                {/* No delete button for users on their own profile */}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
