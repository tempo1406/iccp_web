import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export interface TicketDecisionDelegateOption {
  id: string;
  label: string;
}

interface TicketRequestDecisionDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  inputLabel: string;
  inputPlaceholder: string;
  required?: boolean;
  isPending: boolean;
  delegateOptions?: TicketDecisionDelegateOption[];
  onOpenChange: (open: boolean) => void;
  onConfirm: (payload: { value: string; nextDelegateId?: string }) => Promise<{ ok: boolean }>;
}

export function TicketRequestDecisionDialog({
  open,
  title,
  description,
  confirmLabel,
  inputLabel,
  inputPlaceholder,
  required = true,
  isPending,
  delegateOptions,
  onOpenChange,
  onConfirm,
}: TicketRequestDecisionDialogProps) {
  const t = useTranslations('ticket.decisionDialog');
  const [value, setValue] = useState('');
  const [nextDelegateId, setNextDelegateId] = useState('none');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setValue('');
      setNextDelegateId('none');
      setErrorMessage(null);
    }

    onOpenChange(nextOpen);
  };

  const handleConfirm = async () => {
    const trimmedValue = value.trim();

    if (required && trimmedValue.length === 0) {
      setErrorMessage(t('required', { label: inputLabel }));
      return;
    }

    const result = await onConfirm({
      value: trimmedValue,
      nextDelegateId: nextDelegateId === 'none' ? undefined : nextDelegateId,
    });

    if (result.ok) {
      handleOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-2.5">
            <Label htmlFor="ticket-decision-input" className="block leading-none">
              {inputLabel}
            </Label>
            <Textarea
              id="ticket-decision-input"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder={inputPlaceholder}
              rows={4}
            />
          </div>

          {delegateOptions && delegateOptions.length > 0 && (
            <div className="space-y-2.5">
              <Label htmlFor="ticket-next-delegate" className="block leading-none">
                {t('nextDelegate')}
              </Label>
              <Select value={nextDelegateId} onValueChange={setNextDelegateId}>
                <SelectTrigger id="ticket-next-delegate">
                  <SelectValue placeholder={t('keepAssigned')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('keepAssigned')}</SelectItem>
                  {delegateOptions.map((delegate) => (
                    <SelectItem key={delegate.id} value={delegate.id}>
                      {delegate.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
            {t('cancel')}
          </Button>
          <Button onClick={() => void handleConfirm()} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
