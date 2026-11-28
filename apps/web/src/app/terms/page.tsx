'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, FileText, CheckCircle2, Lock, Scale } from 'lucide-react';

export default function TermsPage() {
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
            Conformidade Legal
          </span>
        </div>

        <div className="mt-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-100/60 rounded-2xl text-emerald-700">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Termos de Uso do Serviço
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Última atualização: Novembro de 2026 • Em conformidade com o Marco Civil da Internet e CDC
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 prose prose-slate max-w-none text-xs sm:text-sm leading-relaxed space-y-6 text-slate-600">
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              1. Identificação do Fornecedor e Objeto
            </h2>
            <p>
              O <strong>ZapFlow</strong> é uma plataforma SaaS multitenant de automação e orquestração de comunicações via WhatsApp e E-mail, desenvolvida para possibilitar que empresas gerenciem suas listas de transmissão, contatos e réguas de relacionamento de forma profissional e segura.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              2. Uso Aceitável e Política Anti-Spam
            </h2>
            <p>
              O Usuário concorda expressamente em utilizar o ZapFlow apenas para comunicações legítimas com contatos que forneceram consentimento prévio e inequívoco (Opt-In). É terminantemente proibido:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Envio de mensagens não solicitadas (SPAM) ou aquisição de listas de contatos de terceiros.</li>
              <li>Disseminação de conteúdos discriminatórios, fraudulentos, vírus ou materiais ilícitos.</li>
              <li>Tentativas de engenharia reversa, violação de segurança ou sobrecarga das APIs (Rate Limiting).</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              3. Planos, Cobranças e Política de Reembolso (CDC)
            </h2>
            <p>
              Nos termos do <strong>Artigo 49 do Código de Defesa do Consumidor (Lei nº 8.078/1990)</strong>, o contratante tem direito de arrependimento e cancelamento com reembolso integral dos valores pagos em até <strong>7 (sete) dias corridos</strong> após a contratação inicial.
            </p>
            <p>
              O cancelamento das assinaturas pode ser realizado a qualquer momento diretamente no painel do usuário, sem taxas adicionais de rescisão ou cláusulas de fidelidade involuntárias.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              4. Níveis de Serviço e Responsabilidades
            </h2>
            <p>
              O ZapFlow emprega práticas recomendadas de segurança em nuvem (criptografia TLS/HTTPS, hashing de senhas com bcrypt, isolamento estrito de tenants e controle de taxa). O ZapFlow não se responsabiliza por bloqueios ou restrições impostas por operadoras ou pela Meta em caso de descumprimento das diretrizes de mensageria pelo usuário.
            </p>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} ZapFlow Inc. Todos os direitos reservados.</p>
          <Link href="/privacy" className="font-semibold text-emerald-600 hover:underline">
            Ver Política de Privacidade (LGPD) →
          </Link>
        </div>
      </div>
    </div>
  );
}
