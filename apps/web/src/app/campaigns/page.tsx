'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Send,
  PlusCircle,
  CheckCircle2,
  Eye,
  AlertCircle,
  Clock,
  ShieldCheck,
  Smartphone,
  ChevronRight,
  Filter,
  RefreshCw,
  X,
  Users,
} from 'lucide-react';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);

  // Form states
  const [name, setName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchData = async () => {
    try {
      const [campRes, templRes, contRes] = await Promise.all([
        api.get('/campaigns'),
        api.get('/whatsapp/templates'),
        api.get('/contacts'),
      ]);
      setCampaigns(campRes.data);
      setTemplates(templRes.data);
      setContacts(contRes.data);
      if (templRes.data.length > 0 && !selectedTemplate) {
        setSelectedTemplate(templRes.data[0].id);
      }
    } catch (err) {
      console.error('Erro ao carregar campanhas', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Atualiza a cada 4 segundos para refletir o envio e status assíncrono
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      await api.post('/campaigns', {
        name,
        templateName: selectedTemplate,
      });

      setShowCreateModal(false);
      setName('');
      fetchData();
    } catch (err: any) {
      alert('Erro ao disparar campanha: ' + (err.response?.data?.message || err.message));
    } finally {
      setCreating(false);
    }
  };

  const handleOpenDetails = async (id: string) => {
    try {
      const res = await api.get(`/campaigns/${id}`);
      setSelectedCampaign(res.data);
    } catch (err: any) {
      alert('Erro ao buscar detalhes da campanha: ' + err.message);
    }
  };

  const activeTemplate = templates.find((t) => t.id === selectedTemplate);
  const eligibleContacts = contacts.filter((c) => c.consentStatus === 'OPT_IN');
  const optOutCount = contacts.filter((c) => c.consentStatus === 'OPT_OUT').length;

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Campanhas & Disparos WhatsApp
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Crie transmissões segmentadas, acompanhe entregas e analise a taxa de leitura.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-md shadow-emerald-200 flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Criar Nova Campanha</span>
        </button>
      </div>

      {/* Lista de Campanhas */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-medium">Carregando histórico...</div>
        ) : campaigns.length === 0 ? (
          <div className="p-12 text-center">
            <Send className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700">Nenhuma campanha criada</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Clique em "Criar Nova Campanha" para disparar sua primeira comunicação homologada.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {campaigns.map((c) => {
              const isProcessing = c.status === 'PROCESSING';
              const isCompleted = c.status === 'COMPLETED';
              const deliveryPercent =
                c.sentCount > 0 ? Math.round((c.deliveredCount / c.sentCount) * 100) : 0;
              const readPercent =
                c.deliveredCount > 0 ? Math.round((c.readCount / c.deliveredCount) * 100) : 0;

              return (
                <div
                  key={c.id}
                  className="p-6 hover:bg-slate-50/70 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                >
                  <div className="space-y-1.5 max-w-md">
                    <div className="flex items-center gap-2.5">
                      <h3 className="font-bold text-slate-900 text-base">{c.name}</h3>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                          isCompleted
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : isProcessing
                            ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {c.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-2">
                      <span>Template: <code className="font-mono text-slate-700">{c.templateName}</code></span>
                      <span>•</span>
                      <span>Criada em {new Date(c.createdAt).toLocaleDateString('pt-BR')} às {new Date(c.createdAt).toLocaleTimeString('pt-BR')}</span>
                    </p>
                  </div>

                  {/* Métricas da Campanha */}
                  <div className="grid grid-cols-4 gap-4 sm:gap-8 text-center">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Destinatários
                      </span>
                      <span className="text-lg font-bold text-slate-800">{c.totalCount}</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Enviadas
                      </span>
                      <span className="text-lg font-bold text-blue-600">{c.sentCount}</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Entregues
                      </span>
                      <span className="text-lg font-bold text-emerald-600">
                        {c.deliveredCount}{' '}
                        <span className="text-[11px] font-normal text-slate-400">
                          ({deliveryPercent}%)
                        </span>
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Lidas
                      </span>
                      <span className="text-lg font-bold text-indigo-600">
                        {c.readCount}{' '}
                        <span className="text-[11px] font-normal text-slate-400">
                          ({readPercent}%)
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Ação */}
                  <div>
                    <button
                      onClick={() => handleOpenDetails(c.id)}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-1.5 w-full lg:w-auto justify-center"
                    >
                      <span>Ver Destinatários</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Criação de Campanha */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Send className="w-5 h-5 text-emerald-600" />
                Criar Nova Campanha de WhatsApp
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-6 mt-5">
              {/* Nome */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Nome Identificador da Campanha
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Lembrete Especial de Fim de Semana"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Seleção do Template */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Escolha o Template Aprovado pela Meta
                </label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* Prévia do Balão de WhatsApp */}
              {activeTemplate && (
                <div>
                  <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Prévia do Visual no WhatsApp do Cliente
                  </span>
                  <div className="p-4 rounded-2xl bg-[#efeae2] border border-slate-200 max-w-sm mx-auto shadow-inner">
                    <div className="bg-white p-3.5 rounded-2xl rounded-tl-sm shadow-sm text-xs text-slate-800 leading-relaxed font-sans relative">
                      <p>{activeTemplate.body.replace('{{1}}', 'Lucas').replace('{{2}}', 'desconto de 20%')}</p>
                      <span className="block text-[10px] text-slate-400 text-right mt-1.5">
                        12:30 ✓✓
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Proteção LGPD e Audiência */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-emerald-600" />
                    Destinatários Elegíveis:
                  </span>
                  <span className="text-emerald-700 font-extrabold text-sm">
                    {eligibleContacts.length} contatos
                  </span>
                </div>
                {optOutCount > 0 && (
                  <p className="text-[11px] text-amber-700 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span>
                      {optOutCount} contato(s) da lista de supressão (Opt-Out) foram excluídos
                      automaticamente para proteger sua conta contra bloqueios.
                    </span>
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating || eligibleContacts.length === 0}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-md shadow-emerald-200 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {creating ? 'Enfileirando...' : 'Iniciar Disparo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Detalhes dos Destinatários */}
      {selectedCampaign && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-100 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">{selectedCampaign.name}</h2>
                <p className="text-xs text-slate-500">
                  Total de destinatários: {selectedCampaign.recipients?.length || 0}
                </p>
              </div>
              <button
                onClick={() => setSelectedCampaign(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 mt-4">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider sticky top-0">
                  <tr>
                    <th className="py-2.5 px-4">Destinatário</th>
                    <th className="py-2.5 px-4">Telefone</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4">WAMID (Meta ID)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {selectedCampaign.recipients?.map((r: any) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-bold text-slate-900">{r.contactName}</td>
                      <td className="py-2.5 px-4 font-mono text-slate-600">{r.phone}</td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                            r.status === 'READ'
                              ? 'bg-indigo-50 text-indigo-700'
                              : r.status === 'DELIVERED'
                              ? 'bg-emerald-50 text-emerald-700'
                              : r.status === 'SENT'
                              ? 'bg-blue-50 text-blue-700'
                              : r.status === 'FAILED'
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[10px] text-slate-400 truncate max-w-[200px]">
                        {r.externalMessageId || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedCampaign(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
