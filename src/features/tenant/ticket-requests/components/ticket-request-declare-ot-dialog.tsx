'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { CalendarDays, Clock, FileText, Loader2, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type {
  DeclareOtEffortBody,
  OtEffortEntry,
} from '@/services/ticket/types/ticket-request.types';

interface TicketRequestDeclareOtDialogProps {
  open: boolean;
  ticketId: string;
  plannedHours?: number | null;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (ticketId: string, body: DeclareOtEffortBody) => Promise<{ ok: boolean }>;
}

interface EntryRow extends OtEffortEntry {
  _key: string;
}

interface EffortEntryCardProps {
  index: number;
  entry: EntryRow;
  isOnly: boolean;
  isPending: boolean;
  onUpdate: (key: string, field: keyof OtEffortEntry, value: string | number) => void;
  onRemove: (key: string) => void;
}

function makeKey() {
  return Math.random().toString(36).slice(2);
}

function emptyEntry(): EntryRow {
  return { _key: makeKey(), date: '', hours: 0, taskDescription: '', workDescription: '' };
}

function fmtH(value: number): string {
  if (!Number.isFinite(value)) return '0';
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, '');
}

function SummaryStat({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/90 px-4 py-3 text-center shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className={cn('mt-2 text-lg font-semibold tabular-nums text-foreground', className)}>
        {value}
      </p>
    </div>
  );
}

function EffortEntryCard({
  index,
  entry,
  isOnly,
  isPending,
  onUpdate,
  onRemove,
}: EffortEntryCardProps) {
  const t = useTranslations('ticket');

  return (
    <div className="rounded-2xl border border-border/70 bg-background p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Badge
          variant="outline"
          className="rounded-full border-primary/25 bg-primary/5 px-3 py-1 text-primary"
        >
          {t('declareOt.entry', { index: index + 1 })}
        </Badge>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 rounded-full px-3 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          onClick={() => onRemove(entry._key)}
          disabled={isPending || isOnly}
        >
          <Trash2 className="h-3.5 w-3.5" />
          {t('declareOt.remove')}
        </Button>
      </div>

      <div className="grid gap-3 lg:grid-cols-[140px_100px_minmax(0,1fr)]">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">
            {t('declareOt.date')} <span className="text-destructive">*</span>
          </Label>
          <DatePicker
            value={entry.date}
            onChange={(value) => onUpdate(entry._key, 'date', value)}
            disabled={isPending}
            className="h-10"
            placeholder={t('declareOt.pickDate')}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">
            {t('declareOt.hours')} <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Input
              type="number"
              min={0.5}
              max={24}
              step={0.5}
              value={entry.hours || ''}
              onChange={(event) =>
                onUpdate(entry._key, 'hours', parseFloat(event.target.value) || 0)
              }
              disabled={isPending}
              className="h-10 pr-7 text-sm"
              placeholder={t('declareOt.hoursPlaceholder')}
            />
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              {t('common.hoursSuffix')}
            </span>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">
            {t('declareOt.taskCompleted')} <span className="text-destructive">*</span>
          </Label>
          <Input
            value={entry.taskDescription}
            onChange={(event) => onUpdate(entry._key, 'taskDescription', event.target.value)}
            disabled={isPending}
            className="h-10 text-sm"
            placeholder={t('declareOt.taskPlaceholder')}
          />
        </div>
      </div>

      <div className="mt-3 space-y-1.5">
        <Label className="text-xs font-medium text-muted-foreground">
          {t('declareOt.workDetails')}
        </Label>
        <Textarea
          value={entry.workDescription ?? ''}
          onChange={(event) => onUpdate(entry._key, 'workDescription', event.target.value)}
          disabled={isPending}
          placeholder={t('declareOt.workDetailsPlaceholder')}
          rows={3}
          className="resize-none rounded-xl text-sm"
        />
      </div>
    </div>
  );
}

