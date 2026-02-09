import { useState } from "react";
import { CalendarClock, CalendarPlus, RefreshCw, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { type RequestType } from "@/hooks/useCalendarAI";

interface CalendarAIPanelProps {
  readonly onRequest: (type: RequestType) => Promise<unknown>;
  readonly isLoading: boolean;
  readonly hasProposals: boolean;
  readonly onShowProposals: () => void;
}

export function CalendarAIPanel({
  onRequest,
  isLoading,
  hasProposals,
  onShowProposals,
}: CalendarAIPanelProps) {
  const [open, setOpen] = useState(false);

  const handleRequest = async (type: RequestType) => {
    setOpen(false);
    await onRequest(type);
  };

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 text-purple-400" />
            )}
            AI Schedule
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>AI Scheduling</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleRequest("schedule_unscheduled")}>
            <CalendarPlus className="w-4 h-4 mr-2 text-green-400" />
            <div>
              <p className="font-medium">Schedule Unscheduled</p>
              <p className="text-xs text-muted-foreground">Find slots for unplanned tasks</p>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleRequest("reschedule")}>
            <RefreshCw className="w-4 h-4 mr-2 text-blue-400" />
            <div>
              <p className="font-medium">Optimize Schedule</p>
              <p className="text-xs text-muted-foreground">Improve existing task timing</p>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleRequest("batch_plan")}>
            <CalendarClock className="w-4 h-4 mr-2 text-purple-400" />
            <div>
              <p className="font-medium">Plan My Week</p>
              <p className="text-xs text-muted-foreground">Full weekly schedule optimization</p>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {hasProposals && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onShowProposals}
          className="gap-2 animate-pulse"
        >
          <Sparkles className="w-4 h-4 text-purple-400" />
          View Proposals
        </Button>
      )}
    </div>
  );
}
