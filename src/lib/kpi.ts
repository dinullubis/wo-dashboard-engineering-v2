import type { IeWorkOrder } from "@workspace/api-client-react";

export type WorkOrder = IeWorkOrder;

const HIGH_DOWNTIME_THRESHOLD_MIN = 60;

export function isValidRow(wo: WorkOrder): boolean {
  return typeof wo.WO_Number === "string" && wo.WO_Number.trim() !== "";
}

export function sanitizeOrders(orders: WorkOrder[]): WorkOrder[] {
  return orders.filter(isValidRow);
}

export function isBreakdown(wo: WorkOrder): boolean {
  const s = (wo.STATUS_WO || "").toLowerCase();
  return s.includes("breakdown") && !s.includes("non");
}

export function isNonBreakdown(wo: WorkOrder): boolean {
  const s = (wo.STATUS_WO || "").toLowerCase();
  return s.includes("non") && s.includes("breakdown");
}

export function isPreventive(wo: WorkOrder): boolean {
  const s = (wo.STATUS_WO || "").toLowerCase();
  const p = (wo.MASTER_PROBLEM || "").toLowerCase();
  return (
    s.includes("preventive") ||
    s.includes("preventif") ||
    p.includes("preventive") ||
    p.includes("preventif")
  );
}

export function isClosed(wo: WorkOrder): boolean {
  return (wo.STATUS_PROGRESS || "").trim().toUpperCase() === "CLOSE";
}

export function isActive(wo: WorkOrder): boolean {
  return !isClosed(wo);
}

