'use client';

import { useMemo, useState } from 'react';
import { FileText, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useTenant } from '@/providers';
import { useDocumentList, DOCUMENT_QUERY_KEYS } from '../query/use-documents';
import type { ApprovalStat } from '../components/documents-approve/approval-stats-cards';

export function useDocumentApproval() {
  const { tenantId } = useTenant();
  const qc = useQueryClient();

  const [selectedTab, setSelectedTab] = useState('all');
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  const { data: documents = [], isPending } = useDocumentList();

  const filteredDocuments = useMemo(() => {
    let result = documents;
    if (selectedTab !== 'all') {
      result = result.filter((d) => d.status === selectedTab);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((d) => d.title.toLowerCase().includes(q));
    }
    return result;
  }, [documents, selectedTab, search]);

  const stats = useMemo<ApprovalStat[]>(
    () => [
      {
        label: 'Total Documents',
        value: documents.length,
        icon: FileText,
        iconColor: 'text-blue-500',
        change: `${documents.length} total`,
        changeType: 'neutral',
      },
      {
        label: 'Indexed',
        value: documents.filter((d) => d.status === 'indexed').length,
        icon: CheckCircle2,
        iconColor: 'text-emerald-500',
        change: 'ready',
        changeType: 'positive',
      },
      {
        label: 'Processing',
        value: documents.filter((d) => d.status === 'processing').length,
        icon: Clock,
        iconColor: 'text-amber-500',
        change: 'in progress',
        changeType: 'neutral',
      },
      {
        label: 'Failed',
        value: documents.filter((d) => d.status === 'failed').length,
        icon: AlertCircle,
        iconColor: 'text-red-500',
        change: 'needs review',
        changeType: 'neutral',
      },
    ],
    [documents],
  );

  function toggleDoc(id: string) {
    setSelectedDocs((prev) =>
      prev.includes(id) ? prev.filter((docId) => docId !== id) : [...prev, id],
    );
  }

  function toggleAll() {
    if (selectedDocs.length === filteredDocuments.length) {
      setSelectedDocs([]);
    } else {
      setSelectedDocs(filteredDocuments.map((d) => d.id));
    }
  }

  function handleRefresh() {
    void qc.invalidateQueries({ queryKey: DOCUMENT_QUERY_KEYS.root(tenantId) });
  }

  return {
    selectedTab,
    setSelectedTab,
    selectedDocs,
    search,
    setSearch,
    documents,
    isPending,
    filteredDocuments,
    stats,
    toggleDoc,
    toggleAll,
    handleRefresh,
  };
}
