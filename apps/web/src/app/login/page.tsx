'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { ShieldCheck, ArrowRight, Zap, CheckCircle2, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isRegister) {
        const res = await api.post('/auth/register', {
          email,
          password,
          name,
          companyName,
        });
        login(res.data.token, res.data.user, res.data.tenant);
        router.push('/dashboard');
      } else {
        const res = await api.post('/auth/login', {
          email,
          password,
        });
        login(res.data.token, res.data.user, res.data.tenant);
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Falha na autenticação. Verifique suas credenciais e tente novamente.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      // Tenta registrar uma empresa demo se não existir, ou logar
      const demoEmail = 'demo@zapflow.io';
      const demoPass = 'ZapFlow@2026';
      try {
        const res = await api.post('/auth/login', {
          email: demoEmail,
          password: demoPass,
        });
        login(res.data.token, res.data.user, res.data.tenant);
        router.push('/dashboard');
      } catch {
        const res = await api.post('/auth/register', {
          email: demoEmail,
          password: demoPass,
          name: 'Lucas Gerente',
          companyName: 'ZapFlow Comércio Demo',
        });
        login(res.data.token, res.data.user, res.data.tenant);
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError('Erro ao iniciar sessão demo: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Decorativo */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-emerald-500/10 to-transparent blur-3xl pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="flex justify-center items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-emerald-500/30">
            ⚡
          </div>
          <span className="text-3xl font-black tracking-tight text-white">ZapFlow</span>
        </div>
        <h2 className="text-center text-sm font-medium text-slate-400">
          Plataforma Segura de Campanhas e Automação de WhatsApp
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        <div className="bg-slate-800/80 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-700/60">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {isRegister && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Seu Nome Completo
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Lucas Silva"
                    className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Nome da Empresa
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Ex: Minha Loja Oficial"
                    className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                E-mail Corporativo
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@empresa.com"
                className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Senha
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                'Processando...'
              ) : isRegister ? (
                <>
                  Criar Conta e Espaço <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  Entrar no ZapFlow <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-700/60 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="text-xs text-center text-slate-400 hover:text-emerald-400 font-medium transition-colors"
            >
              {isRegister
                ? 'Já tem uma conta? Clique para entrar'
                : 'Não tem conta? Cadastre sua empresa em 1 minuto'}
            </button>

            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-slate-700/50 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-600/50 flex items-center justify-center gap-2 transition-all"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Acesso Rápido de Demonstração
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Isolamento Multi-Tenant por Criptografia & JWT</span>
        </div>
      </div>
    </div>
  );
}