function parseDateTime(
  date: string | null | undefined,
  time: string | null | undefined,
): Date | null {
  if (!date) return null;
  const d = String(date).trim();
  const t = (time ? String(time).trim() : "") || "00:00:00";
  let parsed = new Date(`${d}T${t}`);
  if (!Number.isNaN(parsed.getTime())) return parsed;
  const m = d.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (m) {
    const day = parseInt(m[1]!, 10);
    const month = parseInt(m[2]!, 10);
    let year = parseInt(m[3]!, 10);
    if (year < 100) year += 2000;
    const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${t}`;
    parsed = new Date(iso);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  parsed = new Date(d);
  if (!Number.isNaN(parsed.getTime())) return parsed;
  return null;
}

export function getWoDate(wo: WorkOrder): Date | null {
  return (
    parseDateTime(wo.DATE, null) ??
    parseDateTime(wo.TANGGAL_START, wo.JAM_START)
  );
}

export function getDowntimeMinutes(wo: WorkOrder): number | null {
  if (
    typeof wo.DOWNTIME_MIN === "number" &&
    Number.isFinite(wo.DOWNTIME_MIN) &&
    wo.DOWNTIME_MIN > 0
  ) {
    return wo.DOWNTIME_MIN;
  }
  return null;
}

export function hasDowntime(wo: WorkOrder): boolean {
  return getDowntimeMinutes(wo) !== null;
}

export function isHighSeverity(wo: WorkOrder): boolean {
  const dt = getDowntimeMinutes(wo);
  if (dt !== null) return dt >= HIGH_DOWNTIME_THRESHOLD_MIN;
  return !isClosed(wo);
}

export function computeMttrHours(orders: WorkOrder[]): number | null {
  const rows = orders.filter(
    (o) => isBreakdown(o) && isClosed(o) && hasDowntime(o),
  );
  if (rows.length === 0) return null;
  const totalMin = rows.reduce((s, o) => s + (getDowntimeMinutes(o) ?? 0), 0);
  return totalMin / rows.length / 60;
}

export function computeMtbfHours(orders: WorkOrder[]): number | null {
  const breakdowns = orders.filter(isBreakdown);
  if (breakdowns.length === 0) return null;
  const times = orders
    .map(getWoDate)
    .filter((d): d is Date => d !== null)
    .map((d) => d.getTime());
  if (times.length < 2) return null;
  const span = (Math.max(...times) - Math.min(...times)) / 3_600_000;
  const downtimeHours =
    breakdowns
      .map(getDowntimeMinutes)
      .filter((n): n is number => n !== null)
      .reduce((a, b) => a + b, 0) / 60;
  const operating = Math.max(0, span - downtimeHours);
  if (operating <= 0) return null;
  return operating / breakdowns.length;
}

export interface MachineRow {
  rank: number;
  machine: string;
  totalDowntimeMin: number;
  woCount: number;
}

export function topMachinesByDowntime(
  orders: WorkOrder[],
  limit = 10,
): MachineRow[] {
  const map = new Map<string, { dt: number; count: number }>();
  for (const o of orders) {
    const name = o.MASTER_MESIN || "Unknown";
    const cur = map.get(name) ?? { dt: 0, count: 0 };
    cur.count += 1;
    cur.dt += getDowntimeMinutes(o) ?? 0;
    map.set(name, cur);
  }
  return Array.from(map.entries())
    .map(([machine, v]) => ({
      machine,
      totalDowntimeMin: v.dt,
      woCount: v.count,
    }))
    .filter((r) => r.totalDowntimeMin > 0)
    .sort((a, b) => b.totalDowntimeMin - a.totalDowntimeMin)
    .slice(0, limit)
    .map((r, i) => ({ ...r, rank: i + 1 }));
}

export interface DailyCount {
  date: string;
  label: string;
  total: number;
}

export function dailyWoCounts(orders: WorkOrder[]): DailyCount[] {
  const map = new Map<string, number>();
  for (const o of orders) {
    const d = getWoDate(o);
    if (!d) continue;
    const key = d.toISOString().slice(0, 10);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, total]) => {
      const [, mm, dd] = date.split("-");
      return { date, label: `${dd}/${mm}`, total };
    });
}

export type DonutKey = "BKD" | "NON_BKD_HIGH" | "NON_BKD_LOW";

export interface DonutSlice {
  key: DonutKey;
  label: string;
  count: number;
  color: string;
}

function normalizeStatusWo(value: string | null | undefined): string {
  return (value || "")
    .toString()
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
}

export function computeDonutCategories(orders: WorkOrder[]): DonutSlice[] {
  const counts: Record<DonutKey, number> = {
    BKD: 0,
    NON_BKD_HIGH: 0,
    NON_BKD_LOW: 0,
  };
  for (const o of orders) {
    const status = normalizeStatusWo(o.STATUS_WO);
    if (status === "BREAKDOWN") {
      counts.BKD += 1;
    } else if (status === "NON BKD HIGH") {
      counts.NON_BKD_HIGH += 1;
    } else if (status === "NON BKD LOW") {
      counts.NON_BKD_LOW += 1;
    }
  }
  return [
    { key: "BKD", label: "BKD", count: counts.BKD, color: "#ef4444" },
    { key: "NON_BKD_HIGH", label: "NON BKD HIGH", count: counts.NON_BKD_HIGH, color: "#ff7a00" },
    { key: "NON_BKD_LOW", label: "NON BKD LOW", count: counts.NON_BKD_LOW, color: "#22c55e" },
  ];
}

export function uniqueValues(
  orders: WorkOrder[],
  field: "AREA_PRODUKSI" | "SHIFT" | "STATUS_WO",
): string[] {
  const set = new Set<string>();
  for (const o of orders) {
    const v = o[field];
    if (v && typeof v === "string" && v.trim() !== "") set.add(v);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

export interface FilterState {
  area: string;
  shift: string;
  statusWo: string;
  dateFrom: string | null;
  dateTo: string | null;
}

export function applyFilters(
  orders: WorkOrder[],
  f: FilterState,
): WorkOrder[] {
  const from = f.dateFrom ? new Date(`${f.dateFrom}T00:00:00`).getTime() : null;
  const to = f.dateTo ? new Date(`${f.dateTo}T23:59:59`).getTime() : null;
  return orders.filter((o) => {
    if (f.area !== "ALL" && o.AREA_PRODUKSI !== f.area) return false;
    if (f.shift !== "ALL" && (o.SHIFT ?? "") !== f.shift) return false;
    if (f.statusWo !== "ALL" && o.STATUS_WO !== f.statusWo) return false;
    if (from !== null || to !== null) {
      const d = getWoDate(o);
      if (!d) return false;
      const t = d.getTime();
      if (from !== null && t < from) return false;
      if (to !== null && t > to) return false;
    }
    return true;
  });
}

export function formatHours2(hours: number | null | undefined): string {
  if (hours === null || hours === undefined || !Number.isFinite(hours))
    return "—";
  return hours.toFixed(2);
}

export function formatMinutes(min: number | null | undefined): string {
  if (min === null || min === undefined || !Number.isFinite(min)) return "—";
  return Math.round(min).toLocaleString();
}

export type TeamStatus = "Excellent" | "Good" | "Warning" | "Critical";

export interface TeamMetrics {
  team: string;
  totalWO: number;
  closedWO: number;
  openWO: number;
  pendingCount: number;
  breakdownCount: number;
  avgMttrHours: number | null;
  avgDowntimeMin: number | null;
  closeRate: number;
  effectivenessScore: number;
  status: TeamStatus;
}

function isPending(wo: WorkOrder): boolean {
  const s = (wo.STATUS_PROGRESS || "").trim().toUpperCase();
  return s === "PENDING" || s === "ON HOLD" || s === "WAITING";
}

export function computeTeamMetrics(orders: WorkOrder[]): TeamMetrics[] {
  const map = new Map<
    string,
    {
      totalWO: number;
      closedWO: number;
      pendingCount: number;
      breakdownCount: number;
      mttrHoursSum: number;
      mttrSamples: number;
      downtimeMinSum: number;
      downtimeSamples: number;
    }
  >();

  for (const o of orders) {
    const rawTeam = o.TEAM_PRODUKSI;
    const name =
      rawTeam && typeof rawTeam === "string" && rawTeam.trim() !== ""
        ? rawTeam.trim()
        : "Unassigned";
    const cur =
      map.get(name) ?? {
        totalWO: 0,
        closedWO: 0,
        pendingCount: 0,
        breakdownCount: 0,
        mttrHoursSum: 0,
        mttrSamples: 0,
        downtimeMinSum: 0,
        downtimeSamples: 0,
      };
    cur.totalWO += 1;
    if (isClosed(o)) cur.closedWO += 1;
    if (isPending(o)) cur.pendingCount += 1;
    if (isBreakdown(o)) cur.breakdownCount += 1;
    const dt = getDowntimeMinutes(o);
    if (dt !== null) {
      cur.downtimeMinSum += dt;
      cur.downtimeSamples += 1;
      if (isBreakdown(o) && isClosed(o)) {
        cur.mttrHoursSum += dt / 60;
        cur.mttrSamples += 1;
      }
    }
    map.set(name, cur);
  }

  const base = Array.from(map.entries()).map(([team, v]) => ({
    team,
    totalWO: v.totalWO,
    closedWO: v.closedWO,
    openWO: v.totalWO - v.closedWO,
    pendingCount: v.pendingCount,
    breakdownCount: v.breakdownCount,
    avgMttrHours:
      v.mttrSamples > 0 ? v.mttrHoursSum / v.mttrSamples : null,
    avgDowntimeMin:
      v.downtimeSamples > 0 ? v.downtimeMinSum / v.downtimeSamples : null,
    closeRate: v.totalWO > 0 ? (v.closedWO / v.totalWO) * 100 : 0,
  }));

  return computeTeamEffectiveness(base);
}

type TeamMetricsBase = Omit<TeamMetrics, "effectivenessScore" | "status">;

function normalizeLowerIsBetter(values: number[]): number[] {
  if (values.length === 0) return [];
  const finite = values.filter((v) => Number.isFinite(v));
  if (finite.length === 0) return values.map(() => 50);
  const min = Math.min(...finite);
  const max = Math.max(...finite);
  if (max === min) return values.map(() => 100);
  return values.map((v) => {
    if (!Number.isFinite(v)) return 50;
    return ((max - v) / (max - min)) * 100;
  });
}

function classify(score: number): TeamStatus {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Good";
  if (score >= 60) return "Warning";
  return "Critical";
}

export function computeTeamEffectiveness(
  rows: TeamMetricsBase[],
): TeamMetrics[] {
  if (rows.length === 0) return [];

  const mttrVals = rows.map((r) =>
    r.avgMttrHours === null ? Number.NaN : r.avgMttrHours,
  );
  const downtimeVals = rows.map((r) =>
    r.avgDowntimeMin === null ? Number.NaN : r.avgDowntimeMin,
  );
  const pendingVals = rows.map((r) => r.pendingCount);

  const mttrScores = normalizeLowerIsBetter(mttrVals);
  const downtimeScores = normalizeLowerIsBetter(downtimeVals);
  const pendingScores = normalizeLowerIsBetter(pendingVals);

  return rows
    .map((r, i) => {
      const closeRate = r.closeRate;
      const score =
        closeRate * 0.4 +
        (mttrScores[i] ?? 50) * 0.3 +
        (downtimeScores[i] ?? 50) * 0.2 +
        (pendingScores[i] ?? 50) * 0.1;
      const clamped = Math.max(0, Math.min(100, score));
      return {
        ...r,
        effectivenessScore: clamped,
        status: classify(clamped),
      };
    })
    .sort((a, b) => b.effectivenessScore - a.effectivenessScore);
}

export interface InsightPayload {
  key: string;
  params: Record<string, string | number>;
}

export function generateTeamInsights(metrics: TeamMetrics[]): InsightPayload[] {
  if (metrics.length === 0) return [];

  const insights: InsightPayload[] = [];

  const mostWO = [...metrics].sort((a, b) => b.totalWO - a.totalWO)[0];
  if (mostWO && mostWO.totalWO > 0) {
    insights.push({
      key: "insights.mostWo",
      params: { team: mostWO.team, count: mostWO.totalWO.toLocaleString() },
    });
  }

  const withMttr = metrics.filter(
    (m): m is TeamMetrics & { avgMttrHours: number } =>
      m.avgMttrHours !== null && Number.isFinite(m.avgMttrHours),
  );
  if (withMttr.length > 0) {
    const bestMttr = [...withMttr].sort(
      (a, b) => a.avgMttrHours - b.avgMttrHours,
    )[0]!;
    insights.push({
      key: "insights.bestMttr",
      params: {
        team: bestMttr.team,
        hours: bestMttr.avgMttrHours.toFixed(2),
      },
    });
  }

  const mostBreakdowns = [...metrics].sort(
    (a, b) => b.breakdownCount - a.breakdownCount,
  )[0];
  if (mostBreakdowns && mostBreakdowns.breakdownCount > 0) {
    insights.push({
      key: "insights.mostBreakdowns",
      params: {
        team: mostBreakdowns.team,
        count: mostBreakdowns.breakdownCount.toLocaleString(),
      },
    });
  }

  const topScore = metrics[0];
  if (topScore) {
    insights.push({
      key: "insights.topScore",
      params: {
        team: topScore.team,
        score: topScore.effectivenessScore.toFixed(0),
        status: topScore.status,
      },
    });
  }

  const mostPending = [...metrics].sort(
    (a, b) => b.pendingCount - a.pendingCount,
  )[0];
  if (mostPending && mostPending.pendingCount > 0) {
    insights.push({
      key: "insights.mostPending",
      params: {
        team: mostPending.team,
        count: mostPending.pendingCount.toLocaleString(),
      },
    });
  }

  if (insights.length < 3) {
    const bestCloseRate = [...metrics].sort(
      (a, b) => b.closeRate - a.closeRate,
    )[0];
    if (bestCloseRate && bestCloseRate.totalWO > 0) {
      insights.push({
        key: "insights.bestCloseRate",
        params: {
          team: bestCloseRate.team,
          rate: bestCloseRate.closeRate.toFixed(0),
        },
      });
    }
  }

  if (insights.length < 3) {
    const worstScore = metrics[metrics.length - 1];
    if (worstScore && worstScore !== metrics[0]) {
      insights.push({
        key: "insights.worstScore",
        params: {
          team: worstScore.team,
          score: worstScore.effectivenessScore.toFixed(0),
          status: worstScore.status,
        },
      });
    }
  }

  if (insights.length < 3) {
    if (metrics.length === 1) {
      insights.push({ key: "insights.trackingOne", params: {} });
    } else {
      insights.push({
        key: "insights.trackingMany",
        params: { count: metrics.length },
      });
    }
  }

  return insights.slice(0, 5);
}

export function formatDate(d: Date | null): string {
  if (!d) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
}
