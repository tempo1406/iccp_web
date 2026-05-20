'use client';

import { useTranslations } from 'next-intl';
import { CloudUpload, FileText, MessageSquare, Upload } from 'lucide-react';

function IngestCard() {
  const t = useTranslations('landing.rag.cards');

  return (
    <div className="group relative flex flex-col">
      <div className="hover:border-primary/50 relative h-[320px] overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:shadow-[0_0_30px_-5px_rgba(var(--color-primary-rgb,19,55,236),0.15)] dark:border-slate-800 dark:bg-slate-900">
        <div className="rag-dot-grid absolute inset-0 opacity-10" />
        <div className="absolute top-4 left-4 z-20 rounded-full border border-slate-300 bg-white/80 px-3 py-1 font-mono text-xs text-slate-600 backdrop-blur dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300">
          {t('stepOne')}
        </div>

        <div className="relative flex h-full w-full items-center justify-center">
          <div className="relative z-20 flex h-12 w-48 translate-y-12 items-center justify-center rounded-lg border border-slate-300 bg-slate-100 shadow-xl dark:border-slate-700 dark:bg-slate-800">
            <div className="bg-primary absolute -top-px right-0 left-0 h-[2px] animate-pulse shadow-[0_0_15px_2px_rgba(19,55,236,0.8)]" />
            <div className="h-1 w-20 rounded-full bg-slate-400 dark:bg-slate-600" />
          </div>

          <div className="absolute flex -translate-y-8 animate-[rag-float_4s_ease-in-out_infinite] flex-col items-center gap-2">
            <div className="flex h-32 w-24 translate-y-4 -rotate-[6deg] flex-col gap-2 rounded border border-slate-300 bg-slate-100 p-2 shadow-lg">
              <div className="h-2 w-full rounded bg-slate-200" />
              <div className="h-2 w-2/3 rounded bg-slate-200" />
              <div className="mt-auto h-2 w-full rounded bg-slate-200" />
            </div>
            <div className="z-10 flex h-32 w-24 -translate-y-24 rotate-[3deg] flex-col gap-2 rounded border border-slate-300 bg-slate-50 p-2 shadow-lg">
              <div className="h-2 w-full rounded bg-slate-200" />
              <div className="h-2 w-3/4 rounded bg-slate-200" />
              <div className="h-2 w-1/2 rounded bg-slate-200" />
              <div className="mt-4 flex gap-1">
                <div className="text-primary flex h-6 w-6 items-center justify-center rounded-full bg-blue-100">
                  <FileText className="h-3 w-3" />
                </div>
              </div>
            </div>
          </div>

          <div className="absolute bottom-20 flex w-full justify-center gap-8 opacity-0 transition-opacity duration-700 group-hover:opacity-100">
            <Upload className="text-primary/40 h-5 w-5 animate-bounce delay-75" />
            <CloudUpload className="text-primary/40 h-5 w-5 animate-bounce delay-150" />
            <FileText className="text-primary/40 h-5 w-5 animate-bounce delay-300" />
          </div>
        </div>
      </div>

      <div className="mt-6 px-2">
        <div className="mb-2 flex items-center gap-3">
          <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-lg">
            <Upload className="h-4 w-4" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            {t('ingest.title')}
          </h3>
        </div>
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          {t('ingest.description')}
        </p>
      </div>
    </div>
  );
}

