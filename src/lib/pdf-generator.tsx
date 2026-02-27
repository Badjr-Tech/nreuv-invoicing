import React from "react";
import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
interface Invoice {
  id: string;
  invoiceDate: Date;
  dueDate: Date;
  status: string;
  totalHours: number;
  totalCost: number;
  submittedDate: Date | null;
  approvedDate: Date | null;
  userId: string;
  paymentScheduleId: string;
}

// Register a font to use, otherwise, default font might not support all characters
Font.register({
  family: "Roboto",
  src: "https://cdnjs.cloudflare.com/ajax/libs/ink/1.0.0/fonts/Roboto/roboto-light-webfont.ttf",
});

const styles = StyleSheet.create({
  page: {
    fontFamily: "Roboto",
    fontSize: 12,
    padding: 30,
    backgroundColor: "#ffffff", // White background as per color scheme
    color: "#000000", // Black text
  },
  header: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: "center",
    color: "#730404", // Dark red for header
  },
  section: {
    marginBottom: 10,
  },
  text: {
    marginBottom: 5,
  },
  table: {
    display: "flex",
    width: "auto",
    marginTop: 10,
    marginBottom: 10,
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#bababa", // Light gray border
  },
  tableRow: {
    margin: "auto",
    flexDirection: "row",
  },
  tableColHeader: {
    width: "25%",
    borderStyle: "solid",
    borderBottomWidth: 1,
    borderColor: "#bababa",
    padding: 5,
    backgroundColor: "#bababa", // Light gray header background
    color: "#000000", // Black text
    fontWeight: "bold",
  },
  tableCol: {
    width: "25%",
    borderStyle: "solid",
    borderBottomWidth: 1,
    borderColor: "#bababa",
    padding: 5,
  },
  totalSection: {
    marginTop: 10,
    textAlign: "right",
    fontSize: 14,
  },
  totalText: {
    marginBottom: 5,
  },
});

interface InvoicePdfProps {
  invoice: Invoice & {
    user: { name: string | null; email: string };
    items: {
      description: string;
      hours: number;
      rate: number;
    }[];
  };
}

const InvoicePdfDocument = ({ invoice }: InvoicePdfProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.header}>INVOICE</Text>

      <View style={styles.section}>
        <Text style={styles.text}>Invoice ID: {invoice.id}</Text>
        <Text style={styles.text}>Invoice Date: {invoice.invoiceDate.toLocaleDateString()}</Text>
        <Text style={styles.text}>Due Date: {invoice.dueDate.toLocaleDateString()}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.text}>Billed To: {invoice.user.name || invoice.user.email}</Text>
        <Text style={styles.text}>Email: {invoice.user.email}</Text>
      </View>

      <View style={styles.table}>
        <View style={styles.tableRow}>
          <Text style={styles.tableColHeader}>Description</Text>
          <Text style={styles.tableColHeader}>Hours</Text>
          <Text style={styles.tableColHeader}>Rate</Text>
          <Text style={styles.tableColHeader}>Amount</Text>
        </View>
        {invoice.items.map((item, index) => (
          <View style={styles.tableRow} key={index}>
            <Text style={styles.tableCol}>{item.description}</Text>
            <Text style={styles.tableCol}>{item.hours}</Text>
            <Text style={styles.tableCol}>${item.rate.toFixed(2)}</Text>
            <Text style={styles.tableCol}>${(item.hours * item.rate).toFixed(2)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.totalSection}>
        <Text style={styles.totalText}>Total Hours: {invoice.totalHours}</Text>
        <Text style={styles.totalText}>Total Cost: ${invoice.totalCost.toFixed(2)}</Text>
      </View>
    </Page>
  </Document>
);

export default InvoicePdfDocument;
