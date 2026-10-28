import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ShoppingBasket,
  ArrowRight,
  Upload,
  Smartphone,
  FileText,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Wallet,
  Sparkles,
  Building2,
  Users,
  Check,
} from "lucide-react";
import heroImg from "@/assets/hero.jpg";
import {
  MARKETS,
  MARKET_ORDER,
  POSITIONS,
  salaryFor,
  allowanceFor,
  formatKsh,
  APPLICATION_FEE,
  type MarketId,
} from "@/lib/jobs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KaziLink — Kenya Supermarket Employment Portal" },
      {
        name: "description",
        content:
          "Apply to Quickmart, Carrefour and Naivas. Select role, upload ID & CV, simulate M-PESA KSh 650 fee, and download your official acceptance letter.",
      },
      { property: "og:title", content: "KaziLink — Apply to Quickmart, Carrefour & Naivas" },
      {
        property: "og:description",
        content: "One application for Kenya's top supermarkets — role, documents, payment and letter in minutes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const [market, setMarket] = useState<MarketId>("carrefour");

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
              <ShoppingBasket className="size-5" />
            </span>
            <span className="font-display text-xl font-black tracking-tight">KaziLink</span>
            <Badge variant="secondary" className="hidden sm:inline-flex border-emerald-500/20 text-emerald-600 font-semibold">
              Live Recruitment 2026
            </Badge>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild className="border-border">
              <Link to="/admin">Admin HR Console</Link>
            </Button>
            <Button size="sm" asChild className="bg-emerald-600 font-bold text-white hover:bg-emerald-500">
              <Link to="/apply">Start Application</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-7xl items-center gap-10 px-5 pb-16 pt-12 lg:grid-cols-2 lg:pt-16">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            Openings for Quickmart · Carrefour · Naivas
          </span>
          <h1 className="mt-5 font-display text-5xl font-black leading-[1.05] tracking-tight sm:text-6xl">
            Your supermarket career, <span className="text-emerald-600 dark:text-emerald-400">guaranteed.</span>
          </h1>
          <p className="mt-5 max-w-lg text-lg text-muted-foreground">
            Apply to <strong className="text-foreground">Carrefour</strong>,{" "}
            <strong className="text-foreground">Quickmart</strong> and{" "}
            <strong className="text-foreground">Naivas</strong> in one seamless portal. Upload your ID & CV,
            complete the {formatKsh(APPLICATION_FEE)} processing fee via simulated M-PESA STK push, and download your
            official Employment Acceptance Letter.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button size="lg" asChild className="bg-emerald-600 font-bold text-white shadow-lg hover:bg-emerald-500">
              <Link to="/apply" search={{ market }}>
                Start Application <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="#positions">Browse {POSITIONS.length} Open Roles</a>
            </Button>
            <Button size="lg" variant="ghost" asChild>
              <Link to="/admin">Admin HR Registry →</Link>
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Clock className="size-4 text-emerald-600" /> ~3 minute submission
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-emerald-600" /> ID & CV stored permanently
            </span>
            <span className="flex items-center gap-1.5">
              <FileText className="size-4 text-emerald-600" /> Instant PDF acceptance letter
            </span>
          </div>
        </div>

        <div className="relative">
          <img
            src={heroImg}
            alt="Supermarket staff assisting a customer in a fresh produce aisle"
            width={1600}
            height={900}
            className="aspect-[4/3] w-full rounded-3xl object-cover shadow-2xl"
          />
          <div className="absolute -bottom-6 -left-4 flex items-center gap-3 rounded-2xl border border-border bg-card/95 backdrop-blur px-5 py-4 shadow-xl sm:-left-8">
            <span className="grid size-12 place-items-center rounded-2xl bg-emerald-600 text-white shadow-md">
              <CheckCircle2 className="size-6" />
            </span>
            <div>
              <p className="text-sm font-bold">Acceptance Letter Authenticated</p>
              <p className="text-xs text-muted-foreground">CRF-2026-8812 · Driver · Carrefour Two Rivers</p>
            </div>
          </div>
        </div>
      </section>

      {/* Supermarket Brands Showcase */}
      <section id="markets" className="mx-auto max-w-7xl px-5 py-16 border-t border-border/60">
        <div className="text-center sm:text-left">
          <span className="text-xs uppercase tracking-wider font-bold text-emerald-600">Leading Kenyan Retailers</span>
          <h2 className="mt-1 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            Choose Your Preferred Supermarket
          </h2>
          <p className="mt-2 text-muted-foreground">Select a store to view branch openings, salary structures and allowances.</p>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {MARKET_ORDER.map((id) => {
            const m = MARKETS[id];
            const active = market === id;
            return (
              <button
                key={id}
                onClick={() => setMarket(id)}
                className={`group rounded-3xl border-2 bg-card p-6 text-left transition-all hover:-translate-y-1 hover:shadow-xl ${
                  active ? "border-emerald-600 shadow-lg shadow-emerald-600/10" : "border-border"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="grid size-14 place-items-center rounded-2xl text-2xl font-black text-white shadow-md"
                    style={{ backgroundColor: m.primaryColor }}
                  >
                    {m.logoLetter}
                  </span>
                  {active && (
                    <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-[11px] font-bold text-white">
                      Selected
                    </span>
                  )}
                </div>
                <h3 className="mt-4 font-display text-2xl font-bold">{m.brandName}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{m.tagline}</p>
                <div className="mt-4 space-y-1 border-t border-border/50 pt-3 text-xs text-muted-foreground">
                  <p><strong>HR Contact:</strong> {m.hrName} ({m.hrPhone})</p>
                  <p><strong>Locations:</strong> {m.branches.slice(0, 3).join(", ")} + {m.branches.length - 3} more</p>
                </div>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {active ? "View Roles Below" : "Select Brand"} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Positions Section */}
      <section id="positions" className="border-y border-border bg-secondary/40 py-16">
        <div className="mx-auto max-w-7xl px-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                10 Available Employment Positions
              </span>
              <h2 className="mt-1 font-display text-3xl font-extrabold tracking-tight">
                Roles & Published Remuneration at {MARKETS[market].brandName}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                All roles include standard allowances, medical/transport benefits, and scheduled orientation invitations.
              </p>
            </div>
            <Tabs value={market} onValueChange={(v) => setMarket(v as MarketId)}>
              <TabsList className="bg-background">
                {MARKET_ORDER.map((id) => (
                  <TabsTrigger key={id} value={id}>
                    {MARKETS[id].name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {POSITIONS.map((p) => {
              const salary = salaryFor(p, market);
              const allowance = allowanceFor(p, market);

              return (
                <div
                  key={p.id}
                  className="flex flex-col justify-between rounded-3xl border border-border bg-card p-6 shadow-sm transition-all hover:border-emerald-500/50 hover:shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-xs">
                        {p.category}
                      </Badge>
                      <span className="font-display text-xl font-black text-emerald-600 dark:text-emerald-400">
                        {formatKsh(salary)}
                      </span>
                    </div>

                    <h3 className="mt-3 font-display text-xl font-bold">{p.title}</h3>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{p.description}</p>
                  </div>

                  <div className="mt-5 border-t border-border/60 pt-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{p.allowanceLabel}</span>
                      <strong className="text-emerald-700 dark:text-emerald-300 font-bold">{allowance}</strong>
                    </div>

                    <Button asChild size="sm" className="mt-4 w-full bg-emerald-600 font-bold text-white hover:bg-emerald-500">
                      <Link to="/apply" search={{ market, role: p.id }}>
                        Apply for {p.title} <ArrowRight className="ml-1 size-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Steps */}
      <section className="mx-auto max-w-7xl px-5 py-16">
        <div className="text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Simple 4-Step Process</span>
          <h2 className="mt-1 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            From Application to Onboarding in Minutes
          </h2>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl border border-border bg-card p-6">
            <span className="grid size-12 place-items-center rounded-2xl bg-secondary font-display text-xl font-bold text-emerald-600">
              1
            </span>
            <h3 className="mt-4 font-display text-lg font-bold">Pick Store & Role</h3>
            <p className="mt-2 text-xs text-muted-foreground">
              Choose Quickmart, Carrefour or Naivas and your target job title with preferred work and orientation branches.
            </p>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6">
            <span className="grid size-12 place-items-center rounded-2xl bg-secondary font-display text-xl font-bold text-emerald-600">
              2
            </span>
            <h3 className="mt-4 font-display text-lg font-bold">Upload ID & CV</h3>
            <p className="mt-2 text-xs text-muted-foreground">
              Upload clear front and back photos of your National ID and your CV. Documents are permanently indexed in Supabase.
            </p>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6">
            <span className="grid size-12 place-items-center rounded-2xl bg-secondary font-display text-xl font-bold text-emerald-600">
              3
            </span>
            <h3 className="mt-4 font-display text-lg font-bold">Simulate M-PESA Fee</h3>
            <p className="mt-2 text-xs text-muted-foreground">
              Experience the realistic Safaricom M-PESA STK push prompt for the {formatKsh(APPLICATION_FEE)} processing fee.
            </p>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6">
            <span className="grid size-12 place-items-center rounded-2xl bg-secondary font-display text-xl font-bold text-emerald-600">
              4
            </span>
            <h3 className="mt-4 font-display text-lg font-bold">Download Letter</h3>
            <p className="mt-2 text-xs text-muted-foreground">
              Download and print your official Employment Acceptance Letter and Orientation Invitation complete with seals and signatures.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-secondary/30 py-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <ShoppingBasket className="size-4 text-emerald-600" />
            <span className="font-semibold text-foreground">KaziLink Retail Recruitment Portal</span>
            <span>· All Rights Reserved © 2026</span>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/apply" className="hover:text-foreground">Candidate Application</Link>
            <Link to="/admin" className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
              Admin HR Console
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
