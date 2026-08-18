"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { generateInvoicesCsv } from "@/app/actions";

export default function DownloadCsvButton() {
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();

  const handleDownload = async () => {
    setIsLoading(true);
    try {
      const csv = await generateInvoicesCsv({
        sortField: searchParams.get("sortField") || undefined,
        sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || undefined,
        filterUser: searchParams.get("filterUser") || undefined,
        filterStatus: (searchParams.get("filterStatus") as any) || undefined,
        filterInvoiceDateStart: searchParams.get("filterPaymentDateStart") || undefined,
        filterInvoiceDateEnd: searchParams.get("filterPaymentDateEnd") || undefined,
        filterDueDateStart: searchParams.get("filterDueDateStart") || undefined,
        filterDueDateEnd: searchParams.get("filterDueDateEnd") || undefined,
      });
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "invoices.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (error: any) {
      alert(error.message || "Failed to export CSV.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={isLoading}
      className="bg-nreuv-primary hover:opacity-90 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition-colors disabled:opacity-50"
    >
      {isLoading ? "Exporting…" : "Export CSV"}
    </button>
  );
}
