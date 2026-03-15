"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateInvoice } from '@/app/actions';
import { PayPeriod } from '@/lib/schedule-utils';



interface Category {
  id: string;
  name: string;
}

interface EditInvoiceClientProps {
  invoice: any;
  categories: Category[];
  payPeriods: PayPeriod[];
  hourlyRate: number;
}

export default function EditInvoiceClient({ invoice, categories, payPeriods, hourlyRate }: EditInvoiceClientProps) {
  const router = useRouter();
  
  // Format dates for input fields
  const formattedInvoiceDate = new Date(invoice.invoiceDate).toISOString().split('T')[0];

  const [invoiceDate, setInvoiceDate] = useState(formattedInvoiceDate);
  const [items, setItems] = useState(invoice.items.map((item: any) => ({
    id: item.id,
    date: item.date ? new Date(item.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    description: item.description,
    hours: item.hours,
    categoryId: item.categoryId || '',
  })));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [itemErrors, setItemErrors] = useState<string[]>([]); // To store individual item errors

  const selectedPayPeriod = payPeriods.find(
    (p) => new Date(p.invoiceDate).toISOString().split('T')[0] === invoiceDate
  );

  const validateItemDate = (dateString: string, itemIndex: number) => {
    const newErrors = [...itemErrors];
    if (!selectedPayPeriod) {
      newErrors[itemIndex] = ""; // No schedule to validate against
      setItemErrors(newErrors);
      return true;
    }

    const itemDate = new Date(dateString);
    const pStart = new Date(selectedPayPeriod.periodStart);
    const pEnd = new Date(selectedPayPeriod.periodEnd);
    pStart.setHours(0, 0, 0, 0);
    pEnd.setHours(23, 59, 59, 999);

    if (itemDate < pStart || itemDate > pEnd) {
      newErrors[itemIndex] = "Date is not within the selected payroll period.";
      setItemErrors(newErrors);
      return false;
    }
    newErrors[itemIndex] = "";
    setItemErrors(newErrors);
    return true;
  };

  const handleAddItem = () => {
    // Default the new item's date to the start of the selected period, or today
    const defaultItemDate = selectedPayPeriod 
      ? new Date(selectedPayPeriod.periodStart).toISOString().split('T')[0] 
      : invoiceDate;
    setItems([...items, { date: defaultItemDate, description: '', hours: 0, categoryId: '' }]);
    setItemErrors([...itemErrors, ""]); // Add an empty error slot for new item
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_: any, i: number) => i !== index));
    setItemErrors(itemErrors.filter((_, i) => i !== index)); // Remove error for deleted item
  };

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
    if (field === 'date') {
      validateItemDate(value as string, index);
    }
  };

  const handleSaveProgress = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const validItems = items.filter((item: any) => item.description.trim() !== '' && item.hours > 0 && item.date);
      if (validItems.length === 0) {
        throw new Error("Please add at least one valid item with date, description, and hours.");
      }

      if (selectedPayPeriod) {
        const pStart = new Date(selectedPayPeriod.periodStart);
        const pEnd = new Date(selectedPayPeriod.periodEnd);
        pStart.setHours(0, 0, 0, 0);
        pEnd.setHours(23, 59, 59, 999);

        for (let i = 0; i < validItems.length; i++) {
          const itemDate = new Date(validItems[i].date);
          if (itemDate < pStart || itemDate > pEnd) {
            throw new Error(`Item at row ${i + 1} has a date (${validItems[i].date}) outside the allowed billing period (${selectedPayPeriod.label}).`);
          }
        }
      }

      await updateInvoice({
        id: invoice.id,
        invoiceDate: new Date(invoiceDate),
        items: validItems.map((item: any) => ({
          id: item.id,
          date: new Date(item.date),
          description: item.description,
          hours: item.hours,
          categoryId: item.categoryId || undefined,
        })),
      });

      // Just refresh to show updated data without navigating away
      router.refresh();
      alert("Progress saved successfully.");
    } catch (err: any) {
      setError(err.message || "Failed to save progress.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const validItems = items.filter((item: any) => item.description.trim() !== '' && item.hours > 0 && item.date);
      if (validItems.length === 0) {
        throw new Error("Please add at least one valid item with date, description, and hours.");
      }

      // If a pay period is selected, enforce that all items fall within it
      if (selectedPayPeriod) {
        const pStart = new Date(selectedPayPeriod.periodStart);
        const pEnd = new Date(selectedPayPeriod.periodEnd);
        pStart.setHours(0, 0, 0, 0);
        pEnd.setHours(23, 59, 59, 999);

        for (let i = 0; i < validItems.length; i++) {
          const itemDate = new Date(validItems[i].date);
          if (itemDate < pStart || itemDate > pEnd) {
            throw new Error(`Item at row ${i + 1} has a date (${validItems[i].date}) outside the allowed billing period (${selectedPayPeriod.label}).`);
          }
        }
      }

      await updateInvoice({
        id: invoice.id,
        invoiceDate: new Date(invoiceDate),
        items: validItems.map((item: any) => ({
          id: item.id, // Will be undefined for new items
          date: new Date(item.date),
          description: item.description,
          hours: item.hours,
          categoryId: item.categoryId || undefined,
        })),
      });

      router.push(`/invoices/${invoice.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to update invoice.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white shadow-sm border border-slate-100 rounded-xl p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-nreuv-black">Edit Invoice</h1>
        <button
          type="button"
          onClick={() => router.push(`/invoices/${invoice.id}`)}
          className="text-slate-500 hover:text-slate-700 text-sm font-medium"
        >
          Cancel
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg text-sm font-medium">
          {error}
        </div>
      )}

      {selectedPayPeriod && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800">
          <span className="font-semibold">Current Billing Period:</span> {selectedPayPeriod.label}. 
          All item dates must fall within this range.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col">
            <label className="text-sm font-semibold text-slate-700 mb-2">Payment Date</label>
            {payPeriods.length > 0 ? (
              <select
                required
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-nreuv-accent outline-none bg-white"
              >
                {/* Include the current date if it's not in the list to avoid breaking existing drafts */}
                {!payPeriods.some(p => new Date(p.invoiceDate).toISOString().split('T')[0] === invoiceDate) && (
                  <option value={invoiceDate}>{new Date(invoiceDate).toLocaleDateString()} (Current)</option>
                )}
                {payPeriods.map((period, idx) => {
                  const dateStr = new Date(period.invoiceDate).toISOString().split('T')[0];
                  const isPastDate = new Date(period.invoiceDate) < new Date();
                  return (
                    <option 
                      key={idx} 
                      value={dateStr} 
                      disabled={isPastDate} 
                      className={isPastDate ? "text-gray-400" : ""}
                    >
                      {period.label}
                    </option>
                  );
                })}
              </select>
            ) : (
              <input
                type="date"
                required
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-nreuv-accent outline-none"
              />
            )}
            {selectedPayPeriod && selectedPayPeriod.submissionDeadline && (
              <div className="mt-2 text-sm text-slate-500">
                Submission Deadline:{" "}
                <span className="font-medium">
                  {new Date(selectedPayPeriod.submissionDeadline).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>


        </div>

        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-slate-800">Invoice Items</h2>
            <button
              type="button"
              onClick={handleAddItem}
              className="text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-1.5 px-3 rounded-md transition-colors"
            >
              + Add Item
            </button>
          </div>

          <div className="space-y-4">
            {items.map((item: any, index: number) => (
              <div key={index} className="flex flex-wrap md:flex-nowrap gap-4 items-start p-4 border border-slate-200 rounded-lg bg-slate-50">
                <div className="w-full md:w-1/6">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={item.date}
                    onChange={(e) => handleItemChange(index, 'date', e.target.value)}
                    onBlur={(e) => validateItemDate(e.target.value, index)}
                    className={`w-full border rounded-md p-2 focus:ring-2 focus:ring-nreuv-accent outline-none ${itemErrors[index] ? 'border-red-500' : 'border-slate-300'}`}
                  />
                  {itemErrors[index] && (
                    <p className="text-red-500 text-xs mt-1">{itemErrors[index]}</p>
                  )}
                </div>
                
                <div className="w-full md:w-1/4">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
                  <input
                    type="text"
                    required
                    placeholder="Work description..."
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    className="w-full border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-nreuv-accent outline-none"
                  />
                </div>
                
                <div className="w-1/3 md:w-1/6">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Category</label>
                  <select
                    value={item.categoryId}
                    onChange={(e) => handleItemChange(index, 'categoryId', e.target.value)}
                    className="w-full border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-nreuv-accent outline-none bg-white"
                  >
                    <option value="">None</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="w-1/4 md:w-1/6">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Hours</label>
                  <input
                    type="number"
                    required
                    min="0.1"
                    step="0.1"
                    value={item.hours || ''}
                    onChange={(e) => handleItemChange(index, 'hours', parseFloat(e.target.value))}
                    className="w-full border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-nreuv-accent outline-none"
                  />
                </div>

                <div className="w-1/4 md:w-1/6">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Rate ($)</label>
                  <input
                    type="number"
                    readOnly
                    value={hourlyRate}
                    className="w-full border border-slate-200 rounded-md p-2 bg-slate-100 text-slate-500 outline-none cursor-not-allowed"
                    title="Assigned by Admin"
                  />
                </div>

                <div className="w-auto md:w-auto pt-6">
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="text-red-500 hover:text-red-700 p-2"
                      title="Remove Item"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 flex justify-end text-lg font-bold text-slate-800">
            Total: ${items.reduce((sum: number, item: any) => sum + (item.hours || 0) * hourlyRate, 0).toFixed(2)}
          </div>
        </div>

        <div className="flex justify-between items-center pt-6 border-t border-slate-100">
          <button
            type="button"
            onClick={handleSaveProgress}
            disabled={isSubmitting}
            className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium py-2.5 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : "Save Progress"}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-nreuv-primary hover:opacity-90 text-white font-medium py-2.5 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-nreuv-accent transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : "Save & Review Invoice"}
          </button>
        </div>
      </form>
    </div>
  );
}
