"use client";

import { generateInvoicePdf } from "@/app/actions";

export default function DownloadPdfButton({ invoiceId }: { invoiceId: string }) {
  const handleDownloadPdf = async () => {
    try {
      const pdfBase64 = await generateInvoicePdf(invoiceId);
      
      // Decode Base64 string to a Uint8Array
      const binaryString = atob(pdfBase64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const blob = new Blob([bytes], { type: "application/pdf" });
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