import type { Metadata } from "next";
import { Manrope, Fraunces } from "next/font/google";
import "@/app/globals.css";
import { cn } from "@/lib/utils";

const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
});

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Veganewunder Insights",
  description:
    "Internes Dashboard fuer gecachte Instagram, Facebook und YouTube Insights",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className={cn(sans.variable, display.variable, "font-sans antialiased")}>
        {children}
      </body>
    </html>
  );
}
