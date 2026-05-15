import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetIeWorkOrdersQueryKey,
  useGetIeWorkOrders,
} from "@workspace/api-client-react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { FilterBar } from "@/components/FilterBar";
import { SummaryCards } from "@/components/KpiCards";
import { DonutBreakdown } from "@/components/DonutBreakdown";
import { WoBarChart } from "@/components/WoBarChart";
import { TopMachineBars } from "@/components/TopMachineBars";
import { WorkOrdersTable } from "@/components/WorkOrdersTable";
import { TeamPerformanceSection } from "@/components/TeamPerformanceSection";
import {
  applyFilters,
  computeDonutCategories,
  computeMtbfHours,
  computeMttrHours,
  computeTeamMetrics,
  dailyWoCounts,
  generateTeamInsights,
  isActive,
  isBreakdown,
  isClosed,
  sanitizeOrders,
  topMachinesByDowntime,
  uniqueValues,
  type FilterState,
} from "@/lib/kpi";
import { useT } from "@/i18n";

const REFRESH_MS = 15_000;

export default function DashboardPage() {
  const [filters, setFilters] = useState<FilterState>({
    area: "ALL",
    shift: "ALL",
    statusWo: "ALL",
    dateFrom: null,
    dateTo: null,
  });
  const queryClient = useQueryClient();
  const t = useT();

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

  const donut = useMemo(() => computeDonutCategories(filtered), [filtered]);
  const trend = useMemo(() => dailyWoCounts(filtered), [filtered]);
  const top10 = useMemo(() => topMachinesByDowntime(filtered, 10), [filtered]);

  const activeWO = useMemo(() => filtered.filter(isActive), [filtered]);
  const closedCount = useMemo(
    () => filtered.filter(isClosed).length,
    [filtered],
  );
  const breakdownCount = useMemo(
    () => filtered.filter(isBreakdown).length,
    [filtered],
  );
  const mttrHours = useMemo(() => computeMttrHours(filtered), [filtered]);
  const mtbfHours = useMemo(() => computeMtbfHours(filtered), [filtered]);
  const teamMetrics = useMemo(() => computeTeamMetrics(filtered), [filtered]);
  const teamInsights = useMemo(
    () => generateTeamInsights(teamMetrics),
    [teamMetrics],
  );
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
                {t("error.banner")}
              </div>
            )}

            <SummaryCards
              totalWO={filtered.length}
              openWO={activeWO.length}
              closedWO={closedCount}
              breakdownWO={breakdownCount}
              mttrHours={mttrHours}
              mtbfHours={mtbfHours}
              isLoading={isLoading}
            />

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <DonutBreakdown data={donut} isLoading={isLoading} />
              <WoBarChart data={trend} isLoading={isLoading} />
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <TopMachineBars rows={top10} isLoading={isLoading} />
              <WorkOrdersTable orders={activeWO} isLoading={isLoading} />
            </div>

            <TeamPerformanceSection
              metrics={teamMetrics}
              insights={teamInsights}
              isLoading={isLoading}
            />

            <footer
              className="border-t border-border pt-4 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground"
              data-testid="footer"
            >
              {t("footer.text")}
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}
