import { ShieldCheck, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import CountUpNumber from "@/components/CountUpNumber";

interface VerificationBadgeProps {
  readonly rating: number;
  readonly size?: "sm" | "md";
}

export function VerificationBadge({ rating, size = "sm" }: VerificationBadgeProps) {
  const getColor = () => {
    if (rating >= 8) return "bg-green-500/20 text-green-400 border-green-500/30";
    if (rating >= 5) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    return "bg-red-500/20 text-red-400 border-red-500/30";
  };

  return (
    <Badge
      variant="outline"
      className={`${getColor()} ${size === "sm" ? "text-xs px-1.5 py-0.5" : "text-sm px-2 py-1"}`}
    >
      <Star className={`${size === "sm" ? "w-3 h-3" : "w-4 h-4"} mr-1 fill-current`} />
      {rating}/10
    </Badge>
  );
}

interface VerificationScoreCardProps {
  readonly avg: number;
  readonly count: number;
}

export function VerificationScoreCard({ avg, count }: VerificationScoreCardProps) {
  const displayAvg = count === 0 ? 0 : Math.round(avg * 10) / 10;

  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border/50 shadow-sm">
      <div className="p-2.5 rounded-lg bg-purple-500/10">
        <ShieldCheck className="h-5 w-5 text-purple-400" />
      </div>
      <div>
        <div className="text-2xl font-bold leading-none">
          <CountUpNumber value={displayAvg} />
          <span className="text-sm font-normal text-muted-foreground">/10</span>
        </div>
        <div className="text-xs text-muted-foreground">
          {count === 0 ? "work score" : `work score · ${count} verified`}
        </div>
      </div>
    </div>
  );
}
