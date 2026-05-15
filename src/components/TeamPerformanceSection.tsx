import { Award, Lightbulb, Users } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  formatHours2,
  formatMinutes,
  type InsightPayload,
  type TeamMetrics,
  type TeamStatus,
} from "@/lib/kpi";
import { useT, type Translate } from "@/i18n";

interface Props {
  metrics: TeamMetrics[];
  insights: InsightPayload[];
  isLoading: boolean;
}

const STATUS_STYLES: Record<TeamStatus, { badge: string; dot: string }> = {
  Excellent: {
    badge:
      "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/40 shadow-[0_0_10px_rgba(34,197,94,0.20)]",
    dot: "bg-emerald-400",
  },
  Good: {
    badge:
      "bg-lime-500/15 text-lime-300 ring-1 ring-lime-500/40 shadow-[0_0_10px_rgba(163,230,53,0.18)]",
    dot: "bg-lime-300",
  },
  Warning: {
    badge:
      "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.18)]",
    dot: "bg-amber-400",
  },
  Critical: {
    badge:
      "bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/40 shadow-[0_0_10px_rgba(239,68,68,0.20)]",
    dot: "bg-rose-400",
  },
};

const CHART_COLORS = [
  "#ff7a00",
  "#f59e0b",
  "#22c55e",
  "#3b82f6",
  "#a855f7",
  "#ef4444",
  "#06b6d4",
  "#eab308",
];

function colorFor(i: number): string {
  return CHART_COLORS[i % CHART_COLORS.length]!;
}

const TOOLTIP_STYLE = {
  background: "#10151c",
  border: "1px solid rgba(249,115,22,0.4)",
  borderRadius: 8,
  fontFamily: "JetBrains Mono, monospace",
  fontSize: 11,
};

const AXIS_TICK = {
  fill: "rgba(255,255,255,0.55)",
  fontSize: 10,
  fontFamily: "JetBrains Mono, monospace",
};

function translateStatus(t: Translate, status: TeamStatus): string {
  return t(`team.status.${status}`);
}

function renderInsight(t: Translate, p: InsightPayload): string {
  const params = { ...p.params };
  if (typeof params.status === "string") {
    params.status = translateStatus(t, params.status as TeamStatus);
  }
  return t(p.key, params);
}

