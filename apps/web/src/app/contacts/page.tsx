'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Users,
  UserPlus,
  Upload,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Trash2,
  Tag,
  Phone,
  FileSpreadsheet,
  X,
} from 'lucide-react';

export default function ContactsPage() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [saving, setSaving] = useState(false);

  // Import state
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  const fetchContacts = async () => {
    try {
      const res = await api.get('/contacts', {
        params: { search: search || undefined },
      });
      setContacts(res.data);
    } catch (err) {
      console.error('Erro ao buscar contatos', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchContacts();
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      await api.post('/contacts', {
        name,
        phone,
        email: email || undefined,
        tags,
        consentStatus: 'OPT_IN',
      });

      setShowAddModal(false);
      setName('');
      setPhone('');
      setEmail('');
      setTagsInput('');
      fetchContacts();
    } catch (err: any) {
      alert('Erro ao salvar contato: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleConsent = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'OPT_IN' ? 'OPT_OUT' : 'OPT_IN';
    try {
      await api.put(`/contacts/${id}/consent`, { consentStatus: newStatus });
      fetchContacts();
    } catch (err: any) {
      alert('Erro ao atualizar consentimento: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (id: string, contactName: string) => {
    if (!confirm(`Deseja realmente remover o contato ${contactName}?`)) return;
    try {
      await api.delete(`/contacts/${id}`);
      fetchContacts();
    } catch (err: any) {
      alert('Erro ao excluir contato: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleImportCsv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) return;

    setImporting(true);
    setImportResult(null);

    const formData = new FormData();
    formData.append('file', importFile);

    try {
      const res = await api.post('/contacts/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImportResult(res.data);
      fetchContacts();
    } catch (err: any) {
      alert('Erro ao importar CSV: ' + (err.response?.data?.message || err.message));
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Gestão de Contatos & Opt-Out
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Controle de audiência, consentimento LGPD e lista de supressão para WhatsApp.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setImportResult(null);
              setShowImportModal(true);
            }}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold shadow-sm flex items-center gap-2 transition-all"
          >
            <Upload className="w-4 h-4 text-slate-500" />
            <span>Importar CSV</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-md shadow-emerald-200 flex items-center gap-2 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Novo Contato</span>
          </button>
        </div>
      </div>

      {/* Barra de Pesquisa */}
      <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar contato por nome ou telefone..."
          className="w-full text-sm focus:outline-none bg-transparent placeholder-slate-400 text-slate-700"
        />
      </div>

      {/* Tabela de Contatos */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-medium">Carregando contatos...</div>
        ) : contacts.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700">Nenhum contato encontrado</p>
            <p className="text-xs text-slate-400 mt-1">
              Cadastre novos contatos ou importe uma planilha CSV para começar.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-6">Nome</th>
                  <th className="py-3 px-6">Telefone (E.164)</th>
                  <th className="py-3 px-6">Tags</th>
                  <th className="py-3 px-6">Consentimento LGPD</th>
                  <th className="py-3 px-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {contacts.map((c) => {
                  const isOptIn = c.consentStatus === 'OPT_IN';

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-6 font-bold text-slate-900">{c.name}</td>
                      <td className="py-3.5 px-6 font-mono text-xs text-slate-600 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {c.phone}
                      </td>
                      <td className="py-3.5 px-6">
                        <div className="flex flex-wrap gap-1">
                          {c.tags && c.tags.length > 0 ? (
                            c.tags.map((t: string, i: number) => (
                              <span
                                key={i}
                                className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium"
                              >
                                {t}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-300">—</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-6">
                        <button
                          onClick={() => handleToggleConsent(c.id, c.consentStatus)}
                          title="Clique para alternar consentimento"
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 transition-colors ${
                            isOptIn
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                          }`}
                        >
                          {isOptIn ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              <span>Opt-in Ativo</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5 text-rose-500" />
                              <span>Opt-out (Suprimido)</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <button
                          onClick={() => handleDelete(c.id, c.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Excluir contato"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Criação de Contato */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-600" />
                Adicionar Novo Contato
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateContact} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Nome do Contato
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Carlos Eduardo"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  WhatsApp com DDD
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ex: 11987654321 ou +5511987654321"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  E-mail (Opcional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="carlos@email.com"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Tags (Separadas por vírgula)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="VIP, Clientes Antigos, Black Friday"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-md shadow-emerald-200 transition-all disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : 'Salvar Contato'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Importação CSV */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                Importar Contatos via CSV
              </h2>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleImportCsv} className="space-y-4 mt-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                Envie uma planilha com cabeçalhos como <code className="font-mono font-bold">nome</code>,{' '}
                <code className="font-mono font-bold">telefone</code> (ou celular) e{' '}
                <code className="font-mono font-bold">tags</code>.
              </p>

              <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-emerald-500 transition-colors cursor-pointer bg-slate-50">
                <input
                  type="file"
                  accept=".csv"
                  required
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-500 cursor-pointer"
                />
              </div>

              {importResult && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 space-y-1">
                  <p className="font-bold">
                    Sucesso: {importResult.imported} contato(s) importados de {importResult.total}!
                  </p>
                  {importResult.errors && importResult.errors.length > 0 && (
                    <p className="text-rose-600">
                      {importResult.errors.length} linha(s) ignoradas por formato inválido.
                    </p>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Fechar
                </button>
                <button
                  type="submit"
                  disabled={importing || !importFile}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-md shadow-emerald-200 transition-all disabled:opacity-50"
                >
                  {importing ? 'Importando...' : 'Iniciar Importação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
