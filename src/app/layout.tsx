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
  title: "Decision Wheel - Laissez le hasard décider",
  description: "Créez une roue interactive qui choisit aléatoirement entre plusieurs options. Parfait pour prendre des décisions difficiles!",
  keywords: ["Decision Wheel", "Roue de décision", "Random", "Choix aléatoire", "Spin the wheel"],
  authors: [{ name: "Decision Wheel" }],
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.png", type: "image/png" },
    ],
  },
  openGraph: {
    title: "Decision Wheel - Laissez le hasard décider",
    description: "Créez une roue interactive qui choisit aléatoirement entre plusieurs options",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Decision Wheel",
    description: "Créez une roue interactive qui choisit aléatoirement entre plusieurs options",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
