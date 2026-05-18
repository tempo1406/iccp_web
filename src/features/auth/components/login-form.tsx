'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ROUTES } from '@/common/constant/routes';
import { createLoginSchema } from '../validation/auth.schema';
import type { LoginInput } from '../validation/auth.schema';
import { useLogin } from '../hooks/use-login';

export function LoginForm() {
  const t = useTranslations('auth.login');
  const tValidation = useTranslations('auth.validation');
  const { login, isPending } = useLogin();

  const form = useForm<LoginInput>({
    resolver: zodResolver(createLoginSchema(tValidation)) as any,
    defaultValues: { email: '', password: '', rememberMe: false },
  });

  return (
    <Card className="border-0 shadow-none lg:border lg:shadow-sm">
      <CardHeader className="space-y-1 text-center lg:text-left">
        <CardTitle className="text-3xl font-bold tracking-tight">{t('title')}</CardTitle>
        <CardDescription className="text-base">{t('description')}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <form className="space-y-4" onSubmit={form.handleSubmit((v) => login(v))}>
          <div className="space-y-2">
            <Label htmlFor="email">{t('emailLabel')}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t('emailPlaceholder')}
              className="h-12"
              {...form.register('email')}
            />
            {form.formState.errors.email && (
              <p className="text-destructive text-sm">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t('passwordLabel')}</Label>
            <PasswordInput
              id="password"
              placeholder="********"
              className="h-12"
              {...form.register('password')}
            />
            {form.formState.errors.password && (
              <p className="text-destructive text-sm">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          <Link
            href={ROUTES.forgotPassword}
            className="text-sm font-semibold text-[#1337ec] hover:text-[#0f2cb8]"
          >
            {t('forgotPassword')}
          </Link>

          <Button
            type="submit"
            className="mt-2 h-12 w-full bg-[#1337ec] hover:bg-[#0f2cb8]"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('submitting')}
              </>
            ) : (
              t('submit')
            )}
          </Button>
        </form>

        <p className="text-muted-foreground text-center text-sm">
          {t('registerPrompt')}{' '}
          <Link
            href={ROUTES.register}
            className="font-semibold text-[#1337ec] hover:text-[#0f2cb8]"
          >
            {t('registerLink')}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
