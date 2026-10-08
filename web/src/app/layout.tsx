import type { Metadata } from "next";
import "./globals.css";

import { SolanaProvider } from "@/components/providers/SolanaProvider";

export const metadata: Metadata = {
  title: "TokenvaPay",
  description: "Trustless Cross-Chain Asset Streaming & Payroll Protocol",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SolanaProvider>
          {children}
        </SolanaProvider>
      </body>
    </html>
  );
}