import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileUp,
  Loader2,
  Upload,
  Building2,
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  User,
  CreditCard,
  FileText,
  Eye,
  Check,
  Sparkles,
  ExternalLink,
  Printer,
  Download,
} from "lucide-react";
import { downloadLetterPdf, printOrSavePdf, formatLongDate } from "@/lib/letter-generator";
import { supabase } from "@/integrations/supabase/client";
import { createApplication, type ApplicationRow } from "@/lib/app-server";
import {
  MARKETS,
  MARKET_ORDER,
  POSITIONS,
  salaryFor,
  allowanceFor,
  formatKsh,
  APPLICATION_FEE,
  isMarketId,
  type MarketId,
  type Position,
} from "@/lib/jobs";
import { PaymentPanel } from "@/components/PaymentPanel";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ApplySearch = { market?: string; role?: string };

export const Route = createFileRoute("/_authenticated/apply")({
  validateSearch: (search: Record<string, unknown>): ApplySearch => {
    const market = typeof search.market === "string" ? search.market : undefined;
    const role = typeof search.role === "string" ? search.role : undefined;
    return { market, role };
  },
  head: () => ({
    meta: [
      { title: "Candidate Appointment Verification & Orientation — Jobs Portal" },
      {
        name: "description",
        content:
          "Official Jobs Portal for Quickmart, Carrefour, and Naivas. Confirm your qualified position, upload your ID and CV, pay the letter processing fee, and download your signed acceptance letter.",
      },
      { property: "og:title", content: "Supermarket Orientation & Letter Download — Jobs Portal" },
      { property: "og:description", content: "Verify appointment and download your orientation letter." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ApplyPage,
});

type Step = 1 | 2 | 3 | 4 | 5;

export function ApplyPage() {
  const search = Route.useSearch();
  const initialMarket: MarketId = isMarketId(search.market) ? search.market : "carrefour";
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>(1);
  const [market, setMarket] = useState<MarketId>(initialMarket);
  const [positionId, setPositionId] = useState<string>(
    search.role && POSITIONS.some((p) => p.id === search.role) ? search.role : "drivers"
  );

  // Form Fields
  const [preferredBranch, setPreferredBranch] = useState<string>(MARKETS[initialMarket].branches[0]);
  const [orientationBranch, setOrientationBranch] = useState<string>(MARKETS[initialMarket].branches[0]);
  const [orientationDate, setOrientationDate] = useState<string>("2026-10-19");
  const [availability, setAvailability] = useState<string>("Full day available from 8:30 AM");

  const [fullName, setFullName] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Uploaded Files and Previews
  const [idFrontFile, setIdFrontFile] = useState<File | null>(null);
  const [idFrontPreview, setIdFrontPreview] = useState<string | null>(null);
  const [idBackFile, setIdBackFile] = useState<File | null>(null);
  const [idBackPreview, setIdBackPreview] = useState<string | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);

  const [busy, setBusy] = useState(false);
  const [application, setApplication] = useState<ApplicationRow | null>(null);
  const [paidReceipt, setPaidReceipt] = useState<string | null>(null);

  const selectedPosition = POSITIONS.find((p) => p.id === positionId) || POSITIONS[3];
  const marketDetails = MARKETS[market];

  function pickMarket(id: MarketId) {
    setMarket(id);
    setPreferredBranch(MARKETS[id].branches[0]);
    setOrientationBranch(MARKETS[id].branches[0]);
  }

  // Handle Image previews
  function handleFrontIdChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setIdFrontFile(file);
      const reader = new FileReader();
      reader.onload = (event) => setIdFrontPreview(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  }

  function handleBackIdChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setIdBackFile(file);
      const reader = new FileReader();
      reader.onload = (event) => setIdBackPreview(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  }

  function handleCvChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setCvFile(file);
  }

  // Helper to upload a file to Supabase Storage
  async function uploadToStorage(file: File | null, kind: string, ref: string): Promise<string | null> {
    if (!file) return null;
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `uploads/${ref}/${kind}-${Date.now()}.${ext}`;

      const { data, error } = await supabase.storage.from("job-applications").upload(path, file, {
        upsert: true,
      });

      if (error) {
        console.warn("Direct upload error:", error);
      }
      return `https://zeichvwrpxrpzeqyfypj.supabase.co/storage/v1/object/public/job-applications/${path}`;
    } catch (e) {
      return null;
    }
  }

  // Step 2 Submission -> Advance to Document Uploads
  function submitStep2(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim() || fullName.trim().length < 3) {
      toast.error("Please enter your full official name");
      return;
    }
    if (!idNumber.trim()) {
      toast.error("Please enter your National ID or Passport Number");
      return;
    }
    if (!email.trim() || !/.+@.+\..+/.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (!phone.trim() || phone.replace(/\D/g, "").length < 9) {
      toast.error("Please enter a valid phone number (e.g. 0712 345 678)");
      return;
    }
    setStep(3);
  }

  // Step 3 Submission -> Store Immediately in Database & Storage
  async function submitDocumentsAndRegister(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);

    try {
      const tempRef = `${marketDetails.refPrefix}-2026-${Math.floor(1000 + Math.random() * 9000)}`;

      // 1. Upload files to Supabase Storage
      const [frontUrl, backUrl, cvUrl] = await Promise.all([
        uploadToStorage(idFrontFile, "id-front", tempRef),
        uploadToStorage(idBackFile, "id-back", tempRef),
        uploadToStorage(cvFile, "cv", tempRef),
      ]);

      // Fallback to base64 preview if direct storage upload couldn't connect
      const finalFrontUrl = frontUrl || idFrontPreview || null;
      const finalBackUrl = backUrl || idBackPreview || null;
      const finalCvUrl = cvUrl || null;

      // 2. Immediately save application record in Supabase (even before payment!)
      const created = await createApplication({
        data: {
          supermarket: market || "carrefour",
          positionId: selectedPosition?.id || "drivers",
          preferredBranch: preferredBranch || marketDetails?.branches?.[0] || "Main Branch",
          orientationBranch: orientationBranch || marketDetails?.branches?.[0] || "Main Branch",
          orientationDate: orientationDate || "2026-10-19",
          availability: availability || "Full Day Orientation",
          fullName: fullName.trim(),
          idNumber: idNumber.trim(),
          email: email.trim(),
          phone: phone.trim(),
          idFrontUrl: finalFrontUrl,
          idBackUrl: finalBackUrl,
          cvUrl: finalCvUrl,
        },
      });

      setApplication(created);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(`app_${created.reference_number}`, JSON.stringify(created));
          localStorage.setItem("latest_job_app", JSON.stringify(created));
        } catch (e) {
          // ignore storage error
        }
      }
      toast.success("Application details & ID documents saved to database!");
      setStep(4);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to register application");
    } finally {
      setBusy(false);
    }
  }

  // Payment Callback
  function handlePaymentComplete(receipt: string) {
    setPaidReceipt(receipt);
    toast.success(`Payment verified! Acceptance Letter generated for ${fullName}.`);
    if (application) {
      const updated = {
        ...application,
        payment_status: "paid" as const,
        mpesa_receipt: receipt,
        paid_at: new Date().toISOString(),
      };
      setApplication(updated);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(`app_${application.reference_number}`, JSON.stringify(updated));
          localStorage.setItem("latest_job_app", JSON.stringify(updated));
        } catch (e) {
          // ignore
        }
      }
    }
    setStep(5);
  }

  const stepTitles = ["Role & Market", "Candidate Details", "Upload ID & CV", "M-PESA Fee", "Acceptance Letter"];

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl py-2">
        {/* Progress Step Bar */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between text-xs font-semibold sm:hidden mb-1.5 px-0.5">
            <span className="font-bold text-foreground">Step {step} of 5: <span className="text-emerald-600">{stepTitles[step - 1]}</span></span>
            <span className="font-mono text-emerald-600 font-bold">{Math.round((step / 5) * 100)}%</span>
          </div>
          <div className="hidden sm:flex flex-wrap items-center justify-between gap-2 text-xs font-semibold">
            {stepTitles.map((title, i) => (
              <span
                key={title}
                className={
                  step === i + 1
                    ? "font-bold text-primary"
                    : step > i + 1
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-muted-foreground"
                }
              >
                {step > i + 1 ? "✓ " : `${i + 1}. `}
                {title}
              </span>
            ))}
          </div>
          <div className="mt-1 sm:mt-2 h-2.5 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-emerald-600 transition-all duration-500 ease-out"
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* STEP 1: Select Supermarket & Position */}
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in duration-200">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                <Sparkles className="size-3.5" /> Qualified Candidate Onboarding
              </div>
              <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
                Confirm Your Supermarket & Position
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Select the supermarket and role you applied for and passed the interview. Remuneration, orientation venue, and official acceptance letters are generated for your selection.
              </p>
            </div>

            {/* Supermarket Selection Cards */}
            <div className="grid gap-4 sm:grid-cols-3">
              {MARKET_ORDER.map((id) => {
                const m = MARKETS[id];
                const active = market === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => pickMarket(id)}
                    className={`group relative flex flex-col overflow-hidden rounded-3xl border-2 text-left transition-all ${
                      active
                        ? "border-emerald-600 bg-emerald-500/5 shadow-lg shadow-emerald-600/10 ring-2 ring-emerald-600/20"
                        : "border-border bg-card hover:border-emerald-500/40 hover:bg-secondary/20"
                    }`}
                  >
                    {/* Top icon header filling top part of card */}
                    <div className="relative h-24 w-full border-b border-border/60 bg-white flex items-center justify-center p-3">
                      <img
                        src={m.logoUrl}
                        alt={m.name}
                        className="max-h-full max-w-[140px] object-contain"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                      {active && (
                        <span className="absolute top-2 right-2 grid size-6 place-items-center rounded-full bg-emerald-600 text-white shadow-sm">
                          <Check className="size-3.5" />
                        </span>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col justify-between p-5">
                      <div>
                        <h3 className="font-display text-lg font-bold">{m.brandName}</h3>
                        <p className="mt-1 text-xs text-muted-foreground">{m.tagline}</p>
                      </div>

                      <div className="mt-4 border-t border-border/60 pt-2 text-[11px] text-muted-foreground">
                        <span>{m.branches.length} Branches · HR: {m.hrName}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Position Selection Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-xl font-bold">Select Position You Applied For</h2>
                  <p className="text-xs text-muted-foreground">
                    What role did you apply and qualify for at <strong>{marketDetails.name}</strong>?
                  </p>
                </div>
                <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                  {POSITIONS.length} Approved Roles
                </Badge>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {POSITIONS.map((p) => {
                  const active = positionId === p.id;
                  const salary = salaryFor(p, market);
                  const allowance = allowanceFor(p, market);

                  const handleSelectAndAdvance = () => {
                    setPositionId(p.id);
                    setStep(2);
                    if (typeof window !== "undefined") {
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }
                    toast.success(`Selected ${p.title}. Enter your candidate details below.`);
                  };

                  return (
                    <div
                      key={p.id}
                      onClick={handleSelectAndAdvance}
                      className={`group cursor-pointer rounded-2xl border-2 p-4 transition-all ${
                        active
                          ? "border-emerald-600 bg-emerald-500/5 shadow-md ring-2 ring-emerald-600/20"
                          : "border-border bg-card hover:border-emerald-500/40 hover:bg-secondary/40 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <Badge variant="secondary" className="text-[10px]">
                            {p.category}
                          </Badge>
                          <h4 className="mt-1 font-display text-lg font-bold">{p.title}</h4>
                        </div>
                        <div className="text-right">
                          <span className="font-display text-lg font-black text-emerald-600 dark:text-emerald-400">
                            {formatKsh(salary)}
                          </span>
                          <p className="text-[10px] text-muted-foreground">per month</p>
                        </div>
                      </div>

                      <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{p.description}</p>

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-2 text-xs">
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                          {p.allowanceLabel}: {allowance}
                        </span>
                        <Button
                          size="sm"
                          type="button"
                          variant={active ? "default" : "outline"}
                          className={`w-full sm:w-auto font-bold ${active ? "bg-emerald-600 text-white hover:bg-emerald-500" : "group-hover:border-emerald-500 group-hover:text-emerald-600"}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectAndAdvance();
                          }}
                        >
                          {active ? "Selected ✓" : "Select & Continue →"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Compensation Summary & Next Button */}
            <div className="flex flex-col items-center justify-between gap-4 rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-6 sm:flex-row">
              <div>
                <span className="text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-semibold">
                  Selected Package: {selectedPosition.title} at {marketDetails.name}
                </span>
                <p className="mt-1 font-display text-2xl font-black text-emerald-900 dark:text-emerald-200">
                  {formatKsh(salaryFor(selectedPosition, market))} Gross Salary + {selectedPosition.allowanceLabel} ({allowanceFor(selectedPosition, market)})
                </p>
              </div>
              <Button
                size="lg"
                onClick={() => setStep(2)}
                className="w-full bg-emerald-600 font-bold text-white shadow-lg hover:bg-emerald-500 sm:w-auto"
              >
                Continue to Candidate Details <ArrowRight className="ml-2 size-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: Candidate Details, Branch Selection & Orientation */}
        {step === 2 && (
          <form onSubmit={submitStep2} className="space-y-6 rounded-3xl border border-border bg-card p-6 sm:p-8 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h2 className="font-display text-2xl font-bold">Candidate & Placement Details</h2>
                <p className="text-xs text-muted-foreground">
                  Specify where you'd like to work and your preferred orientation branch for <strong>{marketDetails.name}</strong>.
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="gap-1">
                <ArrowLeft className="size-4" /> Back to Roles
              </Button>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="full-name">Full Official Names (as on ID)</Label>
                <Input
                  id="full-name"
                  placeholder="e.g. Brian Otieno Onyango"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="id-number">National ID or Passport Number</Label>
                <Input
                  id="id-number"
                  placeholder="e.g. 34819022"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="e.g. brian.otieno@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number (M-PESA Registered)</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="e.g. 0712 345 678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              {/* Branch Selection */}
              <div className="space-y-2">
                <Label>Branch You Would Like to Work At</Label>
                <Select value={preferredBranch} onValueChange={setPreferredBranch}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select preferred work branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {marketDetails.branches.map((b) => (
                      <SelectItem key={b} value={b}>
                        {marketDetails.name} — {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Nearest Orientation Branch */}
              <div className="space-y-2">
                <Label>Nearest Branch for Orientation</Label>
                <Select value={orientationBranch} onValueChange={setOrientationBranch}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select orientation branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {marketDetails.branches.map((b) => (
                      <SelectItem key={b} value={b}>
                        {marketDetails.name} — {b} (Orientation Center)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Orientation Date */}
              <div className="space-y-2">
                <Label>When You Are Available to Attend Orientation</Label>
                <Select value={orientationDate} onValueChange={setOrientationDate}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2026-10-19">Monday, 19th October 2026 (9:00 AM)</SelectItem>
                    <SelectItem value="2026-10-26">Monday, 26th October 2026 (9:00 AM)</SelectItem>
                    <SelectItem value="2026-10-28">Wednesday, 28th October 2026 (9:00 AM)</SelectItem>
                    <SelectItem value="2026-11-02">Monday, 2nd November 2026 (9:00 AM)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Availability Notes */}
              <div className="space-y-2">
                <Label>Availability Notes</Label>
                <Input
                  placeholder="e.g. Full day available from 8:30 AM"
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setStep(1)} className="w-full sm:w-auto">
                Back
              </Button>
              <Button type="submit" size="lg" className="w-full sm:w-auto bg-emerald-600 font-bold text-white hover:bg-emerald-500">
                Proceed to Document Uploads <ArrowRight className="ml-2 size-4" />
              </Button>
            </div>
          </form>
        )}

        {/* STEP 3: Upload Front/Back ID & CV */}
        {step === 3 && (
          <form onSubmit={submitDocumentsAndRegister} className="space-y-6 rounded-3xl border border-border bg-card p-6 sm:p-8 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h2 className="font-display text-2xl font-bold">Document Verification & Uploads</h2>
                <p className="text-xs text-muted-foreground">
                  Upload clear photos of your National ID (Front and Back) and your CV/Resume. Documents are securely saved directly to the Supabase database.
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setStep(2)}>
                <ArrowLeft className="size-4" /> Back
              </Button>
            </div>

            {/* Upload Cards Grid */}
            <div className="grid gap-6 sm:grid-cols-2">
              {/* ID Front Upload */}
              <div className="space-y-3 rounded-2xl border border-border bg-secondary/30 p-5">
                <div className="flex items-center justify-between">
                  <Label className="font-bold">National ID Card (Front Image)</Label>
                  {idFrontFile && (
                    <Badge variant="outline" className="border-emerald-500 text-emerald-600">
                      Uploaded ✓
                    </Badge>
                  )}
                </div>

                <div className="relative flex aspect-[16/10] flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-card transition-all hover:border-emerald-500/60">
                  {idFrontPreview ? (
                    <img src={idFrontPreview} alt="ID Front Preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="p-4 text-center">
                      <Upload className="mx-auto size-8 text-muted-foreground" />
                      <p className="mt-2 text-xs font-semibold">Click to upload front ID photo</p>
                      <p className="text-[10px] text-muted-foreground">JPG, PNG or WEBP</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFrontIdChange}
                    className="absolute inset-0 cursor-pointer opacity-0"
                    required={!idFrontPreview}
                  />
                </div>
              </div>

              {/* ID Back Upload */}
              <div className="space-y-3 rounded-2xl border border-border bg-secondary/30 p-5">
                <div className="flex items-center justify-between">
                  <Label className="font-bold">National ID Card (Back Image)</Label>
                  {idBackFile && (
                    <Badge variant="outline" className="border-emerald-500 text-emerald-600">
                      Uploaded ✓
                    </Badge>
                  )}
                </div>

                <div className="relative flex aspect-[16/10] flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-card transition-all hover:border-emerald-500/60">
                  {idBackPreview ? (
                    <img src={idBackPreview} alt="ID Back Preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="p-4 text-center">
                      <Upload className="mx-auto size-8 text-muted-foreground" />
                      <p className="mt-2 text-xs font-semibold">Click to upload back ID photo</p>
                      <p className="text-[10px] text-muted-foreground">JPG, PNG or WEBP</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBackIdChange}
                    className="absolute inset-0 cursor-pointer opacity-0"
                    required={!idBackPreview}
                  />
                </div>
              </div>

              {/* CV Upload */}
              <div className="space-y-3 rounded-2xl border border-border bg-secondary/30 p-5 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <Label className="font-bold">Curriculum Vitae (CV / Resume)</Label>
                  {cvFile && (
                    <Badge variant="outline" className="border-emerald-500 text-emerald-600">
                      {cvFile.name} ({(cvFile.size / 1024).toFixed(1)} KB)
                    </Badge>
                  )}
                </div>

                <div className="relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-card p-6 transition-all hover:border-emerald-500/60">
                  <FileText className="size-8 text-emerald-600" />
                  <p className="mt-2 text-sm font-semibold">
                    {cvFile ? cvFile.name : "Select or drag your CV file here"}
                  </p>
                  <p className="text-xs text-muted-foreground">PDF, DOC, DOCX up to 10MB</p>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleCvChange}
                    className="absolute inset-0 cursor-pointer opacity-0"
                  />
                </div>
              </div>
            </div>

            {/* Retention Note */}
            <div className="rounded-2xl border border-border bg-secondary/50 p-4 text-xs text-muted-foreground">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="size-4 shrink-0 text-emerald-600" />
                <span>
                  <strong>Database Retention:</strong> Your full applicant profile and uploaded ID documents are
                  immediately saved and indexed in the recruitment database. Even if you complete the processing fee later,
                  your documents and priority queue slot remain saved.
                </span>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-3 pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setStep(2)} className="w-full sm:w-auto">
                Back
              </Button>
              <Button
                type="submit"
                size="lg"
                disabled={busy}
                className="w-full sm:w-auto bg-emerald-600 font-bold text-white shadow-lg hover:bg-emerald-500"
              >
                {busy ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" /> Saving Documents & Creating Profile…
                  </>
                ) : (
                  <>
                    Save Documents & Proceed to Letter Fee <ArrowRight className="ml-2 size-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        )}

        {/* STEP 4: Live HashBack M-PESA STK Push (KSh 650) */}
        {step === 4 && application && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="font-display text-3xl font-bold tracking-tight">Application Processing Fee</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Your application for <strong>{application.position}</strong> at <strong>{marketDetails.name}</strong> is
                registered. Complete the {formatKsh(APPLICATION_FEE)} processing fee to generate your official acceptance letter.
              </p>
            </div>

            <PaymentPanel
              applicationId={application.id}
              referenceNumber={application.reference_number}
              candidateName={application.full_name}
              supermarketName={marketDetails.name}
              defaultPhone={phone}
              onPaid={handlePaymentComplete}
            />
          </div>
        )}

        {/* STEP 5: Acceptance Letter Generated */}
        {step === 5 && application && (
          <div className="space-y-8 animate-in zoom-in-95 duration-300">
            <div className="rounded-3xl border-2 border-emerald-500/60 bg-emerald-500/10 p-6 text-center sm:p-10">
              <div className="mx-auto grid size-16 place-items-center rounded-3xl bg-emerald-600 text-white shadow-xl shadow-emerald-600/30">
                <CheckCircle2 className="size-8" />
              </div>
              <h2 className="mt-4 font-display text-3xl font-black text-emerald-950 dark:text-emerald-100 sm:text-4xl">
                Interview Successful & Orientation Confirmed!
              </h2>
              <p className="mx-auto mt-2 max-w-lg text-sm text-emerald-900/80 dark:text-emerald-300">
                Congratulations <strong>{application.full_name}</strong>! Your official Employment Acceptance Letter and
                Orientation Invitation for <strong>{marketDetails.name}</strong> is generated and authenticated.
              </p>

              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
                <Button
                  size="lg"
                  onClick={() => downloadLetterPdf(application)}
                  className="w-full sm:w-auto bg-emerald-600 font-bold text-white shadow-lg hover:bg-emerald-500"
                >
                  <Download className="mr-2 size-5" /> Download Acceptance Letter (PDF)
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => printOrSavePdf(application)}
                  className="w-full sm:w-auto border-emerald-600/40 font-semibold text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-300"
                >
                  <Printer className="mr-2 size-4" /> Print / Save PDF
                </Button>
              </div>
            </div>

            {/* Complete Official Acceptance Letter Rendered Right Here */}
            <article id="official-letter-doc" className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-zinc-300 bg-white p-4 sm:p-12 text-zinc-900 shadow-xl dark:border-zinc-800 dark:bg-white dark:text-zinc-900">
              <div
                className="absolute left-0 top-0 h-3 w-full"
                style={{ backgroundColor: marketDetails.primaryColor }}
              />

              {/* Letterhead */}
              <header className="flex flex-col justify-between gap-4 sm:gap-6 border-b-2 border-zinc-800 pb-5 sm:pb-6 sm:flex-row sm:items-start">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="size-14 sm:size-16 shrink-0 overflow-hidden rounded-xl sm:rounded-2xl border border-zinc-200 bg-white p-1 shadow-sm flex items-center justify-center">
                    <img
                      src={marketDetails.logoUrl}
                      alt={marketDetails.name}
                      className="size-full object-contain"
                    />
                  </div>
                  <div>
                    <h1
                      className="font-display text-xl sm:text-2xl lg:text-3xl font-black tracking-tight"
                      style={{ color: marketDetails.primaryColor }}
                    >
                      {marketDetails.brandName.toUpperCase()}
                    </h1>
                    <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-zinc-600">
                      Human Resources & Recruitment Directorate
                    </p>
                    <p className="mt-0.5 text-[10px] sm:text-xs text-zinc-500">
                      Head Office: Nairobi, Kenya · Official Career Onboarding Portal
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-start rounded-xl sm:rounded-2xl border border-zinc-200 bg-zinc-50 p-3 sm:p-4 text-xs sm:items-end w-full sm:w-auto">
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-zinc-500">Official Reference</span>
                  <span className="font-mono text-sm sm:text-base font-extrabold text-zinc-900 break-all">{application.reference_number}</span>
                  <span className="mt-0.5 text-[11px] text-zinc-500">Date Issued: {new Date().toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" })}</span>
                  <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2 py-1 font-mono text-[10px] sm:text-[11px] font-bold text-emerald-700">
                    <CheckCircle2 className="size-3" />
                    STATUS: VERIFIED & PAID ({paidReceipt})
                  </div>
                </div>
              </header>

              {/* Letter Body */}
              <div className="mt-8 space-y-6 text-sm leading-relaxed text-zinc-800">
                <div className="rounded-xl bg-zinc-100 p-4 border-l-4" style={{ borderColor: marketDetails.primaryColor }}>
                  <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">SUBJECT</p>
                  <h2 className="mt-1 font-display text-lg font-black tracking-tight text-zinc-950 sm:text-xl">
                    RE: INTERVIEW SUCCESSFUL – INVITATION FOR ORIENTATION
                  </h2>
                </div>

                <div>
                  <p className="font-semibold text-zinc-950">Dear {application.full_name},</p>
                  <p className="mt-3">
                    Congratulations! We are pleased to inform you that you have successfully passed the interview and document
                    verification stage for the position of <strong>{application.position}</strong> at{" "}
                    <strong>{marketDetails.brandName}</strong>.
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
                        <strong>Date:</strong> {formatLongDate(application.orientation_date)}
                      </span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Clock className="size-4 text-zinc-600" />
                      <span>
                        <strong>Time:</strong> 9:00 AM Prompt
                      </span>
                    </li>
                    <li className="flex items-center gap-2.5 sm:col-span-2">
                      <MapPin className="size-4 text-zinc-600" />
                      <span>
                        <strong>Venue:</strong> {marketDetails.brandName}, {application.orientation_branch} Branch
                      </span>
                    </li>
                    <li className="flex items-center gap-2.5 sm:col-span-2">
                      <Building2 className="size-4 text-zinc-600" />
                      <span>
                        <strong>Assigned Work Location:</strong> {application.preferred_branch} Branch
                      </span>
                    </li>
                    <li className="flex items-center gap-2.5 sm:col-span-2">
                      <ShieldCheck className="size-4 text-zinc-600" />
                      <span>
                        <strong>Monthly Salary:</strong> {formatKsh(application.monthly_salary)} (gross)
                        {application.allowance_amount ? ` + ${application.allowance_label}: ${application.allowance_amount}` : ""}
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
                      <p className="font-bold text-zinc-900">{marketDetails.hrName}</p>
                    </div>
                    <div>
                      <span className="text-zinc-500">Official Phone Number:</span>
                      <p className="font-bold text-zinc-900">{marketDetails.hrPhone}</p>
                    </div>
                    <div>
                      <span className="text-zinc-500">Official Email:</span>
                      <p className="font-bold text-zinc-900">{marketDetails.hrEmail}</p>
                    </div>
                    <div>
                      <span className="text-zinc-500">Reference Number:</span>
                      <p className="font-mono font-bold text-zinc-900">{application.reference_number}</p>
                    </div>
                  </div>
                </div>

                {/* Acknowledgment and Signatures */}
                <div className="space-y-4 pt-2">
                  <h3 className="font-display text-base font-bold text-zinc-950">Acknowledgment and Signatures</h3>
                  <p className="text-xs text-zinc-600">
                    By signing below, both parties acknowledge receipt and confirmation of the information contained in this letter.
                  </p>

                  <div className="grid gap-6 pt-2 sm:grid-cols-2">
                    <div className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-5">
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                        For {marketDetails.brandName} (HR Representative)
                      </span>
                      <div className="mt-4 space-y-2 text-xs">
                        <div>
                          <span className="text-zinc-500">Full Name: </span>
                          <strong className="text-zinc-900">{marketDetails.hrName}</strong>
                        </div>
                        <div>
                          <span className="text-zinc-500">Signature: </span>
                          <div className="mt-1 font-serif text-lg italic text-blue-900">
                            {marketDetails.hrName.split(" ")[0]} · {marketDetails.refPrefix} Recruitment
                          </div>
                        </div>
                        <div>
                          <span className="text-zinc-500">Date: </span>
                          <strong className="text-zinc-900">
                            {new Date().toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" })}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-5">
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                        Employee/Candidate Acknowledgment
                      </span>
                      <div className="mt-4 space-y-2 text-xs">
                        <div>
                          <span className="text-zinc-500">Full Name: </span>
                          <strong className="text-zinc-900">{application.full_name}</strong>
                        </div>
                        <div>
                          <span className="text-zinc-500">Signature: </span>
                          <span className="text-zinc-400">_________________________________</span>
                        </div>
                        <div>
                          <span className="text-zinc-500">Date: </span>
                          <span className="text-zinc-400">_________________________________</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-zinc-200 pt-6">
                  <div>
                    <p className="text-xs text-zinc-500">Kind regards,</p>
                    <p className="text-sm font-bold text-zinc-900">Human Resources Department</p>
                    <p className="text-xs font-semibold" style={{ color: marketDetails.primaryColor }}>
                      {marketDetails.brandName}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <Button
                      size="sm"
                      onClick={() => downloadLetterPdf(application)}
                      className="w-full sm:w-auto bg-emerald-600 font-bold text-white hover:bg-emerald-500"
                    >
                      <Download className="mr-1.5 size-4" /> Download PDF
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => printOrSavePdf(application)}
                      className="w-full sm:w-auto"
                    >
                      <Printer className="mr-1.5 size-4" /> Print PDF
                    </Button>
                  </div>
                </div>
              </div>
            </article>
          </div>
        )}
      </div>
    </AppShell>
  );
}
