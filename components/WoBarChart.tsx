import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { DailyCount } from "@/lib/kpi";
import { useT } from "@/i18n";

interface Props {
  data: DailyCount[];
  isLoading: boolean;
}

export function WoBarChart({ data, isLoading }: Props) {
  const t = useT();
  return (
    <Card
      className="rounded-xl border-card-border bg-card p-5"
      data-testid="card-wo-bar"
    >
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            {t("woBar.title")}
          </h3>
          <p className="text-sm font-semibold text-foreground">
            {t("woBar.subtitle")}
          </p>
        </div>
      </div>
      {isLoading ? (
        <Skeleton className="h-[260px] w-full" />
      ) : data.length === 0 ? (
        <div className="py-16 text-center font-mono text-xs uppercase tracking-wider text-muted-foreground">
          {t("woBar.noData")}
        </div>
      ) : (
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ff9233" stopOpacity={1} />
                  <stop offset="100%" stopColor="#ff7a00" stopOpacity={0.85} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 10, fontFamily: "JetBrains Mono, monospace" }}
                tickLine={false}
                axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                interval="preserveStartEnd"
                minTickGap={20}
              />
              <YAxis
                tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 10, fontFamily: "JetBrains Mono, monospace" }}
                tickLine={false}
                axisLine={false}
                width={36}
              />
              <Tooltip
                cursor={{ fill: "rgba(249,115,22,0.08)" }}
                contentStyle={{
                  background: "#10151c",
                  border: "1px solid rgba(249,115,22,0.4)",
                  borderRadius: 8,
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: 11,
                }}
                labelStyle={{ color: "#ff7a00", textTransform: "uppercase", letterSpacing: 1 }}
                itemStyle={{ color: "#fff" }}
              />
              <Bar
                dataKey="total"
                name={t("woBar.legendTotalWo")}
                fill="url(#barGrad)"
                radius={[4, 4, 0, 0]}
                maxBarSize={24}
                isAnimationActive
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="mt-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        <span className="h-2 w-3 rounded-sm bg-primary" />
        {t("woBar.legendTotalWo")}
      </div>
    </Card>
  );
}
