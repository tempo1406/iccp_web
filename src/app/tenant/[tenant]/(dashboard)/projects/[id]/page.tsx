'use client';

import { use, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface Props {
  params: Promise<{ tenant: string; id: string }>;
}

export default function ProjectDetailIndexPage({ params }: Props) {
  use(params);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    router.replace(`${pathname}/dashboard`);
  }, [pathname, router]);

  return null;
}
