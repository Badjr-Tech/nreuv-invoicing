"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateInvoice } from '@/app/actions';

interface PaymentSchedule {
  id: string;
  name: string;
  daysDue: number;
}

interface Category {
  id: string;
  name: string;
}

interface AllowedDate {
  id: string;
  date: Date;
  description: string | null;
}

interface EditInvoiceClientProps {
  invoice: any;
  paymentSchedules: PaymentSchedule[];
  categories: Category[];
  allowedDates: AllowedDate[];
  hourlyRate: number;
}

export default function EditInvoiceClient({ invoice, paymentSchedules, categories, allowedDates, hourlyRate }: EditInvoiceClientProps) {
  const router = useRouter();
  
  // Format dates for input fields
  const formattedInvoiceDate = new Date(invoice.invoiceDate).toISOString().split('T')[0];

  const [invoiceDate, setInvoiceDate] = useState(formattedInvoiceDate);
  const [paymentScheduleId, setPaymentScheduleId] = useState(invoice.paymentScheduleId || "");
  const [items, setItems] = useState(invoice.items.map((item: any) => ({
    id: item.id,
    date: item.date ? new Date(item.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    description: item.description,
    hours: item.hours,
    categoryId: item.categoryId || '',
  })));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddItem = () => {
    setItems([...items, { date: new Date().toISOString().split('T')[0], description: '', hours: 0, categoryId: '' }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_: any, i: number) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
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

      await updateInvoice({
        id: invoice.id,
        invoiceDate: new Date(invoiceDate),
        paymentScheduleId,
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

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col">
            <label className="text-sm font-semibold text-slate-700 mb-2">Invoice Date</label>
            {allowedDates.length > 0 ? (
              <select
                required
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-nreuv-accent outline-none bg-white"
              >
                {/* Include the current date if it's not in the list to avoid breaking existing drafts */}
                {!allowedDates.some(d => new Date(d.date).toISOString().split('T')[0] === invoiceDate) && (
                  <option value={invoiceDate}>{new Date(invoiceDate).toLocaleDateString()} (Current)</option>
                )}
                {allowedDates.map((dateObj) => {
                  const dateStr = new Date(dateObj.date).toISOString().split('T')[0];
                  return (
                    <option key={dateObj.id} value={dateStr}>
                      {new Date(dateObj.date).toLocaleDateString()} {dateObj.description ? `- ${dateObj.description}` : ''}
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
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-semibold text-slate-700 mb-2">Payment Terms</label>
            <select
              required
              value={paymentScheduleId}
              onChange={(e) => setPaymentScheduleId(e.target.value)}
              className="border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-nreuv-accent outline-none bg-white"
            >
              {paymentSchedules.map((schedule) => (
                <option key={schedule.id} value={schedule.id}>
                  {schedule.name} ({schedule.daysDue} Days)
                </option>
              ))}
            </select>
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
                <div className="w-full md:w-1/5">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={item.date}
                    onChange={(e) => handleItemChange(index, 'date', e.target.value)}
                    className="w-full border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-nreuv-accent outline-none"
                  />
                </div>
                
                <div className="w-full md:w-2/5">
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
                
                <div className="w-1/3 md:w-1/5">
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

                <div className="w-1/4 md:w-1/5">
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

        <div className="flex justify-end pt-6 border-t border-slate-100">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-nreuv-primary hover:opacity-90 text-white font-medium py-2.5 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-nreuv-accent transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
