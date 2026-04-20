import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Terrabyte Academy",
  description: "Nigeria's Premier Technology Learning Platform",
  keywords: ["GIS", "online learning", "tech courses", "Geography", "data science", "Nigeria"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} bg-[#03091A] text-white antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
