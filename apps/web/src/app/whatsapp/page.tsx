'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Save,
  Key,
  Globe,
  Radio,
  FileCode2,
  QrCode,
  Server,
  RefreshCw,
  X,
  Mail,
  Send,
} from 'lucide-react';

export default function ChannelsPage() {
  const [activeTab, setActiveTab] = useState<'WHATSAPP' | 'EMAIL'>('WHATSAPP');

  // WhatsApp states
  const [connection, setConnection] = useState<any>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [provider, setProvider] = useState<'SIMULATED' | 'CLOUD_API' | 'EVOLUTION_API'>('SIMULATED');
  const [displayPhoneNumber, setDisplayPhoneNumber] = useState('');
  const [displayName, setDisplayName] = useState('');

  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [wabaId, setWabaId] = useState('');
  const [accessToken, setAccessToken] = useState('');

  const [evolutionUrl, setEvolutionUrl] = useState('');
  const [evolutionInstance, setEvolutionInstance] = useState('');
  const [evolutionApiKey, setEvolutionApiKey] = useState('');

  const [qrCodeModal, setQrCodeModal] = useState(false);
  const [qrCodeImage, setQrCodeImage] = useState<string | null>(null);
  const [loadingQr, setLoadingQr] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  const [alreadyConnected, setAlreadyConnected] = useState(false);

  // Email states (Brevo)
  const [emailConn, setEmailConn] = useState<any>(null);
  const [emailProvider, setEmailProvider] = useState<'SIMULATED' | 'BREVO'>('SIMULATED');
  const [senderEmail, setSenderEmail] = useState('');
  const [senderName, setSenderName] = useState('');
  const [brevoApiKey, setBrevoApiKey] = useState('');
  const [testEmailTo, setTestEmailTo] = useState('');
  const [sendingTest, setSendingTest] = useState(false);

  const loadData = async () => {
    try {
      const [connRes, templRes, emailRes] = await Promise.all([
        api.get('/whatsapp/connection'),
        api.get('/whatsapp/templates'),
        api.get('/email/connection'),
      ]);
      const conn = connRes.data;
      setConnection(conn);
      setTemplates(templRes.data);

      setProvider(conn.provider || 'SIMULATED');
      setDisplayPhoneNumber(conn.displayPhoneNumber || '+55 11 98888-7777');
      setDisplayName(conn.displayName || 'ZapFlow Oficial');

      if (conn.provider === 'EVOLUTION_API') {
        setEvolutionUrl(conn.phoneNumberId || '');
        setEvolutionInstance(conn.wabaId || '');
      } else {
        setPhoneNumberId(conn.phoneNumberId || '');
        setWabaId(conn.wabaId || '');
      }

      const eConn = emailRes.data;
      setEmailConn(eConn);
      setEmailProvider(eConn.provider || 'SIMULATED');
      setSenderEmail(eConn.senderEmail || 'contato@zapflow.io');
      setSenderName(eConn.senderName || 'ZapFlow');
    } catch (err) {
      console.error('Erro ao carregar dados dos canais', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);

    try {
      let payload: any = {
        provider,
        displayPhoneNumber,
        displayName,
      };

      if (provider === 'CLOUD_API') {
        payload.phoneNumberId = phoneNumberId;
        payload.wabaId = wabaId;
        if (accessToken) payload.accessToken = accessToken;
      } else if (provider === 'EVOLUTION_API') {
        payload.phoneNumberId = evolutionUrl;
        payload.wabaId = evolutionInstance;
        if (evolutionApiKey) payload.accessToken = evolutionApiKey;
      }

      const res = await api.put('/whatsapp/connection', payload);
      setConnection(res.data);
      setSuccessMsg('Configurações de WhatsApp salvas e ativadas!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      alert('Erro ao salvar conexão: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);

    try {
      const res = await api.put('/email/connection', {
        provider: emailProvider,
        senderEmail,
        senderName,
        apiKey: brevoApiKey || undefined,
      });
      setEmailConn(res.data);
      setSuccessMsg('Canal de E-mail Brevo salvo e ativado!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      alert('Erro ao salvar e-mail: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmailTo) {
      alert('Digite um e-mail para receber o teste');
      return;
    }
    setSendingTest(true);
    try {
      await api.post('/email/test', { toEmail: testEmailTo });
      alert('E-mail de teste enviado com sucesso!');
    } catch (err: any) {
      alert('Erro ao enviar teste: ' + (err.response?.data?.message || err.message));
    } finally {
      setSendingTest(false);
    }
  };

  const handleFetchQrCode = async () => {
    if (!evolutionUrl || !evolutionInstance || !evolutionApiKey) {
      alert('Preencha a URL da API, o Nome da Instância e a API Key antes de gerar o QR Code.');
      return;
    }

    setLoadingQr(true);
    setQrError(null);
    setQrCodeImage(null);
    setAlreadyConnected(false);
    setQrCodeModal(true);

    try {
      const res = await api.post('/whatsapp/evolution/qrcode', {
        apiUrl: evolutionUrl,
        instanceName: evolutionInstance,
        apiKey: evolutionApiKey,
      });

      if (res.data.alreadyConnected) {
        setAlreadyConnected(true);
      } else if (res.data.qrcode) {
        setQrCodeImage(res.data.qrcode);
      } else {
        setQrError(res.data.error || 'Não foi possível carregar o QR Code.');
      }
    } catch (err: any) {
      setQrError(err.response?.data?.message || err.message);
    } finally {
      setLoadingQr(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-slate-500 font-medium">Carregando canais de disparo...</div>;
  }

  return (
    <div className="space-y-6 sm:space-y-8 max-w-5xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Canais de Envio & Integrações
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Gerencie suas conexões de WhatsApp e configure o serviço de E-mail Marketing Brevo.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Abas Superiores: WhatsApp vs E-mail */}
      <div className="flex border-b border-slate-200 gap-4">
        <button
          onClick={() => setActiveTab('WHATSAPP')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'WHATSAPP'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>WhatsApp (QR Code & Meta)</span>
        </button>

        <button
          onClick={() => setActiveTab('EMAIL')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'EMAIL'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>E-mail Promocional (Brevo)</span>
        </button>
      </div>

      {/* ABA 1: WHATSAPP */}
      {activeTab === 'WHATSAPP' && (
        <div className="space-y-6 sm:space-y-8">
          {/* Grid com os 3 Provedores */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
            {/* Opção 1: Modo Simulado */}
            <div
              onClick={() => setProvider('SIMULATED')}
              className={`p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                provider === 'SIMULATED'
                  ? 'border-emerald-500 bg-emerald-50/40 shadow-md ring-2 ring-emerald-400/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-base">
                    🧪
                  </div>
                  <Radio className={`w-4 h-4 sm:w-5 sm:h-5 ${provider === 'SIMULATED' ? 'text-emerald-600' : 'text-slate-300'}`} />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Modo Simulado</h3>
                <span className="text-[11px] text-emerald-700 font-semibold block mt-0.5">Testes & Demonstração</span>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Ideal para testar sem custo. Simula entregas e leituras automáticas em tempo real.
                </p>
              </div>
            </div>

            {/* Opção 2: Evolution API / QR Code */}
            <div
              onClick={() => setProvider('EVOLUTION_API')}
              className={`p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                provider === 'EVOLUTION_API'
                  ? 'border-emerald-500 bg-emerald-50/40 shadow-md ring-2 ring-emerald-400/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                    <QrCode className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <Radio className={`w-4 h-4 sm:w-5 sm:h-5 ${provider === 'EVOLUTION_API' ? 'text-emerald-600' : 'text-slate-300'}`} />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Gateway QR Code</h3>
                <span className="text-[11px] text-purple-700 font-semibold block mt-0.5">Evolution API</span>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Conecte qualquer celular lendo o QR Code na tela. Sem taxas por envio da Meta.
                </p>
              </div>
            </div>

            {/* Opção 3: Meta WhatsApp Cloud API */}
            <div
              onClick={() => setProvider('CLOUD_API')}
              className={`p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                provider === 'CLOUD_API'
                  ? 'border-emerald-500 bg-emerald-50/40 shadow-md ring-2 ring-emerald-400/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <Radio className={`w-4 h-4 sm:w-5 sm:h-5 ${provider === 'CLOUD_API' ? 'text-emerald-600' : 'text-slate-300'}`} />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Meta Cloud API</h3>
                <span className="text-[11px] text-blue-700 font-semibold block mt-0.5">Oficial da Meta</span>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  API oficial corporativa com alta entregabilidade e suporte a templates homologados.
                </p>
              </div>
            </div>
          </div>

          {/* Formulário de Configuração WhatsApp */}
          <form onSubmit={handleSaveWhatsApp} className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-5">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
              Dados da Linha de WhatsApp
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Nome de Exibição
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Número Comercial com DDD
                </label>
                <input
                  type="text"
                  required
                  value={displayPhoneNumber}
                  onChange={(e) => setDisplayPhoneNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Configurações específicas para Evolution API / Gateway QR Code */}
            {provider === 'EVOLUTION_API' && (
              <div className="p-4 sm:p-5 rounded-xl bg-purple-50/50 border border-purple-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-purple-900 flex items-center gap-1.5">
                      <Server className="w-4 h-4 text-purple-600" />
                      Instância Evolution API
                    </h3>
                    <p className="text-[11px] sm:text-xs text-purple-700 mt-0.5">
                      Gere e escaneie o QR Code na tela para parear seu celular.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleFetchQrCode}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all w-full sm:w-auto"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Gerar / Escanear QR Code</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      URL da API
                    </label>
                    <input
                      type="text"
                      required
                      value={evolutionUrl}
                      onChange={(e) => setEvolutionUrl(e.target.value)}
                      placeholder="Ex: https://evolution-api-v2-3-8-d8mu.onrender.com"
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Nome da Instância
                    </label>
                    <input
                      type="text"
                      required
                      value={evolutionInstance}
                      onChange={(e) => setEvolutionInstance(e.target.value)}
                      placeholder="Ex: zapflow-comercial-01"
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    API Key de Acesso (AUTHENTICATION_API_KEY)
                  </label>
                  <input
                    type="password"
                    value={evolutionApiKey}
                    onChange={(e) => setEvolutionApiKey(e.target.value)}
                    placeholder="Chave configurada na Evolution API"
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm font-mono"
                  />
                </div>
              </div>
            )}

            {/* Configurações específicas para Meta Cloud API */}
            {provider === 'CLOUD_API' && (
              <div className="p-4 sm:p-5 rounded-xl bg-blue-50/50 border border-blue-200 space-y-4">
                <h3 className="text-xs sm:text-sm font-bold text-blue-900 flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-blue-600" />
                  Credenciais da Meta for Developers
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Phone Number ID
                    </label>
                    <input
                      type="text"
                      required
                      value={phoneNumberId}
                      onChange={(e) => setPhoneNumberId(e.target.value)}
                      placeholder="Ex: 1064829374928"
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      WABA ID
                    </label>
                    <input
                      type="text"
                      required
                      value={wabaId}
                      onChange={(e) => setWabaId(e.target.value)}
                      placeholder="Ex: 294827104928"
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Permanent System User Access Token
                  </label>
                  <input
                    type="password"
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    placeholder="EAAB..."
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm font-mono"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-200 flex items-center justify-center gap-2 transition-all w-full sm:w-auto disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Salvando...' : 'Salvar Provedor WhatsApp'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ABA 2: E-MAIL (BREVO) */}
      {activeTab === 'EMAIL' && (
        <div className="space-y-6 sm:space-y-8">
          {/* Seleção do Modo de E-mail */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              onClick={() => setEmailProvider('SIMULATED')}
              className={`p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                emailProvider === 'SIMULATED'
                  ? 'border-emerald-500 bg-emerald-50/40 shadow-md ring-2 ring-emerald-400/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    🧪
                  </div>
                  <Radio className={`w-4 h-4 sm:w-5 sm:h-5 ${emailProvider === 'SIMULATED' ? 'text-emerald-600' : 'text-slate-300'}`} />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Modo Simulado de E-mail</h3>
                <span className="text-[11px] text-emerald-700 font-semibold block mt-0.5">Testes Imediatos</span>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Permite criar campanhas de e-mail e simular disparos sem precisar de chave do Brevo.
                </p>
              </div>
            </div>

            <div
              onClick={() => setEmailProvider('BREVO')}
              className={`p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                emailProvider === 'BREVO'
                  ? 'border-emerald-500 bg-emerald-50/40 shadow-md ring-2 ring-emerald-400/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <Radio className={`w-4 h-4 sm:w-5 sm:h-5 ${emailProvider === 'BREVO' ? 'text-emerald-600' : 'text-slate-300'}`} />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Brevo (Sendinblue) Oficial</h3>
                <span className="text-[11px] text-blue-700 font-semibold block mt-0.5">300 envios/dia Grátis (~9.000/mês)</span>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Dispare e-mails promocionais reais com alta entregabilidade usando sua conta gratuita do Brevo.
                </p>
              </div>
            </div>
          </div>

          {/* Formulário de Configuração do Brevo */}
          <form onSubmit={handleSaveEmail} className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-5">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
              Configurações de Remetente de E-mail
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Nome do Remetente (Quem envia)
                </label>
                <input
                  type="text"
                  required
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="Ex: Minha Loja Oficial"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  E-mail do Remetente (Cadastrado no Brevo)
                </label>
                <input
                  type="email"
                  required
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  placeholder="Ex: contato@minhaempresa.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {emailProvider === 'BREVO' && (
              <div className="p-4 sm:p-5 rounded-xl bg-blue-50/50 border border-blue-200 space-y-3">
                <h3 className="text-xs sm:text-sm font-bold text-blue-900 flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-blue-600" />
                  Chave de API do Brevo (v3)
                </h3>
                <p className="text-xs text-blue-700">
                  Obtenha em: <em>app.brevo.com ➔ Configurações ➔ Chaves de API (SMTP & API)</em>.
                </p>

                <input
                  type="password"
                  value={brevoApiKey}
                  onChange={(e) => setBrevoApiKey(e.target.value)}
                  placeholder="xkeysib-..."
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm font-mono"
                />
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-200 flex items-center justify-center gap-2 transition-all w-full sm:w-auto disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Salvando...' : 'Salvar Canal de E-mail'}
              </button>
            </div>
          </form>

          {/* Teste de Disparo de E-mail */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <Send className="w-4 h-4 text-emerald-600" />
              Enviar E-mail de Teste
            </h2>
            <p className="text-xs text-slate-500">
              Valide se o canal de e-mail está funcionando disparando uma mensagem de validação agora.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={testEmailTo}
                onChange={(e) => setTestEmailTo(e.target.value)}
                placeholder="Digite seu e-mail para receber o teste..."
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={handleSendTestEmail}
                disabled={sendingTest}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <Mail className="w-4 h-4" />
                {sendingTest ? 'Enviando...' : 'Disparar Teste'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal QR Code */}
      {qrCodeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 sm:p-6 shadow-2xl border border-slate-100 text-center">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <QrCode className="w-4 h-4 text-purple-600" />
                Conectar WhatsApp via QR Code
              </h3>
              <button
                onClick={() => setQrCodeModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-6 flex flex-col items-center justify-center min-h-[260px]">
              {loadingQr ? (
                <div className="flex flex-col items-center gap-3">
                  <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
                  <p className="text-xs text-slate-500 font-medium">
                    Gerando QR Code na Evolution API...
                  </p>
                </div>
              ) : alreadyConnected ? (
                <div className="flex flex-col items-center gap-2 text-emerald-600">
                  <CheckCircle2 className="w-12 h-12" />
                  <p className="font-bold text-sm text-slate-800">Instância já Conectada!</p>
                  <p className="text-xs text-slate-500">
                    O WhatsApp já está autenticado e pronto para disparos.
                  </p>
                </div>
              ) : qrCodeImage ? (
                <div className="space-y-4">
                  <div className="p-3 bg-white border-2 border-purple-200 rounded-2xl shadow-md inline-block">
                    <img
                      src={qrCodeImage}
                      alt="WhatsApp QR Code"
                      className="w-52 h-52 sm:w-56 sm:h-56 object-contain rounded-lg"
                    />
                  </div>
                  <div className="text-xs text-slate-600 space-y-1">
                    <p className="font-bold text-slate-800">Como escanear:</p>
                    <p>1. Abra o WhatsApp no seu celular</p>
                    <p>2. Toque em <strong>Aparelhos Conectados</strong></p>
                    <p>3. Aponte a câmera para a tela</p>
                  </div>
                </div>
              ) : qrError ? (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-left">
                  <p className="font-bold mb-1 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" /> Erro ao carregar QR Code:
                  </p>
                  <p>{qrError}</p>
                </div>
              ) : null}
            </div>

            <button
              onClick={() => setQrCodeModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
