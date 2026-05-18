'use client';
import { BrainCircuit, FileText, Table2 } from 'lucide-react';

export function LandingHero3DVisual() {
  return (
    <div className="lp3d-root relative flex h-[500px] w-full items-center justify-center">
      <div className="bg-primary/20 dark:bg-primary/20 absolute inset-0 scale-75 rounded-full blur-[100px]" />

      <div
        className="lp3d-orbit-ring lp3d-orbit-reverse h-[300px] w-[300px]"
        style={{ transform: 'translate(-50%, -50%) rotateX(60deg) rotateY(-10deg)' }}
      />
      <div
        className="lp3d-orbit-ring lp3d-orbit h-[450px] w-[450px]"
        style={{ transform: 'translate(-50%, -50%) rotateX(70deg) rotateY(10deg)' }}
      />

      <div className="lp3d-sphere lp3d-pulse-glow group relative z-10 flex h-48 w-48 items-center justify-center rounded-full">
        <BrainCircuit className="h-16 w-16 text-white/80 transition-transform duration-500 group-hover:scale-110" />
        <div className="border-primary/40 dark:border-primary/60 absolute inset-0 animate-ping rounded-full border opacity-30 dark:opacity-45" />
      </div>

      <div
        className="lp3d-float absolute top-[10%] left-[10%]"
        style={{ animationDelay: '0s' }}
      >
        <div className="lp3d-glass-panel flex items-center gap-2 rounded-xl p-3 shadow-lg shadow-cyan-300/5">
          <FileText className="h-4 w-4 text-red-400" />
          <div className="bg-muted/90 h-2 w-16 overflow-hidden rounded-full">
            <div className="bg-primary/70 h-full w-full animate-pulse" />
          </div>
        </div>
        <div className="from-primary/75 absolute top-1/2 left-full h-px w-24 origin-left rotate-[25deg] bg-gradient-to-r to-transparent" />
      </div>

      <div
        className="lp3d-float absolute right-[5%] bottom-[20%]"
        style={{ animationDelay: '2s' }}
      >
        <div className="lp3d-glass-panel flex items-center gap-2 rounded-xl p-3 shadow-lg shadow-cyan-300/5">
          <FileText className="h-4 w-4 text-blue-400" />
          <div className="flex flex-col gap-1">
            <div className="bg-muted/90 h-1.5 w-12 rounded-full" />
            <div className="bg-muted/90 h-1.5 w-8 rounded-full" />
          </div>
        </div>
        <div className="from-primary/75 absolute top-1/2 right-full h-px w-32 origin-right rotate-[-15deg] bg-gradient-to-l to-transparent" />
      </div>

      <div
        className="lp3d-float absolute top-[20%] right-[15%]"
        style={{ animationDelay: '4s' }}
      >
        <div className="lp3d-glass-panel flex items-center gap-2 rounded-xl p-3 shadow-lg shadow-cyan-300/5">
          <Table2 className="h-4 w-4 text-green-400" />
          <div className="bg-muted/90 h-2 w-16 overflow-hidden rounded-full">
            <div className="bg-primary/70 h-full w-2/3 animate-pulse" />
          </div>
        </div>
        <div className="to-primary/75 absolute bottom-0 left-0 h-px w-20 origin-right rotate-[45deg] bg-gradient-to-r from-transparent" />
      </div>

      <style jsx>{`
        .lp3d-root {
          transform-style: preserve-3d;
          perspective: 1000px;
        }

        .lp3d-glass-panel {
          background: hsl(var(--card) / 0.92);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid hsl(var(--primary) / 0.34);
          box-shadow: 0 12px 30px hsl(var(--primary) / 0.14);
        }

        .lp3d-orbit-ring {
          position: absolute;
          top: 50%;
          left: 50%;
          border-radius: 50%;
          border: 1px solid hsl(var(--primary) / 0.34);
        }

        .lp3d-sphere {
          background: radial-gradient(
            circle at 30% 30%,
            hsl(var(--primary) / 0.9) 0%,
            hsl(var(--primary) / 0.45) 52%,
            hsl(var(--background) / 1) 100%
          );
          box-shadow:
            inset -20px -20px 60px rgba(0, 0, 0, 0.5),
            0 0 52px hsl(var(--primary) / 0.5);
        }

        .lp3d-pulse-glow {
          animation: lp3d-pulse-glow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        .lp3d-orbit {
          opacity: 0.35;
          animation: lp3d-orbit 10s linear infinite;
        }

        .lp3d-orbit-reverse {
          opacity: 0.48;
          animation: lp3d-orbit-reverse 15s linear infinite;
        }

        .lp3d-float {
          animation: lp3d-float 6s ease-in-out infinite;
        }

        :global(.dark) .lp3d-glass-panel {
          background: hsl(var(--card) / 0.9);
          border-color: hsl(var(--primary) / 0.4);
          box-shadow: 0 14px 36px hsl(var(--primary) / 0.18);
        }

        :global(.dark) .lp3d-orbit-ring {
          border-color: hsl(var(--primary) / 0.42);
        }

        :global(.dark) .lp3d-orbit {
          opacity: 0.42;
        }

        :global(.dark) .lp3d-orbit-reverse {
          opacity: 0.56;
        }

        :global(.dark) .lp3d-sphere {
          box-shadow:
            inset -18px -18px 56px rgba(0, 0, 0, 0.6),
            0 0 72px hsl(var(--primary) / 0.62);
        }

        @keyframes lp3d-pulse-glow {
          0%,
          100% {
            box-shadow: 0 0 20px 0 hsl(var(--primary) / 0.3);
          }
          50% {
            box-shadow: 0 0 60px 10px hsl(var(--primary) / 0.6);
          }
        }

        @keyframes lp3d-orbit {
          0% {
            transform: translate(-50%, -50%) rotateX(70deg) rotateY(10deg) rotate(360deg);
          }
          100% {
            transform: translate(-50%, -50%) rotateX(70deg) rotateY(10deg) rotate(0deg);
          }
        }

        @keyframes lp3d-orbit-reverse {
          0% {
            transform: translate(-50%, -50%) rotateX(60deg) rotateY(-10deg) rotate(0deg);
          }
          100% {
            transform: translate(-50%, -50%) rotateX(60deg) rotateY(-10deg) rotate(360deg);
          }
        }

        @keyframes lp3d-float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-20px);
          }
        }
      `}</style>
    </div>
  );
}
