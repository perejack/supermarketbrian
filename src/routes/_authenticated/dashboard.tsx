import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { BadgeCheck, Clock3, FilePlus2, FileText, Loader2, Wallet } from "lucide-react";
import { getMyApplications, type ApplicationRow } from "@/lib/app-server";
import { MARKETS, formatKsh, type MarketId } from "@/lib/jobs";
import { PaymentPanel } from "@/components/PaymentPanel";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "My Orientation Letters — Jobs Portal" },
      { name: "description", content: "View your verified supermarket appointment status and download your orientation letter." },
      { property: "og:title", content: "My Orientation Letters — Jobs Portal" },
      { property: "og:description", content: "Track your appointments, fee receipts and orientation letters." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: () => getMyApplications(),
  component: DashboardPage,
});

function DashboardPage() {
  const apps = Route.useLoaderData() as ApplicationRow[];
  const router = useRouter();
  const [paying, setPaying] = useState<ApplicationRow | null>(null);

  return (
    <AppShell>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">My Orientation Letters</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {apps.length === 0
              ? "You haven't claimed an appointment letter yet — your letters will appear here."
              : `${apps.length} qualified appointment${apps.length === 1 ? "" : "s"} on file.`}
          </p>
        </div>
        <Button asChild className="font-semibold bg-emerald-600 hover:bg-emerald-500 text-white">
          <Link to="/apply">
            <FilePlus2 className="size-4" /> Claim Orientation Letter
          </Link>
        </Button>
      </div>

      {apps.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-dashed border-border bg-card p-10 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-secondary text-primary">
            <FileText className="size-6" />
          </span>
          <h2 className="mt-4 font-display text-xl font-bold">No applications yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Pick a supermarket and role, upload your ID and CV, and download your acceptance letter.
          </p>
          <Button asChild className="mt-5 font-semibold">
            <Link to="/apply">
              Start application <FilePlus2 className="size-4" />
            </Link>
          </Button>
        </div>
      ) : (
        <div className="mt-8 grid gap-4">
          {apps.map((app) => {
            const market = MARKETS[app.supermarket as MarketId];
            const paid = app.payment_status === "paid";
            return (
              <div
                key={app.id}
                className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center"
              >
                <span className="font-display grid size-12 shrink-0 place-items-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground">
                  {market?.name.charAt(0) ?? "?"}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-lg font-bold">
                      {app.position} · {market?.name ?? app.supermarket}
                    </h3>
                    {paid ? (
                      <Badge className="gap-1 bg-primary text-primary-foreground hover:bg-primary">
                        <BadgeCheck className="size-3" /> Paid
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 border-mpesa/60 text-mpesa">
                        <Clock3 className="size-3" /> Payment pending
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    <span className="font-mono font-semibold text-foreground">{app.reference_number}</span>
                    {" · "}{app.preferred_branch} · {formatKsh(app.monthly_salary)}/month
                    {app.mpesa_receipt && <> · Receipt <span className="font-mono">{app.mpesa_receipt}</span></>}
                  </p>
                </div>
                {paid ? (
                  <Button asChild className="font-semibold">
                    <Link to="/letter" search={{ ref: app.reference_number }}>
                      <FileText className="size-4" /> Acceptance letter
                    </Link>
                  </Button>
                ) : (
                  <Button variant="outline" className="border-mpesa/60 font-semibold text-mpesa hover:bg-mpesa/10" onClick={() => setPaying(app)}>
                    <Wallet className="size-4" /> Complete payment
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {paying && (
        <Dialog open onOpenChange={(open) => !open && setPaying(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Complete payment — <span className="font-mono">{paying.reference_number}</span>
              </DialogTitle>
            </DialogHeader>
            <PaymentPanel
              applicationId={paying.id}
              defaultPhone={paying.phone}
              onPaid={() => {
                setPaying(null);
                router.invalidate();
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {paying && <span className="sr-only"><Loader2 /> paying</span>}
    </AppShell>
  );
}
