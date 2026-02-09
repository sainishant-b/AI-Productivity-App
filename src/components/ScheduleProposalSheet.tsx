import { Clock, ArrowRight, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { type ScheduleProposal } from "@/hooks/useCalendarAI";

interface ScheduleProposalSheetProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly proposals: readonly ScheduleProposal[];
  readonly overallReasoning: string;
  readonly conflicts: readonly string[];
  readonly onToggle: (taskId: string) => void;
  readonly onApprove: () => void;
  readonly onDismiss: () => void;
  readonly isApplying?: boolean;
}

export function ScheduleProposalSheet({
  open,
  onOpenChange,
  proposals,
  overallReasoning,
  conflicts,
  onToggle,
  onApprove,
  onDismiss,
  isApplying = false,
}: ScheduleProposalSheetProps) {
  const acceptedCount = proposals.filter((p) => p.accepted).length;

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case "high":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "low":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "";
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case "schedule":
        return <Badge variant="outline" className="bg-green-500/10 text-green-400 text-xs">New</Badge>;
      case "reschedule":
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-400 text-xs">Move</Badge>;
      case "keep":
        return <Badge variant="outline" className="bg-gray-500/10 text-gray-400 text-xs">Keep</Badge>;
      default:
        return null;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return "";
    const [hours, minutes] = timeStr.split(":");
    const h = Number.parseInt(hours);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[420px] sm:max-w-[420px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-400" />
            AI Schedule Proposals
          </SheetTitle>
          <SheetDescription>
            {proposals.length} suggestions. Toggle each one on/off, then approve.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 my-4 -mx-6 px-6" style={{ height: "calc(100vh - 280px)" }}>
          {overallReasoning && (
            <div className="mb-4 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <p className="text-sm text-muted-foreground">{overallReasoning}</p>
            </div>
          )}

          {conflicts.length > 0 && (
            <div className="mb-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                <p className="text-sm font-medium text-yellow-400">Conflicts Detected</p>
              </div>
              {conflicts.map((c, i) => (
                <p key={`conflict-${c.slice(0, 20)}`} className="text-xs text-muted-foreground">• {c}</p>
              ))}
            </div>
          )}

          <div className="space-y-3">
            {proposals.map((proposal) => (
              <div
                key={proposal.taskId}
                className={`p-3 rounded-lg border transition-colors ${
                  proposal.accepted
                    ? "bg-card border-border"
                    : "bg-muted/30 border-muted opacity-60"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getActionBadge(proposal.action)}
                      <Badge
                        variant="outline"
                        className={`text-xs ${getConfidenceColor(proposal.confidence)}`}
                      >
                        {proposal.confidence}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium truncate">{proposal.taskTitle}</p>
                  </div>
                  <Switch
                    checked={proposal.accepted}
                    onCheckedChange={() => onToggle(proposal.taskId)}
                    aria-label={`Toggle proposal for ${proposal.taskTitle}`}
                  />
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  {proposal.currentDate && (
                    <>
                      <span>{formatDate(proposal.currentDate)} {formatTime(proposal.currentTime || "")}</span>
                      <ArrowRight className="w-3 h-3" />
                    </>
                  )}
                  <span className="font-medium text-foreground">
                    {formatDate(proposal.proposedDate)} {formatTime(proposal.proposedTime)}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground">{proposal.reasoning}</p>
              </div>
            ))}
          </div>
        </ScrollArea>

        <Separator className="my-2" />

        <SheetFooter className="flex-row gap-2 sm:justify-between">
          <Button variant="ghost" size="sm" onClick={onDismiss} disabled={isApplying}>
            Dismiss All
          </Button>
          <Button
            size="sm"
            onClick={onApprove}
            disabled={acceptedCount === 0 || isApplying}
            className="gap-2"
          >
            {isApplying ? "Applying..." : `Approve ${acceptedCount} Changes`}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
