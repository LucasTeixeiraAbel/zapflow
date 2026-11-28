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
} from 'lucide-react';

export default function WhatsAppConnectionPage() {
  const [connection, setConnection] = useState<any>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const [provider, setProvider] = useState<'SIMULATED' | 'CLOUD_API' | 'EVOLUTION_API'>('SIMULATED');
  const [displayPhoneNumber, setDisplayPhoneNumber] = useState('');
  const [displayName, setDisplayName] = useState('');

  // Meta Cloud API states
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [wabaId, setWabaId] = useState('');
  const [accessToken, setAccessToken] = useState('');

  // Evolution API states
  const [evolutionUrl, setEvolutionUrl] = useState('');
  const [evolutionInstance, setEvolutionInstance] = useState('');
  const [evolutionApiKey, setEvolutionApiKey] = useState('');

  // QR Code Modal State
  const [qrCodeModal, setQrCodeModal] = useState(false);
  const [qrCodeImage, setQrCodeImage] = useState<string | null>(null);
  const [loadingQr, setLoadingQr] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  const [alreadyConnected, setAlreadyConnected] = useState(false);

  const loadData = async () => {
    try {
      const [connRes, templRes] = await Promise.all([
        api.get('/whatsapp/connection'),
        api.get('/whatsapp/templates'),
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
    } catch (err) {
      console.error('Erro ao carregar dados do WhatsApp', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
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
      setSuccessMsg('Configurações do canal salvas e ativadas com sucesso!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      alert('Erro ao salvar conexão: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
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
        setQrError(res.data.error || 'Não foi possível carregar a imagem do QR Code.');
      }
    } catch (err: any) {
      setQrError(err.response?.data?.message || err.message);
    } finally {
      setLoadingQr(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-slate-500 font-medium">Carregando canal do WhatsApp...</div>;
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Canais & Provedores do WhatsApp
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Escolha a infraestrutura de envio ideal para o momento da sua empresa: Modo Simulado para testes,
          Gateway QR Code para agilidade sem tarifas ou a Meta Cloud API para grandes volumes oficiais.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Grid com os 3 Provedores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Opção 1: Modo Simulado */}
        <div
          onClick={() => setProvider('SIMULATED')}
          className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
            provider === 'SIMULATED'
              ? 'border-emerald-500 bg-emerald-50/40 shadow-md ring-2 ring-emerald-400/20'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg">
                🧪
              </div>
              <Radio className={`w-5 h-5 ${provider === 'SIMULATED' ? 'text-emerald-600' : 'text-slate-300'}`} />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Modo Simulado</h3>
            <span className="text-[11px] text-emerald-700 font-semibold block mt-0.5">Testes & Demonstração</span>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Ideal para testar sem custo. Gera entregas e leituras automáticas em tempo real.
            </p>
          </div>
        </div>

        {/* Opção 2: Evolution API / QR Code */}
        <div
          onClick={() => setProvider('EVOLUTION_API')}
          className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
            provider === 'EVOLUTION_API'
              ? 'border-emerald-500 bg-emerald-50/40 shadow-md ring-2 ring-emerald-400/20'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <QrCode className="w-5 h-5" />
              </div>
              <Radio className={`w-5 h-5 ${provider === 'EVOLUTION_API' ? 'text-emerald-600' : 'text-slate-300'}`} />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Gateway QR Code</h3>
            <span className="text-[11px] text-purple-700 font-semibold block mt-0.5">Evolution API / Z-API</span>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Conecte qualquer número escaneando um QR Code no celular. Sem tarifas por mensagem da Meta.
            </p>
          </div>
        </div>

        {/* Opção 3: Meta WhatsApp Cloud API */}
        <div
          onClick={() => setProvider('CLOUD_API')}
          className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
            provider === 'CLOUD_API'
              ? 'border-emerald-500 bg-emerald-50/40 shadow-md ring-2 ring-emerald-400/20'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <Globe className="w-5 h-5" />
              </div>
              <Radio className={`w-5 h-5 ${provider === 'CLOUD_API' ? 'text-emerald-600' : 'text-slate-300'}`} />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Meta Cloud API</h3>
            <span className="text-[11px] text-blue-700 font-semibold block mt-0.5">Oficial da Meta (Graph v21)</span>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              API oficial corporativa com alta entregabilidade, suporte a templates e escalabilidade industrial.
            </p>
          </div>
        </div>
      </div>

      {/* Formulário de Configuração Dinâmico */}
      <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
          Dados do Canal Conectado
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Nome de Exibição
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Número Comercial WhatsApp
            </label>
            <input
              type="text"
              required
              value={displayPhoneNumber}
              onChange={(e) => setDisplayPhoneNumber(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Configurações específicas para Evolution API / Gateway QR Code */}
        {provider === 'EVOLUTION_API' && (
          <div className="p-5 rounded-xl bg-purple-50/50 border border-purple-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-purple-900 flex items-center gap-2">
                  <Server className="w-4 h-4 text-purple-600" />
                  Parâmetros da sua Instância Evolution API
                </h3>
                <p className="text-xs text-purple-700 mt-0.5">
                  Conecte à sua Evolution API e escaneie o QR Code diretamente nesta tela.
                </p>
              </div>

              <button
                type="button"
                onClick={handleFetchQrCode}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all self-start sm:self-auto"
              >
                <QrCode className="w-4 h-4" />
                <span>Gerar / Escanear QR Code</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  URL da API (Endpoint)
                </label>
                <input
                  type="text"
                  required
                  value={evolutionUrl}
                  onChange={(e) => setEvolutionUrl(e.target.value)}
                  placeholder="Ex: https://evolution-api-v2-3-8-d8mu.onrender.com"
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Nome da Instância Conectada
                </label>
                <input
                  type="text"
                  required
                  value={evolutionInstance}
                  onChange={(e) => setEvolutionInstance(e.target.value)}
                  placeholder="Ex: zapflow-comercial-01"
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm font-mono"
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
                placeholder="Insira a chave de segurança configurada na Evolution API"
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm font-mono"
              />
            </div>
          </div>
        )}

        {/* Configurações específicas para Meta Cloud API */}
        {provider === 'CLOUD_API' && (
          <div className="p-5 rounded-xl bg-blue-50/50 border border-blue-200 space-y-4">
            <h3 className="text-sm font-bold text-blue-900 flex items-center gap-2">
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
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  WABA ID (WhatsApp Business Account ID)
                </label>
                <input
                  type="text"
                  required
                  value={wabaId}
                  onChange={(e) => setWabaId(e.target.value)}
                  placeholder="Ex: 294827104928"
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm font-mono"
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
                placeholder="Insira o token permanente (EAAB...)"
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm font-mono"
              />
            </div>
          </div>
        )}

        <div className="flex justify-end pt-3">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-200 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Salvando...' : 'Salvar e Ativar Provedor'}
          </button>
        </div>
      </form>

      {/* Modal Interativo de Escaneamento de QR Code */}
      {qrCodeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center">
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
                    O WhatsApp desta instância já está autenticado e pronto para disparos.
                  </p>
                </div>
              ) : qrCodeImage ? (
                <div className="space-y-4">
                  <div className="p-3 bg-white border-2 border-purple-200 rounded-2xl shadow-md inline-block">
                    {/* Imagem do QR Code Base64 */}
                    <img
                      src={qrCodeImage}
                      alt="WhatsApp QR Code"
                      className="w-56 h-56 object-contain rounded-lg"
                    />
                  </div>
                  <div className="text-xs text-slate-600 space-y-1">
                    <p className="font-bold text-slate-800">Como escanear:</p>
                    <p>1. Abra o WhatsApp no seu celular</p>
                    <p>2. Toque em <strong>Aparelhos Conectados</strong></p>
                    <p>3. Toque em <strong>Conectar aparelho</strong> e aponte para a tela</p>
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

      {/* Catálogo de Templates Homologados */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
          <FileCode2 className="w-5 h-5 text-emerald-600" />
          Templates de Comunicação Compatíveis
        </h2>
        <p className="text-xs text-slate-500 mb-5">
          Estes modelos de mensagens funcionam perfeitamente nos três provedores (Simulado, QR Code e Meta API).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((t) => (
            <div key={t.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-slate-800">{t.name}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase">
                  {t.category}
                </span>
              </div>
              <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-lg text-xs text-slate-700 leading-relaxed font-sans mb-2">
                {t.body}
              </div>
              <div className="text-[11px] text-slate-500 flex items-center justify-between">
                <span>Identificador: <code className="font-mono text-slate-700">{t.id}</code></span>
                <span>Idioma: {t.language}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
