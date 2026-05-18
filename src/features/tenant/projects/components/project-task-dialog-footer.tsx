'use client';

import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProjectTaskDialogFooterProps {
  isSubmitting: boolean;
  onCancel: () => void;
  onSave: () => void;
}

export function ProjectTaskDialogFooter({
  isSubmitting,
  onCancel,
  onSave,
}: ProjectTaskDialogFooterProps) {
  return (
    <div className="flex justify-end gap-2">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={isSubmitting}
      >
        Cancel
      </Button>
      <Button type="button" onClick={onSave} disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save Changes
      </Button>
    </div>
  );
}
