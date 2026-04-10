import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import TRPCProvider from "@/components/TRPCProvider";
import AuthProvider from "@/components/AuthProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Esolang Battle 2",
  description: "Esolang Golf Battle Platform",
};

export default function RootLayout({
  children,
}: {
  children: any;
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <AuthProvider>
          <TRPCProvider>
            {children}
          </TRPCProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
