"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
} from "recharts";

interface AnalyticsClientProps {
  invoiceMetrics: { period: string; totalAmount: number; totalHours: number }[];
  categoryBreakdown: { category: string; totalAmount: number; totalHours: number }[];
  userPerformance: { userName: string; totalAmount: number; totalHours: number; avgInvoice: number }[];
  companyBreakdown: { company: string; totalAmount: number; totalHours: number }[];
}

const BRAND = "#991b1b"; // NREUV dark red
const GRID = "#e2e8f0";
const INK_MUTED = "#64748b";

const money = (v: number) =>
  "$" + v.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-md px-3 py-2 text-sm">
      <p className="font-semibold text-slate-800">{label ?? row.name}</p>
      <p className="text-slate-600">{money(row.totalAmount)}</p>
      {row.totalHours !== undefined && <p className="text-slate-500 text-xs">{row.totalHours} hours</p>}
    </div>
  );
}

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white shadow-sm border border-slate-100 rounded-xl p-5">
      <h2 className="text-lg font-bold text-slate-800">{title}</h2>
      {subtitle && <p className="text-xs text-slate-500 mb-2">{subtitle}</p>}
      {children}
    </div>
  );
}

function HorizontalBars({ data, nameKey }: { data: any[]; nameKey: string }) {
  const height = Math.max(120, data.length * 44 + 30);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 64, left: 8, bottom: 4 }}>
        <CartesianGrid horizontal={false} stroke={GRID} />
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey={nameKey}
          width={140}
          tickLine={false}
          axisLine={false}
          tick={{ fill: "#334155", fontSize: 13 }}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(148,163,184,0.08)" }} />
        <Bar dataKey="totalAmount" fill={BRAND} radius={[0, 4, 4, 0]} maxBarSize={22}>
          <LabelList dataKey="totalAmount" position="right" formatter={money as any} style={{ fill: INK_MUTED, fontSize: 12 }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function DetailTable({ headers, rows }: { headers: string[]; rows: (string | number)[][] }) {
  return (
    <details className="mt-3">
      <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-700">View as table</summary>
      <table className="min-w-full text-left mt-2 text-sm">
        <thead>
          <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
            {headers.map((h, i) => (
              <th key={i} className={`py-2 px-3 font-semibold text-xs ${i > 0 ? "text-right" : ""}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-slate-100 last:border-b-0">
              {r.map((cell, j) => (
                <td key={j} className={`py-2 px-3 text-slate-800 ${j > 0 ? "text-right" : ""}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}

export default function AnalyticsClient({ invoiceMetrics, categoryBreakdown, userPerformance, companyBreakdown }: AnalyticsClientProps) {
  const totalPaid = invoiceMetrics.reduce((s, m) => s + m.totalAmount, 0);
  const totalHours = invoiceMetrics.reduce((s, m) => s + m.totalHours, 0);
  const bestMonth = invoiceMetrics.reduce(
    (best, m) => (m.totalAmount > (best?.totalAmount ?? -1) ? m : best),
    null as null | { period: string; totalAmount: number }
  );
  const avgRate = totalHours > 0 ? totalPaid / totalHours : 0;

  if (invoiceMetrics.length === 0 && categoryBreakdown.length === 0 && userPerformance.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-nreuv-black mb-2">Analytics</h1>
        <p className="text-slate-600">No approved invoices yet — charts will appear once payroll starts flowing.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-nreuv-black mb-6">Analytics</h1>

      {/* Headline stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white shadow-sm border border-slate-100 rounded-xl p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase">Total Paid Out</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{money(totalPaid)}</p>
          <p className="text-xs text-slate-500 mt-0.5">approved invoices, all time</p>
        </div>
        <div className="bg-white shadow-sm border border-slate-100 rounded-xl p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase">Total Hours</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalHours.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-0.5">billed &amp; approved</p>
        </div>
        <div className="bg-white shadow-sm border border-slate-100 rounded-xl p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase">Avg Cost / Hour</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">${avgRate.toFixed(2)}</p>
          <p className="text-xs text-slate-500 mt-0.5">blended across everyone</p>
        </div>
        <div className="bg-white shadow-sm border border-slate-100 rounded-xl p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase">Biggest Month</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{bestMonth ? money(bestMonth.totalAmount) : "—"}</p>
          <p className="text-xs text-slate-500 mt-0.5">{bestMonth?.period ?? ""}</p>
        </div>
      </div>

      {/* Monthly spend */}
      <div className="mb-6">
        <Card title="Payroll Spend by Month" subtitle="Approved invoice totals per month">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={invoiceMetrics} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={GRID} />
              <XAxis dataKey="period" tickLine={false} axisLine={{ stroke: GRID }} tick={{ fill: "#334155", fontSize: 12 }} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: INK_MUTED, fontSize: 12 }}
                tickFormatter={(v: number) => money(v)}
                width={64}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(148,163,184,0.08)" }} />
              <Bar dataKey="totalAmount" fill={BRAND} radius={[4, 4, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
          <DetailTable
            headers={["Month", "Amount", "Hours"]}
            rows={invoiceMetrics.map((m) => [m.period, money(m.totalAmount), m.totalHours])}
          />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* By company */}
        <Card title="Spend by Company" subtitle="Approved invoices, grouped by each person's company">
          {companyBreakdown.length === 0 ? (
            <p className="text-sm text-slate-500 italic">No company data yet.</p>
          ) : (
            <>
              <HorizontalBars data={companyBreakdown} nameKey="company" />
              <DetailTable
                headers={["Company", "Amount", "Hours"]}
                rows={companyBreakdown.map((c) => [c.company, money(c.totalAmount), c.totalHours])}
              />
            </>
          )}
        </Card>

        {/* By category */}
        <Card title="Spend by Category" subtitle="Where the billed hours go">
          {categoryBreakdown.length === 0 ? (
            <p className="text-sm text-slate-500 italic">No category data yet.</p>
          ) : (
            <>
              <HorizontalBars data={categoryBreakdown} nameKey="category" />
              <DetailTable
                headers={["Category", "Amount", "Hours"]}
                rows={categoryBreakdown.map((c) => [c.category, money(c.totalAmount), c.totalHours])}
              />
            </>
          )}
        </Card>
      </div>

      {/* Top contractors */}
      <Card title="Top Contractors" subtitle="Total approved pay per person">
        {userPerformance.length === 0 ? (
          <p className="text-sm text-slate-500 italic">No contractor data yet.</p>
        ) : (
          <>
            <HorizontalBars data={userPerformance} nameKey="userName" />
            <DetailTable
              headers={["Contractor", "Amount", "Hours", "Avg Invoice"]}
              rows={userPerformance.map((u) => [u.userName, money(u.totalAmount), u.totalHours, "$" + u.avgInvoice.toFixed(2)])}
            />
          </>
        )}
      </Card>
    </div>
  );
}
