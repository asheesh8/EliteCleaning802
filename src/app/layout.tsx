import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import Script from "next/script";
import { brand } from "@/lib/brand";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans-stack",
  display: "swap",
});

// One interesting typeface does more for perceived quality than any
// amount of motion. Fraunces carries the headlines; Inter does the work.
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display-stack",
  display: "swap",
  axes: ["SOFT", "WONK"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://elitecleaning802.com"),
  title: {
    default: `${brand.name} — Cleaning services in ${brand.serviceArea}`,
    template: `%s · ${brand.name}`,
  },
  description:
    "Woman-owned and detail-obsessed. Homes, Airbnbs, offices, and rentals kept spotless across Rutland County and central Vermont.",
  openGraph: {
    title: brand.name,
    description: brand.tagline,
    type: "website",
    locale: "en_US",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className={`${inter.variable} ${fraunces.variable}`}>
        {/* Light by default; an explicit saved dark preference still wins. */}
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(localStorage.getItem("ec802-theme")==="dark")document.documentElement.classList.add("dark")}catch(e){}})()`,
          }}
        />
        {children}
      </body>
    </html>
  );
}
