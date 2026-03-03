"use client";

import React, { useState } from "react";
import { approveAccountRequest, denyAccountRequest } from "@/app/actions"; // Actions to be created
import { useRouter } from "next/navigation";

interface AccountRequest {
  id: string;
  name: string;
  email: string;
  message: string | null;
  status: "PENDING" | "APPROVED" | "DENIED";
  createdAt: Date;
  password?: string | null; // Passwords are not always returned but exist in schema
}

interface AdminAccountRequestsClientProps {
  initialRequests: AccountRequest[];
}

export default function AdminAccountRequestsClient({ initialRequests }: AdminAccountRequestsClientProps) {
  const [requests, setRequests] = useState(initialRequests);
  const router = useRouter();

  const handleApprove = async (requestId: string) => {
    try {
      // In a real app, you might ask for a temporary password or send an invitation email
      await approveAccountRequest(requestId);
      setRequests(requests.filter(req => req.id !== requestId));
      alert("Account request approved and user created!");
      router.refresh(); // Refresh data from server
    } catch (error: any) {
      alert(`Error approving request: ${error.message}`);
    }
  };

  const handleDeny = async (requestId: string) => {
    try {
      await denyAccountRequest(requestId);
      setRequests(requests.filter(req => req.id !== requestId));
      alert("Account request denied!");
      router.refresh(); // Refresh data from server
    } catch (error: any) {
      alert(`Error denying request: ${error.message}`);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-black mb-4">Pending Account Requests</h1>

      {requests.length === 0 ? (
        <p className="text-gray-600">No pending account requests.</p>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full leading-normal">
            <thead>
              <tr>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Message
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Requested On
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id}>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <p className="text-gray-900 whitespace-no-wrap">{request.name}</p>
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <p className="text-gray-900 whitespace-no-wrap">{request.email}</p>
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <p className="text-gray-900 whitespace-no-wrap">{request.message}</p>
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <p className="text-gray-900 whitespace-no-wrap">{new Date(request.createdAt).toLocaleDateString()}</p>
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <button
                      onClick={() => handleApprove(request.id)}
                      className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded text-xs mr-2"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleDeny(request.id)}
                      className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-xs"
                    >
                      Deny
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}