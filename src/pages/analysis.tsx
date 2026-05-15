import { useMemo, useState, type ComponentType } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  CheckCircle2,
  Crown,
  Users,
} from "lucide-react";
import {
  getGetIeWorkOrdersQueryKey,
  useGetIeWorkOrders,
} from "@workspace/api-client-react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { FilterBar } from "@/components/FilterBar";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  applyFilters,
  sanitizeOrders,
  uniqueValues,
  type FilterState,
} from "@/lib/kpi";
import {
  byPicEngineering,
  byShift,
  byTeamProduksi,
  totals,
  type TeamRow,
} from "@/lib/team";

const REFRESH_MS = 15_000;

export default function AnalysisPage() {
  const [filters, setFilters] = useState<FilterState>({
    area: "ALL",
    shift: "ALL",
    statusWo: "ALL",
    dateFrom: null,
    dateTo: null,
  });
  const queryClient = useQueryClient();

  const { data, isLoading, isFetching, dataUpdatedAt, isError } =
    useGetIeWorkOrders({
      query: {
        queryKey: getGetIeWorkOrdersQueryKey(),
        refetchInterval: REFRESH_MS,
        refetchOnWindowFocus: false,
      },
    });

  const orders = useMemo(() => sanitizeOrders(data ?? []), [data]);
  const areas = useMemo(() => uniqueValues(orders, "AREA_PRODUKSI"), [orders]);
  const shifts = useMemo(() => uniqueValues(orders, "SHIFT"), [orders]);
  const statuses = useMemo(() => uniqueValues(orders, "STATUS_WO"), [orders]);
  const filtered = useMemo(
    () => applyFilters(orders, filters),
    [orders, filters],
  );

  const teamRows = useMemo(() => byTeamProduksi(filtered), [filtered]);
  const picRows = useMemo(() => byPicEngineering(filtered), [filtered]);
  const shiftRows = useMemo(() => byShift(filtered), [filtered]);
  const teamTotals = useMemo(() => totals(teamRows), [teamRows]);

  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt) : null;

  function handleRefresh() {
    queryClient.invalidateQueries({ queryKey: getGetIeWorkOrdersQueryKey() });
  }

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header lastUpdated={lastUpdated} />
        <main className="industrial-grid flex-1 px-4 py-5 sm:px-6 sm:py-6">
          <div className="mx-auto flex max-w-[1480px] flex-col gap-5">
            <div>
              <h2 className="font-mono text-[11px] uppercase tracking-[0.28em] text-primary">
                Analysis · Team Performance
              </h2>
              <p className="mt-1 text-lg font-bold tracking-tight text-foreground">
                Team Performance Analysis
              </p>
              <p className="text-xs text-muted-foreground">
                Workload distribution, breakdown share, and close-rate by
                production team, engineering PIC, and shift.
              </p>
            </div>

            <FilterBar
              areas={areas}
              shifts={shifts}
              statuses={statuses}
              area={filters.area}
              shift={filters.shift}
              statusWo={filters.statusWo}
              dateFrom={filters.dateFrom}
              dateTo={filters.dateTo}
              isFetching={isFetching}
              onArea={(v) => setFilters((f) => ({ ...f, area: v }))}
              onShift={(v) => setFilters((f) => ({ ...f, shift: v }))}
              onStatus={(v) => setFilters((f) => ({ ...f, statusWo: v }))}
              onDateFrom={(v) =>
                setFilters((f) => ({ ...f, dateFrom: v || null }))
              }
              onDateTo={(v) => setFilters((f) => ({ ...f, dateTo: v || null }))}
              onRefresh={handleRefresh}
            />

            {isError && (
              <div
                className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 font-mono text-xs text-rose-300"
                data-testid="error-banner"
              >
                Failed to load work orders. Retrying automatically…
              </div>
            )}

            <TeamHeadline
              totalTeams={teamTotals.totalTeams}
              totalWO={teamTotals.totalWO}
              topTeam={teamTotals.topTeam}
              topTeamWO={teamTotals.topTeamWO}
              avgCloseRate={teamTotals.avgCloseRate}
              isLoading={isLoading}
            />

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <TeamTable
                title="Production Team"
                subtitle="Performance by TEAM_PRODUKSI"
                rows={teamRows}
                isLoading={isLoading}
                testIdPrefix="team"
                nameHeader="Team"
              />
              <TeamTable
                title="Engineering PIC"
                subtitle="Performance by PIC_ENGINEERING"
                rows={picRows}
                isLoading={isLoading}
                testIdPrefix="pic"
                nameHeader="PIC"
              />
            </div>

            <ShiftBars rows={shiftRows} isLoading={isLoading} />

            <footer
              className="border-t border-border pt-4 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground"
              data-testid="footer"
            >
              Data source: Google Sheets API (Apps Script) · Auto refresh every
              15 seconds · Timezone: Asia/Jakarta
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}

interface HeadlineProps {
  totalTeams: number;
  totalWO: number;
  topTeam: string;
  topTeamWO: number;
  avgCloseRate: number;
  isLoading: boolean;
}

function TeamHeadline({
  totalTeams,
  totalWO,
  topTeam,
  topTeamWO,
  avgCloseRate,
  isLoading,
}: HeadlineProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      <HeadlineStat
        label="ACTIVE TEAMS"
        sub="Teams with WO"
        value={isLoading ? null : totalTeams.toLocaleString()}
        icon={Users}
        tone="white"
        testId="headline-teams"
      />
      <HeadlineStat
        label="TOTAL WO"
        sub="Across all teams"
        value={isLoading ? null : totalWO.toLocaleString()}
        icon={Activity}
        tone="orange"
        testId="headline-wo"
      />
      <HeadlineStat
        label="TOP TEAM"
        sub={`${topTeamWO.toLocaleString()} WO handled`}
        value={isLoading ? null : topTeam}
        icon={Crown}
        tone="amber"
        testId="headline-top"
        truncate
      />
      <HeadlineStat
        label="AVG CLOSE RATE"
        sub="Mean of all teams"
        value={isLoading ? null : `${avgCloseRate.toFixed(1)}%`}
        icon={CheckCircle2}
        tone="green"
        testId="headline-close"
      />
    </div>
  );
}

