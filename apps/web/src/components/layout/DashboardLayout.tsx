import Link from 'next/link';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="w-64 bg-white shadow-md">
        <div className="p-6 font-bold text-xl text-blue-600">ZapFlow</div>
        <nav className="mt-6">
          <Link href="/dashboard" className="block px-6 py-2 hover:bg-blue-50">Dashboard</Link>
          <Link href="/contacts" className="block px-6 py-2 hover:bg-blue-50">Contatos</Link>
          <Link href="/campaigns" className="block px-6 py-2 hover:bg-blue-50">Campanhas</Link>
          <Link href="/reports" className="block px-6 py-2 hover:bg-blue-50">Relatórios</Link>
        </nav>
      </aside>
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  );
}
