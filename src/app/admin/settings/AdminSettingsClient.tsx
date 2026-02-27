"use client";

import React, { useState } from "react";
import {
  createOrUpdateInvoiceDeadlineSetting,
  createOrUpdatePaymentSchedule,
} from "@/app/actions";
import { invoiceRecurrenceEnum } from "@/db/schema"; // Assuming this enum is accessible client-side

type RecurrenceType = typeof invoiceRecurrenceEnum.enumValues[number];

interface DeadlineSetting {
  id: string;
  recurrence: RecurrenceType;
  customIntervalDays: number | null;
}

interface PaymentSchedule {
  id: string;
  name: string;
  daysDue: number;
}

interface AdminSettingsClientProps {
  initialDeadlineSettings: DeadlineSetting[];
  initialPaymentSchedules: PaymentSchedule[];
}

export default function AdminSettingsClient({
  initialDeadlineSettings,
  initialPaymentSchedules,
}: AdminSettingsClientProps) {
  const [deadlineSettings, setDeadlineSettings] = useState<DeadlineSetting[]>(
    initialDeadlineSettings
  );
  const [paymentSchedules, setPaymentSchedules] = useState<PaymentSchedule[]>(
    initialPaymentSchedules
  );

  // State for new deadline setting form
  const [newRecurrence, setNewRecurrence] = useState<RecurrenceType>("MONTHLY");
  const [newCustomInterval, setNewCustomInterval] = useState<number | undefined>(
    undefined
  );

  // State for new payment schedule form
  const [newScheduleName, setNewScheduleName] = useState<string>("");
  const [newScheduleDaysDue, setNewScheduleDaysDue] = useState<number>(0);

  const handleSaveDeadlineSetting = async () => {
    try {
      await createOrUpdateInvoiceDeadlineSetting({
        recurrence: newRecurrence,
        customIntervalDays: newCustomInterval,
      });
      // Re-fetch or update state
      // For simplicity, let's just alert for now, in a real app you'd re-fetch or update state more robustly
      alert("Deadline setting saved!");
      // Reset form
      setNewRecurrence("MONTHLY");
      setNewCustomInterval(undefined);
    } catch (error: any) {
      alert(`Error saving deadline setting: ${error.message}`);
    }
  };

  const handleSavePaymentSchedule = async () => {
    try {
      await createOrUpdatePaymentSchedule({
        name: newScheduleName,
        daysDue: newScheduleDaysDue,
      });
      // Re-fetch or update state
      alert("Payment schedule saved!");
      // Reset form
      setNewScheduleName("");
      setNewScheduleDaysDue(0);
    } catch (error: any) {
      alert(`Error saving payment schedule: ${error.message}`);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-black mb-4">Admin Settings</h1>

      {/* Invoice Deadline Settings */}
      <div className="bg-white shadow-md rounded-lg p-4 mb-6">
        <h2 className="text-xl font-semibold text-black mb-4">
          Invoice Deadline Settings
        </h2>
        <div className="mb-4">
          {deadlineSettings.map((setting) => (
            <div key={setting.id} className="mb-2 p-2 border rounded">
              Recurrence: {setting.recurrence}{" "}
              {setting.customIntervalDays &&
                `(Every ${setting.customIntervalDays} days)`}
            </div>
          ))}
        </div>
        <h3 className="text-lg font-medium text-black mb-2">
          Add New Deadline Setting
        </h3>
        <div className="flex gap-2 mb-2">
          <select
            className="border p-2 rounded"
            value={newRecurrence}
            onChange={(e) => setNewRecurrence(e.target.value as RecurrenceType)}
          >
            {invoiceRecurrenceEnum.enumValues.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          {newRecurrence === "CUSTOM" && (
            <input
              type="number"
              className="border p-2 rounded"
              placeholder="Custom Days"
              value={newCustomInterval || ""}
              onChange={(e) =>
                setNewCustomInterval(parseInt(e.target.value) || undefined)
              }
            />
          )}
          <button
            onClick={handleSaveDeadlineSetting}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Save Deadline Setting
          </button>
        </div>
      </div>

      {/* Payment Schedules */}
      <div className="bg-white shadow-md rounded-lg p-4">
        <h2 className="text-xl font-semibold text-black mb-4">
          Payment Schedules
        </h2>
        <div className="mb-4">
          {paymentSchedules.map((schedule) => (
            <div key={schedule.id} className="mb-2 p-2 border rounded">
              Name: {schedule.name}, Days Due: {schedule.daysDue}
            </div>
          ))}
        </div>
        <h3 className="text-lg font-medium text-black mb-2">
          Add New Payment Schedule
        </h3>
        <div className="flex gap-2">
          <input
            type="text"
            className="border p-2 rounded"
            placeholder="Schedule Name"
            value={newScheduleName}
            onChange={(e) => setNewScheduleName(e.target.value)}
          />
          <input
            type="number"
            className="border p-2 rounded"
            placeholder="Days Due"
            value={newScheduleDaysDue}
            onChange={(e) => setNewScheduleDaysDue(parseInt(e.target.value) || 0)}
          />
          <button
            onClick={handleSavePaymentSchedule}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Save Payment Schedule
          </button>
        </div>
      </div>
    </div>
  );
}
