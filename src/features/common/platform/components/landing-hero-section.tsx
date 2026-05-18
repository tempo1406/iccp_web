'use client';

import Link from 'next/link';
import { useEffect, useRef, type MouseEvent } from 'react';
import { useTranslations } from 'next-intl';
import {
  ArrowRight,
  BadgeDollarSign,
  Code2,
  PlayCircle,
  Scale,
  UsersRound,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { scrollToLandingSection } from '../utils/landing-scroll';

const heroAvatars = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBoR_AuDUJN3iK1SWPfW9M68gpc5BBuHhhdst031KB2K_5iiMWN9DttftdxHkZPmQtbIiup0oxcLf7yKA4gsejAxHtElCqUpqpsNt1gUdNgbRU4st9w5DTonkxldWdnV7auCjphgXNvecrC8zF5hxokAz-Bn4FU3JbeyxvGIssV6Acsfq1UUnqPzjEnvvH7qL2DIaQPHr7Fred2Rf7Dlr1WOoMdp6Sal53wB8wvGmeyIb3zGYBC229nwZcLMbOuo_tMgu373xbyxao',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuB0UBB98I_Cb4RRF6sN6KNBxznFpNHs59ajo9SqrVUlBKv5hl2N0HC1_ICisu8zdo3lnOyRlBjm2GBRf-W56t9edIEUXzkNHgzd5feF_G3iHCaPCEXsC-UXVTsLeJboCpVnoF55LwFMJusQyDbiK1FwGWl9i8n0R25pEvqQvFEoqy7yjxTFsKsD9oH6wu_2QaqwpPbwbdVxmu2WdcOnio2YmXpHykL9niOwnnCwBplbok9OTTkaMscSTnvC8fZBymAQonCw_fBtc-4',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCeuYpGtfkjXM5av2ilb60Nub6_zWT8ChHPmGwaUWlxZqXxdwQDeP7_BqTE209fBdvkKfKRmX9cVoAQk0kH9YD4qM7wwxQBdFfotB9-rdscozoh5d8o95CgJzKM3Kx-bIgd7QDneWqnA4-wBeFYLGMYX_4dITv4omGeDP_wHrYlP85h87j446BhdpJiSju29n2YWSomw7Y-FzvIZ8h6dZ3Vchm2yNNqo_7fbuSTAYWRN3PxlVDdScpUgbqGX89aLhAs2J8w5ZPJyxM',
];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
}

const PARTICLE_COUNT = 90;
const CONNECTION_DISTANCE = 130;

