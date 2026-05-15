import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Gauge,
  TimerReset,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatHours2 } from "@/lib/kpi";
import { useT } from "@/i18n";

interface SummaryCardsProps {
  totalWO: number;
  openWO: number;
  closedWO: number;
  breakdownWO: number;
  mttrHours: number | null;
  mtbfHours: number | null;
  isLoading: boolean;
}

type Tone = "orange" | "amber" | "green" | "red" | "white";

const TONE: Record<Tone, { value: string; icon: string; ring: string; glow: string }> = {
  orange: {
    value: "text-primary",
    icon: "text-primary bg-primary/15 ring-1 ring-primary/40",
    ring: "ring-primary/20",
    glow: "shadow-[0_0_22px_rgba(249,115,22,0.12)]",
  },
  amber: {
    value: "text-amber-400",
    icon: "text-amber-400 bg-amber-500/15 ring-1 ring-amber-500/40",
    ring: "ring-amber-500/15",
    glow: "shadow-[0_0_22px_rgba(245,158,11,0.10)]",
  },
  green: {
    value: "text-emerald-400",
    icon: "text-emerald-400 bg-emerald-500/15 ring-1 ring-emerald-500/40",
    ring: "ring-emerald-500/15",
    glow: "shadow-[0_0_22px_rgba(34,197,94,0.10)]",
  },
  red: {
    value: "text-rose-400",
    icon: "text-rose-400 bg-rose-500/15 ring-1 ring-rose-500/40",
    ring: "ring-rose-500/15",
    glow: "shadow-[0_0_22px_rgba(239,68,68,0.10)]",
  },
  white: {
    value: "text-foreground",
    icon: "text-foreground bg-white/5 ring-1 ring-white/15",
    ring: "ring-white/10",
    glow: "shadow-[0_0_18px_rgba(255,255,255,0.04)]",
  },
};

export function SummaryCards({
  totalWO,
  openWO,
  closedWO,
  breakdownWO,
  mttrHours,
  mtbfHours,
  isLoading,
}: SummaryCardsProps) {
  const t = useT();
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
      <Stat
        label={t("kpi.totalWo")}
        sub={t("kpi.totalWoSub")}
        value={isLoading ? null : totalWO.toLocaleString()}
        icon={ClipboardList}
        tone="white"
        testId="summary-total"
      />
      <Stat
        label={t("kpi.openWo")}
        sub={t("kpi.openWoSub")}
        value={isLoading ? null : openWO.toLocaleString()}
        icon={Activity}
        tone="orange"
        testId="summary-open"
      />
      <Stat
        label={t("kpi.closedWo")}
        sub={t("kpi.closedWoSub")}
        value={isLoading ? null : closedWO.toLocaleString()}
        icon={CheckCircle2}
        tone="green"
        testId="summary-closed"
      />
      <Stat
        label={t("kpi.breakdownCount")}
        sub={t("kpi.breakdownCountSub")}
        value={isLoading ? null : breakdownWO.toLocaleString()}
        icon={AlertTriangle}
        tone="red"
        testId="summary-breakdowns"
      />
      <Stat
        label={t("kpi.mttr")}
        sub={t("kpi.mttrSub")}
        value={isLoading ? null : formatHours2(mttrHours)}
        icon={TimerReset}
        tone="amber"
        testId="summary-mttr"
      />
      <Stat
        label={t("kpi.mtbf")}
        sub={t("kpi.mtbfSub")}
        value={isLoading ? null : formatHours2(mtbfHours)}
        icon={Gauge}
        tone="amber"
        testId="summary-mtbf"
      />
    </div>
  );
}

function Stat({
  label,
  sub,
  value,
  icon: Icon,
  tone,
  testId,
}: {
  label: string;
  sub: string;
  value: string | null;
  icon: React.ComponentType<{ className?: string }>;
  tone: Tone;
  testId: string;
}) {
  const t = TONE[tone];
  return (
    <Card
      className={`group relative overflow-hidden rounded-xl border-card-border bg-card p-4 sm:p-5 transition-all hover:-translate-y-0.5 hover:ring-1 ${t.ring} ${t.glow}`}
      data-testid={testId}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            {label}
          </p>
          {value === null ? (
            <Skeleton className="mt-2 h-8 w-20" />
          ) : (
            <div
              className={`mt-1 font-mono text-3xl font-extrabold tracking-tight sm:text-[34px] ${t.value}`}
            >
              {value}
            </div>
          )}
          <p className="mt-1 truncate text-[11px] text-muted-foreground">
            {sub}
          </p>
        </div>
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${t.icon}`}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </Card>
  );
}
