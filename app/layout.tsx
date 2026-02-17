import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";

import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { StickyMobileCTA } from "@/components/sticky-mobile-cta";

import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "Stubborn Stumps",
  image: "https://stubbornstumps.co.nz/logo-512.png",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Invercargill",
    addressRegion: "Southland",
    addressCountry: "NZ",
  },
  areaServed: ["Invercargill", "Southland"],
  url: "https://stubbornstumps.co.nz",
  telephone: "+64000000000",
  description: "Professional stump grinding service. Fast, reliable, affordable. Free quotes.",
};

export const metadata: Metadata = {
  title: "Stubborn Stumps | Stump Grinding Invercargill & Southland",
  description: "Professional stump grinding service. Fast, reliable, affordable. Free quotes.",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
    other: [
      {
        rel: "icon",
        url: "/logo-512.png",
        type: "image/png",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Header />
        <main className="mx-auto min-h-[70vh] w-full max-w-6xl px-4 py-8 pb-24 md:pb-8">{children}</main>
        <Footer />
        <StickyMobileCTA />
        <Script
          id="local-business-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
      </body>
    </html>
  );
}