function ProcessCard() {
  const t = useTranslations('landing.rag.cards');

  return (
    <div className="group relative flex flex-col">
      <div className="flex justify-center py-4 text-slate-700 lg:hidden">
        <svg className="h-5 w-5 rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </div>

      <div className="hover:border-primary/50 relative h-[320px] overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:shadow-[0_0_30px_-5px_rgba(19,55,236,0.15)] dark:border-slate-800 dark:bg-slate-900">
        <div className="rag-dot-grid absolute inset-0 opacity-10" />
        <div className="absolute top-4 left-4 z-20 rounded-full border border-slate-300 bg-white/80 px-3 py-1 font-mono text-xs text-slate-600 backdrop-blur dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300">
          {t('stepTwo')}
        </div>

        <div className="relative flex h-full w-full items-center justify-center">
          <div className="border-primary relative z-20 flex h-16 w-16 animate-[rag-node-pulse_2s_infinite] items-center justify-center rounded-full border-2 bg-slate-100 shadow-[0_0_20px_rgba(19,55,236,0.4)] dark:bg-slate-800">
            <svg viewBox="0 0 24 24" fill="none" className="text-primary h-8 w-8" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1 1 .03 2.798-1.319 2.798H4.917c-1.347 0-2.317-1.799-1.319-2.798L5 14.5" />
            </svg>
          </div>

          <div className="absolute h-full w-full animate-[spin_10s_linear_infinite]">
            <div className="absolute top-1/4 left-1/4 h-3 w-3 rounded-full bg-white shadow-[0_0_10px_white]" />
            <div className="bg-primary absolute right-1/4 bottom-1/4 h-3 w-3 rounded-full shadow-[0_0_10px_#1337ec]" />
            <div className="absolute top-1/3 right-1/3 h-2 w-2 rounded-full bg-slate-400" />
          </div>

          <div className="absolute h-full w-full animate-[spin_15s_linear_infinite_reverse]">
            <div className="border-primary bg-primary/50 absolute bottom-1/3 left-1/3 h-4 w-4 rounded-full border backdrop-blur-sm" />
            <div className="absolute top-10 right-10 h-2 w-2 rounded-full bg-white/50" />
          </div>

          <svg className="pointer-events-none absolute inset-0 z-10 h-full w-full opacity-40">
            <line className="animate-pulse" stroke="#1337ec" strokeWidth="1" x1="50%" y1="50%" x2="25%" y2="25%" />
            <line className="animate-pulse" stroke="#1337ec" strokeWidth="1" x1="50%" y1="50%" x2="75%" y2="75%" strokeDasharray="4 4" />
            <line className="opacity-50" stroke="white" strokeWidth="1" strokeDasharray="4 4" x1="50%" y1="50%" x2="33%" y2="66%" />
          </svg>

          <div className="text-primary absolute bottom-4 left-4 animate-bounce rounded border border-slate-300 bg-white/90 px-2 py-1 font-mono text-[10px] dark:border-slate-700 dark:bg-slate-800/90">
            Vec[0.23, 0.91]
          </div>
          <div className="text-primary absolute top-4 right-4 animate-bounce rounded border border-slate-300 bg-white/90 px-2 py-1 font-mono text-[10px] delay-150 dark:border-slate-700 dark:bg-slate-800/90">
            Index: Active
          </div>
        </div>
      </div>

      <div className="mt-6 px-2">
        <div className="mb-2 flex items-center gap-3">
          <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-lg">
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t('process.title')}</h3>
        </div>
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          {t('process.description')}
        </p>
      </div>
    </div>
  );
}

