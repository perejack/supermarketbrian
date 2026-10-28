import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Users,
  CheckCircle2,
  Clock3,
  Wallet,
  Search,
  Filter,
  ArrowUpDown,
  FileText,
  ExternalLink,
  Eye,
  Download,
  Building2,
  RefreshCw,
  Phone,
  Mail,
  Calendar,
  MapPin,
  ShieldCheck,
  Smartphone,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  UserCheck,
  FileCheck,
} from "lucide-react";
import {
  getAdminApplications,
  togglePaymentStatus,
  type ApplicationRow,
} from "@/lib/app-server";
import { MARKETS, formatKsh, APPLICATION_FEE, type MarketId, isMarketId } from "@/lib/jobs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Executive HR & Candidate Portal — Admin" },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Executive HR Admin Console" },
    ],
  }),
  loader: () => getAdminApplications({ data: { passcode: "" } }),
  component: AdminPage,
});

function AdminPage() {
  const initialData = Route.useLoaderData();
  const [applications, setApplications] = useState<ApplicationRow[]>(initialData);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "pending">("all");
  const [marketFilter, setMarketFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date-desc" | "date-asc" | "salary-desc" | "name-asc">("date-desc");
  const [refreshing, setRefreshing] = useState(false);

  // Modals state
  const [selectedApplicant, setSelectedApplicant] = useState<ApplicationRow | null>(null);
  const [idModalApplicant, setIdModalApplicant] = useState<ApplicationRow | null>(null);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const refreshed = await getAdminApplications({ data: { passcode: "" } });
      setApplications(refreshed);
      toast.success("Applications list refreshed successfully");
    } catch (e) {
      toast.error("Failed to refresh applications");
    } finally {
      setRefreshing(false);
    }
  }

  async function handleToggleStatus(app: ApplicationRow) {
    const nextStatus = app.payment_status === "paid" ? "pending" : "paid";
    try {
      const res = await togglePaymentStatus({
        data: {
          id: app.id,
          status: nextStatus,
        },
      });

      setApplications((prev) =>
        prev.map((item) =>
          item.id === app.id
            ? {
                ...item,
                payment_status: nextStatus,
                mpesa_receipt: res.receipt || null,
                paid_at: nextStatus === "paid" ? new Date().toISOString() : null,
              }
            : item
        )
      );

      toast.success(
        nextStatus === "paid"
          ? `Marked ${app.full_name} as PAID (${res.receipt})`
          : `Marked ${app.full_name} as PENDING`
      );
    } catch (e) {
      toast.error("Failed to update status");
    }
  }

  // Filter and Sort Pipeline
  const filteredApplications = useMemo(() => {
    let result = [...applications];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (a) =>
          a.full_name.toLowerCase().includes(q) ||
          a.reference_number.toLowerCase().includes(q) ||
          a.phone.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q) ||
          (a.id_number && a.id_number.toLowerCase().includes(q)) ||
          a.position.toLowerCase().includes(q) ||
          a.preferred_branch.toLowerCase().includes(q)
      );
    }

    // Payment Status filter
    if (statusFilter !== "all") {
      result = result.filter((a) => {
        if (statusFilter === "paid") return a.payment_status === "paid";
        return a.payment_status !== "paid";
      });
    }

    // Supermarket filter
    if (marketFilter !== "all") {
      result = result.filter((a) => a.supermarket.toLowerCase() === marketFilter.toLowerCase());
    }

    // Sort order
    result.sort((a, b) => {
      if (sortBy === "date-desc") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === "date-asc") {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (sortBy === "salary-desc") {
        return (b.monthly_salary || 0) - (a.monthly_salary || 0);
      }
      if (sortBy === "name-asc") {
        return a.full_name.localeCompare(b.full_name);
      }
      return 0;
    });

    return result;
  }, [applications, searchQuery, statusFilter, marketFilter, sortBy]);

  // Analytics Metrics
  const totalCount = applications.length;
  const paidList = applications.filter((a) => a.payment_status === "paid");
  const unpaidList = applications.filter((a) => a.payment_status !== "paid");
  const paidCount = paidList.length;
  const unpaidCount = unpaidList.length;
  const totalRevenue = paidCount * APPLICATION_FEE;
  const conversionRate = totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 border-b border-zinc-800/80 bg-zinc-950/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/30">
                <Building2 className="size-5" />
              </span>
              <span className="font-display text-lg font-bold tracking-tight text-white">
                KaziLink <span className="text-emerald-400">Executive HR</span>
              </span>
            </Link>
            <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-xs font-semibold text-emerald-400">
              Live Production Database
            </Badge>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="gap-2 border-zinc-800 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 hover:text-white"
            >
              <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin text-emerald-400" : ""}`} />
              Refresh
            </Button>
            <Button size="sm" asChild className="bg-emerald-600 font-semibold text-white hover:bg-emerald-500">
              <Link to="/apply">Open Job Portal</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8">
        {/* Page Title & Intro */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Applicant Registry & Verifications
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Real-time candidate records across Quickmart, Carrefour, and Naivas. ID front/back documents and CVs stored permanently.
            </p>
          </div>
        </div>

        {/* Executive KPI Stats Cards */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Submissions */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-lg backdrop-blur">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Submissions</span>
              <Users className="size-4 text-zinc-400" />
            </div>
            <p className="mt-3 font-display text-3xl font-black text-white">{totalCount}</p>
            <p className="mt-1 text-xs text-zinc-500">Registered candidates on record</p>
          </div>

          {/* Paid & Verified */}
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-5 shadow-lg shadow-emerald-950/10 backdrop-blur">
            <div className="flex items-center justify-between text-emerald-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Paid & Authenticated</span>
              <CheckCircle2 className="size-4 text-emerald-400" />
            </div>
            <p className="mt-3 font-display text-3xl font-black text-emerald-400">{paidCount}</p>
            <p className="mt-1 text-xs text-emerald-300/70">Letters issued & orientation slots reserved</p>
          </div>

          {/* Pending / Incomplete */}
          <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-5 shadow-lg shadow-amber-950/10 backdrop-blur">
            <div className="flex items-center justify-between text-amber-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Pending Fee ({formatKsh(650)})</span>
              <Clock3 className="size-4 text-amber-400" />
            </div>
            <p className="mt-3 font-display text-3xl font-black text-amber-400">{unpaidCount}</p>
            <p className="mt-1 text-xs text-amber-300/70">Submitted profile & ID but haven't paid</p>
          </div>

          {/* Total Revenue */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-lg backdrop-blur">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Processing Fees Collected</span>
              <Wallet className="size-4 text-emerald-400" />
            </div>
            <p className="mt-3 font-display text-3xl font-black text-white">{formatKsh(totalRevenue)}</p>
            <p className="mt-1 text-xs text-zinc-500">{conversionRate}% payment completion rate</p>
          </div>
        </div>

        {/* Filter, Search & Controls Bar */}
        <div className="mt-8 space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3.5 size-4 text-zinc-500" />
              <Input
                placeholder="Search candidates by name, reference (e.g. CRF-2026), phone, ID number, position..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 border-zinc-800 bg-zinc-950 pl-10 text-sm text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-emerald-500"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Payment Filter */}
              <div className="flex rounded-xl bg-zinc-950 p-1 border border-zinc-800">
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    statusFilter === "all" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  All ({totalCount})
                </button>
                <button
                  onClick={() => setStatusFilter("paid")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    statusFilter === "paid" ? "bg-emerald-600 text-white shadow-sm" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Paid ({paidCount})
                </button>
                <button
                  onClick={() => setStatusFilter("pending")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    statusFilter === "pending" ? "bg-amber-600 text-white shadow-sm" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Pending ({unpaidCount})
                </button>
              </div>

              {/* Supermarket Filter */}
              <select
                value={marketFilter}
                onChange={(e) => setMarketFilter(e.target.value)}
                className="h-10 rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-xs font-semibold text-zinc-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">All Supermarkets</option>
                <option value="quickmart">Quickmart</option>
                <option value="carrefour">Carrefour</option>
                <option value="naivas">Naivas</option>
              </select>

              {/* Sort By Filter */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="h-10 rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-xs font-semibold text-zinc-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="date-desc">Date: Newest First</option>
                <option value="date-asc">Date: Oldest First</option>
                <option value="salary-desc">Salary: High to Low</option>
                <option value="name-asc">Candidate Name (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Applicant Records List */}
        <div className="mt-6 space-y-3">
          {filteredApplications.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-zinc-800 bg-zinc-900/30 p-12 text-center">
              <Users className="mx-auto size-10 text-zinc-600" />
              <h3 className="mt-4 font-display text-lg font-bold text-zinc-300">No applicants match criteria</h3>
              <p className="mt-1 text-sm text-zinc-500">
                Try clearing your search query or switching your filters.
              </p>
            </div>
          ) : (
            filteredApplications.map((app) => {
              const marketId: MarketId = isMarketId(app.supermarket) ? app.supermarket : "carrefour";
              const market = MARKETS[marketId] ?? MARKETS.carrefour;
              const isPaid = app.payment_status === "paid";

              return (
                <div
                  key={app.id}
                  className="group relative flex flex-col justify-between gap-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-5 transition-all hover:border-zinc-700 hover:bg-zinc-900/90 lg:flex-row lg:items-center"
                >
                  {/* Left: Candidate Info & Badge */}
                  <div className="flex items-start gap-4">
                    <div
                      className="grid size-12 shrink-0 place-items-center rounded-2xl text-xl font-black text-white shadow-md"
                      style={{ backgroundColor: market.primaryColor }}
                    >
                      {market.logoLetter}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display text-lg font-bold text-white">
                          {app.full_name}
                        </h3>
                        {app.id_number && (
                          <span className="rounded-md bg-zinc-800 px-2 py-0.5 font-mono text-[11px] text-zinc-300">
                            ID: {app.id_number}
                          </span>
                        )}
                        <span
                          className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                          style={{
                            backgroundColor: `${market.primaryColor}25`,
                            color: market.primaryColor,
                          }}
                        >
                          {market.brandName}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400">
                        <span className="font-mono font-bold text-emerald-400">{app.reference_number}</span>
                        <span>Role: <strong className="text-zinc-200">{app.position}</strong> ({formatKsh(app.monthly_salary)}/mo)</span>
                        <span>Work Branch: <strong className="text-zinc-200">{app.preferred_branch}</strong></span>
                        <span>Orientation: <strong className="text-zinc-200">{app.orientation_branch}</strong></span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-xs text-zinc-500">
                        <span className="flex items-center gap-1">
                          <Phone className="size-3" /> {app.phone}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="size-3" /> {app.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3" /> {new Date(app.created_at).toLocaleString("en-KE", { dateStyle: "short", timeStyle: "short" })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Payment Status & Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800/80 pt-3 lg:border-t-0 lg:pt-0">
                    <div className="text-left lg:text-right">
                      {isPaid ? (
                        <div className="space-y-0.5">
                          <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-600/30">
                            <CheckCircle2 className="mr-1 size-3 text-emerald-400" />
                            PAID · {app.mpesa_receipt}
                          </Badge>
                          <p className="text-[10px] text-zinc-400">
                            Receipt: {app.mpesa_receipt}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-400">
                            <Clock3 className="mr-1 size-3 text-amber-400" />
                            PENDING (UNPAID)
                          </Badge>
                          <p className="text-[10px] text-zinc-500">KSh 650 fee not yet completed</p>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* View ID Cards Modal trigger */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIdModalApplicant(app)}
                        className="gap-1.5 border-zinc-700 bg-zinc-800/60 text-xs text-zinc-200 hover:bg-zinc-800 hover:text-white"
                      >
                        <Eye className="size-3.5 text-blue-400" />
                        View ID Front & Back
                      </Button>

                      {/* Download CV */}
                      {app.cv_url ? (
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                          className="gap-1.5 border-zinc-700 bg-zinc-800/60 text-xs text-zinc-200 hover:bg-zinc-800 hover:text-white"
                        >
                          <a href={app.cv_url} target="_blank" rel="noopener noreferrer">
                            <FileText className="size-3.5 text-emerald-400" />
                            CV
                          </a>
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled
                          className="border-zinc-800 bg-zinc-900 text-xs text-zinc-600"
                        >
                          No CV
                        </Button>
                      )}

                      {/* View Acceptance Letter */}
                      <Button
                        size="sm"
                        asChild
                        className="gap-1 bg-zinc-800 text-xs font-semibold text-white hover:bg-zinc-700"
                      >
                        <Link to="/letter" search={{ ref: app.reference_number }} target="_blank">
                          <ExternalLink className="size-3" />
                          Letter
                        </Link>
                      </Button>

                      {/* Status Toggle Button */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleStatus(app)}
                        title={isPaid ? "Mark as Pending" : "Mark as Paid"}
                        className={`text-xs ${
                          isPaid
                            ? "text-zinc-500 hover:text-amber-400"
                            : "text-emerald-400 hover:bg-emerald-950/40 hover:text-emerald-300"
                        }`}
                      >
                        {isPaid ? "Mark Unpaid" : "Confirm Pay"}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* ID Front & Back Lightbox Modal */}
      <Dialog open={!!idModalApplicant} onOpenChange={(open) => !open && setIdModalApplicant(null)}>
        <DialogContent className="max-w-3xl border-zinc-800 bg-zinc-950 text-white sm:rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display text-xl">
              <UserCheck className="size-5 text-emerald-400" />
              National ID Documents · {idModalApplicant?.full_name}
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              National ID / Passport Number: <strong className="text-white">{idModalApplicant?.id_number || "Not provided"}</strong> ·
              Reference: <strong className="font-mono text-emerald-400">{idModalApplicant?.reference_number}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            {/* ID Front Card */}
            <div className="space-y-2 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  National ID (Front Side)
                </span>
                {idModalApplicant?.id_front_url && (
                  <a
                    href={idModalApplicant.id_front_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white"
                  >
                    <Download className="size-3" /> Full Size
                  </a>
                )}
              </div>
              <div className="relative flex aspect-[16/10] items-center justify-center overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
                {idModalApplicant?.id_front_url ? (
                  <img
                    src={idModalApplicant.id_front_url}
                    alt="ID Front"
                    className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                ) : (
                  <div className="p-4 text-center text-xs text-zinc-500">
                    <FileText className="mx-auto mb-2 size-8 text-zinc-700" />
                    No front ID image uploaded
                  </div>
                )}
              </div>
            </div>

            {/* ID Back Card */}
            <div className="space-y-2 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  National ID (Back Side)
                </span>
                {idModalApplicant?.id_back_url && (
                  <a
                    href={idModalApplicant.id_back_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white"
                  >
                    <Download className="size-3" /> Full Size
                  </a>
                )}
              </div>
              <div className="relative flex aspect-[16/10] items-center justify-center overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
                {idModalApplicant?.id_back_url ? (
                  <img
                    src={idModalApplicant.id_back_url}
                    alt="ID Back"
                    className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                ) : (
                  <div className="p-4 text-center text-xs text-zinc-500">
                    <FileText className="mx-auto mb-2 size-8 text-zinc-700" />
                    No back ID image uploaded
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-between border-t border-zinc-800/80 pt-4 text-xs text-zinc-400">
            <span>Payment Status: <strong className={idModalApplicant?.payment_status === "paid" ? "text-emerald-400" : "text-amber-400"}>
              {idModalApplicant?.payment_status?.toUpperCase()}
            </strong></span>
            <Button size="sm" variant="outline" onClick={() => setIdModalApplicant(null)}>
              Close Viewer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
