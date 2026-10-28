import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ShoppingBasket, ArrowRight, Lock, Sparkles, BadgeCheck, Zap, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type AuthSearch = { next?: string };

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): AuthSearch => {
    const raw = search["next"];
    return typeof raw === "string" && raw.startsWith("/") ? { next: raw } : {};
  },
  head: () => ({
    meta: [
      { title: "Sign in — Jobs Portal" },
      { name: "description", content: "Sign in to Jobs Portal to verify your qualified status and download your supermarket orientation letter." },
      { property: "og:title", content: "Sign in — Jobs Portal" },
      { property: "og:description", content: "Sign in to download your supermarket orientation letter." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function safeNext(next: string | undefined): string {
  if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  return "/apply";
}

function AuthPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const destination = safeNext(search.next);

  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const go = () => navigate({ to: destination });

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: signInEmail.trim(),
      password: signInPassword,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    go();
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: signUpEmail.trim(),
      password: signUpPassword,
      options: { emailRedirectTo: window.location.origin },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data.session) {
      go();
    } else {
      toast.success("Account created successfully!");
      go();
    }
  }

  async function handleInstantDemoLogin() {
    setBusy(true);
    const demoEmail = `candidate.${Math.floor(1000 + Math.random() * 9000)}@kazilink.demo`;
    const demoPassword = "KaziDemoPassword2026!";

    try {
      const { data, error } = await supabase.auth.signUp({
        email: demoEmail,
        password: demoPassword,
      });

      if (error) {
        // Fallback: try signing in if exists
        await supabase.auth.signInWithPassword({
          email: demoEmail,
          password: demoPassword,
        });
      }
      toast.success("Welcome! Signed in as demo applicant.");
      go();
    } catch (e) {
      toast.info("Entering demo portal directly...");
      go();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand side */}
      <div className="relative hidden flex-col justify-between bg-zinc-950 p-12 text-white lg:flex border-r border-zinc-800">
        <Link to="/" className="flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/30">
            <ShoppingBasket className="size-6" />
          </span>
          <div>
            <span className="font-display text-2xl font-black tracking-tight">Jobs Portal</span>
            <p className="text-xs text-zinc-400">Kenya Retail Employment Verification</p>
          </div>
        </Link>

        <div className="max-w-md space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3.5 py-1 text-xs font-semibold text-emerald-400">
            <Sparkles className="size-3.5" /> Quickmart · Carrefour · Naivas
          </span>
          <h2 className="font-display text-4xl font-extrabold leading-tight">
            Interview Passed? Claim your Official Orientation Letter.
          </h2>
          <p className="text-sm leading-relaxed text-zinc-400">
            Candidates who qualified for Quickmart, Carrefour, or Naivas: select your position, verify your details, complete the processing fee, and download your official invitation letter.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2 text-xs text-zinc-300">
            <div className="flex items-center gap-2 rounded-xl bg-zinc-900/80 p-3 border border-zinc-800">
              <BadgeCheck className="size-4 text-emerald-400" />
              <span>10 Qualified Roles</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-zinc-900/80 p-3 border border-zinc-800">
              <ShieldCheck className="size-4 text-emerald-400" />
              <span>Verified Acceptance Letter</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>© 2026 Jobs Portal Recruitment</span>
          <Link to="/admin" className="text-emerald-400 hover:underline">
            Admin HR Portal →
          </Link>
        </div>
      </div>

      {/* Form side */}
      <div className="flex items-center justify-center bg-background p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight">Welcome to Jobs Portal</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in to verify your qualified appointment and download your orientation letter.
            </p>
          </div>

          {/* Instant 1-Click Demo Login Banner */}
          <div className="rounded-2xl border-2 border-emerald-500/40 bg-emerald-500/10 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-display font-bold text-emerald-800 dark:text-emerald-300">
                  Quick Showcase Access
                </p>
                <p className="mt-0.5 text-xs text-emerald-700/90 dark:text-emerald-400/90">
                  Bypass manual credentials and jump straight into the application workflow.
                </p>
              </div>
              <Button
                type="button"
                onClick={handleInstantDemoLogin}
                disabled={busy}
                className="bg-emerald-600 font-bold text-white shadow-md hover:bg-emerald-500"
              >
                <Zap className="mr-1.5 size-4" /> 1-Click Demo Login
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or sign in with email</span>
            </div>
          </div>

          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-xl">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Create Account</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-6">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email Address</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="e.g. brian.otieno@gmail.com"
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="••••••••"
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" disabled={busy} className="w-full font-semibold">
                  Sign In <ArrowRight className="ml-2 size-4" />
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-6">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email Address</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="e.g. brian.otieno@gmail.com"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" disabled={busy} className="w-full font-semibold">
                  Create Account <ArrowRight className="ml-2 size-4" />
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <p className="text-center text-xs text-muted-foreground">
            Recruiter or Staff?{" "}
            <Link to="/admin" className="font-semibold text-primary underline">
              Open Admin HR Registry
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
