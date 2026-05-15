import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatMinutes, getWoDate, isBreakdown, isPreventive, type WorkOrder } from "@/lib/kpi";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useT, type Translate } from "@/i18n";

interface Props {
  orders: WorkOrder[];
  isLoading: boolean;
}

const PAGE_SIZE = 8;

function statusBadge(wo: WorkOrder, t: Translate) {
  if (isBreakdown(wo)) {
    return {
      cls: "bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/40",
      label: wo.STATUS_WO || t("table.statusBreakdown"),
    };
  }
  if (isPreventive(wo)) {
    return {
      cls: "bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/40",
      label: wo.STATUS_WO || t("table.statusPreventive"),
    };
  }
  return {
    cls: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/40",
    label: wo.STATUS_WO || t("table.statusNonBreakdown"),
  };
}

export function WorkOrdersTable({ orders, isLoading }: Props) {
  const t = useT();
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(orders.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const slice = useMemo(
    () => orders.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE),
    [orders, safePage],
  );
  const start = orders.length === 0 ? 0 : safePage * PAGE_SIZE + 1;
  const end = Math.min(orders.length, (safePage + 1) * PAGE_SIZE);

  return (
    <Card
      className="rounded-xl border-card-border bg-card overflow-hidden"
      data-testid="card-active-wo"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-4">
        <div>
          <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            {t("table.title")}
          </h3>
          <p className="text-sm font-semibold text-foreground">
            {t("table.subtitle")}
          </p>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {isLoading ? "—" : t("table.rows", { n: orders.length })}
        </span>
      </div>
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="space-y-2 p-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        ) : slice.length === 0 ? (
          <div className="py-12 text-center font-mono text-xs uppercase tracking-wider text-muted-foreground">
            {t("table.noData")}
          </div>
        ) : (
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-card">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
                  {t("table.colWoNumber")}
                </TableHead>
                <TableHead className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
                  {t("table.colDate")}
                </TableHead>
                <TableHead className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
                  {t("table.colMachine")}
                </TableHead>
                <TableHead className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
                  {t("table.colArea")}
                </TableHead>
                <TableHead className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
                  {t("table.colStatusWo")}
                </TableHead>
                <TableHead className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
                  {t("table.colProgress")}
                </TableHead>
                <TableHead className="text-right font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
                  {t("table.colDowntime")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slice.map((wo) => {
                const badge = statusBadge(wo, t);
                const dt = wo.DOWNTIME_MIN ?? null;
                return (
                  <TableRow
                    key={`${wo.WO_Number}-${wo.MASTER_MESIN}`}
                    className="border-border font-mono text-xs hover:bg-white/[0.02]"
                    data-testid={`row-wo-${wo.WO_Number}`}
                  >
                    <TableCell className="font-semibold text-primary">
                      {wo.WO_Number || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(getWoDate(wo))}
                    </TableCell>
                    <TableCell className="text-foreground">
                      {wo.MASTER_MESIN || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {wo.AREA_PRODUKSI || "—"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`rounded-sm px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${badge.cls}`}
                      >
                        {badge.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {wo.STATUS_PROGRESS || "—"}
                    </TableCell>
                    <TableCell className="text-right text-foreground">
                      {dt !== null ? formatMinutes(dt) : "-"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
      {orders.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-5 py-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          <span data-testid="table-summary">
            {t("table.showing", { start, end, total: orders.length })}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background/60 text-muted-foreground hover:text-primary disabled:opacity-30"
              data-testid="page-prev"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            {pageNumbers(safePage, totalPages).map((n, i) =>
              n === -1 ? (
                <span key={`gap-${i}`} className="px-1 text-muted-foreground">
                  …
                </span>
              ) : (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPage(n)}
                  className={`h-7 min-w-7 rounded-md px-2 text-[10px] font-bold ${
                    n === safePage
                      ? "bg-primary text-primary-foreground shadow-[0_0_10px_rgba(249,115,22,0.4)]"
                      : "border border-border bg-background/60 text-muted-foreground hover:text-primary"
                  }`}
                  data-testid={`page-${n + 1}`}
                >
                  {n + 1}
                </button>
              ),
            )}
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={safePage >= totalPages - 1}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background/60 text-muted-foreground hover:text-primary disabled:opacity-30"
              data-testid="page-next"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}

function pageNumbers(current: number, total: number): number[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i);
  const out: number[] = [];
  const add = (n: number) => out.push(n);
  add(0);
  if (current > 2) add(-1);
  const start = Math.max(1, current - 1);
  const end = Math.min(total - 2, current + 1);
  for (let i = start; i <= end; i++) add(i);
  if (current < total - 3) add(-1);
  add(total - 1);
  return out;
}
