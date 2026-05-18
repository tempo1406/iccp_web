'use client';

import { type Dispatch, type KeyboardEvent, type SetStateAction, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { FolderOpen, Loader2, User, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from '@/components/ui/combobox';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { useOtEffortOwnerOptionsQuery } from '../query/ticket-requests.queries';
import type {
  CreateOvertimeTicketRequestBody,
  CreateTicketRequestBody,
  OtProjectOption,
  TicketRequestCatalogReason,
  TicketRequestCatalogType,
  TicketRequestWorkflowCode,
} from '../../../../services/ticket/types/ticket-request.types';
import {
  dateTimeInputToIso,
  getNonOvertimeReasonOptions,
  getOvertimeReasonOptions,
} from './ticket-request-utils';

// ---------- shared: date+time picker ----------

function DateTimeInput({
  value,
  onChange,
  disabled,
  id,
  minDate,
  maxDate,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  id?: string;
  minDate?: string | Date | null;
  maxDate?: string | Date | null;
}) {
  const [datePart, timePart] = value ? value.split('T') : ['', ''];

  const handleDateChange = (newDate: string) => {
    const time = timePart || '00:00';
    onChange(newDate ? `${newDate}T${time}` : '');
  };

  const handleTimeChange = (newTime: string) => {
    if (!datePart) return;
    onChange(`${datePart}T${newTime}`);
  };

  return (
    <div className="flex gap-2">
      <DatePicker
        value={datePart || null}
        onChange={handleDateChange}
        disabled={disabled}
        minDate={minDate}
        maxDate={maxDate}
        className="flex-1"
      />
      <Input
        id={id}
        type="time"
        value={timePart || ''}
        onChange={(e) => handleTimeChange(e.target.value)}
        disabled={disabled || !datePart}
        className="w-32"
      />
    </div>
  );
}

// ---------- shared: CC member tag input ----------

interface CcMemberTagInputProps {
  options: TicketRequestMemberOption[];
  selectedMemberIds: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  emptyMessage?: string;
}

function CcMemberTagInput({
  options,
  selectedMemberIds,
  onChange,
  disabled = false,
  placeholder,
  emptyMessage,
}: CcMemberTagInputProps) {
  const t = useTranslations('ticket');
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
    if (availableOptions.length === 0 || !isMentionMode) return [] as TicketRequestMemberOption[];
    if (normalizedKeyword.length === 0) return availableOptions.slice(0, 6);
    return availableOptions
      .filter((member) => `${member.label} ${member.email}`.toLowerCase().includes(normalizedKeyword))
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

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (isMentionMode && suggestions.length > 0) addMember(suggestions[0].id);
      return;
    }
    if (event.key === 'Backspace' && inputValue.trim().length === 0 && selectedMemberIds.length > 0) {
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
                className="cursor-pointer text-muted-foreground hover:text-foreground"
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
        placeholder={placeholder ?? t('createForm.common.mentionPlaceholder')}
        disabled={disabled}
      />
      {!disabled && suggestions.length > 0 && (
        <div className="max-h-36 space-y-1 overflow-y-auto rounded-md border p-1">
          {suggestions.map((member) => (
            <button
              type="button"
              key={member.id}
              className="flex w-full cursor-pointer items-start rounded px-2 py-1 text-left hover:bg-muted"
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
        <p className="text-muted-foreground text-xs">
          {emptyMessage ?? t('createForm.common.noAvailableMembers')}
        </p>
      )}
    </div>
  );
}

interface MemberComboboxMultiSelectProps {
  options: TicketRequestMemberOption[];
  selectedMemberIds: string[];
  onChange: (next: string[]) => void;
  currentUserId?: string | null;
  disabled?: boolean;
  placeholder?: string;
  emptyMessage?: string;
}

function getMemberDisplayLabel(
  member: TicketRequestMemberOption,
  currentUserId?: string | null,
  youLabel = 'You',
): string {
  return currentUserId && member.id === currentUserId ? youLabel : member.label;
}

function MemberComboboxMultiSelect({
  options,
  selectedMemberIds,
  onChange,
  currentUserId,
  disabled = false,
  placeholder,
  emptyMessage,
}: MemberComboboxMultiSelectProps) {
  const t = useTranslations('ticket');
  const anchor = useComboboxAnchor();
  const selectedMembers = useMemo(
    () => options.filter((member) => selectedMemberIds.includes(member.id)),
    [options, selectedMemberIds],
  );

  return (
    <Combobox
      multiple
      autoHighlight
      items={options}
      value={selectedMembers}
      onValueChange={(values) => {
        if (disabled) return;
        onChange((values ?? []).map((member) => member.id));
      }}
      itemToStringLabel={(item) => item?.label ?? ''}
      isItemEqualToValue={(item, value) => item.id === value.id}
    >
      <ComboboxChips
        ref={anchor}
        className={cn('w-full min-h-11', disabled && 'pointer-events-none opacity-70')}
      >
        <ComboboxValue>
          {(values) =>
            (values as TicketRequestMemberOption[]).map((member) => (
              <ComboboxChip key={member.id}>
                {getMemberDisplayLabel(member, currentUserId, t('createForm.common.you'))}
              </ComboboxChip>
            ))
          }
        </ComboboxValue>
        <ComboboxChipsInput
          disabled={disabled}
          placeholder={
            selectedMembers.length === 0
              ? (placeholder ?? t('createForm.common.selectMembers'))
              : ''
          }
          className="min-w-[120px] flex-1 bg-transparent text-sm outline-none border-none shadow-none focus-visible:ring-0"
        />
      </ComboboxChips>

      <ComboboxContent anchor={anchor} align="start" className="w-[var(--anchor-width)]">
        <ComboboxEmpty>{emptyMessage ?? t('createForm.common.noAvailableMembers')}</ComboboxEmpty>
        <ComboboxList>
          {(item) => (
            <ComboboxItem key={item.id} value={item} className="flex items-center gap-2.5 px-2 py-2">
              <Checkbox
                checked={selectedMemberIds.includes(item.id)}
                className="pointer-events-none data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {getMemberDisplayLabel(item, currentUserId, t('createForm.common.you'))}
                </p>
                <p className="truncate text-xs text-muted-foreground">{item.email}</p>
              </div>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

// ---------- helpers ----------

function ensureUnique(values: string[]): string[] {
  return Array.from(new Set(values));
}

function sanitizeCcMemberIds(options: {
  ccMemberIds: string[];
  requesterId?: string | null;
  delegateId?: string;
  effortOwnerIds?: string[];
  memberOptionMap: Map<string, TicketRequestMemberOption>;
}): string[] {
  const {
    ccMemberIds,
    requesterId,
    delegateId,
    effortOwnerIds = [],
    memberOptionMap,
  } = options;
  return ensureUnique(ccMemberIds).filter((memberId) => {
    if (requesterId && memberId === requesterId) return false;
    if (delegateId && memberId === delegateId) return false;
    if (effortOwnerIds.includes(memberId)) return false;
    return !memberOptionMap.get(memberId)?.isOrganizationAdmin;
  });
}

function getTodayStart(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function isPastScheduleDate(value: string): boolean {
  return new Date(value).getTime() < getTodayStart().getTime();
}

function getScheduleDayCount(startAtValue: string, endAtValue: string): number {
  const startAt = new Date(startAtValue);
  const endAt = new Date(endAtValue);

  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
    return 0;
  }

  startAt.setHours(0, 0, 0, 0);
  endAt.setHours(0, 0, 0, 0);

  return Math.max(Math.floor((endAt.getTime() - startAt.getTime()) / 86_400_000) + 1, 1);
}

function showValidationError(
  setErrorMessage: Dispatch<SetStateAction<string | null>>,
  message: string,
): void {
  setErrorMessage(message);
  toast.danger(message);
}

// ---------- Normal form ----------

interface NormalFormState {
  requestTypeCode: string;
  requestTypeName: string;
  workflowCode: string;
  title: string;
  content: string;
  reasonCode: string;
  reasonDetail: string;
  delegateId: string;
  ccMemberIds: string[];
  startAt: string;
  endAt: string;
}

const defaultNormalFormState: NormalFormState = {
  requestTypeCode: '',
  requestTypeName: '',
  workflowCode: '',
  title: '',
  content: '',
  reasonCode: '',
  reasonDetail: '',
  delegateId: '',
  ccMemberIds: [],
  startAt: '',
  endAt: '',
};

function buildInitialNormalFormState(requestTypes: TicketRequestCatalogType[]): NormalFormState {
  const nonOtTypes = requestTypes.filter((t) => t.type !== 'overtime');
  const first = nonOtTypes[0];
  return {
    ...defaultNormalFormState,
    requestTypeCode: first?.code ?? '',
    workflowCode: first?.defaultWorkflowCode ?? first?.allowedWorkflowCodes[0] ?? '',
  };
}

interface NormalCreateFormProps {
  requesterId?: string | null;
  isPending: boolean;
  canDelegate: boolean;
  memberOptions: TicketRequestMemberOption[];
  requestTypes: TicketRequestCatalogType[];
  reasonOptions: TicketRequestCatalogReason[];
  onSubmit: (payload: CreateTicketRequestBody) => Promise<{ ok: boolean; data?: { id: string } }>;
  onSuccess?: (ticketId: string) => void;
}

function NormalCreateForm({
  requesterId,
  isPending,
  canDelegate,
  memberOptions,
  requestTypes,
  reasonOptions,
  onSubmit,
  onSuccess,
}: NormalCreateFormProps) {
  const t = useTranslations('ticket');
  const nonOtTypes = useMemo(() => requestTypes.filter((t) => t.type !== 'overtime'), [requestTypes]);
  const normalReasonOptions = useMemo(
    () => getNonOvertimeReasonOptions(reasonOptions),
    [reasonOptions],
  );
  const [form, setForm] = useState<NormalFormState>(() => buildInitialNormalFormState(nonOtTypes));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const today = useMemo(() => getTodayStart(), []);


  const memberOptionMap = useMemo(
    () => new Map(memberOptions.map((m) => [m.id, m])),
    [memberOptions],
  );
  const requesterCanDelegate = canDelegate;
  const delegateOptions = useMemo(
    () => memberOptions.filter((m) => m.canApprove && !m.isOrganizationAdmin && (!requesterId || m.id !== requesterId)),
    [memberOptions, requesterId],
  );
  const ccOptions = useMemo(
    () => memberOptions.filter((m) => {
      if (m.isOrganizationAdmin) return false;
      if (requesterId && m.id === requesterId) return false;
      if (form.delegateId && m.id === form.delegateId) return false;
      return true;
    }),
    [memberOptions, requesterId, form.delegateId],
  );

  const selectedRequestType = useMemo(
    () => nonOtTypes.find((t) => t.code === form.requestTypeCode),
    [nonOtTypes, form.requestTypeCode],
  );
  const isCustomType = selectedRequestType?.isCustom === true;

  const handleRequestTypeChange = (requestTypeCode: string) => {
    setForm((previous) => {
      const requestType = nonOtTypes.find((item) => item.code === requestTypeCode);
      const allowed = requestType?.allowedWorkflowCodes ?? [];
      const nextWorkflow = allowed.includes(previous.workflowCode as TicketRequestWorkflowCode)
        ? previous.workflowCode
        : requestType?.defaultWorkflowCode ?? allowed[0] ?? '';
      return { ...previous, requestTypeCode, requestTypeName: '', workflowCode: nextWorkflow };
    });
  };

  const handleSubmit = async () => {
    const trimmedTitle = form.title.trim();
    const trimmedContent = form.content.trim();

    if (!form.requestTypeCode.trim()) { showValidationError(setErrorMessage, t('createForm.validation.requestTypeRequired')); return; }
    if (isCustomType && !form.requestTypeName.trim()) { showValidationError(setErrorMessage, t('createForm.validation.customRequestTypeRequired')); return; }
    if (!trimmedTitle) { showValidationError(setErrorMessage, t('createForm.validation.titleRequired')); return; }
    if (!trimmedContent) { showValidationError(setErrorMessage, t('createForm.validation.contentRequired')); return; }
    if (!requesterCanDelegate && !form.delegateId) { showValidationError(setErrorMessage, t('createForm.validation.delegateRequired')); return; }

    const startAtIso = form.startAt ? dateTimeInputToIso(form.startAt) : undefined;
    const endAtIso = form.endAt ? dateTimeInputToIso(form.endAt) : undefined;

    if (startAtIso && endAtIso && new Date(startAtIso) > new Date(endAtIso)) {
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

    const selectedType = nonOtTypes.find((item) => item.code === form.requestTypeCode);
    const cleanedCcMemberIds = sanitizeCcMemberIds({
      ccMemberIds: form.ccMemberIds,
      requesterId,
      delegateId: form.delegateId,
      effortOwnerIds: [],
      memberOptionMap,
    });

    const payload: CreateTicketRequestBody = {
      requestTypeCode: form.requestTypeCode,
      requestTypeName: isCustomType ? form.requestTypeName.trim() : undefined,
      type: selectedType?.type,
      workflowCode: (() => {
        if (!form.workflowCode) return undefined;
        const wf = form.workflowCode as TicketRequestWorkflowCode;
        if (requesterCanDelegate && wf === 'working_time') return 'working_time_direct';
        return wf;
      })(),
      title: trimmedTitle,
      content: trimmedContent,
      reasonCode: form.reasonCode || undefined,
      reasonDetail: form.reasonDetail.trim() || undefined,
      delegateId: form.delegateId || undefined,
      ccMemberIds: cleanedCcMemberIds,
      ...(startAtIso ? { startAt: startAtIso } : {}),
      ...(endAtIso ? { endAt: endAtIso } : {}),
    };

    setErrorMessage(null);
    const result = await onSubmit(payload);
    if (result.ok) {
      setForm(buildInitialNormalFormState(nonOtTypes));
      if (result.data?.id) onSuccess?.(result.data.id);
    }
  };

  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">{t('createForm.general.title')}</CardTitle>
        <CardDescription>{t('createForm.general.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide">
            {t('createForm.general.workflowSetup')}
          </h3>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ticket-create-request-type">{t('createForm.general.requestType')} <span className="text-destructive">*</span></Label>
              <Select value={form.requestTypeCode} onValueChange={handleRequestTypeChange}>
                <SelectTrigger id="ticket-create-request-type">
                  <SelectValue placeholder={t('createForm.common.selectRequestType')} />
                </SelectTrigger>
                <SelectContent>
                  {nonOtTypes.map((requestType) => (
                    <SelectItem key={requestType.code} value={requestType.code}>
                      {requestType.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isCustomType && (
                <Input
                  id="ticket-create-request-type-name"
                  value={form.requestTypeName}
                  onChange={(e) => setForm((p) => ({ ...p, requestTypeName: e.target.value }))}
                  placeholder={t('createForm.common.enterCustomRequestTypeName')}
                  maxLength={100}
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ticket-create-reason">{t('createForm.general.reason')}</Label>
              <Select
                value={form.reasonCode || 'none'}
                onValueChange={(v) => setForm((p) => ({ ...p, reasonCode: v === 'none' ? '' : v }))}
              >
                <SelectTrigger id="ticket-create-reason">
                  <SelectValue placeholder={t('createForm.common.optionalReason')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('createForm.common.noReason')}</SelectItem>
                  {normalReasonOptions.map((r) => (
                    <SelectItem key={r.code} value={r.code}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

        </section>

        <section className="space-y-4 rounded-xl border bg-muted/30 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide">
            {t('createForm.general.participants')}
          </h3>
          <div className="grid gap-4 lg:grid-cols-2">
            {!requesterCanDelegate && (
              <div className="space-y-2">
                <Label htmlFor="ticket-create-delegate">
                  {t('createForm.general.delegate')}<span className="text-destructive"> *</span>
                </Label>
                <Select
                  value={form.delegateId || ''}
                  onValueChange={(v) => setForm((p) => ({ ...p, delegateId: v }))}
                >
                  <SelectTrigger id="ticket-create-delegate">
                    <SelectValue placeholder={t('createForm.common.selectApprover')} />
                  </SelectTrigger>
                  <SelectContent>
                    {delegateOptions.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>{t('createForm.general.ccMembers')}</Label>
            <CcMemberTagInput
              options={ccOptions}
              selectedMemberIds={form.ccMemberIds}
              onChange={(next) => setForm((p) => ({ ...p, ccMemberIds: next }))}
              disabled={isPending}
            />
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide">
            {t('createForm.general.requestDetail')}
          </h3>
          <div className="space-y-2">
            <Label htmlFor="ticket-create-title">{t('createForm.general.titleField')} <span className="text-destructive">*</span></Label>
            <Input
              id="ticket-create-title"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              maxLength={255}
              placeholder={t('createForm.common.enterRequestTitle')}
            />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ticket-create-content">{t('createForm.general.content')} <span className="text-destructive">*</span></Label>
              <Textarea
                id="ticket-create-content"
                value={form.content}
                onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
                placeholder={t('createForm.common.describeRequestDetails')}
                rows={5}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ticket-create-reason-detail">{t('createForm.general.reasonDetail')}</Label>
              <Textarea
                id="ticket-create-reason-detail"
                value={form.reasonDetail}
                onChange={(e) => setForm((p) => ({ ...p, reasonDetail: e.target.value }))}
                placeholder={t('createForm.common.optionalDetailForReason')}
                rows={5}
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide">
            {t('createForm.general.scheduleOptional')}
          </h3>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Label>{t('createForm.general.startAt')}</Label>
              <DateTimeInput
                value={form.startAt}
                onChange={(v) => setForm((p) => ({ ...p, startAt: v }))}
                minDate={today}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('createForm.general.endAt')}</Label>
              <DateTimeInput
                value={form.endAt}
                onChange={(v) => setForm((p) => ({ ...p, endAt: v }))}
                minDate={today}
              />
            </div>
          </div>
        </section>

        <div className="flex justify-end border-t pt-4">
          <Button onClick={() => void handleSubmit()} disabled={isPending} size="lg">
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('createForm.general.submit')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------- Overtime form ----------

interface OtFormState {
  title: string;
  startAt: string;
  endAt: string;
  projectId: string;
  plannedHours: string;
  scope: string;
  reasonCode: string;
  reasonDetail: string;
  effortOwnerIds: string[];
  ccMemberIds: string[];
}

const defaultOtFormState: OtFormState = {
  title: '',
  startAt: '',
  endAt: '',
  projectId: '',
  plannedHours: '',
  scope: '',
  reasonCode: '',
  reasonDetail: '',
  effortOwnerIds: [],
  ccMemberIds: [],
};

interface OvertimeCreateFormProps {
  requesterId?: string | null;
  isPending: boolean;
  memberOptions: TicketRequestMemberOption[];
  reasonOptions: TicketRequestCatalogReason[];
  projectOptions: OtProjectOption[];
  isProjectOptionsLoading?: boolean;
  onSubmit: (payload: CreateOvertimeTicketRequestBody) => Promise<{ ok: boolean; data?: { id: string }; error?: string }>;
  onSuccess?: (ticketId: string) => void;
}

function formatEffortOwnerLabel(user: { firstName?: string | null; lastName?: string | null; email: string }): string {
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ');
  return name ? `${name} (${user.email})` : user.email;
}

function OvertimeCreateForm({
  requesterId,
  isPending,
  memberOptions,
  reasonOptions,
  projectOptions,
  isProjectOptionsLoading = false,
  onSubmit,
  onSuccess,
}: OvertimeCreateFormProps) {
  const t = useTranslations('ticket');
  const overtimeReasonOptions = useMemo(
    () => getOvertimeReasonOptions(reasonOptions),
    [reasonOptions],
  );
  const [form, setForm] = useState<OtFormState>(defaultOtFormState);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const today = useMemo(() => getTodayStart(), []);
  const isOtherOvertimeReason = form.reasonCode === 'ot_other';

  // Fetch effort owners dynamically — re-fetches when projectId changes
  const {
    data: effortOwnerRaw = [],
    isPending: isEffortOwnerLoading,
  } = useOtEffortOwnerOptionsQuery(
    form.projectId || undefined,
    Boolean(form.projectId),
  );
  const organizationAdminIdSet = useMemo(
    () =>
      new Set(
        memberOptions
          .filter((member) => member.isOrganizationAdmin)
          .map((member) => member.id),
      ),
    [memberOptions],
  );

  const projectMemberOptions = useMemo(
    () =>
      effortOwnerRaw
        .filter((member) => !organizationAdminIdSet.has(member.id))
        .map((member) => ({
          id: member.id,
          email: member.email,
          firstName: member.firstName ?? null,
          lastName: member.lastName ?? null,
          label: formatEffortOwnerLabel(member),
          roles: [],
          canApprove: false,
          isOrganizationAdmin: organizationAdminIdSet.has(member.id),
          isDefaultApprover: false,
        })),
    [effortOwnerRaw, organizationAdminIdSet],
  );
  const projectMemberOptionMap = useMemo(
    () => new Map(projectMemberOptions.map((member) => [member.id, member])),
    [projectMemberOptions],
  );
  const effortOwnerOptions = projectMemberOptions;

  useEffect(() => {
    if (!form.projectId) {
      if (form.effortOwnerIds.length > 0) {
        setForm((previous) => ({ ...previous, effortOwnerIds: [] }));
      }
      return;
    }

    if (projectMemberOptions.length === 0) {
      return;
    }

    const availableIds = new Set(projectMemberOptions.map((member) => member.id));
    const filteredIds = form.effortOwnerIds.filter((memberId) => availableIds.has(memberId));

    if (filteredIds.length !== form.effortOwnerIds.length) {
      setForm((previous) => ({
        ...previous,
        effortOwnerIds: filteredIds,
      }));
    }
  }, [projectMemberOptions, form.effortOwnerIds, form.projectId]);

  useEffect(() => {
    if (!form.projectId) {
      if (form.ccMemberIds.length > 0) {
        setForm((previous) => ({ ...previous, ccMemberIds: [] }));
      }
      return;
    }

    if (projectMemberOptions.length === 0) {
      return;
    }

    const availableIds = new Set(projectMemberOptions.map((member) => member.id));
    const filteredIds = form.ccMemberIds.filter((memberId) => availableIds.has(memberId));

    if (filteredIds.length !== form.ccMemberIds.length) {
      setForm((previous) => ({
        ...previous,
        ccMemberIds: filteredIds,
      }));
    }
  }, [projectMemberOptions, form.ccMemberIds, form.projectId]);

  // CC options: project members only, excluding requester and selected effort owners
  const ccOptions = useMemo(
    () => projectMemberOptions.filter((m) => {
      if (requesterId && m.id === requesterId) return false;
      if (form.effortOwnerIds.includes(m.id)) return false;
      return true;
    }),
    [projectMemberOptions, requesterId, form.effortOwnerIds],
  );

  const handleSubmit = async () => {
    const trimmedTitle = form.title.trim();
    if (!trimmedTitle) { showValidationError(setErrorMessage, t('createForm.validation.titleRequired')); return; }
    if (!form.startAt) { showValidationError(setErrorMessage, t('createForm.validation.startDateTimeRequired')); return; }
    if (!form.endAt) { showValidationError(setErrorMessage, t('createForm.validation.endDateTimeRequired')); return; }
    if (!form.projectId) { showValidationError(setErrorMessage, t('createForm.validation.projectRequired')); return; }
    if (!form.plannedHours.trim()) {
      showValidationError(setErrorMessage, t('createForm.validation.plannedHoursRequired'));
      return;
    }
    if (!form.reasonCode.trim()) {
      showValidationError(setErrorMessage, t('createForm.validation.reasonRequired'));
      return;
    }

    const startAtIso = dateTimeInputToIso(form.startAt);
    const endAtIso = dateTimeInputToIso(form.endAt);

    if (new Date(startAtIso) > new Date(endAtIso)) {
      showValidationError(setErrorMessage, t('createForm.validation.startBeforeEnd'));
      return;
    }

    if (isPastScheduleDate(startAtIso)) {
      showValidationError(setErrorMessage, t('createForm.validation.startPast'));
      return;
    }

    if (isPastScheduleDate(endAtIso)) {
      showValidationError(setErrorMessage, t('createForm.validation.endPast'));
      return;
    }

    const plannedHours = form.plannedHours ? Number(form.plannedHours) : undefined;
    if (form.plannedHours && (!plannedHours || plannedHours <= 0)) {
      showValidationError(setErrorMessage, t('createForm.validation.plannedHoursPositive'));
      return;
    }

    const maxPlannedHours = getScheduleDayCount(form.startAt, form.endAt) * 4;
    if (plannedHours != null && plannedHours > maxPlannedHours) {
      showValidationError(
        setErrorMessage,
        t('createForm.validation.plannedHoursExceeded', { hours: maxPlannedHours }),
      );
      return;
    }

    if (isOtherOvertimeReason && !form.reasonDetail.trim()) {
      showValidationError(setErrorMessage, t('createForm.validation.reasonDetailRequired'));
      return;
    }

    const effortOwnerIds = ensureUnique(
      form.effortOwnerIds.length > 0
        ? form.effortOwnerIds
        : requesterId
          ? [requesterId]
          : [],
    );
    if (effortOwnerIds.length === 0) {
      showValidationError(setErrorMessage, t('createForm.validation.effortOwnerRequired'));
      return;
    }

    const availableEffortOwnerIds = new Set(effortOwnerOptions.map((member) => member.id));
    const hasRestrictedEffortOwner = effortOwnerIds.some((memberId) => !availableEffortOwnerIds.has(memberId));
    if (hasRestrictedEffortOwner) {
      showValidationError(
        setErrorMessage,
        t('createForm.validation.restrictedEffortOwner'),
      );
      return;
    }

    const cleanedCcMemberIds = sanitizeCcMemberIds({
      ccMemberIds: form.ccMemberIds,
      requesterId,
      effortOwnerIds,
      memberOptionMap: projectMemberOptionMap,
    });

    const payload: CreateOvertimeTicketRequestBody = {
      title: trimmedTitle,
      startAt: startAtIso,
      endAt: endAtIso,
      projectId: form.projectId,
      plannedHours,
      scope: form.scope.trim() || undefined,
      reasonCode: form.reasonCode || undefined,
      reasonDetail: form.reasonDetail.trim() || undefined,
      effortOwnerIds,
      ccMemberIds: cleanedCcMemberIds.length > 0 ? cleanedCcMemberIds : undefined,
    };

    setErrorMessage(null);
    const result = await onSubmit(payload);
    if (result.ok) {
      setForm(defaultOtFormState);
      if (result.data?.id) onSuccess?.(result.data.id);
      return;
    }

    setErrorMessage(result.error ?? t('toasts.overtimeCreateFailed'));
  };

  return (
    <Card className="shadow-sm">
      <CardContent className="space-y-6 pt-6">

        {/* ── Basic Info ── */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide">{t('createForm.overtime.basicInfo')}</h3>
          <div className="space-y-2">
            <Label htmlFor="ot-create-title">{t('createForm.general.titleField')} <span className="text-destructive">*</span></Label>
            <Input
              id="ot-create-title"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              maxLength={255}
              placeholder="e.g. OT March — ICCP Portal sprint deadline"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t('createForm.general.startAt')} <span className="text-destructive">*</span></Label>
              <DateTimeInput
                value={form.startAt}
                onChange={(v) => setForm((p) => ({ ...p, startAt: v }))}
                disabled={isPending}
                minDate={today}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('createForm.general.endAt')} <span className="text-destructive">*</span></Label>
              <DateTimeInput
                value={form.endAt}
                onChange={(v) => setForm((p) => ({ ...p, endAt: v }))}
                disabled={isPending}
                minDate={today}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ot-create-planned-hours">
                {t('createForm.overtime.plannedHours')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="ot-create-planned-hours"
                type="number"
                min={0.5}
                step={0.5}
                value={form.plannedHours}
                onChange={(e) => setForm((p) => ({ ...p, plannedHours: e.target.value }))}
                placeholder={t('createForm.common.egHours')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ot-create-reason">
                {t('createForm.overtime.reason')} <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.reasonCode || 'none'}
                onValueChange={(v) =>
                  setForm((p) => ({
                    ...p,
                    reasonCode: v === 'none' ? '' : v,
                    reasonDetail: v === 'ot_other' ? p.reasonDetail : '',
                  }))
                }
              >
                <SelectTrigger id="ot-create-reason">
                  <SelectValue placeholder={t('createForm.common.selectReason')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('createForm.common.noReason')}</SelectItem>
                  {overtimeReasonOptions.map((r) => (
                    <SelectItem key={r.code} value={r.code}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isOtherOvertimeReason ? (
            <div className="space-y-2">
              <Label htmlFor="ot-create-reason-detail">
                {t('createForm.overtime.reasonDetail')} <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="ot-create-reason-detail"
                value={form.reasonDetail}
                onChange={(e) => setForm((p) => ({ ...p, reasonDetail: e.target.value }))}
                placeholder={t('createForm.common.enterDetailedOvertimeReason')}
                rows={2}
              />
            </div>
          ) : null}
        </section>

        {/* ── Project & Team ── */}
        <section className="space-y-4 rounded-xl border bg-muted/30 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
            {t('createForm.overtime.projectTeam')}
          </h3>

          {/* Project dropdown */}
          <div className="space-y-2">
            <Label htmlFor="ot-create-project">
              Project <span className="text-destructive">*</span>
            </Label>
            {isProjectOptionsLoading ? (
              <div className="h-9 rounded-md border bg-muted/50 animate-pulse" />
            ) : (
              <Select
                value={form.projectId}
                onValueChange={(v) => setForm((p) => ({
                  ...p,
                  projectId: v,
                  effortOwnerIds: [],
                }))}
                disabled={isPending}
              >
                <SelectTrigger id="ot-create-project">
                  <SelectValue placeholder={t('createForm.common.selectProject')} />
                </SelectTrigger>
                <SelectContent>
                  {projectOptions.length === 0 ? (
                    <div className="px-2 py-3 text-center text-xs text-muted-foreground">
                      {t('createForm.overtime.noProjectManagerAssignments')}
                    </div>
                  ) : (
                    projectOptions.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Effort Owner dropdown — sourced from API based on selected project */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                {t('createForm.overtime.effortOwners')}
              </Label>
              {form.projectId && isEffortOwnerLoading && (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              )}
            </div>
            <MemberComboboxMultiSelect
              options={effortOwnerOptions}
              selectedMemberIds={form.effortOwnerIds}
              onChange={(next) => setForm((p) => ({ ...p, effortOwnerIds: next }))}
              currentUserId={requesterId}
              disabled={isPending || isEffortOwnerLoading || !form.projectId}
              placeholder={t('createForm.overtime.effortOwners')}
              emptyMessage={
                form.projectId
                  ? t('createForm.overtime.noEligibleMembers')
                  : t('createForm.overtime.selectProjectFirstForEffortOwners')
              }
            />
            <p className="text-xs text-muted-foreground">
              {form.projectId
                ? t('createForm.overtime.effortOwnersHint')
                : t('createForm.overtime.selectProjectThenEffortOwners')}
            </p>
          </div>

          {/* CC Members */}
          <div className="space-y-2">
            <Label>{t('createForm.overtime.ccMembers')}</Label>
            <CcMemberTagInput
              options={ccOptions}
              selectedMemberIds={form.ccMemberIds}
              onChange={(next) => setForm((p) => ({ ...p, ccMemberIds: next }))}
              disabled={isPending || isEffortOwnerLoading || !form.projectId}
              emptyMessage={
                form.projectId
                  ? t('createForm.overtime.noAvailableCcInProject')
                  : t('createForm.overtime.selectProjectFirstForCc')
              }
            />
            <p className="text-xs text-muted-foreground">
              {form.projectId
                ? t('createForm.overtime.ccHint')
                : t('createForm.overtime.selectProjectThenCc')}
            </p>
          </div>
        </section>

        {/* ── Scope & Details ── */}
        <section className="space-y-4 rounded-xl border bg-muted/30 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide">{t('createForm.overtime.scopeDetails')}</h3>
          <div className="space-y-2">
            <Label htmlFor="ot-create-scope">{t('createForm.overtime.scope')}</Label>
            <Textarea
              id="ot-create-scope"
              value={form.scope}
              onChange={(e) => setForm((p) => ({ ...p, scope: e.target.value }))}
              placeholder={t('createForm.common.describeOtScope')}
              rows={3}
            />
          </div>
        </section>

        <div className="flex justify-end border-t pt-4">
          <Button
            onClick={() => void handleSubmit()}
            disabled={isPending}
            size="lg"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('createForm.overtime.submit')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------- Public exported component ----------

export interface TicketRequestCreateFormProps {
  mode?: 'normal' | 'overtime';
  requesterId?: string | null;
  isPending: boolean;
  canDelegate?: boolean;
  memberOptions: TicketRequestMemberOption[];
  requestTypes: TicketRequestCatalogType[];
  reasonOptions: TicketRequestCatalogReason[];
  projectOptions?: OtProjectOption[];
  isProjectOptionsLoading?: boolean;
  onSubmit: (payload: CreateTicketRequestBody) => Promise<{ ok: boolean; data?: { id: string }; error?: string }>;
  onSubmitOvertime?: (payload: CreateOvertimeTicketRequestBody) => Promise<{ ok: boolean; data?: { id: string }; error?: string }>;
  onSuccess?: (ticketId: string) => void;
}

export function TicketRequestCreateForm({
  mode = 'normal',
  requesterId,
  isPending,
  canDelegate = false,
  memberOptions,
  requestTypes,
  reasonOptions,
  projectOptions = [],
  isProjectOptionsLoading = false,
  onSubmit,
  onSubmitOvertime,
  onSuccess,
}: TicketRequestCreateFormProps) {
  const t = useTranslations('ticket');
  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-muted/40 p-4">
        <p className="text-base font-semibold">
          {mode === 'overtime' ? t('workspace.createOtCardTitle') : t('workspace.createCardTitle')}
        </p>
        <p className="text-muted-foreground mt-1 text-sm">
          {mode === 'overtime'
            ? t('createForm.overtime.description')
            : t('createForm.general.description')}
        </p>
      </div>

      {mode === 'overtime' ? (
        <OvertimeCreateForm
          requesterId={requesterId}
          isPending={isPending}
          memberOptions={memberOptions}
          reasonOptions={reasonOptions}
          projectOptions={projectOptions}
          isProjectOptionsLoading={isProjectOptionsLoading}
          onSubmit={onSubmitOvertime ?? (async () => ({ ok: false }))}
          onSuccess={onSuccess}
        />
      ) : (
        <NormalCreateForm
          requesterId={requesterId}
          isPending={isPending}
          canDelegate={canDelegate}
          memberOptions={memberOptions}
          requestTypes={requestTypes}
          reasonOptions={reasonOptions}
          onSubmit={onSubmit}
          onSuccess={onSuccess}
        />
      )}
    </div>
  );
}
