import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import type { WorkflowStep } from './workflow-data';

interface WorkflowConfigDrawerProps {
  open: boolean;
  currentStep?: WorkflowStep;
  onOpenChange: (open: boolean) => void;
}

export function WorkflowConfigDrawer({
  open,
  currentStep,
  onOpenChange,
}: WorkflowConfigDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] overflow-y-auto sm:w-[540px]">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
              Configure Step
            </SheetTitle>
          </div>
        </SheetHeader>

        {currentStep && (
          <div className="mt-6 space-y-6">
            <div className="bg-muted flex items-center gap-3 rounded-lg p-4">
              <currentStep.icon className={`h-6 w-6 ${currentStep.iconColor}`} />
              <div>
                <p className="font-semibold">{currentStep.name}</p>
                <p className="text-muted-foreground text-xs">
                  {currentStep.type === 'approval'
                    ? 'Approval Step'
                    : currentStep.type === 'rule'
                      ? 'Conditional Rule'
                      : 'Trigger'}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Step Name</Label>
              <Input defaultValue={currentStep.name} />
            </div>

            {currentStep.type === 'approval' && (
              <>
                <div className="space-y-2">
                  <Label>Assignee Type</Label>
                  <Select defaultValue="role">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="role">Role-based</SelectItem>
                      <SelectItem value="user">Specific User</SelectItem>
                      <SelectItem value="manager">Direct Manager</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Assigned To</Label>
                  <Select defaultValue={currentStep.assignee}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Security Team Lead">
                        Security Team Lead
                      </SelectItem>
                      <SelectItem value="Compliance Officer">
                        Compliance Officer
                      </SelectItem>
                      <SelectItem value="Department Head">Department Head</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>SLA (Time to Complete)</Label>
                  <Select defaultValue="48h">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4h">4 hours</SelectItem>
                      <SelectItem value="24h">24 hours</SelectItem>
                      <SelectItem value="48h">48 hours</SelectItem>
                      <SelectItem value="72h">72 hours</SelectItem>
                      <SelectItem value="1w">1 week</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Fallback Action (if SLA exceeded)</Label>
                  <Select defaultValue="escalate">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="escalate">Escalate to Manager</SelectItem>
                      <SelectItem value="auto-approve">Auto-approve</SelectItem>
                      <SelectItem value="reject">Auto-reject</SelectItem>
                      <SelectItem value="notify">Notify Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {currentStep.type === 'rule' && (
              <div className="space-y-2">
                <Label>Condition</Label>
                <Textarea
                  defaultValue={currentStep.condition}
                  placeholder="e.g., Skip approvals if Confidence Score > 95%"
                  rows={3}
                />
              </div>
            )}

            <div className="space-y-4 border-t pt-4">
              <h4 className="font-semibold">Notifications</h4>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Email Notification</p>
                  <p className="text-muted-foreground text-xs">
                    Notify assignee when step is pending
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Reminder</p>
                  <p className="text-muted-foreground text-xs">
                    Send reminder at 50% of SLA time
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>

            <div className="flex gap-3 border-t pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button className="flex-1" onClick={() => onOpenChange(false)}>
                Save Step
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
