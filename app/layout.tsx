import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { QueryProvider } from "@/components/layout/query-provider";

export const metadata: Metadata = {
  metadataBase: new URL("https://tpvd-gis-analyzer.vercel.app"),
  title: {
    default: "CivicPlot GIS Analyzer",
    template: "%s | CivicPlot GIS Analyzer"
  },
  description:
    "A TPVD-style GIS and land feasibility platform for TPS search, plot details, civic layers, zoning analysis, and report generation.",
  keywords: [
    "TPVD",
    "GIS",
    "town planning scheme",
    "plot analysis",
    "zoning",
    "FSI",
    "land feasibility",
    "MapLibre"
  ],
  openGraph: {
    title: "CivicPlot GIS Analyzer",
    description: "Search TPS and plots, inspect TPVD-style GIS layers, and generate feasibility reports.",
    type: "website"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
