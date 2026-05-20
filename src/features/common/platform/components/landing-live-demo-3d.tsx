'use client';

import { useTranslations } from 'next-intl';
import { Bot, FileText, Loader2, Mic, PlusCircle, Table2 } from 'lucide-react';

export function LandingLiveDemo3D() {
  const t = useTranslations('landing.liveDemo');

  return (
    <div className="lp3d-live relative mx-auto max-w-4xl [--lp3d-cursor:#0284c7] dark:[--lp3d-cursor:#0df2f2]">
      <div className="from-primary absolute -inset-1 rounded-2xl bg-gradient-to-r to-blue-600 opacity-20 blur" />

      <div className="relative flex min-h-[500px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-2xl dark:border-white/10 dark:bg-[#0f1623]">
        <div className="flex items-center justify-between border-b border-slate-200 bg-white/80 px-6 py-4 dark:border-white/5 dark:bg-[#0a0f1e]">
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 rounded-full bg-red-500" />
            <div className="h-3 w-3 rounded-full bg-yellow-500" />
            <div className="h-3 w-3 rounded-full bg-green-500" />
          </div>
          <div className="font-mono text-xs text-slate-500">{t('sessionId')}</div>
        </div>

        <div className="flex flex-1 flex-col gap-8 overflow-hidden p-6 lg:p-10">
          <div className="ml-auto flex max-w-[80%] items-start gap-4">
            <div className="border-primary/20 bg-primary/10 flex-1 rounded-2xl rounded-tr-sm border p-4 text-right text-slate-900 dark:text-white">
              <p>{t('question')}</p>
            </div>
            <div
              className="h-10 w-10 shrink-0 rounded-full border border-slate-300 bg-cover dark:border-white/10"
              style={{
                backgroundImage:
                  "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDjx7xOqVENwhsLdXa_rKuoGKsIaxgp4iitsBdXnj344S9L8hkQC8E64NvIPYojKQcTRUttfUOdfAxS_vAvgxtng7oM_8vKU3PQJ0j6r5zd96pw-x9fOsyPtDrQB9JCjhkLVOvZienbVVA4Hlg35EyeRvQ75cw31ZDSyQCSrzDaF_PkDm8FMj9wp9W-TmNZ_dZSbbYyVQEfoaZvIash_YGh9Hzv1ncWkxAaPqEpddhoyGY_XamCERT7FmwZj6LJROrGJI1JX42CGI8')",
              }}
            />
          </div>

          <div className="ml-14 flex animate-pulse items-center gap-2 text-xs text-sky-700/80 dark:text-cyan-300/70">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{t('scanning')}</span>
          </div>

          <div className="flex max-w-[90%] items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-300 to-blue-600 shadow-lg shadow-cyan-300/20">
              <Bot className="h-4 w-4 text-white" />
            </div>

            <div className="flex-1">
              <div className="rounded-2xl rounded-tl-sm border border-slate-200 bg-white/80 p-6 text-slate-700 shadow-xl dark:border-white/5 dark:bg-[#131b2e] dark:text-slate-300">
                <div className="lp3d-typewriter text-sm leading-relaxed">
                  {t('answerBefore')}{' '}
                  <span className="font-bold text-slate-900 dark:text-white">
                    {t('answerHighlight')}
                  </span>{' '}
                  {t('answerAfter')}
                </div>

                <div className="lp3d-citations mt-4 flex flex-wrap gap-2">
                  <div className="group flex cursor-pointer items-center gap-2 rounded-lg border border-cyan-300/30 bg-sky-50 px-3 py-1.5 transition-colors hover:border-cyan-500 hover:bg-cyan-100 dark:border-cyan-300/20 dark:bg-[#1a2336] dark:hover:border-cyan-300 dark:hover:bg-cyan-300/20">
                    <FileText className="h-3 w-3 text-cyan-300" />
                    <span className="text-xs font-medium text-slate-800 dark:text-white">
                      Q3_Report_Final.pdf
                    </span>
                    <span className="text-[10px] text-slate-500 group-hover:text-cyan-700/70 dark:group-hover:text-cyan-300/70">
                      {t('citationOnePage')}
                    </span>
                  </div>
                  <div className="group flex cursor-pointer items-center gap-2 rounded-lg border border-cyan-300/30 bg-sky-50 px-3 py-1.5 transition-colors hover:border-cyan-500 hover:bg-cyan-100 dark:border-cyan-300/20 dark:bg-[#1a2336] dark:hover:border-cyan-300 dark:hover:bg-cyan-300/20">
                    <Table2 className="h-3 w-3 text-blue-400" />
                    <span className="text-xs font-medium text-slate-800 dark:text-white">
                      APAC_Sales_Data.xlsx
                    </span>
                    <span className="text-[10px] text-slate-500 group-hover:text-cyan-700/70 dark:group-hover:text-cyan-300/70">
                      {t('citationTwoPage')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 bg-white/80 p-4 dark:border-white/5 dark:bg-[#0a0f1e]">
          <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-white/5 dark:bg-[#0f1623]">
            <PlusCircle className="h-5 w-5 text-slate-400 dark:text-slate-600" />
            <div className="flex-1 text-sm text-slate-500 dark:text-slate-600">
              {t('followUpPlaceholder')}
            </div>
            <Mic className="h-5 w-5 text-slate-400 dark:text-slate-600" />
          </div>
        </div>
      </div>

      <style jsx>{`
        .lp3d-typewriter {
          display: inline-block;
          max-width: 100%;
          overflow: hidden;
          white-space: normal;
          animation: lp3d-typewriter 3s steps(60) forwards;
        }

        .lp3d-typewriter::after {
          content: '|';
          color: var(--lp3d-cursor);
          animation: lp3d-cursor-blink 1s step-end infinite;
        }

        .lp3d-citations {
          opacity: 0;
          animation: lp3d-pop-in 0.5s ease-out 2.5s forwards;
        }

        @keyframes lp3d-typewriter {
          from {
            width: 0;
          }
          to {
            width: 100%;
          }
        }

        @keyframes lp3d-cursor-blink {
          0%,
          49% {
            opacity: 1;
          }
          50%,
          100% {
            opacity: 0;
          }
        }

        @keyframes lp3d-pop-in {
          0% {
            opacity: 0;
            transform: scale(0.8) translateY(10px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
