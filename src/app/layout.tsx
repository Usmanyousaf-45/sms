import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Brightfield ERP",
  description: "School Management & Learning Platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}