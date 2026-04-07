import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Gym Membership — Subscription Management",
  description: "Subscription management for gyms and clubs",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans bg-slate-50 text-slate-900 dark:bg-[#0b1020] dark:text-slate-100 transition-colors`}
      >
        <ThemeProvider>
          {children}
          <Toaster
            position="top-right"
            richColors
            closeButton
            theme="system"
            toastOptions={{
              style: {
                fontFamily: "var(--font-inter), system-ui, sans-serif",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
