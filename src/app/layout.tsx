import Providers from '@/components/Providers';
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { ToastProvider } from '@/contexts/ToastContext';
import Toast from '@/components/ui/Toast';
import ResponsiveLayout from '@/components/ResponsiveLayout';
import SessionMonitor from '@/components/SessionMonitor';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "µLinkShortener",
  description: "Create short links and see who accessed them!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <ToastProvider>
            <Header />
            <div className="page-content">
              {children}
            </div>
            <Footer />
            <Toast />
            <SessionMonitor />
            <ResponsiveLayout />
          </ToastProvider>
        </Providers>
      </body>
    </html>
  );
}
