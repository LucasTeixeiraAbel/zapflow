'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  Send,
  CheckCircle,
  Eye,
  Users,
  Smartphone,
  TrendingUp,
  PlusCircle,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  ChevronRight,
  Mail,
} from 'lucide-react';

export default function DashboardPage() {
  const { tenant } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/analytics/dashboard');
      setData(res.data);
    } catch (err) {
      console.error('Erro ao carregar dashboard', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[350px]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
          <p className="text-xs sm:text-sm text-slate-500 font-medium">Carregando métricas da empresa...</p>
        </div>
      </div>
    );
  }

  const { contacts, messages, recentCampaigns, whatsapp } = data || {
    contacts: { total: 0, optIn: 0, optOut: 0, consentRate: 100 },
    messages: { totalMessages: 0, sentMessages: 0, deliveredMessages: 0, readMessages: 0, failedMessages: 0, deliveryRate: 0, readRate: 0 },
    recentCampaigns: [],
    whatsapp: { provider: 'SIMULATED', status: 'CONNECTED', qualityRating: 'GREEN', phone: '+55 11 98888-7777' },
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Cabeçalho da Página com Boas-Vindas e Ações */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Painel Geral de Campanhas
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Entregabilidade, leituras e status dos canais em tempo real.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setRefreshing(true);
              fetchDashboard();
            }}
            disabled={refreshing}
            className="p-2 sm:p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs sm:text-sm font-medium transition-all shadow-sm flex items-center gap-1.5"
            title="Atualizar dados"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-600' : ''}`} />
            <span>Atualizar</span>
          </button>

          <Link
            href="/campaigns"
            className="px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-200 flex items-center gap-2 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nova Campanha</span>
          </Link>
        </div>
      </div>

      {/* Banner de Status da Conexão WhatsApp */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg border border-emerald-900/40">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 flex-shrink-0">
            <Smartphone className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-xs sm:text-sm">Canal: {whatsapp.phone}</span>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {whatsapp.provider === 'SIMULATED'
                  ? 'Simulador Ativo'
                  : whatsapp.provider === 'EVOLUTION_API'
                  ? 'Gateway QR Code'
                  : 'Meta Cloud API'}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5">
              Qualidade da Linha:{' '}
              <span className="text-emerald-400 font-bold uppercase">
                {whatsapp.qualityRating} (Excelente - Risco Baixo)
              </span>
            </p>
          </div>
        </div>

        <Link
          href="/whatsapp"
          className="text-xs font-semibold px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-colors w-fit flex items-center gap-1.5 self-start sm:self-auto"
        >
          Configurar Canais <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Grid de 4 Cards de Métricas Principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
        {/* Total Enviadas */}
        <div className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
              Enviadas
            </span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 sm:mt-3">
            {messages.sentMessages}
          </p>
          <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1 truncate">Total acumulado</p>
        </div>

        {/* Taxa de Entrega */}
        <div className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
              Entrega
            </span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 mt-2 sm:mt-3">
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">{messages.deliveryRate}%</p>
            <span className="text-[10px] sm:text-xs text-emerald-600 font-bold hidden sm:inline">
              {messages.deliveredMessages} entregues
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 sm:mt-3 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${messages.deliveryRate}%` }}
            ></div>
          </div>
        </div>

        {/* Taxa de Leitura */}
        <div className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
              Leitura
            </span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 mt-2 sm:mt-3">
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">{messages.readRate}%</p>
            <span className="text-[10px] sm:text-xs text-indigo-600 font-bold hidden sm:inline">
              {messages.readMessages} lidas
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 sm:mt-3 overflow-hidden">
            <div
              className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${messages.readRate}%` }}
            ></div>
          </div>
        </div>

        {/* Base de Contatos */}
        <div className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
              Contatos
            </span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 mt-2 sm:mt-3">
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">{contacts.total}</p>
            <span className="text-[10px] sm:text-xs text-emerald-600 font-bold">{contacts.consentRate}% Opt-in</span>
          </div>
          <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1 truncate">
            {contacts.optOut} opt-outs
          </p>
        </div>
      </div>

      {/* Campanhas Recentes (Adaptadas para Mobile e Desktop) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4 sm:mb-5">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">Campanhas Recentes</h2>
            <p className="text-[11px] sm:text-xs text-slate-500">
              Acompanhamento de entregas dos últimos envios.
            </p>
          </div>
          <Link
            href="/campaigns"
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            <span>Ver todas</span> <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentCampaigns.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl">
            <Send className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs sm:text-sm font-semibold text-slate-700">Nenhuma campanha disparada ainda</p>
            <Link
              href="/campaigns"
              className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Criar Campanha Agora
            </Link>
          </div>
        ) : (
          <>
            {/* Visualização em Cards para Mobile */}
            <div className="block md:hidden divide-y divide-slate-100">
              {recentCampaigns.map((c: any) => {
                const isCompleted = c.status === 'COMPLETED';
                const isProcessing = c.status === 'PROCESSING';

                return (
                  <div key={c.id} className="py-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-800">{c.name}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          isCompleted
                            ? 'bg-emerald-50 text-emerald-700'
                            : isProcessing
                            ? 'bg-amber-50 text-amber-700 animate-pulse'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {c.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-center bg-slate-50 p-2.5 rounded-xl text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Total</span>
                        <span className="font-bold text-slate-800">{c.totalCount}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Enviadas</span>
                        <span className="font-bold text-blue-600">{c.sentCount}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Entregues</span>
                        <span className="font-bold text-emerald-600">{c.deliveredCount}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Lidas</span>
                        <span className="font-bold text-indigo-600">{c.readCount}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Visualização Desktop em Tabela */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="pb-3">Nome da Campanha</th>
                    <th className="pb-3">Template</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-center">Total</th>
                    <th className="pb-3 text-center">Enviadas</th>
                    <th className="pb-3 text-center">Entregues</th>
                    <th className="pb-3 text-center">Lidas</th>
                    <th className="pb-3 text-center">Falhas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {recentCampaigns.map((c: any) => {
                    const isProcessing = c.status === 'PROCESSING';
                    const isCompleted = c.status === 'COMPLETED';

                    return (
                      <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 font-bold text-slate-800">{c.name}</td>
                        <td className="py-3.5 text-xs text-slate-500 font-mono">
                          {c.templateName}
                        </td>
                        <td className="py-3.5">
                          <span
                            className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase ${
                              isCompleted
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : isProcessing
                                ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td className="py-3.5 text-center text-slate-700">{c.totalCount}</td>
                        <td className="py-3.5 text-center text-blue-600 font-bold">{c.sentCount}</td>
                        <td className="py-3.5 text-center text-emerald-600 font-bold">
                          {c.deliveredCount}
                        </td>
                        <td className="py-3.5 text-center text-indigo-600 font-bold">
                          {c.readCount}
                        </td>
                        <td className="py-3.5 text-center text-rose-600 font-bold">{c.failedCount}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
