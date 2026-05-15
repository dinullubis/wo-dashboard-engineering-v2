import { Calendar, RefreshCw } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useT } from "@/i18n";

interface FilterBarProps {
  areas: string[];
  shifts: string[];
  statuses: string[];
  area: string;
  shift: string;
  statusWo: string;
  dateFrom: string | null;
  dateTo: string | null;
  isFetching: boolean;
  onArea: (v: string) => void;
  onShift: (v: string) => void;
  onStatus: (v: string) => void;
  onDateFrom: (v: string) => void;
  onDateTo: (v: string) => void;
  onRefresh: () => void;
}

export function FilterBar(p: FilterBarProps) {
  const t = useT();
  return (
    <div
      className="rounded-xl border border-card-border bg-card/80 backdrop-blur p-3 sm:p-4 shadow-[0_0_18px_rgba(249,115,22,0.05)]"
      data-testid="filter-bar"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:gap-4">
        <Field label={t("filter.date")} className="lg:flex-[2]">
          <div className="flex items-center gap-2 rounded-md border border-border bg-background/60 px-2.5 py-2">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            <input
              type="date"
              value={p.dateFrom ?? ""}
              onChange={(e) => p.onDateFrom(e.target.value)}
              className="w-full bg-transparent font-mono text-xs text-foreground outline-none [color-scheme:dark]"
              data-testid="input-date-from"
            />
            <span className="font-mono text-xs text-muted-foreground">—</span>
            <input
              type="date"
              value={p.dateTo ?? ""}
              onChange={(e) => p.onDateTo(e.target.value)}
              className="w-full bg-transparent font-mono text-xs text-foreground outline-none [color-scheme:dark]"
              data-testid="input-date-to"
            />
          </div>
        </Field>
        <Field label={t("filter.area")} className="lg:flex-1">
          <SelectBox
            value={p.area}
            options={p.areas}
            allLabel={t("filter.allAreas")}
            onChange={p.onArea}
            testId="select-area"
          />
        </Field>
        <Field label={t("filter.shift")} className="lg:flex-1">
          <SelectBox
            value={p.shift}
            options={p.shifts}
            allLabel={t("filter.allShifts")}
            onChange={p.onShift}
            testId="select-shift"
          />
        </Field>
        <Field label={t("filter.statusWo")} className="lg:flex-1">
          <SelectBox
            value={p.statusWo}
            options={p.statuses}
            allLabel={t("filter.allStatus")}
            onChange={p.onStatus}
            testId="select-status"
          />
        </Field>
        <button
          type="button"
          onClick={p.onRefresh}
          data-testid="button-refresh"
          className="inline-flex h-[42px] shrink-0 items-center justify-center gap-2 rounded-md bg-primary px-4 font-mono text-[11px] font-bold uppercase tracking-wider text-primary-foreground transition-all hover:brightness-110 hover:shadow-[0_0_18px_rgba(249,115,22,0.5)]"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${p.isFetching ? "animate-spin" : ""}`}
          />
          {t("filter.refresh")}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </span>
      {children}
    </div>
  );
}

function SelectBox({
  value,
  options,
  allLabel,
  onChange,
  testId,
}: {
  value: string;
  options: string[];
  allLabel: string;
  onChange: (v: string) => void;
  testId: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        className="h-[42px] border-border bg-background/60 font-mono text-xs uppercase tracking-wider"
        data-testid={testId}
      >
        <SelectValue placeholder={allLabel} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ALL">{allLabel}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