export function TicketRequestDeclareOtDialog({
  open,
  ticketId,
  plannedHours,
  isPending,
  onOpenChange,
  onSubmit,
}: TicketRequestDeclareOtDialogProps) {
  const t = useTranslations('ticket');
  const [entries, setEntries] = useState<EntryRow[]>([emptyEntry()]);
  const [totalActualHours, setTotalActualHours] = useState('');
  const [effortDetail, setEffortDetail] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [userEditedTotal, setUserEditedTotal] = useState(false);

  const autoSum = entries.reduce((sum, entry) => {
    const hours = Number(entry.hours);
    return sum + (Number.isFinite(hours) && hours > 0 ? hours : 0);
  }, 0);

  const parsedManual = Number(totalActualHours);
  const hasManualTotal = userEditedTotal && Number.isFinite(parsedManual) && parsedManual > 0;
  const displayTotal = hasManualTotal ? parsedManual : autoSum;
  const inputValue = userEditedTotal ? totalActualHours : autoSum > 0 ? String(autoSum) : '';
  const plannedDelta = plannedHours != null ? displayTotal - plannedHours : null;
  const progressPct =
    plannedHours != null && plannedHours > 0
      ? Math.min((displayTotal / plannedHours) * 100, 100)
      : 0;

  const resetForm = () => {
    setEntries([emptyEntry()]);
    setTotalActualHours('');
    setEffortDetail('');
    setErrorMessage(null);
    setUserEditedTotal(false);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) resetForm();
    onOpenChange(next);
  };

  const updateEntry = (key: string, field: keyof OtEffortEntry, value: string | number) =>
    setEntries((prev) => prev.map((entry) => (entry._key === key ? { ...entry, [field]: value } : entry)));

  const handleSubmit = async () => {
    setErrorMessage(null);

    const valid = entries.filter(
      (entry) => entry.date.trim() && entry.hours > 0 && entry.taskDescription.trim(),
    );

    if (valid.length === 0) {
      setErrorMessage(t('declareOt.validation.entryRequired'));
      return;
    }

    if (!displayTotal || displayTotal <= 0) {
      setErrorMessage(t('declareOt.validation.totalHoursRequired'));
      return;
    }

    const body: DeclareOtEffortBody = {
      effortEntries: valid.map((entry) => ({
        date: entry.date,
        hours: Number(entry.hours),
        taskDescription: entry.taskDescription.trim(),
        workDescription: entry.workDescription?.trim() || undefined,
      })),
      totalActualHours: displayTotal,
      effortDetail: effortDetail.trim() || undefined,
    };

    const result = await onSubmit(ticketId, body);
    if (result.ok) handleOpenChange(false);
  };

  const isOver = plannedDelta != null && plannedDelta > 0;
  const isUnder = plannedDelta != null && plannedDelta < 0;
  const varianceText =
    plannedHours == null
      ? t('common.notAvailable')
      : isOver
        ? `+${fmtH(plannedDelta)}${t('common.hoursSuffix')}`
        : isUnder
          ? `-${fmtH(Math.abs(plannedDelta))}${t('common.hoursSuffix')}`
          : `0${t('common.hoursSuffix')}`;
  const varianceHint =
    plannedHours == null
      ? t('declareOt.noPlannedHours')
      : isOver
        ? t('declareOt.abovePlan', { hours: fmtH(plannedDelta) })
        : isUnder
          ? t('declareOt.belowPlan', { hours: fmtH(Math.abs(plannedDelta)) })
          : t('declareOt.onPlan');

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex h-[92vh] w-[96vw] max-w-[860px] flex-col overflow-hidden p-0 sm:rounded-3xl">
        <DialogHeader className="shrink-0 border-b border-border/70 bg-muted/20 px-6 py-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <Badge
                variant="outline"
                className="rounded-full border-primary/25 bg-primary/5 px-3 py-1 text-primary"
              >
                {t('declareOt.dialog.entriesCount', {
                  count: entries.length,
                  plural: entries.length === 1 ? 'y' : 'ies',
                })}
              </Badge>
              <div>
                <DialogTitle className="text-2xl font-semibold tracking-tight">
                  {t('declareOt.sectionTitle')}
                </DialogTitle>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {t('declareOt.dialog.description')}
                </p>
              </div>
            </div>

            {plannedHours != null ? (
              <div className="grid min-w-[280px] gap-3 sm:grid-cols-3">
                <SummaryStat
                  label={t('declareOt.logged')}
                  value={`${fmtH(displayTotal)}${t('common.hoursSuffix')}`}
                />
                <SummaryStat
                  label={t('declareOt.planned')}
                  value={`${fmtH(plannedHours)}${t('common.hoursSuffix')}`}
                />
                <SummaryStat
                  label={t('declareOt.variance')}
                  value={varianceText}
                  className={
                    isOver
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }
                />
              </div>
            ) : null}
          </div>

          {plannedHours != null ? (
            <div className="mt-4 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{t('declareOt.dialog.progressVsPlan')}</span>
                <span
                  className={cn(
                    'font-medium',
                    isOver ? 'text-amber-600 dark:text-amber-400' : 'text-primary',
                  )}
                >
                  {varianceHint}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-300',
                    isOver ? 'bg-amber-500' : 'bg-primary',
                  )}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          ) : null}
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <div className="space-y-6">
            <section className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <CalendarDays className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {t('declareOt.entriesTitle')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('declareOt.dialog.entriesDescription')}
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 gap-1.5 rounded-full px-4"
                  onClick={() => setEntries((prev) => [...prev, emptyEntry()])}
                  disabled={isPending}
                >
                  <Plus className="h-4 w-4" />
                  {t('declareOt.addEntry')}
                </Button>
              </div>

              <div className="space-y-3">
                {entries.map((entry, index) => (
                  <EffortEntryCard
                    key={entry._key}
                    index={index}
                    entry={entry}
                    isOnly={entries.length <= 1}
                    isPending={isPending}
                    onUpdate={updateEntry}
                    onRemove={(key) => setEntries((prev) => prev.filter((item) => item._key !== key))}
                  />
                ))}
              </div>
            </section>

            <Separator />

            <section className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <div className="space-y-1.5">
                <Label
                  htmlFor="declare-total-hours"
                  className="flex items-center gap-1.5 text-sm font-medium"
                >
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  {t('declareOt.dialog.totalActualHours')}
                  <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="declare-total-hours"
                    type="number"
                    min={0.5}
                    step={0.5}
                    value={inputValue}
                    onChange={(event) => {
                      setTotalActualHours(event.target.value);
                      setUserEditedTotal(true);
                    }}
                    disabled={isPending}
                    placeholder={t('declareOt.dialog.autoCalculatedInput')}
                    className="pr-8"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    {t('common.hoursSuffix')}
                  </span>
                </div>
                <p className="text-xs leading-6 text-muted-foreground">
                  {hasManualTotal ? (
                    <>
                      {t('declareOt.dialog.entrySum')}{' '}
                      <span className="font-medium">
                        {fmtH(autoSum)}
                        {t('common.hoursSuffix')}
                      </span>
                      {' | '}
                      <button
                        type="button"
                        className="font-medium text-primary hover:underline"
                        onClick={() => {
                          setTotalActualHours('');
                          setUserEditedTotal(false);
                        }}
                      >
                        {t('declareOt.dialog.useAutoSum')}
                      </button>
                    </>
                  ) : (
                    <>
                      {t('declareOt.autoCalculated')}{' '}
                      <span className="font-medium">
                        {fmtH(autoSum)}
                        {t('common.hoursSuffix')}
                      </span>
                    </>
                  )}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="declare-effort-detail"
                  className="flex items-center gap-1.5 text-sm font-medium"
                >
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  {t('declareOt.dialog.effortSummaryOptional')}
                </Label>
                <Textarea
                  id="declare-effort-detail"
                  value={effortDetail}
                  onChange={(event) => setEffortDetail(event.target.value)}
                  disabled={isPending}
                  placeholder={t('declareOt.effortSummaryPlaceholder')}
                  rows={4}
                  className="resize-none rounded-xl text-sm"
                />
              </div>
            </section>

            {errorMessage ? (
              <div className="rounded-2xl border border-destructive/25 bg-destructive/5 px-4 py-3">
                <p className="text-sm font-medium text-destructive">{errorMessage}</p>
              </div>
            ) : null}
          </div>
        </div>

        <DialogFooter className="shrink-0 border-t border-border/70 bg-muted/15 px-6 py-4">
          <div className="flex w-full flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              <span className="text-destructive">*</span> {t('declareOt.dialog.requiredFields')}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
                {t('editorDialog.cancel')}
              </Button>
              <Button onClick={() => void handleSubmit()} disabled={isPending}>
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {t('declareOt.submit')}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
