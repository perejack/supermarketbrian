import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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
  QrCode,
  Download,
} from "lucide-react";
import { getLetterByRef, type ApplicationRow } from "@/lib/app-server";
import { MARKETS, formatKsh, ORIENTATION_TIME, type MarketId, isMarketId } from "@/lib/jobs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type LetterSearch = { ref?: string };

export const Route = createFileRoute("/letter")({
  validateSearch: (search: Record<string, unknown>): LetterSearch => {
    const ref = typeof search.ref === "string" ? search.ref : undefined;
    return { ref };
  },
  head: () => ({
    meta: [
      { title: "Employment Acceptance Letter — KaziLink" },
      { name: "description", content: "Official supermarket employment acceptance letter and orientation invitation." },
      { property: "og:title", content: "Official Employment Acceptance Letter" },
      { property: "og:description", content: "Supermarket invitation for orientation and employment acceptance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ search }) => getLetterByRef({ data: { ref: search.ref ?? "" } }),
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
  const letter = Route.useLoaderData();
  const navigate = useNavigate();

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
          <Button asChild variant="default">
            <Link to="/apply">Submit New Application</Link>
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

        <div className="flex items-center gap-3">
          {isPaid ? (
            <Badge className="bg-emerald-600 px-3 py-1 text-white hover:bg-emerald-600">
              <CheckCircle2 className="mr-1.5 size-3.5" /> M-PESA Verified ({letter.mpesa_receipt})
            </Badge>
          ) : (
            <Badge variant="outline" className="border-amber-500/50 bg-amber-500/10 text-amber-600">
              Processing Fee Pending
            </Badge>
          )}

          <Button
            size="sm"
            onClick={() => window.print()}
            className="gap-2 bg-zinc-900 font-semibold text-white shadow-md hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
          >
            <Printer className="size-4" /> Print / Save PDF
          </Button>
        </div>
      </div>

      {!isPaid && (
        <div className="mx-auto mb-6 max-w-4xl rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-300 print:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-5 shrink-0" />
              <span>
                <strong>Application Pending Payment:</strong> Complete the {formatKsh(650)} processing fee to obtain your
                official signed seal for orientation entry.
              </span>
            </div>
            <Button size="sm" variant="default" asChild className="ml-4 shrink-0 bg-amber-600 hover:bg-amber-700">
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
            <div
              className="grid size-16 shrink-0 place-items-center rounded-2xl text-3xl font-black text-white shadow-md"
              style={{ backgroundColor: market.primaryColor }}
            >
              {market.logoLetter}
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
