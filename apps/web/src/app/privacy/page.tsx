'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, Lock, CheckCircle2, UserCheck, Trash2 } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl p-6 sm:p-12 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between pb-6 border-b border-slate-100">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-500 hover:text-emerald-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao ZapFlow</span>
          </Link>
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
            LGPD (Lei 13.709/18)
          </span>
        </div>

        <div className="mt-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-100/60 rounded-2xl text-emerald-700">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Política de Privacidade & Proteção de Dados
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Transparência sobre coleta, tratamento e direitos dos titulares conforme a Lei Geral de Proteção de Dados.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 prose prose-slate max-w-none text-xs sm:text-sm leading-relaxed space-y-6 text-slate-600">
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              1. Papéis no Tratamento de Dados (Controlador vs Operador)
            </h2>
            <p>
              Em relação aos contatos cadastrados e às mensagens disparadas, o <strong>Usuário/Cliente do ZapFlow</strong> atua como <strong>Controlador</strong> dos dados pessoais, sendo responsável pela obtenção do consentimento ou pela definição da base legal adequada.
            </p>
            <p>
              O <strong>ZapFlow</strong> atua na qualidade de <strong>Operador</strong>, processando as informações exclusivamente para execução das rotinas de transmissão de mensagens contratadas.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              2. Princípio da Minimização de Dados e Finalidades
            </h2>
            <p>
              Coletamos e armazenamos apenas os dados estritamente necessários para a entrega dos serviços:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Dados de Conta:</strong> Nome, e-mail de login corporativo e credenciais criptografadas.</li>
              <li><strong>Dados de Destinatários:</strong> Nome, número de telefone e e-mail com status de consentimento explícito (OPT_IN / OPT_OUT).</li>
              <li><strong>Logs de Transmissão:</strong> Horário de envio, entrega e leitura para relatórios operacionais.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              3. Direitos dos Titulares e Exclusão de Dados (Direito ao Esquecimento)
            </h2>
            <p>
              Conforme o <strong>Art. 18 da LGPD</strong>, qualquer titular tem o direito de:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Solicitar a revogação do consentimento (Opt-Out imediato).</li>
              <li>Confirmar a existência de tratamento e acessar seus dados.</li>
              <li>Solicitar a eliminação completa e definitiva de seus registros através da plataforma.</li>
            </ul>
            <p className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-900 font-medium text-xs">
              💡 No ZapFlow, contatos com status "OPT_OUT" são automaticamente excluídos das campanhas para prevenir envios indevidos e proteger a reputação do remetente.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              4. Segurança da Informação e Criptografia
            </h2>
            <p>
              Adotamos medidas técnicas adequadas para proteger os dados contra acessos não autorizados:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Senhas tratadas com algoritmos de hash criptográfico com salt (Bcrypt).</li>
              <li>Toda a comunicação em trânsito é protegida com criptografia TLS 1.3 / HTTPS.</li>
              <li>Isolamento lógico multitenant com verificação de autorização em nível de banco de dados.</li>
              <li>Políticas de Rate Limiting para blindagem contra varreduras e ataques de força bruta.</li>
            </ul>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} ZapFlow Inc. Encarregado de Dados (DPO): dpo@zapflow.io</p>
          <Link href="/terms" className="font-semibold text-emerald-600 hover:underline">
            ← Ver Termos de Uso
          </Link>
        </div>
      </div>
    </div>
  );
}
