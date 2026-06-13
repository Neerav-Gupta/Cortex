import { Link, Outlet, useLocation } from "react-router-dom";
import { Activity } from "lucide-react";

export function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Activity className="h-4 w-4" />
            </div>
            <span className="text-lg font-bold tracking-tight">Cortex</span>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <Link
              to="/"
              className={`rounded-md px-3 py-1.5 transition-colors ${
                location.pathname === "/"
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Listings
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
