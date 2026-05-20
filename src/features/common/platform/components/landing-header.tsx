'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { Moon, Network, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import { ROUTES } from '@/common/constant/routes';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { scrollToLandingSection } from '../utils/landing-scroll';
import { useLandingAuth } from '../hooks/use-landing-auth';

const navItems = [
  { key: 'capabilities', href: '#capabilities' },
  { key: 'ragEngine', href: '#rag-engine' },
  { key: 'liveDemo', href: '#live-demo' },
  { key: 'billing', href: '#pricing' },
] as const;

type LandingNavHref = (typeof navItems)[number]['href'];

export function LandingHeader() {
  const t = useTranslations('landing.header');
  const tCommon = useTranslations('common.header');
  const { resolvedTheme, setTheme } = useTheme();
  const { isLoggedIn } = useLandingAuth();
  const navRef = useRef<HTMLElement | null>(null);
  const navLinkRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeHref, setActiveHref] = useState<LandingNavHref>(navItems[0].href);
  const scrollLockRef = useRef(false);
  const [indicatorStyle, setIndicatorStyle] = useState({
    left: 0,
    width: 0,
    opacity: 0,
  });

  useEffect(() => {
    let animationFrameId = 0;

    const updateActiveSection = () => {
      setIsScrolled(window.scrollY > 16);

      if (scrollLockRef.current) return;

      const scrollAnchor = window.scrollY + 148;
      let nextActiveHref: LandingNavHref = navItems[0].href;

      for (const item of navItems) {
        const sectionId = item.href.slice(1);
        const section = document.getElementById(sectionId);
        if (!section) continue;

        if (scrollAnchor >= section.offsetTop) {
          nextActiveHref = item.href;
        }
      }

      setActiveHref((currentHref) =>
        currentHref === nextActiveHref ? currentHref : nextActiveHref,
      );
    };

    const handleViewportChange = () => {
      if (animationFrameId) return;
      animationFrameId = window.requestAnimationFrame(() => {
        animationFrameId = 0;
        updateActiveSection();
      });
    };

    updateActiveSection();
    window.addEventListener('scroll', handleViewportChange, { passive: true });
    window.addEventListener('resize', handleViewportChange);

    return () => {
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }
      window.removeEventListener('scroll', handleViewportChange);
      window.removeEventListener('resize', handleViewportChange);
    };
  }, []);

  useEffect(() => {
    let animationFrameId = 0;

    const updateIndicator = () => {
      const navElement = navRef.current;
      const activeElement = navLinkRefs.current[activeHref];
      if (!navElement || !activeElement) {
        setIndicatorStyle((currentStyle) =>
          currentStyle.opacity === 0
            ? currentStyle
            : { ...currentStyle, opacity: 0 },
        );
        return;
      }

      const navRect = navElement.getBoundingClientRect();
      const activeRect = activeElement.getBoundingClientRect();
      const nextStyle = {
        left: activeRect.left - navRect.left,
        width: activeRect.width,
        opacity: 1,
      };

      setIndicatorStyle((currentStyle) =>
        currentStyle.left === nextStyle.left &&
          currentStyle.width === nextStyle.width &&
          currentStyle.opacity === nextStyle.opacity
          ? currentStyle
          : nextStyle,
      );
    };

    const handleResize = () => {
      if (animationFrameId) return;
      animationFrameId = window.requestAnimationFrame(() => {
        animationFrameId = 0;
        updateIndicator();
      });
    };

    updateIndicator();
    window.addEventListener('resize', handleResize);

    return () => {
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [activeHref]);

  const handleSectionLinkClick =
    (href: LandingNavHref) => (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      setActiveHref(href);
      scrollLockRef.current = true;
      setTimeout(() => {
        scrollLockRef.current = false;
      }, 800);

      if (!scrollToLandingSection(href)) {
        window.location.hash = href;
      }
    };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${isScrolled
        ? 'border-border/80 bg-background/90 shadow-[0_12px_30px_rgba(15,23,42,0.12)]'
        : 'border-border/60 bg-background/78'
        }`}
    >
      <div
        className={`mx-auto flex max-w-7xl items-center justify-between px-6 transition-[height] duration-300 lg:px-8 ${isScrolled ? 'h-[60px]' : 'h-16'
          }`}
      >
        <Link href={ROUTES.home} className="flex items-center gap-2">
          <div className="bg-primary/15 text-primary flex h-8 w-8 items-center justify-center rounded-md">
            <Network className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">ICCP</span>
        </Link>

        <nav
          ref={navRef}
          className={`relative hidden items-center gap-2 rounded-full p-1 md:flex ${isScrolled ? 'bg-background/88 shadow-sm' : 'bg-background/72'
            }`}
        >
          <span
            aria-hidden="true"
            className="bg-primary/12 pointer-events-none absolute inset-y-1 rounded-full border border-primary/10 shadow-[0_10px_30px_rgba(15,23,42,0.08)] transition-[left,width,opacity] duration-300 ease-out"
            style={{
              left: indicatorStyle.left,
              width: indicatorStyle.width,
              opacity: indicatorStyle.opacity,
            }}
          />
          {navItems.map((item) => (
            <a
              key={item.href}
              ref={(element) => {
                navLinkRefs.current[item.href] = element;
              }}
              className={`relative z-10 rounded-full px-4 py-2 text-sm font-medium transition-colors ${activeHref === item.href
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
                }`}
              href={item.href}
              onClick={handleSectionLinkClick(item.href)}
            >
              {t(`nav.${item.key}`)}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden md:block">
            <LanguageSwitcher triggerClassName="h-10 w-[150px] min-w-[150px]" />
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            aria-label={tCommon('toggleTheme')}
          >
            <Sun className="h-4 w-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
            <Moon className="absolute h-4 w-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
          </Button>
          {isLoggedIn ? (
            <Button asChild>
              <Link href={ROUTES.dashboard}>{t('dashboard')}</Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" asChild className="hidden sm:inline-flex">
                <Link href={ROUTES.login}>{t('login')}</Link>
              </Button>
              <Button asChild>
                <Link href={ROUTES.login}>{t('getStarted')}</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
