import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZapFlow",
  description: "Plataforma de comunicação para pequenos negócios",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-gray-50 text-gray-900">{children}</body>
    </html>
  );
}
