"use client";

import React from 'react';

interface AnalyticsClientProps {
  invoiceMetrics: { period: string; totalAmount: number; totalHours: number }[];
  categoryBreakdown: { category: string; totalAmount: number; totalHours: number }[];
  userPerformance: { userName: string; totalAmount: number; totalHours: number; avgInvoice: number }[];
}

export default function AnalyticsClient({ invoiceMetrics, categoryBreakdown, userPerformance }: AnalyticsClientProps) {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-nreuv-black mb-6">Admin Analytics Dashboard</h1>

      {/* Invoice Metrics Over Time */}
      <div className="bg-white shadow-sm border border-slate-100 rounded-lg p-5 mb-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Invoice Volume Over Time</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <th className="py-3 px-4 font-semibold text-sm">Period</th>
                <th className="py-3 px-4 font-semibold text-sm text-right">Total Amount</th>
                <th className="py-3 px-4 font-semibold text-sm text-right">Total Hours</th>
              </tr>
            </thead>
            <tbody>
              {invoiceMetrics.map((metric, index) => (
                <tr key={index} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50">
                  <td className="py-3 px-4 text-sm text-slate-900">{metric.period}</td>
                  <td className="py-3 px-4 text-sm text-slate-900 text-right">${metric.totalAmount.toFixed(2)}</td>
                  <td className="py-3 px-4 text-sm text-slate-900 text-right">{metric.totalHours}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-white shadow-sm border border-slate-100 rounded-lg p-5 mb-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Category Spending Breakdown</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <th className="py-3 px-4 font-semibold text-sm">Category</th>
                <th className="py-3 px-4 font-semibold text-sm text-right">Total Amount</th>
                <th className="py-3 px-4 font-semibold text-sm text-right">Total Hours</th>
              </tr>
            </thead>
            <tbody>
              {categoryBreakdown.map((item, index) => (
                <tr key={index} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50">
                  <td className="py-3 px-4 text-sm text-slate-900">{item.category}</td>
                  <td className="py-3 px-4 text-sm text-slate-900 text-right">${item.totalAmount.toFixed(2)}</td>
                  <td className="py-3 px-4 text-sm text-slate-900 text-right">{item.totalHours}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Performance */}
      <div className="bg-white shadow-sm border border-slate-100 rounded-lg p-5 mb-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">User Performance Overview</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <th className="py-3 px-4 font-semibold text-sm">User</th>
                <th className="py-3 px-4 font-semibold text-sm text-right">Total Amount</th>
                <th className="py-3 px-4 font-semibold text-sm text-right">Total Hours</th>
                <th className="py-3 px-4 font-semibold text-sm text-right">Avg. Invoice</th>
              </tr>
            </thead>
            <tbody>
              {userPerformance.map((user, index) => (
                <tr key={index} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50">
                  <td className="py-3 px-4 text-sm text-slate-900">{user.userName}</td>
                  <td className="py-3 px-4 text-sm text-slate-900 text-right">${user.totalAmount.toFixed(2)}</td>
                  <td className="py-3 px-4 text-sm text-slate-900 text-right">{user.totalHours}</td>
                  <td className="py-3 px-4 text-sm text-slate-900 text-right">${user.avgInvoice.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
