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
  Award,
  Calendar,
  MapPin,
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Jobs Portal — Kenya Supermarket Employment Approval & Orientation" },
      {
        name: "description",
        content:
          "Official Jobs Portal for Quickmart, Carrefour, and Naivas. Congratulations on passing your interview! Verify your appointment, salary details, and download your official acceptance letter.",
      },
      { property: "og:title", content: "Jobs Portal — Supermarket Employment Approval" },
      {
        property: "og:description",
        content: "Qualified candidate appointment verification and orientation letter download for Quickmart, Carrefour, and Naivas.",
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
      {/* Navigation */}
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
              <ShoppingBasket className="size-5" />
            </span>
            <span className="font-display text-xl font-black tracking-tight">Jobs Portal</span>
            <Badge variant="secondary" className="hidden sm:inline-flex border-emerald-500/20 text-emerald-600 font-semibold">
              Orientation 2026
            </Badge>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild className="border-border">
              <Link to="/admin">Admin HR Console</Link>
            </Button>
            <Button size="sm" asChild className="bg-emerald-600 font-bold text-white hover:bg-emerald-500">
              <Link to="/apply">Claim Letter</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-7xl items-center gap-10 px-5 pb-16 pt-12 lg:grid-cols-2 lg:pt-16">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            <Award className="size-3.5" /> Interview Passed · Invitation for Orientation
          </span>
          <h1 className="mt-5 font-display text-5xl font-black leading-[1.08] tracking-tight sm:text-6xl">
            Congratulations! Your supermarket employment is <span className="text-emerald-600 dark:text-emerald-400">approved.</span>
          </h1>
          <p className="mt-5 max-w-lg text-lg text-muted-foreground">
            You have qualified for your applied role and position. Select the supermarket and position you applied for, review your approved salary structure and allowances, upload your ID and CV for verification, and download your official <strong className="text-foreground">Employment Acceptance & Orientation Letter</strong>.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button size="lg" asChild className="bg-emerald-600 font-bold text-white shadow-lg hover:bg-emerald-500">
              <Link to="/apply" search={{ market }}>
                Claim Orientation Letter <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="#positions">View Positions & Salaries</a>
            </Button>
            <Button size="lg" variant="ghost" asChild>
              <Link to="/admin">HR Admin Records →</Link>
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="size-4 text-emerald-600" /> Monday, 19th October 2026 Orientation
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="size-4 text-emerald-600" /> 9:00 AM Prompt
            </span>
            <span className="flex items-center gap-1.5">
              <FileText className="size-4 text-emerald-600" /> Official Signed Letter
            </span>
          </div>
        </div>

        <div className="relative">
          <img
            src={heroImg}
            alt="Supermarket staff assisting customer in store aisle"
            width={1600}
            height={900}
            className="aspect-[4/3] w-full rounded-3xl object-cover shadow-2xl"
          />
          <div className="absolute -bottom-6 -left-4 flex items-center gap-3 rounded-2xl border border-border bg-card/95 backdrop-blur px-5 py-4 shadow-xl sm:-left-8">
            <span className="grid size-12 place-items-center rounded-2xl bg-emerald-600 text-white shadow-md">
              <CheckCircle2 className="size-6" />
            </span>
            <div>
              <p className="text-sm font-bold">RE: INTERVIEW SUCCESSFUL</p>
              <p className="text-xs text-muted-foreground">Invitation for Orientation · Official Acceptance Letter</p>
            </div>
          </div>
        </div>
      </section>

      {/* Supermarket Brands Showcase */}
      <section id="markets" className="mx-auto max-w-7xl px-5 py-16 border-t border-border/60">
        <div className="text-center sm:text-left">
          <span className="text-xs uppercase tracking-wider font-bold text-emerald-600">Qualified Retail Employers</span>
          <h2 className="mt-1 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            Select The Supermarket You Applied For
          </h2>
          <p className="mt-2 text-muted-foreground">
            Choose your supermarket to verify your qualified role, salary package, allowances, and scheduled orientation branch.
          </p>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {MARKET_ORDER.map((id) => {
            const m = MARKETS[id];
            const active = market === id;
            return (
              <button
                key={id}
                onClick={() => setMarket(id)}
                className={`group relative flex flex-col overflow-hidden rounded-3xl border-2 bg-card text-left transition-all hover:-translate-y-1 hover:shadow-xl ${
                  active ? "border-emerald-600 shadow-lg shadow-emerald-600/10 ring-2 ring-emerald-600/20" : "border-border hover:border-emerald-500/40"
                }`}
              >
                {/* Top icon header: fills top part of card */}
                <div className="relative h-28 w-full border-b border-border/60 bg-white flex items-center justify-center p-4">
                  <img
                    src={m.logoUrl}
                    alt={m.name}
                    className="max-h-full max-w-[150px] object-contain"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                  {active && (
                    <span className="absolute top-3 right-3 rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-bold text-white shadow-sm flex items-center gap-1">
                      <Check className="size-3" /> Selected
                    </span>
                  )}
                </div>

                {/* Text Content below image */}
                <div className="flex flex-1 flex-col justify-between p-6">
                  <div>
                    <h3 className="font-display text-2xl font-bold">{m.brandName}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{m.tagline}</p>
                  </div>
                  <div className="mt-4 space-y-1 border-t border-border/50 pt-3 text-xs text-muted-foreground">
                    <p><strong>HR Representative:</strong> {m.hrName}</p>
                    <p><strong>Official Phone:</strong> {m.hrPhone}</p>
                    <p><strong>Official Email:</strong> {m.hrEmail}</p>
                  </div>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {active ? "View Qualified Roles" : "Select This Supermarket"}{" "}
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Positions & Remuneration Section */}
      <section id="positions" className="border-y border-border bg-secondary/40 py-16">
        <div className="mx-auto max-w-7xl px-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                Approved Positions & Remuneration
              </span>
              <h2 className="mt-1 font-display text-3xl font-extrabold tracking-tight">
                What role did you apply and qualify for at {MARKETS[market].name}?
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Select the position you applied for to review your approved salary, allowances, and schedule orientation.
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
                    <p className="text-xs text-muted-foreground font-medium">per month</p>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{p.description}</p>
                  </div>

                  <div className="mt-5 border-t border-border/60 pt-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{p.allowanceLabel}:</span>
                      <strong className="text-emerald-700 dark:text-emerald-300 font-bold">{allowance}</strong>
                    </div>

                    <Button asChild size="sm" className="mt-4 w-full bg-emerald-600 font-bold text-white hover:bg-emerald-500">
                      <Link to="/apply" search={{ market, role: p.id }}>
                        Select Qualified Position <ArrowRight className="ml-1 size-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How To Download Letter Steps */}
      <section className="mx-auto max-w-7xl px-5 py-16">
        <div className="text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Orientation Onboarding Flow</span>
          <h2 className="mt-1 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            How To Download Your Acceptance Letter
          </h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-xl mx-auto">
            Follow these 4 simple steps to authenticate your employment and receive your printed orientation invitation letter.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl border border-border bg-card p-6">
            <span className="grid size-12 place-items-center rounded-2xl bg-secondary font-display text-xl font-bold text-emerald-600">
              1
            </span>
            <h3 className="mt-4 font-display text-lg font-bold">Confirm Supermarket & Role</h3>
            <p className="mt-2 text-xs text-muted-foreground">
              Select Quickmart, Carrefour, or Naivas and the position you passed the interview for.
            </p>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6">
            <span className="grid size-12 place-items-center rounded-2xl bg-secondary font-display text-xl font-bold text-emerald-600">
              2
            </span>
            <h3 className="mt-4 font-display text-lg font-bold">Enter Details & Branches</h3>
            <p className="mt-2 text-xs text-muted-foreground">
              Type in your full names, preferred working branch, and nearest branch for your scheduled orientation session.
            </p>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6">
            <span className="grid size-12 place-items-center rounded-2xl bg-secondary font-display text-xl font-bold text-emerald-600">
              3
            </span>
            <h3 className="mt-4 font-display text-lg font-bold">Upload ID Front/Back & CV</h3>
            <p className="mt-2 text-xs text-muted-foreground">
              Upload clear photos of your National ID (front and back) plus your CV. These are saved securely even before payment.
            </p>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6">
            <span className="grid size-12 place-items-center rounded-2xl bg-secondary font-display text-xl font-bold text-emerald-600">
              4
            </span>
            <h3 className="mt-4 font-display text-lg font-bold">Pay Fee & Download Letter</h3>
            <p className="mt-2 text-xs text-muted-foreground">
              Complete the letter processing fee via live M-PESA STK push to receive and print your signed Acceptance Letter.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-secondary/30 py-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <ShoppingBasket className="size-4 text-emerald-600" />
            <span className="font-semibold text-foreground">Jobs Portal</span>
            <span>· Official Kenya Supermarket Employment Orientation Service © 2026</span>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/apply" className="hover:text-foreground">Claim Letter</Link>
            <Link to="/admin" className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
              Admin HR Console
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
