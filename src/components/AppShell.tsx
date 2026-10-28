import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ShoppingBasket, LayoutDashboard, FilePlus2, LogOut, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Shared header for the signed-in applicant pages.
export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    // Ordered teardown: stop in-flight queries, drop cached data, clear session.
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-lg bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
              <ShoppingBasket className="size-5" />
            </span>
            <span className="font-display text-xl font-bold tracking-tight">Jobs Portal</span>
            <Badge variant="secondary" className="hidden sm:inline-flex border-emerald-500/20 text-emerald-600 font-semibold">
              Orientation 2026
            </Badge>
          </Link>
          <nav className="flex items-center gap-1.5">
            <Button variant="ghost" asChild>
              <Link to="/dashboard">
                <LayoutDashboard className="size-4" /> My Letters
              </Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/apply">
                <FilePlus2 className="size-4" /> Claim Letter
              </Link>
            </Button>
            <Button variant="outline" onClick={handleSignOut} disabled={signingOut}>
              {signingOut ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-10">{children}</main>
      <footer className="border-t border-border py-6">
        <div className="mx-auto max-w-6xl px-5 text-center text-xs text-muted-foreground">
          Jobs Portal — Official Supermarket Candidate Orientation & Employment Approval Service.
        </div>
      </footer>
    </div>
  );
}
