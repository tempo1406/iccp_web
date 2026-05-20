'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type {
  PeriodicReportDispatchRequest,
  PeriodicReportFrequency,
} from '../../types/quarterly-report.types';
import {
  getPeriodicFrequencyLabel,
  isValidPeriodicPeriodKey,
} from './quarterly-report-utils';

function getDefaultClosedPeriod(frequency: PeriodicReportFrequency) {
  const now = new Date();
  const currentQuarter = Math.floor(now.getMonth() / 3) + 1;

  if (frequency === 'monthly') {
    const previousMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return {
      year: String(previousMonthDate.getFullYear()),
      month: String(previousMonthDate.getMonth() + 1).padStart(2, '0'),
      quarter: 'Q1',
    };
  }

  if (frequency === 'yearly') {
    return {
      year: String(now.getFullYear() - 1),
      month: '12',
      quarter: 'Q4',
    };
  }

  if (currentQuarter === 1) {
    return {
      year: String(now.getFullYear() - 1),
      month: '12',
      quarter: 'Q4',
    };
  }

  const previousQuarter = currentQuarter - 1;
  return {
    year: String(now.getFullYear()),
    month: String(previousQuarter * 3).padStart(2, '0'),
    quarter: `Q${previousQuarter}`,
  };
}

export function QuarterlyReportDispatchDialog({
  open,
  onOpenChange,
  isPending,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPending: boolean;
  onSubmit: (payload: PeriodicReportDispatchRequest) => Promise<void>;
}) {
  const t = useTranslations('analytics');
  const [frequency, setFrequency] = useState<PeriodicReportFrequency>('quarterly');
  const [year, setYear] = useState(getDefaultClosedPeriod('quarterly').year);
  const [month, setMonth] = useState(getDefaultClosedPeriod('quarterly').month);
  const [quarter, setQuarter] = useState(getDefaultClosedPeriod('quarterly').quarter);
  const [forceResend, setForceResend] = useState(false);
  const [forceRebuild, setForceRebuild] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const periodKey =
    frequency === 'monthly'
      ? `${year.trim()}-M${month}`
      : frequency === 'yearly'
        ? `${year.trim()}-Y`
        : `${year.trim()}-${quarter}`;

  const handleFrequencyChange = (nextFrequency: PeriodicReportFrequency) => {
    const defaults = getDefaultClosedPeriod(nextFrequency);
    setFrequency(nextFrequency);
    setYear(defaults.year);
    setMonth(defaults.month);
    setQuarter(defaults.quarter);
    setErrorMessage(null);
  };

  const getValidationMessage = () => {
    if (frequency === 'monthly') {
      return t('periodicReports.dispatchDialog.monthlyValidation');
    }

    if (frequency === 'yearly') {
      return t('periodicReports.dispatchDialog.yearlyValidation');
    }

    return t('periodicReports.dispatchDialog.quarterlyValidation');
  };

  const handleSubmit = async () => {
    if (!isValidPeriodicPeriodKey(periodKey, frequency)) {
      setErrorMessage(getValidationMessage());
      return;
    }

    setErrorMessage(null);
    await onSubmit({
      periodKey,
      forceResend,
      forceRebuild,
    });
    setErrorMessage(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t('periodicReports.dispatchDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('periodicReports.dispatchDialog.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-[180px_minmax(0,1fr)_160px]">
            <div className="space-y-2">
              <Label>{t('periodicReports.dispatchDialog.selectFrequency')}</Label>
              <Select
                value={frequency}
                onValueChange={(value) =>
                  handleFrequencyChange(value as PeriodicReportFrequency)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('periodicReports.dispatchDialog.selectFrequency')} />
                </SelectTrigger>
                <SelectContent>
                  {(['monthly', 'quarterly', 'yearly'] as const).map((option) => (
                    <SelectItem key={option} value={option}>
                      {getPeriodicFrequencyLabel(option, t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="periodic-dispatch-year">{t('periodicReports.dispatchDialog.year')}</Label>
              <Input
                id="periodic-dispatch-year"
                value={year}
                onChange={(event) =>
                  setYear(event.target.value.replace(/[^\d]/g, '').slice(0, 4))
                }
                placeholder="2026"
                inputMode="numeric"
              />
            </div>

            {frequency === 'monthly' ? (
              <div className="space-y-2">
                <Label>{t('periodicReports.dispatchDialog.month')}</Label>
                <Select value={month} onValueChange={setMonth}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('periodicReports.dispatchDialog.selectMonth')} />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, index) => {
                      const value = String(index + 1).padStart(2, '0');
                      return (
                        <SelectItem key={value} value={value}>
                          {value}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            ) : frequency === 'quarterly' ? (
              <div className="space-y-2">
                <Label>{t('periodicReports.dispatchDialog.quarter')}</Label>
                <Select value={quarter} onValueChange={setQuarter}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('periodicReports.dispatchDialog.selectQuarter')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Q1">Q1</SelectItem>
                    <SelectItem value="Q2">Q2</SelectItem>
                    <SelectItem value="Q3">Q3</SelectItem>
                    <SelectItem value="Q4">Q4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>{t('periodicReports.dispatchDialog.period')}</Label>
                <div className="flex h-10 items-center rounded-md border bg-muted/20 px-3 text-sm font-medium">
                  {t('periodicReports.dispatchDialog.fullYear')}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-lg border bg-muted/20 p-4">
            <p className="text-sm text-muted-foreground">{t('periodicReports.dispatchDialog.computedPeriodKey')}</p>
            <p className="mt-1 text-lg font-semibold">{periodKey}</p>
          </div>

          <div className="space-y-3 rounded-lg border p-4">
            <label className="flex items-start gap-3">
              <Checkbox
                checked={forceResend}
                onCheckedChange={(checked) => setForceResend(Boolean(checked))}
              />
              <div className="space-y-1">
                <p className="text-sm font-medium">{t('periodicReports.dispatchDialog.forceResend')}</p>
                <p className="text-sm text-muted-foreground">
                  {t('periodicReports.dispatchDialog.forceResendDescription')}
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3">
              <Checkbox
                checked={forceRebuild}
                onCheckedChange={(checked) => setForceRebuild(Boolean(checked))}
              />
              <div className="space-y-1">
                <p className="text-sm font-medium">{t('periodicReports.dispatchDialog.forceRebuild')}</p>
                <p className="text-sm text-muted-foreground">
                  {t('periodicReports.dispatchDialog.forceRebuildDescription')}
                </p>
              </div>
            </label>
          </div>

          {errorMessage ? (
            <p className="text-sm font-medium text-destructive">{errorMessage}</p>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            {t('common.cancel')}
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            {t('periodicReports.dispatchDialog.dispatchReport')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
