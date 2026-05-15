import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { MachineRow } from "@/lib/kpi";
import { useT } from "@/i18n";

interface Props {
  rows: MachineRow[];
  isLoading: boolean;
}

export function TopMachineBars({ rows, isLoading }: Props) {
  const t = useT();
  const max = rows.length > 0 ? rows[0]!.totalDowntimeMin : 0;

  return (
    <Card
      className="rounded-xl border-card-border bg-card p-5"
      data-testid="card-top-machines"
    >
      <div className="mb-4">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {t("topMachines.title")}
        </h3>
        <p className="text-sm font-semibold text-foreground">
          {t("topMachines.subtitle")}
        </p>
      </div>
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="py-10 text-center font-mono text-xs uppercase tracking-wider text-muted-foreground">
          {t("topMachines.noData")}
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-[28px_1fr_110px_60px] gap-3 border-b border-border pb-2 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
            <span>#</span>
            <span>{t("topMachines.colMachine")}</span>
            <span className="text-right">{t("topMachines.colDowntime")}</span>
            <span className="text-right">{t("topMachines.colWo")}</span>
          </div>
          <ul className="mt-1 divide-y divide-border">
            {rows.map((r) => {
              const pct = max > 0 ? (r.totalDowntimeMin / max) * 100 : 0;
              return (
                <li
                  key={r.machine}
                  className="grid grid-cols-[28px_1fr_110px_60px] items-center gap-3 py-1.5 font-mono text-xs hover:bg-white/[0.025] transition-colors"
                  data-testid={`top-machine-${r.rank}`}
                >
                  <span className="text-muted-foreground">{r.rank}</span>
                  <span className="truncate font-semibold text-foreground">
                    {r.machine}
                  </span>
                  <div className="flex items-center justify-end gap-2">
                    <span className="font-semibold text-foreground">
                      {r.totalDowntimeMin.toLocaleString()}
                    </span>
                    <div className="relative h-1.5 w-12 overflow-hidden rounded-full bg-white/5">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full bg-primary shadow-[0_0_6px_rgba(249,115,22,0.6)]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-right text-foreground">
                    {r.woCount}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </Card>
  );
}
