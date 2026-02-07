import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "JourneyIQ Admin - Platform Management",
  description: "Administrative portal for managing the JourneyIQ travel platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="admin-layout">
          <Sidebar />
          <main className="admin-main">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
