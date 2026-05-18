'use client';

import { useState } from 'react';
import { FilePenLine, FolderPlus, Layers3 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/lib/toast';
import {
  useCreateCategory,
  useCreateFolder,
  useUpdateCategory,
  useUpdateDocument,
  useUpdateFolder,
} from '../../query/use-documents';
import type { CategoryResponse } from '@/services/documents';

type DialogMode =
  | 'create-folder'
  | 'rename-folder'
  | 'create-category'
  | 'rename-category'
  | 'edit-document';

interface DocumentResourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: DialogMode;
  projectId?: string;
  categories?: CategoryResponse[];
  folderDraft?: {
    id?: string;
    name?: string;
    description?: string | null;
    parentId?: string | null;
  };
  categoryDraft?: {
    id?: string;
    name?: string;
    description?: string | null;
  };
  documentDraft?: {
    id: string;
    title: string;
    description?: string | null;
    categoryId?: string | null;
    accessScope?: string | null;
  };
}

function getDialogCopy(mode: DialogMode) {
  switch (mode) {
    case 'create-folder':
      return {
        title: 'Create folder',
        description: 'Add a new folder to the current branch of the document tree.',
        submitLabel: 'Create folder',
        accent: 'Folder structure',
      };
    case 'rename-folder':
      return {
        title: 'Edit folder',
        description: 'Update the folder name or add a short description for the team.',
        submitLabel: 'Save folder',
        accent: 'Folder structure',
      };
    case 'create-category':
      return {
        title: 'Create category',
        description: 'Create a category to group documents across folders.',
        submitLabel: 'Create category',
        accent: 'Category lane',
      };
    case 'rename-category':
      return {
        title: 'Edit category',
        description:
          'Refine the category label and short description used in the explorer.',
        submitLabel: 'Save category',
        accent: 'Category lane',
      };
    case 'edit-document':
      return {
        title: 'Edit document',
        description:
          'Update the title, description, and category for the selected document.',
        submitLabel: 'Save document',
        accent: 'Document metadata',
      };
  }
}

function getDialogIcon(mode: DialogMode) {
  switch (mode) {
    case 'create-folder':
    case 'rename-folder':
      return <FolderPlus className="size-5" />;
    case 'create-category':
    case 'rename-category':
      return <Layers3 className="size-5" />;
    case 'edit-document':
      return <FilePenLine className="size-5" />;
  }
}

export function DocumentResourceDialog({
  open,
  onOpenChange,
  mode,
  projectId,
  categories = [],
  folderDraft,
  categoryDraft,
  documentDraft,
}: DocumentResourceDialogProps) {
  const dialogCopy = getDialogCopy(mode);
  const createFolder = useCreateFolder();
  const updateFolder = useUpdateFolder();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const updateDocument = useUpdateDocument();

  const [name, setName] = useState(() => {
    if (mode === 'create-folder' || mode === 'rename-folder') {
      return folderDraft?.name ?? '';
    }

    if (mode === 'create-category' || mode === 'rename-category') {
      return categoryDraft?.name ?? '';
    }

    return documentDraft?.title ?? '';
  });
  const [description, setDescription] = useState(() => {
    if (mode === 'create-folder' || mode === 'rename-folder') {
      return folderDraft?.description ?? '';
    }

    if (mode === 'create-category' || mode === 'rename-category') {
      return categoryDraft?.description ?? '';
    }

    return documentDraft?.description ?? '';
  });
  const [categoryId, setCategoryId] = useState<string>(
    () => documentDraft?.categoryId ?? '__none__',
  );

  async function handleSubmit() {
    if (!name.trim()) {
      toast.danger('A name is required.');
      return;
    }

    if (mode === 'create-folder') {
      const result = await createFolder.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        parentId: folderDraft?.parentId ?? undefined,
        projectId,
      });

      if (!result.ok) {
        toast.danger(result.error.message);
        return;
      }

      toast.success('Folder created.');
      onOpenChange(false);
      return;
    }

    if (mode === 'rename-folder' && folderDraft?.id) {
      const result = await updateFolder.mutateAsync({
        id: folderDraft.id,
        name: name.trim(),
        description: description.trim() || undefined,
      });

      if (!result.ok) {
        toast.danger(result.error.message);
        return;
      }

      toast.success('Folder updated.');
      onOpenChange(false);
      return;
    }

    if (mode === 'create-category') {
      const result = await createCategory.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
      });

      if (!result.ok) {
        toast.danger(result.error.message);
        return;
      }

      toast.success('Category created.');
      onOpenChange(false);
      return;
    }

    if (mode === 'rename-category' && categoryDraft?.id) {
      const result = await updateCategory.mutateAsync({
        id: categoryDraft.id,
        name: name.trim(),
        description: description.trim() || undefined,
      });

      if (!result.ok) {
        toast.danger(result.error.message);
        return;
      }

      toast.success('Category updated.');
      onOpenChange(false);
      return;
    }

    if (mode === 'edit-document' && documentDraft?.id) {
      const result = await updateDocument.mutateAsync({
        id: documentDraft.id,
        title: name.trim(),
        description: description.trim() || undefined,
        categoryId: categoryId === '__none__' ? null : categoryId,
      });

      if (!result.ok) {
        toast.danger(result.error.message);
        return;
      }

      toast.success('Document updated.');
      onOpenChange(false);
    }
  }

  const isPending =
    createFolder.isPending ||
    updateFolder.isPending ||
    createCategory.isPending ||
    updateCategory.isPending ||
    updateDocument.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border/70 bg-background flex max-h-[90vh] w-[calc(100vw-1.5rem)] max-w-xl flex-col gap-0 overflow-hidden rounded-xl border p-0 shadow-2xl sm:w-[calc(100vw-3rem)]">
        <DialogHeader className="border-border/70 bg-card shrink-0 border-b px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 text-primary inline-flex shrink-0 rounded-lg p-2">
              {getDialogIcon(mode)}
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-foreground text-base">
                {dialogCopy.title}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground truncate text-xs">
                {dialogCopy.description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-muted-foreground text-xs font-medium">
                {mode === 'edit-document' ? 'Title' : 'Name'}{' '}
                <span className="text-destructive">*</span>
              </label>
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="border-border bg-background text-foreground h-9 text-sm"
                placeholder={
                  mode === 'edit-document' ? 'Quarterly report' : 'Knowledge base'
                }
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-muted-foreground text-xs font-medium">
                Description
              </label>
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="border-border bg-background text-foreground min-h-[120px] text-sm"
                placeholder="Optional context for the team"
              />
            </div>

            {mode === 'edit-document' ? (
              <div className="space-y-1.5">
                <div className="space-y-1.5">
                  <label className="text-muted-foreground text-xs font-medium">
                    Category
                  </label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger className="border-border bg-background text-foreground h-9 text-sm">
                      <SelectValue placeholder="Choose category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Uncategorized</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <DialogFooter className="border-border/70 bg-muted/20 shrink-0 border-t px-5 py-3">
          <Button
            size="sm"
            variant="outline"
            className="border-border bg-background text-foreground hover:bg-muted"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button size="sm" disabled={isPending} onClick={() => void handleSubmit()}>
            {isPending ? 'Saving...' : dialogCopy.submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
