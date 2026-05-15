import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { DonutSlice } from "@/lib/kpi";
import { useT } from "@/i18n";

interface Props {
  data: DonutSlice[];
  isLoading: boolean;
}

export function DonutBreakdown({ data, isLoading }: Props) {
  const t = useT();
  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <Card
      className="rounded-xl border-card-border bg-card p-5"
      data-testid="card-donut"
    >
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            {t("donut.title")}
          </h3>
          <p className="text-sm font-semibold text-foreground">
            {t("donut.subtitle")}
          </p>
        </div>
      </div>
      {isLoading ? (
        <Skeleton className="h-[260px] w-full" />
      ) : total === 0 ? (
        <div className="py-16 text-center font-mono text-xs uppercase tracking-wider text-muted-foreground">
          {t("donut.noData")}
        </div>
      ) : (
        <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-[1fr_1fr]">
          <div className="relative h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="count"
                  nameKey="label"
                  innerRadius={62}
                  outerRadius={96}
                  paddingAngle={2}
                  stroke="rgba(0,0,0,0.4)"
                  strokeWidth={1}
                  startAngle={90}
                  endAngle={-270}
                  isAnimationActive
                >
                  {data.map((d) => (
                    <Cell key={d.key} fill={d.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <div className="font-mono text-3xl font-extrabold text-foreground">
                {total.toLocaleString()}
              </div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                {t("donut.total")}
              </div>
            </div>
          </div>
          <ul className="space-y-2.5">
            {data.map((d) => {
              const pct = total > 0 ? (d.count / total) * 100 : 0;
              return (
                <li
                  key={d.key}
                  className="flex items-center justify-between gap-3"
                  data-testid={`legend-${d.key}`}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: d.color, boxShadow: `0 0 8px ${d.color}80` }}
                    />
                    <span className="font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
                      {d.label}
                    </span>
                  </div>
                  <div className="font-mono text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      {d.count.toLocaleString()}
                    </span>{" "}
                    ({pct.toFixed(1)}%)
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </Card>
  );
}
