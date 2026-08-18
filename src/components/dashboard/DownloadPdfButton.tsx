"use client";

import { useState } from "react";
import { generateInvoicePdf } from "@/app/actions";

export default function DownloadPdfButton({ invoiceId }: { invoiceId: string }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    setIsLoading(true);
    try {
      const base64 = await generateInvoicePdf(invoiceId);
      const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${invoiceId.slice(0, 8)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error: any) {
      alert(error.message || "Failed to download PDF.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={isLoading}
      className="text-nreuv-primary hover:text-nreuv-accent transition-colors font-medium disabled:opacity-50"
    >
      {isLoading ? "Preparing…" : "PDF"}
    </button>
  );
}
