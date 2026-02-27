"use client";

import React from "react";
import Link from "next/link";

interface Employee {
  id: string;
  name: string | null;
  email: string;
  unreadNotifications: number;
}

interface EmployeeSidebarProps {
  users: Employee[]; 
}

export default function EmployeeSidebar({ users }: EmployeeSidebarProps) {
  return (
    <div className="w-64 bg-gray-50 p-4 shadow-md rounded-lg">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Employees</h2>
      <ul>
        {users.map((user) => (
          <li key={user.id} className="mb-2">
            <Link href={`?filterUser=${user.id}`} className="flex justify-between items-center text-blue-600 hover:underline">
              {user.name || user.email}
              {user.unreadNotifications > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  {user.unreadNotifications}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

