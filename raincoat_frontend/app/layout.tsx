import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Raincoat Labs — Privacy-first visual AI',
  description:
    'Raincoat Labs builds privacy-first visual intelligence: on-device computer vision pipelines and a licensable similarity engine for fashion and retail.',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Load model cache for IndexedDB persistence */}
        <Script src="/js/model_cache.js" strategy="beforeInteractive" {...({} as any)} />
      </head>
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  );
}
