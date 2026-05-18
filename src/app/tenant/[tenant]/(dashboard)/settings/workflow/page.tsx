import { notFound } from 'next/navigation';

export default function WorkflowBuilderPage() {
  /*
  "use client"

  import { useState } from 'react';
  import { WorkflowCanvas } from '@/features/common/settings/components/workflow-canvas';
  import { WorkflowConfigDrawer } from '@/features/common/settings/components/workflow-config-drawer';
  import {
    workflowSteps,
    workflows,
  } from '@/features/common/settings/components/workflow-data';
  import { WorkflowSidebar } from '@/features/common/settings/components/workflow-sidebar';

  export default function WorkflowBuilderPage() {
    const [selectedWorkflow, setSelectedWorkflow] = useState(1);
    const [selectedStep, setSelectedStep] = useState<number | null>(4);
    const [isDrawerOpen, setIsDrawerOpen] = useState(true);
    const [filterText, setFilterText] = useState('');

    const currentWorkflow = workflows.find((workflow) => workflow.id === selectedWorkflow);
    const currentStep = workflowSteps.find((step) => step.id === selectedStep);

    return (
      <div className="-m-6 flex h-[calc(100vh-4rem)] overflow-hidden">
        <WorkflowSidebar
          workflows={workflows}
          selectedWorkflowId={selectedWorkflow}
          filterText={filterText}
          onFilterTextChange={setFilterText}
          onSelectWorkflow={setSelectedWorkflow}
        />

        <WorkflowCanvas
          currentWorkflowName={currentWorkflow?.name}
          steps={workflowSteps}
          selectedStepId={selectedStep}
          onSelectStep={(stepId) => {
            setSelectedStep(stepId);
            setIsDrawerOpen(true);
          }}
        />

        <WorkflowConfigDrawer
          open={isDrawerOpen}
          currentStep={currentStep}
          onOpenChange={setIsDrawerOpen}
        />
      </div>
    );
  }
  */

  // Tenant settings pages are temporarily disabled, but the previous code is kept above.
  notFound();
}
