import {
  getDowntimeMinutes,
  isBreakdown,
  isClosed,
  type WorkOrder,
} from "./kpi";

export interface TeamRow {
  rank: number;
  name: string;
  totalWO: number;
  closedWO: number;
  breakdownWO: number;
  totalDowntimeMin: number;
  avgDowntimeMin: number;
  closeRate: number;
}

function aggregate(
  orders: WorkOrder[],
  keyFn: (wo: WorkOrder) => string | null | undefined,
  fallback = "Unassigned",
): TeamRow[] {
  const map = new Map<
    string,
    {
      totalWO: number;
      closedWO: number;
      breakdownWO: number;
      totalDowntimeMin: number;
      downtimeSamples: number;
    }
  >();

  for (const o of orders) {
    const raw = keyFn(o);
    const name =
      raw && typeof raw === "string" && raw.trim() !== ""
        ? raw.trim()
        : fallback;
    const cur =
      map.get(name) ?? {
        totalWO: 0,
        closedWO: 0,
        breakdownWO: 0,
        totalDowntimeMin: 0,
        downtimeSamples: 0,
      };
    cur.totalWO += 1;
    if (isClosed(o)) cur.closedWO += 1;
    if (isBreakdown(o)) cur.breakdownWO += 1;
    const dt = getDowntimeMinutes(o);
    if (dt !== null) {
      cur.totalDowntimeMin += dt;
      cur.downtimeSamples += 1;
    }
    map.set(name, cur);
  }

  return Array.from(map.entries())
    .map(([name, v]) => ({
      name,
      totalWO: v.totalWO,
      closedWO: v.closedWO,
      breakdownWO: v.breakdownWO,
      totalDowntimeMin: v.totalDowntimeMin,
      avgDowntimeMin:
        v.downtimeSamples > 0 ? v.totalDowntimeMin / v.downtimeSamples : 0,
      closeRate: v.totalWO > 0 ? (v.closedWO / v.totalWO) * 100 : 0,
    }))
    .sort((a, b) => b.totalWO - a.totalWO)
    .map((r, i) => ({ ...r, rank: i + 1 }));
}

export function byTeamProduksi(orders: WorkOrder[]): TeamRow[] {
  return aggregate(orders, (o) => o.TEAM_PRODUKSI, "Unassigned");
}

export function byPicEngineering(orders: WorkOrder[]): TeamRow[] {
  return aggregate(orders, (o) => o.PIC_ENGINEERING, "Unassigned");
}

export function byShift(orders: WorkOrder[]): TeamRow[] {
  return aggregate(orders, (o) => o.SHIFT, "—");
}

export interface TeamTotals {
  totalTeams: number;
  totalWO: number;
  topTeam: string;
  topTeamWO: number;
  avgCloseRate: number;
}

export function totals(rows: TeamRow[]): TeamTotals {
  const totalTeams = rows.length;
  const totalWO = rows.reduce((s, r) => s + r.totalWO, 0);
  const top = rows[0];
  const avgCloseRate =
    rows.length > 0
      ? rows.reduce((s, r) => s + r.closeRate, 0) / rows.length
      : 0;
  return {
    totalTeams,
    totalWO,
    topTeam: top?.name ?? "—",
    topTeamWO: top?.totalWO ?? 0,
    avgCloseRate,
  };
}
