import {
  BarChart3,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  Settings,
  Wrench,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import tacoLogo from "@/assets/taco-logo.png";
import { useT } from "@/i18n";

interface NavItem {
  id: string;
  labelKey: string;
  icon: typeof LayoutDashboard;
  href?: string;
}

const NAV: NavItem[] = [
  { id: "dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard, href: "/" },
  { id: "wo", labelKey: "nav.workOrder", icon: ClipboardList },
  { id: "machine", labelKey: "nav.machine", icon: Wrench },
  { id: "analysis", labelKey: "nav.analysis", icon: BarChart3, href: "/analysis" },
  { id: "report", labelKey: "nav.report", icon: FileText },
  { id: "setting", labelKey: "nav.setting", icon: Settings },
];

export function Sidebar() {
  const [location] = useLocation();
  const t = useT();

  return (
    <aside className="hidden lg:flex h-screen sticky top-0 w-[220px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="border-b border-sidebar-border px-5 py-5">
        <img
          src={tacoLogo}
          alt="TACO"
          className="h-10 w-auto select-none"
          style={{
            filter:
              "invert(1) hue-rotate(180deg) drop-shadow(0 0 10px rgba(249,115,22,0.35))",
          }}
          draggable={false}
        />
        <div className="mt-2 text-[11px] font-semibold leading-snug tracking-tight text-foreground">
          PT Taco Anugrah Corporindo
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-5">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = !!item.href && location === item.href;
          const className = `group flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-all ${
            active
              ? "bg-primary/15 text-primary ring-1 ring-primary/40 shadow-[0_0_18px_rgba(249,115,22,0.18)]"
              : item.href
                ? "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                : "text-muted-foreground/70 hover:bg-white/5 hover:text-foreground cursor-not-allowed"
          }`;

          const inner = (
            <>
              <Icon className="h-4 w-4" />
              <span className="font-medium tracking-tight uppercase text-[11px]">
                {t(item.labelKey)}
              </span>
            </>
          );

          if (item.href) {
            return (
              <Link
                key={item.id}
                href={item.href}
                data-testid={`nav-${item.id}`}
                className={className}
              >
                {inner}
              </Link>
            );
          }

          return (
            <button
              key={item.id}
              type="button"
              data-testid={`nav-${item.id}`}
              disabled
              title={t("nav.comingSoon")}
              className={className}
            >
              {inner}
            </button>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border p-3">
        <button
          type="button"
          data-testid="button-logout"
          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-[11px] uppercase font-medium tracking-tight text-muted-foreground hover:bg-white/5 hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          {t("nav.logout")}
        </button>
      </div>
    </aside>
  );
}
