'use client';

import { Filter, RefreshCw, Search } from 'lucide-react';
import { ROUTES } from '@/common/constant/routes';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useTenant } from '@/providers';
import { useDocumentApproval } from '../hooks/use-document-approval';
import { ApprovalDocumentsTable } from '../components/documents-approve/approval-documents-table';
import { ApprovalStatsCards } from '../components/documents-approve/approval-stats-cards';

export function DocumentApprovalPage() {
  const { tenantSlug } = useTenant();
  const {
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
  } = useDocumentApproval();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Document Queue"
        description="Manage and review documents submitted for the RAG knowledge base."
        breadcrumbs={[
          { label: 'Dashboard', href: ROUTES.tenant.dashboard(tenantSlug) },
          { label: 'Documents', href: ROUTES.tenant.documents(tenantSlug) },
          { label: 'Queue' },
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </div>
        }
      />

      <ApprovalStatsCards stats={stats} />

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="all" className="gap-2">
            All
            <Badge variant="secondary">{documents.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="processing" className="gap-2">
            Processing
            <Badge className="bg-amber-100 text-amber-700">
              {documents.filter((d) => d.status === 'processing').length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="indexed" className="gap-2">
            Indexed
          </TabsTrigger>
          <TabsTrigger value="failed">Failed</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search by name..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs font-medium">Sort by:</span>
          <Select defaultValue="newest">
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Date Uploaded (Newest)</SelectItem>
              <SelectItem value="name">Name (A-Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isPending ? (
        <div className="text-muted-foreground py-8 text-center text-sm">
          Loading documents...
        </div>
      ) : (
        <ApprovalDocumentsTable
          documents={filteredDocuments}
          selectedIds={selectedDocs}
          onToggleAll={toggleAll}
          onToggleOne={toggleDoc}
        />
      )}

      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          Showing{' '}
          <span className="text-foreground font-bold">{filteredDocuments.length}</span>{' '}
          document{filteredDocuments.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}