export function LandingHeroSection() {
  const t = useTranslations('landing.hero');
  const heroCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleWatchDemoClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();

    if (!scrollToLandingSection('#live-demo')) {
      window.location.hash = '#live-demo';
    }
  };

  useEffect(() => {
    const root = document.documentElement;
    const canvas = heroCanvasRef.current;
    const ctx = canvas?.getContext('2d');

    if (!canvas || !ctx) {
      return;
    }

    let animationFrameId = 0;
    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    let isDarkTheme = root.classList.contains('dark');

    const initParticles = () => {
      particles = Array.from({ length: PARTICLE_COUNT }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        size: Math.random() * 1.8 + 0.6,
      }));
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initParticles();
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      const particlePrimary = isDarkTheme ? '#00f2ff' : '#0284c7';
      const particleSecondary = isDarkTheme ? '#7000ff' : '#7c3aed';
      const connectionColor = isDarkTheme ? '0, 242, 255' : '14, 116, 144';

      const glow = ctx.createRadialGradient(
        width * 0.72,
        height * 0.55,
        0,
        width * 0.72,
        height * 0.55,
        360,
      );
      glow.addColorStop(
        0,
        isDarkTheme ? 'rgba(0, 242, 255, 0.12)' : 'rgba(59, 130, 246, 0.24)',
      );
      glow.addColorStop(
        1,
        isDarkTheme ? 'rgba(10, 14, 23, 0)' : 'rgba(238, 244, 255, 0)',
      );
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i += 1) {
        const p = particles[i];

        p.x += p.vx;
        p.y += p.vy;

        if (p.x <= 0 || p.x >= width) {
          p.vx *= -1;
        }
        if (p.y <= 0 || p.y >= height) {
          p.vy *= -1;
        }

        ctx.fillStyle = i % 2 === 0 ? particlePrimary : particleSecondary;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        for (let j = i + 1; j < particles.length; j += 1) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const distance = Math.hypot(dx, dy);

          if (distance < CONNECTION_DISTANCE) {
            ctx.strokeStyle = `rgba(${connectionColor}, ${(1 - distance / CONNECTION_DISTANCE) * 0.65})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      animationFrameId = window.requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener('resize', resize);

    const themeObserver = new MutationObserver(() => {
      isDarkTheme = root.classList.contains('dark');
    });
    themeObserver.observe(root, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      themeObserver.disconnect();
    };
  }, []);

  return (
    <section id="hero" className="relative overflow-hidden scroll-mt-24 py-20 lg:py-28">
      <div className="pointer-events-none absolute inset-0 bg-[rgba(239,246,255,0.9)] dark:bg-[rgba(5,8,16,0.88)]" />
      <div className="hero-gradient-overlay pointer-events-none absolute inset-0" />
      <canvas
        ref={heroCanvasRef}
        className="pointer-events-none absolute inset-0 z-[2] h-full w-full opacity-80"
      />

      <div className="pointer-events-none absolute inset-0 z-[3] hidden lg:block">
        <div className="lh3d-float absolute top-[22%] left-[56%]">
          <div className="lh3d-card border-cyan-300/30">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-cyan-400/15 text-cyan-300">
              <UsersRound className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold tracking-wide">{t('floatingCards.hrHub')}</span>
          </div>
        </div>

        <div className="lh3d-float absolute top-[62%] left-[55%]" style={{ animationDelay: '1.5s' }}>
          <div className="lh3d-card border-violet-300/30">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-violet-400/15 text-violet-300">
              <BadgeDollarSign className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold tracking-wide">{t('floatingCards.finance')}</span>
          </div>
        </div>

        <div className="lh3d-float absolute top-[24%] left-[79%]" style={{ animationDelay: '3s' }}>
          <div className="lh3d-card border-cyan-300/30">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-cyan-400/15 text-cyan-300">
              <Code2 className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold tracking-wide">{t('floatingCards.itOps')}</span>
          </div>
        </div>

        <div className="lh3d-float absolute top-[70%] left-[76%]" style={{ animationDelay: '4.5s' }}>
          <div className="lh3d-card border-violet-300/30">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-violet-400/15 text-violet-300">
              <Scale className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold tracking-wide">{t('floatingCards.legalAi')}</span>
          </div>
        </div>

        <div className="lh3d-ring absolute top-[42%] left-[63%] h-64 w-64 -translate-x-1/2 -translate-y-1/2 border-cyan-300/25" />
        <div
          className="lh3d-ring absolute top-[72%] left-[80%] h-80 w-80 -translate-x-1/2 -translate-y-1/2 border-violet-300/20"
          style={{ animationDirection: 'reverse', animationDuration: '20s' }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        <div className="max-w-3xl space-y-8 text-slate-900 dark:text-white">
          <Badge
            className="rounded-full border-sky-200 bg-white/80 px-3 py-1 text-xs text-slate-700 dark:border-white/15 dark:bg-white/10 dark:text-white"
          >
            {t('badge')}
          </Badge>

          <div className="space-y-4">
            <h1 className="text-5xl leading-[1.05] font-bold tracking-tight lg:text-7xl">
              {t('titleBefore')}{' '}
              <span className="from-primary bg-gradient-to-r to-cyan-400 bg-clip-text text-transparent">
                {t('titleHighlight')}
              </span>{' '}
              {t('titleAfter')}
            </h1>
            <p className="max-w-xl text-lg text-slate-600 dark:text-slate-300">
              {t('description')}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button size="lg" className="text-white" asChild>
              <Link href="/login" className="gap-2">
                {t('primaryCta')}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="gap-2 border-slate-300 bg-white/80 text-slate-800 hover:bg-white dark:border-white/20 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
              asChild
            >
              <Link href="#live-demo" onClick={handleWatchDemoClick}>
                <PlayCircle className="h-5 w-5" />
                {t('secondaryCta')}
              </Link>
            </Button>
          </div>

          <div className="flex items-center gap-4 border-t border-slate-300/70 pt-6 dark:border-white/10">
            <div className="flex -space-x-2">
              {heroAvatars.map((avatar, index) => (
                <div
                  key={avatar}
                  className="h-8 w-8 rounded-full border-2 border-[#eaf2ff] bg-cover dark:border-[#050810]"
                  style={{
                    backgroundImage: `url('${avatar}')`,
                    zIndex: heroAvatars.length - index,
                  }}
                />
              ))}
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {t('trustedByPrefix')}{' '}
              <span className="font-semibold text-slate-900 dark:text-white">
                {t('trustedByValue')}
              </span>{' '}
              {t('trustedBySuffix')}
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .hero-gradient-overlay {
          background:
            radial-gradient(circle at 70% 50%, rgba(139, 92, 246, 0.18), transparent 50%),
            radial-gradient(circle at 80% 85%, rgba(56, 189, 248, 0.2), transparent 45%);
        }

        .lh3d-card {
          height: 8.5rem;
          width: 8.5rem;
          border-radius: 1rem;
          border-width: 1px;
          background: rgba(255, 255, 255, 0.55);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          color: rgba(15, 23, 42, 0.85);
          box-shadow: 0 12px 24px rgba(56, 189, 248, 0.15);
        }

        .lh3d-ring {
          border-width: 1px;
          border-style: solid;
          border-radius: 9999px;
          animation: lh3d-spin-slow 12s linear infinite;
        }

        .lh3d-float {
          animation: lh3d-float 6s ease-in-out infinite;
        }

        :global(.dark) .hero-gradient-overlay {
          background:
            radial-gradient(circle at 70% 50%, rgba(112, 0, 255, 0.2), transparent 50%),
            radial-gradient(circle at 80% 85%, rgba(0, 242, 255, 0.14), transparent 45%);
        }

        :global(.dark) .lh3d-card {
          background: rgba(255, 255, 255, 0.03);
          color: rgba(255, 255, 255, 0.9);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.25);
        }

        @keyframes lh3d-float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-18px);
          }
        }

        @keyframes lh3d-spin-slow {
          from {
            transform: translate(-50%, -50%) rotate(0deg);
          }
          to {
            transform: translate(-50%, -50%) rotate(360deg);
          }
        }
      `}</style>
    </section>
  );
}
