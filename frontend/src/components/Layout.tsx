import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { AssistantPanel } from "@/components/AssistantPanel";
import { Sym } from "@/components/ui/sym";
import { useTheme } from "@/hooks/use-theme";

interface NavItem {
  label: string;
  icon: string;
  to?: string; // omitted => placeholder (non-functional, "soon")
  isActive?: (pathname: string) => boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: "Workspace",
    items: [
      { label: "Search", icon: "search", to: "/search", isActive: (p) => p === "/search" },
      { label: "My properties", icon: "home_work", to: "/", isActive: (p) => p === "/" },
    ],
  },
  {
    title: "Analysis",
    items: [
      { label: "Strategy profile", icon: "insights", to: "/listings", isActive: (p) => p.startsWith("/listing") },
      { label: "Market trends", icon: "trending_up" },
    ],
  },
];

export function Layout() {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [assistantOpen, setAssistantOpen] = useState(false);

  return (
    <div className="min-h-screen">
      {/* Top bar: app name (left), theme toggle (right). */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-rule bg-paper-2 px-4">
        <Link to="/" className="flex items-center">
          <img src="/cortex.png" alt="Cortex" className="h-9 w-auto" />
        </Link>

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === "night" ? "Switch to light theme" : "Switch to night theme"}
          title={theme === "night" ? "Light theme" : "Night theme"}
          className="flex h-9 w-9 items-center justify-center rounded text-ink-2 transition-colors hover:bg-paper-3 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Sym name={theme === "night" ? "light_mode" : "dark_mode"} sm />
        </button>
      </header>

      <div className="flex">
        {/* Sidebar: categorized navigation + profile footer. */}
        <aside className="sticky top-14 flex h-[calc(100vh-3.5rem)] w-16 flex-none flex-col border-r border-rule bg-paper-2 md:w-60">
          <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-2 py-3 md:px-3">
            {NAV_SECTIONS.map((section) => (
              <div key={section.title} className="flex flex-col gap-1">
                <p className="fb-eyebrow hidden px-3 pb-1 md:block">{section.title}</p>
                {section.items.map((item) => {
                  const active = item.isActive?.(location.pathname) ?? false;
                  const placeholder = !item.to;

                  const inner = (
                    <>
                      <Sym name={item.icon} sm active={active} className="flex-none" />
                      <span className="hidden md:inline">{item.label}</span>
                      {placeholder && (
                        <span className="fb-eyebrow ml-auto hidden rounded border border-rule px-1 text-[10px] text-ink-3 md:inline">
                          soon
                        </span>
                      )}
                    </>
                  );

                  const base =
                    "flex items-center gap-3 rounded px-3 py-2 text-sm font-medium transition-colors";

                  if (placeholder) {
                    return (
                      <div
                        key={item.label}
                        role="button"
                        aria-disabled="true"
                        title={`${item.label} (coming soon)`}
                        className={`${base} cursor-default text-ink-3`}
                      >
                        {inner}
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={item.label}
                      to={item.to!}
                      aria-current={active ? "page" : undefined}
                      title={item.label}
                      className={`${base} ${
                        active ? "bg-paper-3 text-ink" : "text-ink-2 hover:bg-paper-3 hover:text-ink"
                      }`}
                    >
                      {inner}
                    </Link>
                  );
                })}

                {section.title === "Analysis" && (
                  <button
                    type="button"
                    onClick={() => setAssistantOpen((o) => !o)}
                    aria-pressed={assistantOpen}
                    title="Assistant"
                    className={`flex items-center gap-3 rounded px-3 py-2 text-sm font-medium transition-[color,background-color,transform] duration-150 ease-fb active:scale-[0.98] ${
                      assistantOpen
                        ? "bg-paper-3 text-ink"
                        : "text-ink-2 hover:bg-paper-3 hover:text-ink"
                    }`}
                  >
                    <Sym name="forum" sm active={assistantOpen} className="flex-none" />
                    <span className="hidden md:inline">Assistant</span>
                  </button>
                )}
              </div>
            ))}
          </nav>

          {/* User profile — visual only for now; wiring comes later. */}
          <div className="border-t border-rule px-2 py-2 md:px-3">
            <div
              role="button"
              aria-disabled="true"
              title="Profile (coming soon)"
              className="flex cursor-default items-center gap-3 rounded px-3 py-2"
            >
              <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full border border-rule bg-paper-3 text-ink-2">
                <Sym name="person" sm />
              </span>
              <span className="hidden flex-col leading-tight md:flex">
                <span className="text-sm font-medium text-ink">Your profile</span>
                <span className="text-xs text-ink-3">Sign in coming soon</span>
              </span>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div
            key={location.pathname}
            className="mx-auto max-w-[1200px] px-6 py-6 duration-300 ease-fb animate-in fade-in slide-in-from-bottom-2"
          >
            <Outlet />
          </div>
        </main>

        <AssistantPanel open={assistantOpen} onClose={() => setAssistantOpen(false)} />
      </div>
    </div>
  );
}
