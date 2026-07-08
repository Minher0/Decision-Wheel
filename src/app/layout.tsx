import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Decision Wheel — Spin to Decide",
  description: "A wheel for indecisive moments. Click to spin. Remove winners. Repeat.",
  keywords: ["decision wheel", "spinner", "random picker"],
  openGraph: {
    title: "Decision Wheel",
    description: "A wheel for indecisive moments.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0A0B0E] text-[#E4E0D6]`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
