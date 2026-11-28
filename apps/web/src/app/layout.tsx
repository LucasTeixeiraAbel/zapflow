import type { Metadata } from 'next';
import './globals.css';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { AuthProvider } from '@/contexts/AuthContext';

export const metadata: Metadata = {
  title: 'ZapFlow — Plataforma Profissional de Campanhas WhatsApp',
  description: 'Envio seguro, resiliente e escalável de campanhas no WhatsApp com conformidade LGPD.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-slate-50 antialiased selection:bg-emerald-500 selection:text-white">
        <AuthProvider>
          <DashboardLayout>{children}</DashboardLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