function AnswerCard() {
  const t = useTranslations('landing.rag.cards');

  return (
    <div className="group relative flex flex-col">
      <div className="flex justify-center py-4 text-slate-700 lg:hidden">
        <svg className="h-5 w-5 rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </div>

      <div className="hover:border-primary/50 relative h-[320px] overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:shadow-[0_0_30px_-5px_rgba(19,55,236,0.15)] dark:border-slate-800 dark:bg-slate-900">
        <div className="rag-dot-grid absolute inset-0 opacity-10" />
        <div className="absolute top-4 left-4 z-20 rounded-full border border-slate-300 bg-white/80 px-3 py-1 font-mono text-xs text-slate-600 backdrop-blur dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300">
          {t('stepThree')}
        </div>

        <div className="relative flex h-full w-full flex-col items-center justify-center gap-4">
          <div className="max-w-[80%] self-start rounded-2xl rounded-tl-none border border-slate-300 bg-slate-100 px-4 py-2 text-xs text-slate-600 opacity-90 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:opacity-50">
            {t('answer.userQuestion')}
          </div>

          <div className="border-primary/40 bg-primary/10 dark:bg-primary/20 relative max-w-[90%] self-end rounded-2xl rounded-tr-none border px-4 py-3 text-xs text-slate-800 shadow-[0_0_15px_rgba(19,55,236,0.2)] dark:text-white">
            <p className="mb-2">{t('answer.assistantAnswer')}</p>
            <div className="mt-2 flex gap-2">
              <span className="border-primary/30 bg-primary/20 text-primary dark:bg-primary/30 rounded border px-1.5 py-0.5 text-[9px] dark:text-blue-200">
                {t('answer.citationOne')}
              </span>
              <span className="border-primary/30 bg-primary/20 text-primary dark:bg-primary/30 rounded border px-1.5 py-0.5 text-[9px] dark:text-blue-200">
                {t('answer.citationTwo')}
              </span>
            </div>
            <div className="absolute -top-3 -right-3 animate-[rag-sparkle_2s_ease-in-out_infinite] text-yellow-300">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                <path d="M12 2l1.6 4.8 4.8 1.6-4.8 1.6L12 14l-1.6-4.8L5.6 7.6l4.8-1.6L12 2z" />
              </svg>
            </div>
            <div className="text-primary absolute -bottom-2 -left-2 animate-[rag-sparkle_2.5s_ease-in-out_infinite_reverse]">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path d="M12 2l1.6 4.8 4.8 1.6-4.8 1.6L12 14l-1.6-4.8L5.6 7.6l4.8-1.6L12 2z" />
              </svg>
            </div>
          </div>

          <div className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 gap-1">
            <div className="bg-primary h-1.5 w-1.5 animate-bounce rounded-full" />
            <div className="bg-primary h-1.5 w-1.5 animate-bounce rounded-full delay-75" />
            <div className="bg-primary h-1.5 w-1.5 animate-bounce rounded-full delay-150" />
          </div>
        </div>
      </div>

      <div className="mt-6 px-2">
        <div className="mb-2 flex items-center gap-3">
          <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-lg">
            <MessageSquare className="h-4 w-4" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t('answer.title')}</h3>
        </div>
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          {t('answer.description')}
        </p>
      </div>
    </div>
  );
}

export function LandingHowRagWorks() {
  return (
    <div className="rag-root w-full px-4 pb-20 lg:px-10">
      <div className="relative mx-auto max-w-[1200px]">
        <div className="absolute top-[160px] left-0 hidden h-[2px] w-full lg:block">
          <div className="rag-flow-track h-full w-full animate-[rag-flow_1s_linear_infinite] opacity-30" />
        </div>

        <div className="relative z-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <IngestCard />
          <ProcessCard />
          <AnswerCard />
        </div>
      </div>

      <style>{`
        .rag-root {
          --rag-dot: #94a3b8;
          --rag-flow-dot: #94a3b8;
        }
        .dark .rag-root {
          --rag-dot: #334155;
          --rag-flow-dot: #334155;
        }
        .rag-dot-grid {
          background-image: radial-gradient(var(--rag-dot) 1px, transparent 1px);
          background-size: 20px 20px;
        }
        .rag-flow-track {
          background-image: linear-gradient(90deg, var(--rag-flow-dot) 50%, transparent 50%);
          background-repeat: repeat-x;
          background-size: 20px 2px;
        }
        @keyframes rag-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes rag-flow {
          0% { background-position: 0 0; }
          100% { background-position: 20px 0; }
        }
        @keyframes rag-sparkle {
          0%, 100% { opacity: 0.5; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes rag-node-pulse {
          0% { box-shadow: 0 0 0 0px rgba(19,55,236,0.4); }
          70% { box-shadow: 0 0 0 10px rgba(19,55,236,0); }
          100% { box-shadow: 0 0 0 0px rgba(19,55,236,0); }
        }
      `}</style>
    </div>
  );
}
