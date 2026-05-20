import { Space_Grotesk } from 'next/font/google';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
});

export function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${spaceGrotesk.className} bg-background text-foreground relative min-h-screen`}
    >
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_0%,hsl(var(--primary)/0.2),transparent_35%),radial-gradient(circle_at_80%_40%,hsl(var(--primary)/0.15),transparent_40%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,hsl(var(--border)/0.3)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.3)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000_60%,transparent_100%)] bg-[size:40px_40px]" />
      {children}
    </div>
  );
}
