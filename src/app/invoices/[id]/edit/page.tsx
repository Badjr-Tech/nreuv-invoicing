import React from 'react';

export default function EditInvoicePage({ params }: { params: { id: string } }) {
  return (
    <div>
      <h1>Edit Invoice {params.id}</h1>
      {/* Invoice Form will go here */}
    </div>
  );
}
