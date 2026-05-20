'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  ShieldCheck,
  X,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useProfilePasswordAction } from '../hooks/use-profile-actions';

interface ProfilePasswordUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email?: string;
}

export function ProfilePasswordUpdateDialog({
  open,
  onOpenChange,
  email,
}: ProfilePasswordUpdateDialogProps) {
  const t = useTranslations('profile.passwordDialog');
  const { sendOtp, resetPassword, isSendingOtp, isResettingPassword } =
    useProfilePasswordAction();

  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);

  const resetLocalState = () => {
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setFormError(null);
    setOtpSent(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      resetLocalState();
    }
  };

  const handleSendOtp = async () => {
    setFormError(null);
    const result = await sendOtp(email);
    if (result.ok) {
      setOtpSent(true);
      return;
    }
    setFormError(result.error ?? t('otpSentMessage'));
  };

  const handleSubmit = async () => {
    setFormError(null);
    const result = await resetPassword({
      email,
      otp,
      newPassword,
      confirmPassword,
    });
    if (!result.ok) {
      setFormError(result.error ?? t('errorTitle'));
      return;
    }
    handleOpenChange(false);
  };

  const isSubmitting = isResettingPassword;
  const isEmailMissing = !email;
  const disableActions = isEmailMissing || isSubmitting || isSendingOtp;
  const canSubmit =
    !disableActions &&
    otp.trim().length > 0 &&
    newPassword.length > 0 &&
    confirmPassword.length > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="overflow-hidden p-0 sm:max-w-3xl"
      >
        <div className="flex min-h-[540px] flex-col overflow-hidden md:flex-row">
          <aside className="bg-muted/30 hidden w-full shrink-0 border-r md:flex md:w-[280px] md:flex-col">
            <div className="border-b p-6">
              <div className="bg-primary/10 text-primary mb-4 flex h-10 w-10 items-center justify-center rounded-lg">
                <KeyRound className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-bold">{t('title')}</h2>
              <p className="text-muted-foreground mt-2 text-sm">{t('description')}</p>
            </div>

            <div className="flex-1 space-y-5 p-6">
              <div className="flex items-start gap-3">
                <div className="bg-primary text-primary-foreground mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold">
                  1
                </div>
                <div>
                  <p className="text-sm font-semibold">{t('stepOneTitle')}</p>
                  <p className="text-muted-foreground text-xs">{t('stepOneDescription')}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 opacity-70">
                <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border text-xs font-bold">
                  2
                </div>
                <div>
                  <p className="text-sm font-semibold">{t('stepTwoTitle')}</p>
                  <p className="text-muted-foreground text-xs">{t('stepTwoDescription')}</p>
                </div>
              </div>
            </div>

            <div className="border-t p-6">
              <div className="border-primary/20 bg-primary/5 rounded-lg border p-3 text-xs">
                <div className="text-muted-foreground flex items-start gap-2">
                  <ShieldCheck className="text-primary mt-0.5 h-4 w-4 shrink-0" />
                  <p>{t('securityTip')}</p>
                </div>
              </div>
            </div>
          </aside>

          <section className="flex min-h-0 min-w-0 flex-1 flex-col">
            <header className="flex shrink-0 items-center justify-between border-b px-6 py-4">
              <div>
                <p className="text-base font-semibold">{t('headerTitle')}</p>
                <p className="text-muted-foreground text-xs">{t('headerDescription')}</p>
              </div>
              <DialogClose asChild>
                <Button variant="ghost" size="icon" aria-label={t('close')}>
                  <X className="h-4 w-4" />
                </Button>
              </DialogClose>
            </header>

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-6">
              <div className="space-y-3 rounded-lg border p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Mail className="text-muted-foreground h-4 w-4" />
                    <p className="text-sm font-semibold">{t('accountEmail')}</p>
                  </div>
                  <Badge variant="secondary">{t('required')}</Badge>
                </div>
                <Input id="password-email" value={email ?? ''} disabled />
              </div>

              <Separator />

              <div className="space-y-4 rounded-lg border p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">{t('otpStep')}</p>
                  <Badge variant="outline">{otpSent ? t('otpSentBadge') : t('otpPendingBadge')}</Badge>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="w-full space-y-2">
                    <Label htmlFor="password-otp">{t('otpLabel')}</Label>
                    <Input
                      id="password-otp"
                      value={otp}
                      onChange={(event) => setOtp(event.target.value)}
                      placeholder={t('otpPlaceholder')}
                      disabled={disableActions}
                      maxLength={6}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSendOtp}
                    disabled={isEmailMissing || isSendingOtp}
                    className="sm:min-w-32"
                  >
                    {isSendingOtp ? t('sending') : otpSent ? t('resendOtp') : t('sendOtp')}
                  </Button>
                </div>

                {otpSent && (
                  <Alert className="py-3">
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>{t('otpSentMessage')}</AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-4 rounded-lg border p-4">
                <p className="text-sm font-semibold">{t('newPasswordStep')}</p>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password-new">{t('newPassword')}</Label>
                    <div className="relative">
                      <Input
                        id="password-new"
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                        placeholder={t('newPasswordPlaceholder')}
                        disabled={disableActions}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground absolute top-1/2 right-1 h-8 w-8 -translate-y-1/2"
                        onClick={() => setShowNewPassword((current) => !current)}
                        disabled={disableActions}
                        aria-label={showNewPassword ? t('hideNewPassword') : t('showNewPassword')}
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password-confirm">{t('confirmPassword')}</Label>
                    <div className="relative">
                      <Input
                        id="password-confirm"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        placeholder={t('confirmPasswordPlaceholder')}
                        disabled={disableActions}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground absolute top-1/2 right-1 h-8 w-8 -translate-y-1/2"
                        onClick={() => setShowConfirmPassword((current) => !current)}
                        disabled={disableActions}
                        aria-label={
                          showConfirmPassword
                            ? t('hideConfirmPassword')
                            : t('showConfirmPassword')
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {isEmailMissing && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>{t('missingEmailTitle')}</AlertTitle>
                  <AlertDescription>{t('missingEmailDescription')}</AlertDescription>
                </Alert>
              )}

              {formError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>{t('errorTitle')}</AlertTitle>
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}
            </div>

            <footer className="flex shrink-0 items-center justify-end gap-3 border-t px-6 py-4">
              <DialogClose asChild>
                <Button variant="ghost">{t('cancel')}</Button>
              </DialogClose>
              <Button type="button" onClick={handleSubmit} disabled={!canSubmit}>
                {isSubmitting ? (
                  t('updating')
                ) : (
                  <>
                    {t('updatePassword')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </footer>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
