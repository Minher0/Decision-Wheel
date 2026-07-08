import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Decision Wheel — Spin to Decide",
  description:
    "An immersive decision wheel. Add your choices, spin the wheel, and let fate decide. Share wheels with anyone via a link.",
  keywords: ["decision wheel", "wheel of fortune", "spinner", "random picker", "decision maker"],
  authors: [{ name: "Minher0" }],
  openGraph: {
    title: "Decision Wheel — Spin to Decide",
    description:
      "An immersive decision wheel. Add your choices, spin, and share.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Decision Wheel",
    description: "Spin to decide. Share your wheels.",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0a0418] text-white`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
