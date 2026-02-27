import React from 'react';

export default function InvoiceDetailsPage({ params }: { params: { id: string } }) {
  return (
    <div>
      <h1>Invoice Details for {params.id}</h1>
      {/* Invoice details will go here */}
    </div>
  );
}
