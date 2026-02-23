import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "lukso.tools - LUKSO Ecosystem Directory",
  description: "A curated directory of tools, dApps, and resources for the LUKSO ecosystem. Discover DeFi protocols, NFT platforms, wallets, and developer tools.",
  keywords: ["LUKSO", "LYX", "Universal Profile", "LSP", "DeFi", "NFT", "blockchain", "tools", "directory"],
  authors: [{ name: "LUKSO Community" }],
  openGraph: {
    title: "lukso.tools - LUKSO Ecosystem Directory",
    description: "Discover the best tools and dApps in the LUKSO ecosystem",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        {children}
      </body>
    </html>
  );
}
