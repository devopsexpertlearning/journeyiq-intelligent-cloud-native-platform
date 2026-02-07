import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/components/Toast";
import { AiChatWidget } from "@/components/AiChatWidget";

export const metadata: Metadata = {
  title: "JourneyIQ - Intelligent Travel Planning",
  description: "The next generation of intelligent travel planning. Experience the future of cloud-native journeys.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ToastProvider>
            {children}
            <AiChatWidget />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
