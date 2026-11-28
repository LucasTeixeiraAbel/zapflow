'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Send,
  Smartphone,
  LogOut,
  Building2,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, tenant, logout, isLoading } = useAuth();

  // Não renderiza a casca do Dashboard na tela de login
  if (pathname === '/login') {
    return <>{children}</>;
  }

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/contacts', label: 'Contatos & Opt-Out', icon: Users },
    { href: '/campaigns', label: 'Campanhas & Disparos', icon: Send },
    { href: '/whatsapp', label: 'Conexão WhatsApp', icon: Smartphone },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* Sidebar Lateral */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shadow-sm">
        <div>
          {/* Logo e Nome */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-xl shadow-md shadow-emerald-200">
                ⚡
              </div>
              <div>
                <span className="font-extrabold text-xl tracking-tight text-slate-900">ZapFlow</span>
                <span className="block text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                  SaaS Enterprise
                </span>
              </div>
            </div>
          </div>

          {/* Cartão da Empresa Ativa */}
          <div className="px-4 py-3 mx-3 my-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Espaço de Trabalho</span>
            </div>
            <div className="font-semibold text-sm text-slate-800 truncate mt-0.5">
              {tenant?.name || 'Minha Empresa'}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              WhatsApp Conectado
            </div>
          </div>

          {/* Links de Navegação */}
          <nav className="px-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Rodapé da Sidebar com Usuário e Logout */}
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 text-xs font-bold uppercase">
                {user?.name ? user.name.substring(0, 2) : 'US'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-slate-800 truncate">{user?.name || 'Usuário'}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email || 'admin@zapflow.io'}</p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sair da conta"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Tenant ID: <span className="font-mono text-slate-800">{tenant?.id?.substring(0, 8)}...</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-500 font-medium">
              Conformidade LGPD & Meta Cloud API v21.0
            </span>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
