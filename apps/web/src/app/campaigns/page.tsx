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
  Mail,
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
  const [channel, setChannel] = useState<'WHATSAPP' | 'EMAIL'>('WHATSAPP');
  const [emailSubject, setEmailSubject] = useState('');
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
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      await api.post('/campaigns', {
        name,
        channel,
        emailSubject: channel === 'EMAIL' ? (emailSubject || 'Novidades e Ofertas Exclusivas ZapFlow') : undefined,
        templateName: channel === 'EMAIL' ? 'email_promocional' : selectedTemplate,
      });

      setShowCreateModal(false);
      setName('');
      setEmailSubject('');
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
  
  // Destinatários elegíveis conforme canal
  const eligibleContacts = contacts.filter((c) => {
    if (channel === 'EMAIL') {
      return Boolean(c.email) && c.consentStatus !== 'OPT_OUT';
    }
    return c.consentStatus === 'OPT_IN';
  });

  const optOutCount = contacts.filter((c) => c.consentStatus === 'OPT_OUT').length;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Campanhas & Disparos
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Transmissões em massa, entregabilidade e estatísticas de engajamento.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-200 flex items-center justify-center gap-2 transition-all w-full sm:w-auto"
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
                  className="p-4 sm:p-6 hover:bg-slate-50/70 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6"
                >
                  <div className="space-y-1 max-w-md">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base">{c.name}</h3>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-1 ${
                          c.channel === 'EMAIL'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {c.channel === 'EMAIL' ? (
                          <>
                            <Mail className="w-3 h-3" />
                            <span>E-mail</span>
                          </>
                        ) : (
                          <>
                            <Smartphone className="w-3 h-3" />
                            <span>WhatsApp</span>
                          </>
                        )}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
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
                    <p className="text-[11px] sm:text-xs text-slate-500">
                      {c.channel === 'EMAIL' ? (
                        <>Assunto: <span className="font-medium text-slate-700">{c.emailSubject || 'Oferta ZapFlow'}</span></>
                      ) : (
                        <>Template: <code className="font-mono text-slate-700">{c.templateName}</code></>
                      )}
                    </p>
                  </div>

                  {/* Métricas da Campanha em Grid Responsivo */}
                  <div className="grid grid-cols-4 gap-2 sm:gap-6 text-center bg-slate-50 lg:bg-transparent p-3 lg:p-0 rounded-xl">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Destinatários
                      </span>
                      <span className="text-sm sm:text-lg font-bold text-slate-800">{c.totalCount}</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Enviadas
                      </span>
                      <span className="text-sm sm:text-lg font-bold text-blue-600">{c.sentCount}</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Entregues
                      </span>
                      <span className="text-sm sm:text-lg font-bold text-emerald-600">
                        {c.deliveredCount}
                        <span className="text-[10px] font-normal text-slate-400 hidden sm:inline">
                          {' '}({deliveryPercent}%)
                        </span>
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Lidas
                      </span>
                      <span className="text-sm sm:text-lg font-bold text-indigo-600">
                        {c.readCount}
                        <span className="text-[10px] font-normal text-slate-400 hidden sm:inline">
                          {' '}({readPercent}%)
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Ação */}
                  <div>
                    <button
                      onClick={() => handleOpenDetails(c.id)}
                      className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-1.5 w-full lg:w-auto justify-center"
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

      {/* Modal de Criação de Campanha (Totalmente Responsivo) */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-5 sm:p-7 shadow-2xl border border-slate-100 my-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-100">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <Send className="w-5 h-5 text-emerald-600" />
                Nova Campanha Multicanal
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-4 sm:space-y-5 mt-4">
              {/* Seletor de Canal */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Canal de Transmissão
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setChannel('WHATSAPP')}
                    className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all text-left ${
                      channel === 'WHATSAPP'
                        ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${channel === 'WHATSAPP' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold">WhatsApp</p>
                      <p className="text-[10px] text-slate-400">Taxa de abertura 98%</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setChannel('EMAIL')}
                    className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all text-left ${
                      channel === 'EMAIL'
                        ? 'border-purple-500 bg-purple-50/50 text-purple-900 ring-2 ring-purple-500/20'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${channel === 'EMAIL' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold">E-mail (Brevo)</p>
                      <p className="text-[10px] text-slate-400">300 disparos/dia free</p>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Nome da Campanha
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Oferta Especial de Sexta"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {channel === 'EMAIL' ? (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Assunto do E-mail (Subject)
                    </label>
                    <input
                      type="text"
                      required
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder="Ex: 🔥 Chegou sua condição exclusiva no ZapFlow!"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Prévia do Email */}
                  <div>
                    <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Prévia do E-mail Promocional (com Opt-Out LGPD)
                    </span>
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
                      <div className="border-b border-slate-200 pb-2">
                        <span className="font-semibold text-slate-900">De:</span> ZapFlow &lt;contato@zapflow.io&gt;<br />
                        <span className="font-semibold text-slate-900">Assunto:</span> {emailSubject || '🔥 Novidades e Ofertas Exclusivas'}
                      </div>
                      <p>Olá, <strong>[Nome do Cliente]</strong>!</p>
                      <p>Temos uma oportunidade especial preparada para você hoje. Aproveite condições exclusivas de lançamento.</p>
                      <div className="pt-3 border-t border-slate-200 text-[10px] text-slate-400">
                        🛡️ Você recebeu esta comunicação porque autorizou o recebimento de e-mails. Para cancelar sua inscrição, responda SAIR ou gerencie seu consentimento.
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Modelo de Mensagem / Template
                    </label>
                    <select
                      value={selectedTemplate}
                      onChange={(e) => setSelectedTemplate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
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
                      <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Prévia da Mensagem no Celular
                      </span>
                      <div className="p-3.5 sm:p-4 rounded-2xl bg-[#efeae2] border border-slate-200 max-w-sm mx-auto shadow-inner">
                        <div className="bg-white p-3 rounded-2xl rounded-tl-sm shadow-sm text-xs text-slate-800 leading-relaxed font-sans">
                          <p>{activeTemplate.body.replace('{{1}}', 'Cliente').replace('{{2}}', 'desconto exclusivo')}</p>
                          <span className="block text-[10px] text-slate-400 text-right mt-1.5">
                            12:30 ✓✓
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Proteção LGPD e Audiência */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
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
                  <p className="text-[11px] text-amber-700 flex items-start gap-1.5 leading-tight">
                    <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <span>
                      {optOutCount} contato(s) com Opt-Out foram excluídos para proteger seu número.
                    </span>
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating || eligibleContacts.length === 0}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-200 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {creating ? 'Disparando...' : 'Iniciar Disparo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Detalhes dos Destinatários (Responsivo) */}
      {selectedCampaign && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl border border-slate-100 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">{selectedCampaign.name}</h2>
                <p className="text-[11px] sm:text-xs text-slate-500">
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

            <div className="overflow-y-auto flex-1 mt-3">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider sticky top-0">
                  <tr>
                    <th className="py-2 px-3">Destinatário</th>
                    <th className="py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {selectedCampaign.recipients?.map((r: any) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3">
                        <p className="font-bold text-slate-900">{r.contactName}</p>
                        <p className="font-mono text-[11px] text-slate-500">{r.phone}</p>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] ${
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
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
