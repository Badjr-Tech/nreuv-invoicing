"use client";

import { generateInvoicePdf } from "@/app/actions";

export default function DownloadPdfButton({ invoiceId }: { invoiceId: string }) {
  const handleDownloadPdf = async () => {
    try {
      const pdfBuffer = await generateInvoicePdf(invoiceId);
      // Drizzle or next actions return an array or object of uint8, convert to Blob
      const blob = new Blob([new Uint8Array(pdfBuffer as unknown as Iterable<number>)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download PDF", error);
      alert("Failed to download PDF.");
    }
  };

  return (
    <button
      onClick={handleDownloadPdf}
      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded text-xs"
    >
      Download PDF
    </button>
  );
}