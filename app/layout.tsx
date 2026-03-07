import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DataGate",
  description: "DataGate MVP",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl">
      <body>{children}</body>
    </html>
  );
}