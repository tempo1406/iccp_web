"use client"

import { useMemo, useState } from 'react';
import { AuditLogDetailsSheet } from '@/features/tenant/admin/components/audit-log-details-sheet';
import {
  auditLogs,
  type AuditLog,
} from '@/features/tenant/admin/components/audit-logs-data';
import { AuditLogsFilters } from '@/features/tenant/admin/components/audit-logs-filters';
import { AuditLogsPageHeader } from '@/features/tenant/admin/components/audit-logs-header';
import { AuditLogsTable } from '@/features/tenant/admin/components/audit-logs-table';

export default function AuditLogsPage() {
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchesSearch =
        log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.target.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || log.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || log.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [searchQuery, categoryFilter, statusFilter]);

  const handleRowClick = (log: AuditLog) => {
    setSelectedLog(log);
    setIsDrawerOpen(true);
  };

  const copyToClipboard = (value: string) => {
    navigator.clipboard.writeText(value);
  };

  return (
    <div className="space-y-6">
      <AuditLogsPageHeader />

      <AuditLogsFilters
        searchQuery={searchQuery}
        categoryFilter={categoryFilter}
        statusFilter={statusFilter}
        onSearchChange={setSearchQuery}
        onCategoryChange={setCategoryFilter}
        onStatusChange={setStatusFilter}
      />

      <AuditLogsTable logs={filteredLogs} onRowClick={handleRowClick} />

      <AuditLogDetailsSheet
        selectedLog={selectedLog}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        onCopy={copyToClipboard}
      />
    </div>
  );
}
