"use client";

import { generateInvoicePdf } from "@/app/actions";

export default function DownloadPdfButton({ invoiceId }: { invoiceId: string }) {
  const handleDownloadPdf = async () => {
    try {
      const pdfBuffer = await generateInvoicePdf(invoiceId);
      
      // Ensure pdfBuffer is an array of numbers or Uint8Array
      let dataArray: Uint8Array;
      if (pdfBuffer instanceof Uint8Array) {
        dataArray = pdfBuffer;
      } else if (Array.isArray(pdfBuffer)) {
        dataArray = new Uint8Array(pdfBuffer);
      } else if (pdfBuffer && typeof pdfBuffer === 'object' && 'data' in pdfBuffer && Array.isArray(pdfBuffer.data)) {
        // Common serialization of Node.js Buffer is { type: 'Buffer', data: [...] }
        dataArray = new Uint8Array(pdfBuffer.data);
      } else {
        throw new Error("Unexpected PDF buffer format.");
      }

      const blob = new Blob([dataArray], { type: "application/pdf" });
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
      className="bg-nreuv-primary hover:opacity-90 text-white font-medium py-1 px-3 rounded text-xs transition-colors shadow-sm"
    >
      Download PDF
    </button>
  );
}