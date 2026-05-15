import { useEffect, useState } from "react";
import { useLanguage } from "@/i18n";

interface HeaderProps {
  lastUpdated: Date | null;
}

export function Header({ lastUpdated }: HeaderProps) {
  const { t, lang, setLang } = useLanguage();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const clock = (lastUpdated ?? now).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <header className="relative flex flex-col gap-4 border-b border-border bg-background/80 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
      <div className="accent-stripe absolute inset-x-0 top-0 h-[3px]" />
      <div className="hidden lg:flex flex-1 items-center">
        <LanguageToggle
          lang={lang}
          onChange={setLang}
          label={t("header.languageLabel")}
        />
      </div>
      <div className="text-center">
        <h1 className="text-xl font-extrabold tracking-tight text-foreground sm:text-2xl lg:text-[26px]">
          {t("header.title")}
        </h1>
        <div className="mt-1 flex items-center justify-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-primary pulse-dot" />
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-primary">
            {t("header.subtitle")}
          </span>
        </div>
      </div>
      <div className="flex flex-1 items-center justify-end gap-4">
        <div className="lg:hidden">
          <LanguageToggle
            lang={lang}
            onChange={setLang}
            label={t("header.languageLabel")}
          />
        </div>
        <div className="text-right">
          <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
            {t("header.lastUpdated")}
          </div>
          <div
            className="font-mono text-sm font-semibold text-foreground"
            data-testid="text-last-updated"
          >
            {clock}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 ring-1 ring-emerald-500/40">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 pulse-dot" />
            {t("header.live")}
          </span>
          <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
            {t("header.autoRefresh")}
          </span>
        </div>
      </div>
    </header>
  );
}

function LanguageToggle({
  lang,
  onChange,
  label,
}: {
  lang: "id" | "en";
  onChange: (l: "id" | "en") => void;
  label: string;
}) {
  return (
    <div
      className="inline-flex items-center gap-1 rounded-md border border-border bg-background/60 p-0.5"
      role="group"
      aria-label={label}
      data-testid="language-toggle"
    >
      <ToggleButton
        active={lang === "id"}
        onClick={() => onChange("id")}
        testId="lang-id"
      >
        ID
      </ToggleButton>
      <ToggleButton
        active={lang === "en"}
        onClick={() => onChange("en")}
        testId="lang-en"
      >
        EN
      </ToggleButton>
    </div>
  );
}

function ToggleButton({
  active,
  onClick,
  testId,
  children,
}: {
  active: boolean;
  onClick: () => void;
  testId: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      aria-pressed={active}
      className={`rounded px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider transition-all ${
        active
          ? "bg-primary text-primary-foreground shadow-[0_0_10px_rgba(249,115,22,0.4)]"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
