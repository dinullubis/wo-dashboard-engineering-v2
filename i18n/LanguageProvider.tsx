import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { id, type Dictionary } from "./translations/id";
import { en } from "./translations/en";

export type Language = "id" | "en";

const DICTIONARIES: Record<Language, Dictionary> = { id, en };

const STORAGE_KEY = "ie-dashboard.lang";
const DEFAULT_LANG: Language = "id";

type Primitive = string | number;
export type TParams = Record<string, Primitive>;

export type Translate = (key: string, params?: TParams) => string;

interface LanguageContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  toggle: () => void;
  t: Translate;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function readInitialLang(): Language {
  if (typeof window === "undefined") return DEFAULT_LANG;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "id" || stored === "en") return stored;
  } catch {
    // ignore storage errors (SSR, privacy mode, quota)
  }
  return DEFAULT_LANG;
}

function resolveKey(dict: Dictionary, key: string): string | undefined {
  const parts = key.split(".");
  let cur: unknown = dict;
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return undefined;
    }
  }
  return typeof cur === "string" ? cur : undefined;
}

function interpolate(template: string, params?: TParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, name: string) => {
    const v = params[name];
    return v === undefined ? `{${name}}` : String(v);
  });
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => readInitialLang());

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore
    }
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
    }
  }, [lang]);

  const setLang = useCallback((next: Language) => {
    setLangState(next);
  }, []);

  const toggle = useCallback(() => {
    setLangState((prev) => (prev === "id" ? "en" : "id"));
  }, []);

  const t = useCallback<Translate>(
    (key, params) => {
      const dict = DICTIONARIES[lang];
      const resolved =
        resolveKey(dict, key) ?? resolveKey(DICTIONARIES[DEFAULT_LANG], key);
      if (resolved === undefined) return key;
      return interpolate(resolved, params);
    },
    [lang],
  );

  const value = useMemo<LanguageContextValue>(
    () => ({ lang, setLang, toggle, t }),
    [lang, setLang, toggle, t],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return ctx;
}

export function useT(): Translate {
  return useLanguage().t;
}
