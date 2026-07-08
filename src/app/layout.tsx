import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Decision Wheel — Spin to Decide",
  description:
    "A wheel for indecisive moments. Add your choices, spin, share the link.",
  keywords: ["decision wheel", "wheel of fortune", "spinner", "random picker"],
  authors: [{ name: "Minher0" }],
  openGraph: {
    title: "Decision Wheel",
    description: "A wheel for indecisive moments.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Decision Wheel",
    description: "A wheel for indecisive moments.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#F2EEE5] text-[#0A0A0A]`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
