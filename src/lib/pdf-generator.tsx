import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";

interface Invoice {
  id: string;
  invoiceNumber?: number;
  invoiceDate: Date;
  dueDate: Date;
  status: string;
  totalHours: number;
  totalCost: number;
  submittedDate: Date | null;
  approvedDate: Date | null;
  userId: string;
}

const styles = StyleSheet.create({
  page: {
    fontSize: 12,
    padding: 40,
    backgroundColor: "#ffffff",
    color: "#000000",
  },
  headerBar: {
    backgroundColor: "#730404",
    color: "#ffffff",
    paddingVertical: 15,
    paddingHorizontal: 20,
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
  },
  headerAccent: {
    height: 4,
    backgroundColor: "#d11c21",
    marginBottom: 25,
  },
  section: {
    marginBottom: 20,
  },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sectionCol: {
    width: "48%",
  },
  sectionTitle: {
    fontWeight: "bold",
    marginBottom: 2,
  },
  text: {
    marginBottom: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "#bababa",
    marginVertical: 10,
  },
  table: {
    display: "flex",
    width: "100%",
    borderWidth: 1,
    borderColor: "#bababa",
    borderStyle: "solid",
    marginTop: 10,
  },
  tableRow: {
    flexDirection: "row",
  },
  tableColHeader: {
    width: "20%",
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#bababa",
    padding: 6,
    backgroundColor: "#730404",
    color: "#ffffff",
    fontWeight: "bold",
    textAlign: "center",
  },
  tableCol: {
    width: "20%",
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#bababa",
    padding: 6,
    textAlign: "center",
  },
  tableColAlt: {
    width: "20%",
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#bababa",
    padding: 6,
    textAlign: "center",
    backgroundColor: "#f7f7f7",
  },
  totalSection: {
    marginTop: 25,
    padding: 15,
    backgroundColor: "#d11c21",
    color: "#ffffff",
    textAlign: "right",
  },
  totalText: {
    fontWeight: "bold",
    fontSize: 14,
    marginBottom: 4,
    color: "#ffffff",
  },
});

interface InvoicePdfProps {
  invoice: Invoice & {
    user: { name: string | null; email: string };
    items: {
      date: Date | string;
      description: string;
      hours: number;
      rate: number;
    }[];
  };
}

const InvoicePdfDocument = ({ invoice }: InvoicePdfProps) => (
  <Document>
   <Page size="LETTER" style={styles.page}>
  {/* Logo + Header */}
  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
  <Image
  src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..." // your base64 string
  style={{ width: 120, height: 50 }}
/>
    <View style={{ flexGrow: 1 }}>
      <Text style={styles.headerBar}>INVOICE</Text>
      <View style={styles.headerAccent} />
    </View>
  </View>
      {/* Invoice Details */}
      <View style={styles.sectionRow}>
        <View style={styles.sectionCol}>
          <Text style={styles.text}>
            <Text style={styles.sectionTitle}>Invoice Number: </Text>
            {invoice.invoiceNumber ? `#${invoice.invoiceNumber.toString().padStart(2, "0")}` : "N/A"}
          </Text>
          <Text style={styles.text}>
            <Text style={styles.sectionTitle}>Payment Date: </Text>
            {invoice.invoiceDate.toLocaleDateString()}
          </Text>
          <Text style={styles.text}>
            <Text style={styles.sectionTitle}>Submission Deadline: </Text>
            {invoice.dueDate.toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.sectionCol}>
          <Text style={styles.text}>
            <Text style={styles.sectionTitle}>From: </Text>
            {invoice.user.name || "User"}
          </Text>
          <Text style={styles.text}>
            <Text style={styles.sectionTitle}>Email: </Text>
            {invoice.user.email}
          </Text>
          <Text style={styles.text}>
            <Text style={styles.sectionTitle}>Billed To: </Text>
            NREUV
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Line Items Table */}
      <View style={styles.table}>
        <View style={styles.tableRow}>
          <Text style={styles.tableColHeader}>Date</Text>
          <Text style={styles.tableColHeader}>Description</Text>
          <Text style={styles.tableColHeader}>Hours</Text>
          <Text style={styles.tableColHeader}>Rate</Text>
          <Text style={styles.tableColHeader}>Amount</Text>
        </View>
        {invoice.items.map((item, index) => {
          const isAlt = index % 2 === 1;
          return (
            <View style={styles.tableRow} key={index}>
              <Text style={isAlt ? styles.tableColAlt : styles.tableCol}>{new Date(item.date).toLocaleDateString()}</Text>
              <Text style={isAlt ? styles.tableColAlt : styles.tableCol}>{item.description}</Text>
              <Text style={isAlt ? styles.tableColAlt : styles.tableCol}>{item.hours}</Text>
              <Text style={isAlt ? styles.tableColAlt : styles.tableCol}>${item.rate.toFixed(2)}</Text>
              <Text style={isAlt ? styles.tableColAlt : styles.tableCol}>${(item.hours * item.rate).toFixed(2)}</Text>
            </View>
          );
        })}
      </View>

      {/* Totals */}
      <View style={styles.totalSection}>
        <Text style={styles.totalText}>Total Hours: {invoice.totalHours}</Text>
        <Text style={styles.totalText}>Total Cost: ${invoice.totalCost.toFixed(2)}</Text>
      </View>
    </Page>
  </Document>
);

export default InvoicePdfDocument;