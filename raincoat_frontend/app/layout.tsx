import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Raincoat - Weather-Smart Wardrobe",
  description: "AI-powered outfit recommendations that respect your privacy",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
