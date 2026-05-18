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
import { createRegisterSchema } from '../validation/auth.schema';
import type { RegisterInput } from '../validation/auth.schema';
import { useRegister } from '../hooks/use-register';

export function RegisterForm() {
  const t = useTranslations('auth.register');
  const tValidation = useTranslations('auth.validation');
  const { register: registerUser, isPending } = useRegister();

  const form = useForm<RegisterInput>({
    resolver: zodResolver(createRegisterSchema(tValidation)) as any,
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '' },
  });

  return (
    <Card className="border-0 shadow-none lg:border lg:shadow-sm">
      <CardHeader className="space-y-1 text-center lg:text-left">
        <CardTitle className="text-3xl font-bold tracking-tight">{t('title')}</CardTitle>
        <CardDescription className="text-base">{t('description')}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <form className="space-y-4" onSubmit={form.handleSubmit((v) => registerUser(v))}>
          <div className="space-y-2">
            <Label htmlFor="fullName">{t('fullNameLabel')}</Label>
            <Input
              id="fullName"
              type="text"
              placeholder={t('fullNamePlaceholder')}
              className="h-12"
              {...form.register('fullName')}
            />
            {form.formState.errors.fullName && (
              <p className="text-destructive text-sm">
                {form.formState.errors.fullName.message}
              </p>
            )}
          </div>

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
              placeholder={t('passwordPlaceholder')}
              className="h-12"
              {...form.register('password')}
            />
            {form.formState.errors.password && (
              <p className="text-destructive text-sm">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t('confirmPasswordLabel')}</Label>
            <PasswordInput
              id="confirmPassword"
              placeholder={t('confirmPasswordPlaceholder')}
              className="h-12"
              {...form.register('confirmPassword')}
            />
            {form.formState.errors.confirmPassword && (
              <p className="text-destructive text-sm">
                {form.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>

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
          {t('loginPrompt')}{' '}
          <Link
            href={ROUTES.login}
            className="font-semibold text-[#1337ec] hover:text-[#0f2cb8]"
          >
            {t('loginLink')}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