export function TeamPerformanceSection({
  metrics,
  insights,
  isLoading,
}: Props) {
  const t = useT();
  return (
    <section
      className="flex flex-col gap-5"
      data-testid="section-team-performance"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/15 text-primary ring-1 ring-primary/40">
          <Users className="h-4 w-4" />
        </div>
        <div>
          <h2 className="font-mono text-[10px] uppercase tracking-[0.28em] text-primary">
            {t("team.eyebrow")}
          </h2>
          <p className="text-lg font-bold tracking-tight text-foreground">
            {t("team.title")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="flex flex-col gap-5">
          <InsightsPanel insights={insights} isLoading={isLoading} />
          <RankingTable metrics={metrics} isLoading={isLoading} />
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <WoCountChart metrics={metrics} isLoading={isLoading} />
          <EffectivenessChart metrics={metrics} isLoading={isLoading} />
          <BreakdownDonut metrics={metrics} isLoading={isLoading} />
          <MttrLineChart metrics={metrics} isLoading={isLoading} />
        </div>
      </div>
    </section>
  );
}

function InsightsPanel({
  insights,
  isLoading,
}: {
  insights: InsightPayload[];
  isLoading: boolean;
}) {
  const t = useT();
  return (
    <Card
      className="rounded-xl border-card-border bg-card p-5"
      data-testid="card-team-insights"
    >
      <div className="mb-3 flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-amber-400" />
        <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {t("team.smartSummary")}
        </h3>
      </div>
      {isLoading ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : insights.length === 0 ? (
        <div className="py-6 text-center font-mono text-xs uppercase tracking-wider text-muted-foreground">
          {t("team.notEnough")}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {insights.map((payload, i) => (
            <div
              key={i}
              className="flex items-start gap-2 rounded-lg border border-card-border bg-background/40 px-3 py-2.5"
              data-testid={`insight-${i}`}
            >
              <span
                className="mt-0.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-primary shadow-[0_0_6px_rgba(249,115,22,0.7)]"
                aria-hidden
              />
              <p className="text-xs leading-relaxed text-foreground">
                {renderInsight(t, payload)}
              </p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function RankingTable({
  metrics,
  isLoading,
}: {
  metrics: TeamMetrics[];
  isLoading: boolean;
}) {
  const t = useT();
  return (
    <Card
      className="rounded-xl border-card-border bg-card p-5"
      data-testid="card-team-ranking"
    >
      <div className="mb-4 flex items-center gap-2">
        <Award className="h-4 w-4 text-primary" />
        <div>
          <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            {t("team.ranking")}
          </h3>
          <p className="text-sm font-semibold text-foreground">
            {t("team.rankingSubtitle")}
          </p>
        </div>
      </div>
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      ) : metrics.length === 0 ? (
        <div className="py-10 text-center font-mono text-xs uppercase tracking-wider text-muted-foreground">
          {t("team.noTeams")}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[760px]">
            <div className="grid grid-cols-[28px_1.4fr_56px_56px_56px_64px_72px_80px_84px_92px] gap-2 border-b border-border pb-2 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
              <span>#</span>
              <span>{t("team.colTeam")}</span>
              <span className="text-right">{t("team.colTotal")}</span>
              <span className="text-right">{t("team.colOpen")}</span>
              <span className="text-right">{t("team.colClosed")}</span>
              <span className="text-right">{t("team.colBkd")}</span>
              <span className="text-right">{t("team.colMttr")}</span>
              <span className="text-right">{t("team.colDowntime")}</span>
              <span className="text-right">{t("team.colScore")}</span>
              <span className="text-right">{t("team.colStatus")}</span>
            </div>
            <ul className="mt-1 divide-y divide-border">
              {metrics.map((m, i) => {
                const styles = STATUS_STYLES[m.status];
                return (
                  <li
                    key={m.team}
                    className="grid grid-cols-[28px_1.4fr_56px_56px_56px_64px_72px_80px_84px_92px] items-center gap-2 py-1.5 font-mono text-xs hover:bg-white/[0.025] transition-colors"
                    data-testid={`row-team-${i + 1}`}
                  >
                    <span className="text-muted-foreground">{i + 1}</span>
                    <span className="truncate font-semibold text-foreground">
                      {m.team}
                    </span>
                    <span className="text-right text-foreground">
                      {m.totalWO.toLocaleString()}
                    </span>
                    <span className="text-right text-primary">
                      {m.openWO.toLocaleString()}
                    </span>
                    <span className="text-right text-emerald-400">
                      {m.closedWO.toLocaleString()}
                    </span>
                    <span className="text-right text-rose-400">
                      {m.breakdownCount.toLocaleString()}
                    </span>
                    <span className="text-right text-amber-400">
                      {formatHours2(m.avgMttrHours)}
                    </span>
                    <span className="text-right text-foreground">
                      {formatMinutes(m.avgDowntimeMin)}
                    </span>
                    <span className="text-right font-bold text-primary">
                      {m.effectivenessScore.toFixed(0)}
                    </span>
                    <span className="flex justify-end">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${styles.badge}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${styles.dot}`}
                        />
                        {translateStatus(t, m.status)}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </Card>
  );
}

interface ChartCardProps {
  title: string;
  subtitle: string;
  testId: string;
  isLoading: boolean;
  isEmpty: boolean;
  emptyText: string;
  children: React.ReactNode;
}

function ChartCard({
  title,
  subtitle,
  testId,
  isLoading,
  isEmpty,
  emptyText,
  children,
}: ChartCardProps) {
  return (
    <Card
      className="rounded-xl border-card-border bg-card p-4"
      data-testid={testId}
    >
      <div className="mb-3">
        <h4 className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {title}
        </h4>
        <p className="text-xs font-semibold text-foreground">{subtitle}</p>
      </div>
      {isLoading ? (
        <Skeleton className="h-[200px] w-full" />
      ) : isEmpty ? (
        <div className="flex h-[200px] items-center justify-center font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {emptyText}
        </div>
      ) : (
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            {children as React.ReactElement}
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}

function WoCountChart({
  metrics,
  isLoading,
}: {
  metrics: TeamMetrics[];
  isLoading: boolean;
}) {
  const t = useT();
  const data = metrics.map((m) => ({ team: m.team, totalWO: m.totalWO }));
  return (
    <ChartCard
      title={t("chart.woCount.title")}
      subtitle={t("chart.woCount.subtitle")}
      testId="chart-team-wo-count"
      isLoading={isLoading}
      isEmpty={data.length === 0}
      emptyText={t("chart.noData")}
    >
      <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="teamWoGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff9233" stopOpacity={1} />
            <stop offset="100%" stopColor="#ff7a00" stopOpacity={0.85} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis
          dataKey="team"
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
          interval={0}
          angle={-15}
          textAnchor="end"
          height={48}
        />
        <YAxis
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={false}
          width={36}
        />
        <Tooltip
          cursor={{ fill: "rgba(249,115,22,0.08)" }}
          contentStyle={TOOLTIP_STYLE}
          labelStyle={{
            color: "#ff7a00",
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
          itemStyle={{ color: "#fff" }}
        />
        <Bar
          dataKey="totalWO"
          name={t("woBar.legendTotalWo")}
          fill="url(#teamWoGrad)"
          radius={[4, 4, 0, 0]}
          maxBarSize={36}
        />
      </BarChart>
    </ChartCard>
  );
}

function EffectivenessChart({
  metrics,
  isLoading,
}: {
  metrics: TeamMetrics[];
  isLoading: boolean;
}) {
  const t = useT();
  const data = metrics
    .map((m) => ({
      team: m.team,
      score: Math.round(m.effectivenessScore * 10) / 10,
      status: m.status,
    }))
    .sort((a, b) => a.score - b.score);

  return (
    <ChartCard
      title={t("chart.effectiveness.title")}
      subtitle={t("chart.effectiveness.subtitle")}
      testId="chart-team-effectiveness"
      isLoading={isLoading}
      isEmpty={data.length === 0}
      emptyText={t("chart.noData")}
    >
      <BarChart
        layout="vertical"
        data={data}
        margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
      >
        <CartesianGrid stroke="rgba(255,255,255,0.05)" horizontal={false} />
        <XAxis
          type="number"
          domain={[0, 100]}
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
        />
        <YAxis
          type="category"
          dataKey="team"
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={false}
          width={80}
        />
        <Tooltip
          cursor={{ fill: "rgba(249,115,22,0.08)" }}
          contentStyle={TOOLTIP_STYLE}
          labelStyle={{
            color: "#ff7a00",
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
          itemStyle={{ color: "#fff" }}
        />
        <Bar dataKey="score" name={t("team.colScore")} radius={[0, 4, 4, 0]} maxBarSize={20}>
          {data.map((d, i) => {
            const color =
              d.status === "Excellent"
                ? "#22c55e"
                : d.status === "Good"
                  ? "#a3e635"
                  : d.status === "Warning"
                    ? "#f59e0b"
                    : "#ef4444";
            return <Cell key={i} fill={color} />;
          })}
        </Bar>
      </BarChart>
    </ChartCard>
  );
}

function BreakdownDonut({
  metrics,
  isLoading,
}: {
  metrics: TeamMetrics[];
  isLoading: boolean;
}) {
  const t = useT();
  const data = metrics
    .filter((m) => m.breakdownCount > 0)
    .map((m, i) => ({
      team: m.team,
      value: m.breakdownCount,
      color: colorFor(i),
    }));
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <ChartCard
      title={t("chart.breakdown.title")}
      subtitle={t("chart.breakdown.subtitle", { n: total.toLocaleString() })}
      testId="chart-team-breakdown"
      isLoading={isLoading}
      isEmpty={data.length === 0}
      emptyText={t("chart.noData")}
    >
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="team"
          innerRadius={48}
          outerRadius={78}
          paddingAngle={2}
          stroke="rgba(0,0,0,0.4)"
          strokeWidth={1}
        >
          {data.map((d) => (
            <Cell key={d.team} fill={d.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          labelStyle={{
            color: "#ff7a00",
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
          itemStyle={{ color: "#fff" }}
        />
      </PieChart>
    </ChartCard>
  );
}

function MttrLineChart({
  metrics,
  isLoading,
}: {
  metrics: TeamMetrics[];
  isLoading: boolean;
}) {
  const t = useT();
  const data = metrics
    .filter((m) => m.avgMttrHours !== null)
    .map((m) => ({
      team: m.team,
      mttr: Math.round((m.avgMttrHours ?? 0) * 100) / 100,
    }));

  return (
    <ChartCard
      title={t("chart.mttr.title")}
      subtitle={t("chart.mttr.subtitle")}
      testId="chart-team-mttr"
      isLoading={isLoading}
      isEmpty={data.length === 0}
      emptyText={t("chart.noData")}
    >
      <LineChart data={data} margin={{ top: 4, right: 12, left: -16, bottom: 0 }}>
        <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis
          dataKey="team"
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
          interval={0}
          angle={-15}
          textAnchor="end"
          height={48}
        />
        <YAxis
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={false}
          width={36}
        />
        <Tooltip
          cursor={{ stroke: "rgba(249,115,22,0.25)" }}
          contentStyle={TOOLTIP_STYLE}
          labelStyle={{
            color: "#ff7a00",
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
          itemStyle={{ color: "#fff" }}
        />
        <Line
          type="monotone"
          dataKey="mttr"
          name={t("team.colMttr")}
          stroke="#ff7a00"
          strokeWidth={2.5}
          dot={{ r: 4, fill: "#ff7a00", stroke: "#10151c", strokeWidth: 2 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ChartCard>
  );
}
