"use client";

import { generateInvoicesCsv } from "@/app/actions";
import { useSearchParams } from "next/navigation"; // Import useSearchParams

export default function DownloadCsvButton() {
  const searchParams = useSearchParams(); // Get current search params

  const handleDownloadCsv = async () => {
    try {
      // Pass the current searchParams to the server action
      const csvContent = await generateInvoicesCsv(Object.fromEntries(searchParams)); 
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "invoices.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download CSV", error);
      alert("Failed to download CSV.");
    }
  };

  return (
    <button
      onClick={handleDownloadCsv}
      className="bg-dark-red hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
    >
      Export CSV
    </button>
  );
}