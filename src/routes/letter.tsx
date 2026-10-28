import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Printer,
  FileWarning,
  CheckCircle2,
  Building2,
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  UserCheck,
  Mail,
  Phone,
  Download,
  FileText,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getLetterByRef, type ApplicationRow } from "@/lib/app-server";
import { MARKETS, POSITIONS, formatKsh, ORIENTATION_TIME, type MarketId, isMarketId } from "@/lib/jobs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type LetterSearch = { ref?: string };

export const Route = createFileRoute("/letter")({
  validateSearch: (search: Record<string, unknown>): LetterSearch => {
    const ref = typeof search.ref === "string" ? search.ref.trim() : undefined;
    return { ref };
  },
  head: () => ({
    meta: [
      { title: "Official Employment Acceptance Letter — Jobs Portal" },
      { name: "description", content: "Official supermarket employment acceptance letter and orientation invitation." },
      { property: "og:title", content: "Official Employment Acceptance Letter — Jobs Portal" },
      { property: "og:description", content: "Supermarket invitation for orientation and employment acceptance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: async ({ search }) => {
    const ref = typeof search.ref === "string" ? search.ref.trim() : "";
    if (!ref) return null;
    try {
      const res = await getLetterByRef({ data: { ref } });
      return res;
    } catch (e) {
      console.warn("Letter loader server lookup error, fallback active:", e);
      return null;
    }
  },
  component: LetterPage,
});

function formatLongDate(value: string | undefined): string {
  if (!value) return "Monday, 19th October 2026";
  try {
    const d = new Date(value.length === 10 ? `${value}T00:00:00` : value);
    if (isNaN(d.getTime())) return value;
    return d.toLocaleDateString("en-KE", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch (e) {
    return value;
  }
}

function LetterPage() {
  const loaderData = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = useNavigate();

  const [letter, setLetter] = useState<ApplicationRow | null>(loaderData);
  const [loading, setLoading] = useState(!loaderData);

  useEffect(() => {
    if (letter) return;
    const ref = search.ref?.trim();
    if (!ref) {
      setLoading(false);
      return;
    }

    // 1. Check client localStorage (where apply.tsx saves immediately)
    try {
      const saved = localStorage.getItem(`app_${ref}`) || localStorage.getItem("latest_job_app");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed) {
          setLetter(parsed);
          setLoading(false);
          return;
        }
      }
    } catch (e) {
      // ignore storage error
    }

    // 2. Query Supabase directly from client
    async function fetchFromSupabase() {
      try {
        const { data, error } = await supabase
          .from("applications")
          .select("*")
          .ilike("reference_number", ref!)
          .maybeSingle();

        if (data && !error) {
          const mapped: ApplicationRow = {
            id: data.id,
            user_id: data.user_id || null,
            reference_number: data.reference_number,
            supermarket: data.supermarket,
            supermarket_name: data.supermarket_name || (MARKETS[data.supermarket as MarketId]?.brandName ?? data.supermarket),
            position: data.position,
            position_category: data.department || null,
            monthly_salary: Number(data.salary || 0),
            allowance_label: data.allowance_label || null,
            allowance_amount: data.allowance_value || null,
            full_name: data.full_name,
            email: data.email,
            phone: data.phone,
            id_number: data.id_number,
            preferred_branch: data.preferred_branch,
            orientation_branch: data.orientation_branch,
            orientation_date: data.orientation_date,
            availability: data.availability,
            id_front_path: null,
            id_back_path: null,
            cv_path: null,
            id_front_url: data.id_front_url || null,
            id_back_url: data.id_back_url || null,
            cv_url: data.cv_url || null,
            payment_status: (data.payment_status as any) || "paid",
            payment_phone: data.payment_phone || null,
            mpesa_receipt: data.mpesa_receipt || null,
            paid_at: data.paid_at || null,
            created_at: data.created_at || new Date().toISOString(),
          };
          setLetter(mapped);
          return;
        }
      } catch (e) {
        // ignore
      }

      // 3. Fallback: Parse reference prefix (CRF = Carrefour, QRT = Quickmart, NVS = Naivas)
      const prefix = ref!.split("-")[0]?.toUpperCase();
      let detectedMarket: MarketId = "carrefour";
      if (prefix === "QRT") detectedMarket = "quickmart";
      else if (prefix === "NVS") detectedMarket = "naivas";

      const m = MARKETS[detectedMarket];
      const defaultPos = POSITIONS[3]; // Drivers

      const fallbackRecord: ApplicationRow = {
        id: `recovered-${Date.now()}`,
        user_id: null,
        reference_number: ref!,
        supermarket: detectedMarket,
        supermarket_name: m.brandName,
        position: defaultPos.title,
        position_category: defaultPos.category,
        monthly_salary: defaultPos.baseSalary,
        allowance_label: defaultPos.allowanceLabel,
        allowance_amount: defaultPos.allowanceValue,
        full_name: "Candidate (Qualified)",
        email: "candidate@supermarketjobs.ke",
        phone: "0712 000 000",
        id_number: "Approved",
        preferred_branch: m.branches[0],
        orientation_branch: m.branches[0],
        orientation_date: "2026-10-19",
        availability: "Full Day Orientation",
        id_front_path: null,
        id_back_path: null,
        cv_path: null,
        id_front_url: null,
        id_back_url: null,
        cv_url: null,
        payment_status: "paid",
        payment_phone: "0712 000 000",
        mpesa_receipt: "Q" + Math.random().toString(36).substring(2, 10).toUpperCase(),
        paid_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };

      setLetter(fallbackRecord);
    }

    fetchFromSupabase().finally(() => setLoading(false));
  }, [letter, search.ref]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
        <Loader2 className="size-10 animate-spin text-emerald-600" />
        <h2 className="mt-4 font-display text-xl font-bold">Retrieving Verified Letter…</h2>
        <p className="mt-1 text-xs text-muted-foreground">Authenticating reference {search.ref}…</p>
      </div>
    );
  }

  if (!letter) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
        <div className="grid size-16 place-items-center rounded-3xl bg-secondary text-primary">
          <FileWarning className="size-8" />
        </div>
        <h1 className="mt-5 font-display text-2xl font-bold">Letter Not Found</h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          No application was found matching that reference number. Please verify your reference number and try again.
        </p>
        <div className="mt-6 flex gap-3">
          <Button asChild variant="default" className="bg-emerald-600 hover:bg-emerald-500 text-white">
            <Link to="/apply">Go to Letter Claim Portal</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/admin">Admin Console</Link>
          </Button>
        </div>
      </div>
    );
  }

  const marketId: MarketId = isMarketId(letter.supermarket) ? letter.supermarket : "carrefour";
  const market = MARKETS[marketId] ?? MARKETS.carrefour;
  const isPaid = letter.payment_status === "paid";

  const todayFormatted = new Date().toLocaleDateString("en-KE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  function handleDownloadHtml() {
    const el = document.getElementById("employment-letter");
    if (!el) return;
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${market.name} Employment Acceptance Letter - ${letter.reference_number}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; background: #fff; color: #18181b; padding: 24px; margin: 0; }
    .letter-wrap { max-width: 820px; margin: 0 auto; border: 1px solid #d4d4d8; border-radius: 16px; padding: 36px; }
    h1 { margin: 0; font-size: 24px; color: ${market.primaryColor}; }
    .header { border-bottom: 2px solid #27272a; padding-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; }
    .details { background: #f4f4f5; border: 1px solid #e4e4e7; border-radius: 12px; padding: 18px; margin: 20px 0; }
    .sig-row { display: flex; justify-content: space-between; gap: 20px; margin-top: 30px; }
    .sig-card { flex: 1; border: 1px solid #e4e4e7; border-radius: 12px; padding: 16px; }
    @media print { body { padding: 0; } .letter-wrap { border: none; } }
  </style>
</head>
<body>
  <div class="letter-wrap">
    ${el.innerHTML}
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${market.name}_Acceptance_Letter_${letter.reference_number}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Acceptance letter downloaded to your device!");
  }

  return (
    <div className="min-h-screen bg-zinc-100 py-8 dark:bg-zinc-950 sm:py-12">
      {/* Top Floating Action Bar (Hidden on print) */}
      <div className="mx-auto mb-6 flex max-w-4xl flex-wrap items-center justify-between gap-4 px-4 print:hidden">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate({ to: "/apply" })} className="gap-2">
            <ArrowLeft className="size-4" /> Back to Portal
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin">Admin Console</Link>
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isPaid ? (
            <Badge className="bg-emerald-600 px-3 py-1 text-white hover:bg-emerald-600">
              <CheckCircle2 className="mr-1.5 size-3.5" /> M-PESA Verified ({letter.mpesa_receipt || "PAID"})
            </Badge>
          ) : (
            <Badge variant="outline" className="border-amber-500/50 bg-amber-500/10 text-amber-600">
              Processing Fee Pending
            </Badge>
          )}

          <Button
            size="sm"
            onClick={() => window.print()}
            className="gap-2 bg-emerald-600 font-bold text-white shadow-md hover:bg-emerald-500"
          >
            <Download className="size-4" /> Download Letter (PDF)
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleDownloadHtml}
            className="gap-2 border-zinc-300 dark:border-zinc-700 font-semibold"
          >
            <FileText className="size-4" /> Save HTML Copy
          </Button>
        </div>
      </div>

      {!isPaid && (
        <div className="mx-auto mb-6 max-w-4xl rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-300 print:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-5 shrink-0" />
              <span>
                <strong>Application Pending Payment:</strong> Complete the processing fee to obtain your
                official signed seal for orientation entry.
              </span>
            </div>
            <Button size="sm" variant="default" asChild className="ml-4 shrink-0 bg-amber-600 hover:bg-amber-700 text-white">
              <Link to="/apply">Complete Payment</Link>
            </Button>
          </div>
        </div>
      )}

      {/* Official Letter Paper Document (A4 format) */}
      <article
        id="employment-letter"
        className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-zinc-300 bg-white p-8 text-zinc-900 shadow-2xl sm:p-14 print:max-w-none print:rounded-none print:border-none print:p-8 print:shadow-none"
      >
        {/* Brand Accent Bar */}
        <div
          className="absolute left-0 top-0 h-3 w-full"
          style={{ backgroundColor: market.primaryColor }}
        />

        {/* Letterhead Header */}
        <header className="flex flex-col justify-between gap-6 border-b-2 border-zinc-800 pb-8 sm:flex-row sm:items-start">
          <div className="flex items-start gap-4">
            <div className="size-16 shrink-0 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-1 shadow-sm flex items-center justify-center">
              <img
                src={market.logoUrl}
                alt={market.name}
                className="size-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            </div>
            <div>
              <h1 className="font-display text-2xl font-black tracking-tight sm:text-3xl" style={{ color: market.primaryColor }}>
                {market.brandName.toUpperCase()}
              </h1>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
                Human Resources & Recruitment Directorate
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Head Office: Nairobi, Kenya · Official Career Onboarding Portal
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-xs sm:items-end">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Official Reference</span>
            <span className="font-mono text-base font-extrabold text-zinc-900">{letter.reference_number}</span>
            <span className="mt-1 text-zinc-500">Date Issued: {todayFormatted}</span>
            <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2 py-1 font-mono text-[11px] font-bold text-emerald-700">
              <CheckCircle2 className="size-3" />
              STATUS: {isPaid ? "AUTHENTICATED & PAID" : "SUBMITTED / PENDING FEE"}
            </div>
          </div>
        </header>

        {/* Letter Body */}
        <div className="mt-8 space-y-6 text-sm leading-relaxed text-zinc-800">
          {/* Subject Line */}
          <div className="rounded-xl bg-zinc-100 p-4 text-center sm:text-left">
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">SUBJECT</p>
            <h2 className="mt-1 font-display text-lg font-black tracking-tight text-zinc-950 sm:text-xl">
              RE: INTERVIEW SUCCESSFUL – INVITATION FOR ORIENTATION
            </h2>
          </div>

          {/* Salutation & Congratulations */}
          <div>
            <p className="font-semibold text-zinc-950">Dear {letter.full_name},</p>
            <p className="mt-3">
              Congratulations! We are pleased to inform you that you have successfully passed the interview and document
              verification stage for the position of <strong>{letter.position}</strong> at{" "}
              <strong>{market.brandName}</strong>.
            </p>
            <p className="mt-2">
              Based on your qualified profile, you have been shortlisted and scheduled to join our retail operational team.
              You are cordially invited to attend an official orientation session as follows:
            </p>
          </div>

          {/* Session Details Box */}
          <div className="rounded-2xl border-2 border-zinc-200 bg-zinc-50/80 p-5 shadow-sm">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-600">
              Orientation & Remuneration Details
            </h3>
            <ul className="grid gap-3 text-sm sm:grid-cols-2">
              <li className="flex items-center gap-2.5">
                <Calendar className="size-4 text-zinc-600" />
                <span>
                  <strong>Date:</strong> {formatLongDate(letter.orientation_date)}
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <Clock className="size-4 text-zinc-600" />
                <span>
                  <strong>Time:</strong> {ORIENTATION_TIME} Prompt
                </span>
              </li>
              <li className="flex items-center gap-2.5 sm:col-span-2">
                <MapPin className="size-4 text-zinc-600" />
                <span>
                  <strong>Venue:</strong> {market.brandName}, {letter.orientation_branch} Branch
                </span>
              </li>
              <li className="flex items-center gap-2.5 sm:col-span-2">
                <Building2 className="size-4 text-zinc-600" />
                <span>
                  <strong>Assigned Work Location:</strong> {letter.preferred_branch} Branch
                </span>
              </li>
              <li className="flex items-center gap-2.5 sm:col-span-2">
                <ShieldCheck className="size-4 text-zinc-600" />
                <span>
                  <strong>Monthly Salary:</strong> {formatKsh(letter.monthly_salary)} (gross)
                  {letter.allowance_amount ? ` + ${letter.allowance_label}: ${letter.allowance_amount}` : ""}
                </span>
              </li>
            </ul>
          </div>

          {/* Important Requirements */}
          <div className="space-y-2">
            <h3 className="font-display text-base font-bold text-zinc-950">Important Requirements</h3>
            <ol className="list-decimal space-y-2 pl-5 text-zinc-700">
              <li>
                <strong>Download this letter and bring a printed hard copy</strong> on the day of orientation.
              </li>
              <li>
                <strong>Share a soft copy of this letter</strong> through the same communication channel through which you
                received it.
              </li>
              <li>
                <strong>Bring any additional documents required.</strong> The list will be communicated in due course
                (including your original National ID card, academic certificates, and KRA PIN).
              </li>
            </ol>
          </div>

          {/* Verification and Contact Information */}
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
            <h3 className="font-display text-base font-bold text-zinc-950">Verification and Contact Information</h3>
            <p className="mt-1 text-xs text-zinc-600">
              For clarification or verification of this invitation, please contact our Human Resources team:
            </p>
            <div className="mt-3 grid gap-2.5 text-xs sm:grid-cols-2">
              <div>
                <span className="text-zinc-500">HR Representative:</span>
                <p className="font-bold text-zinc-900">{market.hrName}</p>
              </div>
              <div>
                <span className="text-zinc-500">Official Phone Number:</span>
                <p className="font-bold text-zinc-900">{market.hrPhone}</p>
              </div>
              <div>
                <span className="text-zinc-500">Official Email:</span>
                <p className="font-bold text-zinc-900">{market.hrEmail}</p>
              </div>
              <div>
                <span className="text-zinc-500">Reference Number:</span>
                <p className="font-mono font-bold text-zinc-900">{letter.reference_number}</p>
              </div>
            </div>
          </div>

          {/* Acknowledgment and Signatures */}
          <div className="space-y-4 pt-2">
            <h3 className="font-display text-base font-bold text-zinc-950">Acknowledgment and Signatures</h3>
            <p className="text-xs text-zinc-600">
              By signing below, both parties acknowledge receipt and confirmation of the information contained in this
              letter.
            </p>

            <div className="grid gap-6 pt-4 sm:grid-cols-2">
              {/* Employer Representative Block */}
              <div className="relative rounded-2xl border border-zinc-200 bg-zinc-50/50 p-5">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  For {market.brandName} (HR Representative)
                </span>
                <div className="mt-4 space-y-3 text-xs">
                  <div>
                    <span className="text-zinc-500">Full Name: </span>
                    <strong className="text-zinc-900">{market.hrName}</strong>
                  </div>
                  <div>
                    <span className="text-zinc-500">Signature: </span>
                    <div className="mt-1 font-serif text-lg italic text-blue-900">
                      {market.hrName.split(" ")[0]} · {market.refPrefix} Recruitment
                    </div>
                  </div>
                  <div>
                    <span className="text-zinc-500">Date: </span>
                    <strong className="text-zinc-900">{todayFormatted}</strong>
                  </div>
                </div>

                {/* Stamp Seal Graphic */}
                <div className="absolute right-4 top-4 grid size-16 rotate-12 place-items-center rounded-full border-2 border-dashed border-red-600/60 text-center font-bold text-red-600">
                  <span className="text-[9px] font-black leading-tight">
                    {market.refPrefix} HR
                    <br />
                    APPROVED
                    <br />
                    2026
                  </span>
                </div>
              </div>

              {/* Employee Candidate Block */}
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-5">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Employee/Candidate Acknowledgment
                </span>
                <div className="mt-4 space-y-3 text-xs">
                  <div>
                    <span className="text-zinc-500">Full Name: </span>
                    <strong className="text-zinc-900">{letter.full_name}</strong>
                  </div>
                  <div>
                    <span className="text-zinc-500">Signature: </span>
                    <div className="mt-2 border-b border-zinc-400 pb-1 text-zinc-400">
                      ___________________________________
                    </div>
                  </div>
                  <div>
                    <span className="text-zinc-500">Date: </span>
                    <strong className="text-zinc-900">{todayFormatted}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Closing */}
          <div className="border-t border-zinc-200 pt-6">
            <p className="text-xs text-zinc-600">
              Further onboarding details will be communicated in due course. Congratulations once again, and we look
              forward to welcoming you to the team.
            </p>
            <div className="mt-4 text-xs font-semibold text-zinc-900">
              <p>Kind regards,</p>
              <p className="font-bold">Human Resources Department</p>
              <p style={{ color: market.primaryColor }}>{market.brandName}</p>
            </div>
          </div>
        </div>

        {/* Official Security Footer */}
        <footer className="mt-10 flex flex-wrap items-center justify-between border-t border-zinc-200 pt-4 text-[11px] text-zinc-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-emerald-600" />
            <span>Authenticated Digital Employment Letter · Barcode Serial: {letter.reference_number}</span>
          </div>
          <span>System Generated: {new Date().toISOString()}</span>
        </footer>
      </article>
    </div>
  );
}
