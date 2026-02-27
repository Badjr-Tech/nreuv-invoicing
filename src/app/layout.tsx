import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import { auth } from "@/auth";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Invoicing Platform",
  description: "A simple invoicing platform built with Next.js",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex h-screen bg-light-gray">
          {session?.user && <Sidebar />}
          <main className="flex-1 overflow-y-auto p-4">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