type Tone = "orange" | "amber" | "green" | "white";

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
  white: {
    value: "text-foreground",
    icon: "text-foreground bg-white/5 ring-1 ring-white/15",
    ring: "ring-white/10",
    glow: "shadow-[0_0_18px_rgba(255,255,255,0.04)]",
  },
};

function HeadlineStat({
  label,
  sub,
  value,
  icon: Icon,
  tone,
  testId,
  truncate,
}: {
  label: string;
  sub: string;
  value: string | null;
  icon: ComponentType<{ className?: string }>;
  tone: Tone;
  testId: string;
  truncate?: boolean;
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
              className={`mt-1 font-mono font-extrabold tracking-tight ${t.value} ${
                truncate ? "truncate text-xl sm:text-2xl" : "text-3xl sm:text-[34px]"
              }`}
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

interface TableProps {
  title: string;
  subtitle: string;
  rows: TeamRow[];
  isLoading: boolean;
  testIdPrefix: string;
  nameHeader: string;
}

function TeamTable({
  title,
  subtitle,
  rows,
  isLoading,
  testIdPrefix,
  nameHeader,
}: TableProps) {
  const maxWO = rows.length > 0 ? Math.max(...rows.map((r) => r.totalWO)) : 0;

  return (
    <Card
      className="rounded-xl border-card-border bg-card p-5"
      data-testid={`card-${testIdPrefix}-table`}
    >
      <div className="mb-4">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {title}
        </h3>
        <p className="text-sm font-semibold text-foreground">{subtitle}</p>
      </div>
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="py-10 text-center font-mono text-xs uppercase tracking-wider text-muted-foreground">
          No team data available
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-[28px_1fr_64px_64px_64px_70px] gap-3 border-b border-border pb-2 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
            <span>#</span>
            <span>{nameHeader}</span>
            <span className="text-right">WO</span>
            <span className="text-right">BKD</span>
            <span className="text-right">Close</span>
            <span className="text-right">Rate %</span>
          </div>
          <ul className="mt-1 divide-y divide-border">
            {rows.map((r) => {
              const pct = maxWO > 0 ? (r.totalWO / maxWO) * 100 : 0;
              const rate = r.closeRate;
              const rateColor =
                rate >= 80
                  ? "text-emerald-400"
                  : rate >= 50
                  ? "text-amber-400"
                  : "text-rose-400";
              return (
                <li
                  key={r.name}
                  className="grid grid-cols-[28px_1fr_64px_64px_64px_70px] items-center gap-3 py-1.5 font-mono text-xs hover:bg-white/[0.025] transition-colors"
                  data-testid={`row-${testIdPrefix}-${r.rank}`}
                >
                  <span className="text-muted-foreground">{r.rank}</span>
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate font-semibold text-foreground">
                      {r.name}
                    </span>
                    <div className="relative hidden h-1.5 w-10 shrink-0 overflow-hidden rounded-full bg-white/5 sm:block">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full bg-primary shadow-[0_0_6px_rgba(249,115,22,0.6)]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-right font-semibold text-foreground">
                    {r.totalWO.toLocaleString()}
                  </span>
                  <span className="text-right text-rose-400">
                    {r.breakdownWO.toLocaleString()}
                  </span>
                  <span className="text-right text-emerald-400">
                    {r.closedWO.toLocaleString()}
                  </span>
                  <span className={`text-right font-semibold ${rateColor}`}>
                    {rate.toFixed(0)}%
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

function ShiftBars({
  rows,
  isLoading,
}: {
  rows: TeamRow[];
  isLoading: boolean;
}) {
  const maxWO = rows.length > 0 ? Math.max(...rows.map((r) => r.totalWO)) : 0;

  return (
    <Card
      className="rounded-xl border-card-border bg-card p-5"
      data-testid="card-shift-distribution"
    >
      <div className="mb-4">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Shift Distribution
        </h3>
        <p className="text-sm font-semibold text-foreground">
          WO load and close performance by shift
        </p>
      </div>
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="py-10 text-center font-mono text-xs uppercase tracking-wider text-muted-foreground">
          No shift data available
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => {
            const pct = maxWO > 0 ? (r.totalWO / maxWO) * 100 : 0;
            return (
              <li
                key={r.name}
                className="grid grid-cols-[100px_1fr_80px_80px] items-center gap-4 font-mono text-xs"
                data-testid={`row-shift-${r.rank}`}
              >
                <span className="truncate font-semibold uppercase tracking-wider text-foreground">
                  Shift {r.name}
                </span>
                <div className="relative h-3 overflow-hidden rounded-md bg-white/5 ring-1 ring-white/10">
                  <div
                    className="absolute inset-y-0 left-0 rounded-md bg-gradient-to-r from-primary to-amber-400 shadow-[0_0_10px_rgba(249,115,22,0.45)]"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-right text-foreground">
                  {r.totalWO.toLocaleString()} WO
                </span>
                <span
                  className={`text-right font-semibold ${
                    r.closeRate >= 80
                      ? "text-emerald-400"
                      : r.closeRate >= 50
                      ? "text-amber-400"
                      : "text-rose-400"
                  }`}
                >
                  {r.closeRate.toFixed(0)}% close
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
