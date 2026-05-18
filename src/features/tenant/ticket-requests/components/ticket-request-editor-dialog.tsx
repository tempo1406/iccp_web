'use client';

import { type KeyboardEvent, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { format } from 'date-fns';
import { CalendarIcon, Clock, Loader2, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import type { TicketRequestMemberOption } from '../hooks/use-ticket-requests';
import type {
  CreateTicketRequestBody,
  TicketRequestCatalogReason,
  TicketRequestCatalogType,
  TicketRequestDetail,
  TicketRequestWorkflowCode,
  UpdateTicketRequestBody,
} from '../../../../services/ticket/types/ticket-request.types';
import {
  dateTimeInputToIso,
  getNonOvertimeReasonOptions,
  getTicketWorkflowLabel,
  getOvertimeReasonOptions,
  resolveTicketDelegate,
  toDateTimeInputIso,
} from './ticket-request-utils';

interface TicketRequestEditorDialogProps {
  open: boolean;
  mode: 'create' | 'resubmit';
  requesterId?: string | null;
  ticket?: TicketRequestDetail | null;
  isPending: boolean;
  memberOptions: TicketRequestMemberOption[];
  requestTypes: TicketRequestCatalogType[];
  reasonOptions: TicketRequestCatalogReason[];
  onOpenChange: (open: boolean) => void;
  onSubmit: (
    payload: CreateTicketRequestBody | UpdateTicketRequestBody,
  ) => Promise<{ ok: boolean }>;
}

interface TicketEditorFormState {
  requestTypeCode: string;
  workflowCode: string;
  title: string;
  content: string;
  reasonCode: string;
  reasonDetail: string;
  delegateId: string;
  effortOwnerId: string;
  nextDelegateId: string;
  ccMemberIds: string[];
  startAt: string;
  endAt: string;
}

interface ResubmitDelegatePreset {
  delegateId: string;
  isLocked: boolean;
}

const defaultFormState: TicketEditorFormState = {
  requestTypeCode: '',
  workflowCode: '',
  title: '',
  content: '',
  reasonCode: '',
  reasonDetail: '',
  delegateId: '',
  effortOwnerId: '',
  nextDelegateId: '',
  ccMemberIds: [],
  startAt: '',
  endAt: '',
};

function ensureUnique(values: string[]): string[] {
  return Array.from(new Set(values));
}

function readOptionalId(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : '';
}

function toTimestamp(value: string | null | undefined): number {
  if (!value) {
    return 0;
  }

  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function getTodayStart(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function isPastScheduleDate(value: string): boolean {
  return new Date(value).getTime() < getTodayStart().getTime();
}

function showValidationError(
  setErrorMessage: (message: string | null) => void,
  message: string,
): void {
  setErrorMessage(message);
  toast.danger(message);
}

function resolveResubmitDelegatePreset(
  ticket: TicketRequestDetail | null | undefined,
): ResubmitDelegatePreset {
  if (!ticket || ticket.status !== 'changes_requested') {
    return { delegateId: '', isLocked: false };
  }

  const latestSendBackActivity = [...ticket.activities]
    .filter(
      (activity) =>
        activity.action === 'changes_requested' || activity.action === 'rejected',
    )
    .sort(
      (first, second) =>
        toTimestamp(second.createdAt) - toTimestamp(first.createdAt),
    )[0];

  if (!latestSendBackActivity?.payload) {
    return { delegateId: '', isLocked: false };
  }

  const explicitDelegateId =
    readOptionalId(latestSendBackActivity.payload.nextDelegateId) ||
    readOptionalId(latestSendBackActivity.payload.nextApproverId);
  if (explicitDelegateId.length > 0) {
    return { delegateId: explicitDelegateId, isLocked: true };
  }

  const stagedDelegateId =
    readOptionalId(latestSendBackActivity.payload.stagedDelegateId) ||
    readOptionalId(latestSendBackActivity.payload.stagedApproverId);
  if (stagedDelegateId.length > 0) {
    return { delegateId: stagedDelegateId, isLocked: true };
  }

  return { delegateId: '', isLocked: false };
}

function buildMemberLabel(options: {
  firstName: string | null | undefined;
  lastName: string | null | undefined;
  email: string | null | undefined;
  fallback: string;
}): string {
  const { firstName, lastName, email, fallback } = options;
  const fullName = [firstName, lastName]
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .join(' ')
    .trim();

  if (fullName.length > 0 && email && email.trim().length > 0) {
    return `${fullName} (${email})`;
  }

  if (fullName.length > 0) return fullName;
  if (email && email.trim().length > 0) return email;

  return fallback;
}

function sanitizeCcMemberIds(options: {
  ccMemberIds: string[];
  requesterId?: string | null;
  delegateId?: string;
  effortOwnerId?: string;
  memberOptionMap: Map<string, TicketRequestMemberOption>;
}): string[] {
  const { ccMemberIds, requesterId, delegateId, effortOwnerId, memberOptionMap } = options;

  return ensureUnique(ccMemberIds).filter((memberId) => {
    if (requesterId && memberId === requesterId) return false;
    if (delegateId && memberId === delegateId) return false;
    if (effortOwnerId && memberId === effortOwnerId) return false;
    return !memberOptionMap.get(memberId)?.isOrganizationAdmin;
  });
}

function buildInitialFormState(
  mode: 'create' | 'resubmit',
  ticket: TicketRequestDetail | null | undefined,
  requestTypes: TicketRequestCatalogType[],
  resubmitDelegatePreset: ResubmitDelegatePreset,
): TicketEditorFormState {
  if (mode === 'resubmit' && ticket) {
    const requestType = requestTypes.find((item) => item.code === ticket.requestTypeCode);
    const currentDelegate = resolveTicketDelegate(ticket);

    return {
      requestTypeCode: ticket.requestTypeCode ?? requestType?.code ?? '',
      workflowCode: ticket.workflowCode,
      title: ticket.title,
      content: ticket.content,
      reasonCode: ticket.reasonCode ?? '',
      reasonDetail: ticket.reasonDetail ?? '',
      delegateId: currentDelegate?.id ?? '',
      effortOwnerId: ticket.effortOwner?.id ?? '',
      nextDelegateId: resubmitDelegatePreset.delegateId,
      ccMemberIds: ticket.ccMembers
        .map((entry) => (entry.member?.id ?? entry.id ?? '').trim())
        .filter((value) => value.length > 0),
      startAt: toDateTimeInputIso(ticket.startAt),
      endAt: toDateTimeInputIso(ticket.endAt),
    };
  }

  const defaultRequestType = requestTypes[0];

  return {
    ...defaultFormState,
    requestTypeCode: defaultRequestType?.code ?? '',
    workflowCode:
      defaultRequestType?.defaultWorkflowCode ??
      defaultRequestType?.allowedWorkflowCodes[0] ??
      '',
  };
}

// ─── DateTimePicker ───────────────────────────────────────────────────────────

interface DateTimePickerProps {
  value: string; // YYYY-MM-DDTHH:mm or ''
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minDate?: Date | null;
}

function DateTimePicker({
  value,
  onChange,
  placeholder = 'Pick date & time',
  disabled,
  minDate,
}: DateTimePickerProps) {
  const [open, setOpen] = useState(false);

  const selectedDate = value ? new Date(value) : undefined;
  const displayText = value ? format(new Date(value), 'dd MMM yyyy HH:mm') : undefined;
  const timeValue = value ? value.slice(11, 16) : '';

  const handleDaySelect = (day: Date | undefined) => {
    if (!day) return;
    const timeStr = value ? value.slice(11, 16) : '00:00';
    const yyyy = day.getFullYear();
    const mm = String(day.getMonth() + 1).padStart(2, '0');
    const dd = String(day.getDate()).padStart(2, '0');
    onChange(`${yyyy}-${mm}-${dd}T${timeStr}`);
  };

  const handleTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const dateStr = value
      ? value.slice(0, 10)
      : new Date().toISOString().slice(0, 10);
    onChange(`${dateStr}T${event.target.value}`);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-start text-left font-normal',
            !value && 'text-muted-foreground',
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          <span>{displayText ?? placeholder}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDaySelect}
          disabled={minDate ? { before: minDate } : undefined}
          initialFocus
        />
        <div className="border-t p-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Input
              type="time"
              value={timeValue}
              onChange={handleTimeChange}
              className="h-8"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── CcMemberTagInput ─────────────────────────────────────────────────────────

interface CcMemberTagInputProps {
  options: TicketRequestMemberOption[];
  selectedMemberIds: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}

function CcMemberTagInput({
  options,
  selectedMemberIds,
  onChange,
  disabled = false,
}: CcMemberTagInputProps) {
  const [inputValue, setInputValue] = useState('');

  const optionMap = useMemo(
    () => new Map(options.map((member) => [member.id, member])),
    [options],
  );

  const selectedMembers = selectedMemberIds
    .map((id) => optionMap.get(id))
    .filter((member): member is TicketRequestMemberOption => Boolean(member));

  const availableOptions = options.filter((member) => !selectedMemberIds.includes(member.id));

  const trimmedInput = inputValue.trim();
  const isMentionMode = trimmedInput.startsWith('@');
  const normalizedKeyword = trimmedInput.replace(/^@/, '').toLowerCase();

  const suggestions = useMemo(() => {
    if (availableOptions.length === 0 || !isMentionMode) {
      return [] as TicketRequestMemberOption[];
    }

    if (normalizedKeyword.length === 0) {
      return availableOptions.slice(0, 6);
    }

    return availableOptions
      .filter((member) => {
        const haystack = `${member.label} ${member.email}`.toLowerCase();
        return haystack.includes(normalizedKeyword);
      })
      .slice(0, 8);
  }, [availableOptions, isMentionMode, normalizedKeyword]);

  const addMember = (memberId: string) => {
    if (selectedMemberIds.includes(memberId)) return;
    onChange([...selectedMemberIds, memberId]);
    setInputValue('');
  };

  const removeMember = (memberId: string) => {
    onChange(selectedMemberIds.filter((id) => id !== memberId));
  };

  const handleEnterSelect = () => {
    if (!isMentionMode || suggestions.length === 0) return;
    addMember(suggestions[0].id);
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleEnterSelect();
      return;
    }

    if (
      event.key === 'Backspace' &&
      inputValue.trim().length === 0 &&
      selectedMemberIds.length > 0
    ) {
      event.preventDefault();
      onChange(selectedMemberIds.slice(0, -1));
    }
  };

  return (
    <div className="space-y-2 rounded-lg border p-3">
      <div className="flex flex-wrap gap-2">
        {selectedMembers.map((member) => (
          <Badge key={member.id} variant="secondary" className="gap-1 rounded-full px-2 py-1">
            <span>{member.label}</span>
            {!disabled && (
              <button
                type="button"
                className="hover:text-foreground text-muted-foreground"
                onClick={() => removeMember(member.id)}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        ))}
      </div>

      <Input
        value={inputValue}
        onChange={(event) => setInputValue(event.target.value)}
        onKeyDown={handleInputKeyDown}
        placeholder="@type member name then press Enter to add"
        disabled={disabled}
      />

      {!disabled && suggestions.length > 0 && (
        <div className="max-h-36 space-y-1 overflow-y-auto rounded-md border p-1">
          {suggestions.map((member) => (
            <button
              type="button"
              key={member.id}
              className="hover:bg-muted flex w-full items-start rounded px-2 py-1 text-left"
              onClick={() => addMember(member.id)}
            >
              <div>
                <p className="text-sm font-medium">{member.label}</p>
                <p className="text-muted-foreground text-xs">{member.email}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {options.length === 0 && (
        <p className="text-muted-foreground text-xs">No available members for CC.</p>
      )}
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-muted-foreground border-b pb-1 text-xs font-semibold uppercase tracking-wide">
        {title}
      </h3>
      {children}
    </div>
  );
}

// ─── Main dialog ──────────────────────────────────────────────────────────────

export function TicketRequestEditorDialog({
  open,
  mode,
  requesterId,
  ticket,
  isPending,
  memberOptions,
  requestTypes,
  reasonOptions,
  onOpenChange,
  onSubmit,
}: TicketRequestEditorDialogProps) {
  const t = useTranslations('ticket');
  const resubmitDelegatePreset = useMemo(
    () => resolveResubmitDelegatePreset(mode === 'resubmit' ? ticket : null),
    [mode, ticket],
  );

  const [form, setForm] = useState<TicketEditorFormState>(() =>
    buildInitialFormState(mode, ticket, requestTypes, resubmitDelegatePreset),
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const today = useMemo(() => getTodayStart(), []);
  const availableReasonOptions = useMemo(
    () =>
      ticket?.type === 'overtime'
        ? getOvertimeReasonOptions(reasonOptions)
        : getNonOvertimeReasonOptions(reasonOptions),
    [reasonOptions, ticket?.type],
  );

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm(buildInitialFormState(mode, ticket, requestTypes, resubmitDelegatePreset));
  }, [open, mode, ticket, requestTypes, resubmitDelegatePreset]);

  const selectedRequestType = useMemo(
    () => requestTypes.find((item) => item.code === form.requestTypeCode) ?? null,
    [requestTypes, form.requestTypeCode],
  );

  const workflowOptions = selectedRequestType?.allowedWorkflowCodes ?? [];

  const memberOptionMap = useMemo(
    () => new Map(memberOptions.map((member) => [member.id, member])),
    [memberOptions],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm((previous) => {
      const cleanedCcMemberIds = sanitizeCcMemberIds({
        ccMemberIds: previous.ccMemberIds,
        requesterId,
        delegateId: previous.delegateId,
        effortOwnerId: previous.effortOwnerId,
        memberOptionMap,
      });

      if (
        cleanedCcMemberIds.length === previous.ccMemberIds.length &&
        cleanedCcMemberIds.every((id, index) => id === previous.ccMemberIds[index])
      ) {
        return previous;
      }

      return { ...previous, ccMemberIds: cleanedCcMemberIds };
    });
  }, [requesterId, memberOptionMap, form.delegateId, form.effortOwnerId]);

  const createDelegateOptions = useMemo(
    () =>
      memberOptions.filter((member) => {
        if (!member.canApprove) return false;
        if (member.isOrganizationAdmin) return false;
        if (requesterId && member.id === requesterId) return false;
        return true;
      }),
    [memberOptions, requesterId],
  );

  const lockedResubmitDelegateLabel = useMemo(() => {
    if (!resubmitDelegatePreset.isLocked || resubmitDelegatePreset.delegateId.length === 0) {
      return '';
    }

    const matchedMember = memberOptionMap.get(resubmitDelegatePreset.delegateId);
    if (matchedMember) return matchedMember.label;

    const fallbackDelegate = ticket ? resolveTicketDelegate(ticket) : null;
    if (fallbackDelegate?.id === resubmitDelegatePreset.delegateId) {
      return buildMemberLabel({
        firstName: fallbackDelegate.firstName,
        lastName: fallbackDelegate.lastName,
        email: fallbackDelegate.email,
        fallback: resubmitDelegatePreset.delegateId,
      });
    }

    return resubmitDelegatePreset.delegateId;
  }, [memberOptionMap, resubmitDelegatePreset, ticket]);

  const effortOwnerOptions = useMemo(
    () => memberOptions.filter((member) => !(requesterId && member.id === requesterId)),
    [memberOptions, requesterId],
  );

  const ccOptions = useMemo(
    () =>
      memberOptions.filter((member) => {
        if (member.isOrganizationAdmin) return false;
        if (requesterId && member.id === requesterId) return false;
        if (form.delegateId.length > 0 && member.id === form.delegateId) return false;
        if (form.effortOwnerId.length > 0 && member.id === form.effortOwnerId) return false;
        return true;
      }),
    [memberOptions, requesterId, form.delegateId, form.effortOwnerId],
  );

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) setErrorMessage(null);
    onOpenChange(nextOpen);
  };

  const handleRequestTypeChange = (requestTypeCode: string) => {
    setForm((previous) => {
      const requestType = requestTypes.find((item) => item.code === requestTypeCode);
      const allowedWorkflowCodes = requestType?.allowedWorkflowCodes ?? [];
      const nextWorkflowCode = allowedWorkflowCodes.includes(
        previous.workflowCode as TicketRequestWorkflowCode,
      )
        ? previous.workflowCode
        : requestType?.defaultWorkflowCode ?? allowedWorkflowCodes[0] ?? '';

      return { ...previous, requestTypeCode, workflowCode: nextWorkflowCode };
    });
  };

  const handleSubmit = async () => {
    const trimmedTitle = form.title.trim();
    const trimmedContent = form.content.trim();

    if (form.requestTypeCode.trim().length === 0) {
      showValidationError(setErrorMessage, t('createForm.validation.requestTypeRequired'));
      return;
    }

    if (trimmedTitle.length === 0) {
      showValidationError(setErrorMessage, t('createForm.validation.titleRequired'));
      return;
    }

    if (trimmedContent.length === 0) {
      showValidationError(setErrorMessage, t('createForm.validation.contentRequired'));
      return;
    }

    if (mode === 'create' && form.delegateId.length > 0) {
      const isValidDelegate = createDelegateOptions.some((member) => member.id === form.delegateId);
      if (!isValidDelegate) {
        showValidationError(setErrorMessage, t('createForm.validation.selectedDelegateInvalid'));
        return;
      }
    }

    if (
      mode === 'create' &&
      workflowOptions.length > 0 &&
      form.workflowCode.length > 0 &&
      !workflowOptions.includes(form.workflowCode as TicketRequestWorkflowCode)
    ) {
      showValidationError(setErrorMessage, t('createForm.validation.workflowMismatch'));
      return;
    }

    const startAtIso = form.startAt.length > 0 ? dateTimeInputToIso(form.startAt) : undefined;
    const endAtIso = form.endAt.length > 0 ? dateTimeInputToIso(form.endAt) : undefined;

    if (startAtIso && endAtIso && new Date(startAtIso).getTime() > new Date(endAtIso).getTime()) {
      showValidationError(setErrorMessage, t('createForm.validation.startBeforeEnd'));
      return;
    }

    if (startAtIso && isPastScheduleDate(startAtIso)) {
      showValidationError(setErrorMessage, t('createForm.validation.startPast'));
      return;
    }

    if (endAtIso && isPastScheduleDate(endAtIso)) {
      showValidationError(setErrorMessage, t('createForm.validation.endPast'));
      return;
    }

    const cleanedCcMemberIds = sanitizeCcMemberIds({
      ccMemberIds: form.ccMemberIds,
      requesterId,
      delegateId: form.delegateId,
      effortOwnerId: form.effortOwnerId,
      memberOptionMap,
    });

    const selectedType = requestTypes.find((item) => item.code === form.requestTypeCode);

    if (mode === 'create') {
      const payload: CreateTicketRequestBody = {
        requestTypeCode: form.requestTypeCode,
        type: selectedType?.type,
        workflowCode:
          form.workflowCode.trim().length > 0
            ? (form.workflowCode as TicketRequestWorkflowCode)
            : undefined,
        title: trimmedTitle,
        content: trimmedContent,
        reasonCode: form.reasonCode.trim().length > 0 ? form.reasonCode : undefined,
        reasonDetail: form.reasonDetail.trim().length > 0 ? form.reasonDetail.trim() : undefined,
        delegateId: form.delegateId.trim().length > 0 ? form.delegateId : undefined,
        effortOwnerId: form.effortOwnerId.trim().length > 0 ? form.effortOwnerId : undefined,
        ccMemberIds: cleanedCcMemberIds,
        ...(startAtIso ? { startAt: startAtIso } : {}),
        ...(endAtIso ? { endAt: endAtIso } : {}),
      };

      const result = await onSubmit(payload);
      if (result.ok) handleOpenChange(false);
      return;
    }

    const payload: UpdateTicketRequestBody = {
      requestTypeCode: form.requestTypeCode,
      type: selectedType?.type,
      title: trimmedTitle,
      content: trimmedContent,
      reasonCode: form.reasonCode.trim().length > 0 ? form.reasonCode : undefined,
      reasonDetail: form.reasonDetail.trim().length > 0 ? form.reasonDetail.trim() : undefined,
      nextDelegateId: form.nextDelegateId.trim().length > 0 ? form.nextDelegateId : undefined,
      ccMemberIds: cleanedCcMemberIds,
      ...(startAtIso ? { startAt: startAtIso } : {}),
      ...(endAtIso ? { endAt: endAtIso } : {}),
    };

    const result = await onSubmit(payload);
    if (result.ok) handleOpenChange(false);
  };

  const dialogTitle = mode === 'create' ? t('editorDialog.titleCreate') : t('editorDialog.titleResubmit');
  const dialogDescription =
    mode === 'create'
      ? t('editorDialog.descriptionCreate')
      : t('editorDialog.descriptionResubmit');

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex h-[92vh] w-[96vw] max-w-[860px] flex-col overflow-hidden p-0 sm:max-w-[860px] sm:rounded-2xl">
        {/* Header */}
        <DialogHeader className="shrink-0 border-b px-6 py-4">
          <DialogTitle className="text-lg">{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>

        {/* Scrollable body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <div className="space-y-6">

            {/* ── Request Type & Workflow ── */}
            <FormSection title={t('editorDialog.requestInfo')}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ticket-request-type">{t('createForm.general.requestType')}</Label>
                  <Select value={form.requestTypeCode} onValueChange={handleRequestTypeChange}>
                    <SelectTrigger id="ticket-request-type">
                      <SelectValue placeholder={t('createForm.common.selectRequestType')} />
                    </SelectTrigger>
                    <SelectContent>
                      {requestTypes.map((requestType) => (
                        <SelectItem key={requestType.code} value={requestType.code}>
                          {requestType.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {mode === 'create' ? (
                  <div className="space-y-2">
                    <Label htmlFor="ticket-workflow">{t('editorDialog.workflow')}</Label>
                    <Select
                      value={form.workflowCode}
                      onValueChange={(value) =>
                        setForm((previous) => ({ ...previous, workflowCode: value }))
                      }
                    >
                      <SelectTrigger id="ticket-workflow">
                        <SelectValue placeholder={t('editorDialog.workflow')} />
                      </SelectTrigger>
                      <SelectContent>
                        {workflowOptions.map((workflowCode) => (
                          <SelectItem key={workflowCode} value={workflowCode}>
                            {getTicketWorkflowLabel(workflowCode, undefined)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>{t('editorDialog.workflow')}</Label>
                    <Input
                      value={getTicketWorkflowLabel(form.workflowCode as TicketRequestWorkflowCode)}
                      disabled
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ticket-title">
                  {t('createForm.general.titleField')} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="ticket-title"
                  value={form.title}
                  onChange={(event) =>
                    setForm((previous) => ({ ...previous, title: event.target.value }))
                  }
                  maxLength={255}
                  placeholder={t('createForm.common.enterRequestTitle')}
                />
              </div>
            </FormSection>

            {/* ── Date & Time ── */}
            <FormSection title={t('editorDialog.dateTime')}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t('createForm.general.startAt')}</Label>
                  <DateTimePicker
                    value={form.startAt}
                    onChange={(value) =>
                      setForm((previous) => ({ ...previous, startAt: value }))
                    }
                    placeholder={t('editorDialog.pickStartDateTime')}
                    disabled={isPending}
                    minDate={today}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('createForm.general.endAt')}</Label>
                  <DateTimePicker
                    value={form.endAt}
                    onChange={(value) =>
                      setForm((previous) => ({ ...previous, endAt: value }))
                    }
                    placeholder={t('editorDialog.pickEndDateTime')}
                    disabled={isPending}
                    minDate={today}
                  />
                </div>
              </div>
            </FormSection>

            {/* ── People ── */}
            <FormSection title={t('editorDialog.people')}>
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Delegate / Next Delegate */}
                {mode === 'create' ? (
                  <div className="space-y-2">
                    <Label htmlFor="ticket-delegate">{t('editorDialog.delegateOptional')}</Label>
                    <Select
                      value={form.delegateId || 'none'}
                      onValueChange={(value) =>
                        setForm((previous) => ({
                          ...previous,
                          delegateId: value === 'none' ? '' : value,
                        }))
                      }
                    >
                      <SelectTrigger id="ticket-delegate">
                        <SelectValue placeholder={t('createForm.common.selectApprover')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{t('editorDialog.noDelegate')}</SelectItem>
                        {createDelegateOptions.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {createDelegateOptions.length === 0 && (
                      <p className="text-muted-foreground text-xs">
                        {t('editorDialog.noEligibleDelegate')} {t('editorDialog.delegatePermissionHelp')}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="ticket-next-delegate">{t('editorDialog.nextDelegateOptional')}</Label>
                    {resubmitDelegatePreset.isLocked ? (
                      <>
                        <Input
                          id="ticket-next-delegate"
                          value={lockedResubmitDelegateLabel}
                          disabled
                        />
                        <p className="text-muted-foreground text-xs">
                          {t('editorDialog.assignedLatestSendBack')}
                        </p>
                      </>
                    ) : (
                      <Select
                        value={form.nextDelegateId || 'none'}
                        onValueChange={(value) =>
                          setForm((previous) => ({
                            ...previous,
                            nextDelegateId: value === 'none' ? '' : value,
                          }))
                        }
                      >
                        <SelectTrigger id="ticket-next-delegate">
                          <SelectValue placeholder={t('decisionDialog.keepAssigned')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">{t('decisionDialog.keepAssigned')}</SelectItem>
                          {createDelegateOptions.map((member) => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}

                {/* Effort Owner */}
                <div className="space-y-2">
                  <Label htmlFor="ticket-effort-owner">{t('editorDialog.effortOwnerOptional')}</Label>
                  <Select
                    value={form.effortOwnerId || 'none'}
                    onValueChange={(value) =>
                      setForm((previous) => ({
                        ...previous,
                        effortOwnerId: value === 'none' ? '' : value,
                      }))
                    }
                  >
                    <SelectTrigger id="ticket-effort-owner">
                      <SelectValue placeholder={t('editorDialog.defaultRequester')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t('editorDialog.defaultRequester')}</SelectItem>
                      {effortOwnerOptions.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* CC Members */}
              <div className="space-y-2">
                <Label>{t('createForm.general.ccMembers')}</Label>
                <CcMemberTagInput
                  options={ccOptions}
                  selectedMemberIds={form.ccMemberIds}
                  onChange={(next) =>
                    setForm((previous) => ({ ...previous, ccMemberIds: next }))
                  }
                  disabled={isPending}
                />
              </div>
            </FormSection>

            {/* ── Content & Reason ── */}
            <FormSection title={t('editorDialog.details')}>
              <div className="space-y-2">
                <Label htmlFor="ticket-content">
                  {t('createForm.general.content')} <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="ticket-content"
                  value={form.content}
                  onChange={(event) =>
                    setForm((previous) => ({ ...previous, content: event.target.value }))
                  }
                  placeholder={t('createForm.common.describeRequestDetails')}
                  rows={4}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ticket-reason">{t('createForm.general.reason')}</Label>
                  <Select
                    value={form.reasonCode || 'none'}
                    onValueChange={(value) =>
                      setForm((previous) => ({
                        ...previous,
                        reasonCode: value === 'none' ? '' : value,
                      }))
                    }
                  >
                    <SelectTrigger id="ticket-reason">
                      <SelectValue placeholder={t('createForm.common.optionalReason')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t('createForm.common.noReason')}</SelectItem>
                      {availableReasonOptions.map((reason) => (
                        <SelectItem key={reason.code} value={reason.code}>
                          {reason.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 sm:col-span-1">
                  <Label htmlFor="ticket-reason-detail">{t('createForm.general.reasonDetail')}</Label>
                  <Textarea
                    id="ticket-reason-detail"
                    value={form.reasonDetail}
                    onChange={(event) =>
                      setForm((previous) => ({ ...previous, reasonDetail: event.target.value }))
                    }
                    placeholder={t('createForm.common.optionalDetailForReason')}
                    rows={3}
                  />
                </div>
              </div>
            </FormSection>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t px-6 py-4">
          {errorMessage && (
            <p className="mb-3 text-sm font-medium text-red-600">{errorMessage}</p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
              {t('editorDialog.cancel')}
            </Button>
            <Button onClick={() => void handleSubmit()} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'create' ? t('editorDialog.submitRequest') : t('editorDialog.resubmitRequest')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
