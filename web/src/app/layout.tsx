import type { Metadata } from "next";
import { Geist, Geist_Mono, Rubik_Mono_One, Changa_One } from "next/font/google";
import "./globals.css";
import "@solana/wallet-adapter-react-ui/styles.css";
import AppWalletProvider from "@/components/AppWalletProvider";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const rubikMonoOne = Rubik_Mono_One({
  weight: "400",
  variable: "--font-rubik-ice",
  subsets: ["latin"],
});

const changaOne = Changa_One({
  weight: "400",
  variable: "--font-changa",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Snowball Effect",
  description: "Push the snowball, win the pot! A Solana-powered FOMO game.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `
            window.global = window;
            window.process = { env: {} };
          `
        }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${rubikMonoOne.variable} ${changaOne.variable} antialiased`}
      >
        <AppWalletProvider>
          {children}
        </AppWalletProvider>
      </body>
    </html>
  );
}