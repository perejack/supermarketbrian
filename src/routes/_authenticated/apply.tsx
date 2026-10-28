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
} from "lucide-react";
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
          supermarket: market,
          positionId: selectedPosition.id,
          preferredBranch,
          orientationBranch,
          orientationDate,
          availability,
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
    setStep(5);
  }

  const stepTitles = ["Role & Market", "Candidate Details", "Upload ID & CV", "M-PESA Fee", "Acceptance Letter"];

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl py-2">
        {/* Progress Step Bar */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold">
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
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-secondary">
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
                    className={`relative flex flex-col justify-between rounded-3xl border-2 p-5 text-left transition-all ${
                      active
                        ? "border-emerald-600 bg-emerald-500/5 shadow-lg shadow-emerald-600/10 ring-2 ring-emerald-600/20"
                        : "border-border bg-card hover:border-border/80 hover:bg-secondary/30"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="size-14 overflow-hidden rounded-2xl border border-border/80 bg-white p-1 shadow-sm flex items-center justify-center">
                          <img
                            src={m.logoUrl}
                            alt={m.name}
                            className="size-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        </div>
                        {active && (
                          <span className="grid size-6 place-items-center rounded-full bg-emerald-600 text-white">
                            <Check className="size-4" />
                          </span>
                        )}
                      </div>
                      <h3 className="mt-4 font-display text-xl font-bold">{m.brandName}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">{m.tagline}</p>
                    </div>

                    <div className="mt-4 border-t border-border/60 pt-3 text-[11px] text-muted-foreground">
                      <span>{m.branches.length} Branches · HR: {m.hrName}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Position Selection Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-xl font-bold">Select Position</h2>
                  <p className="text-xs text-muted-foreground">
                    What role are you looking for at <strong>{marketDetails.name}</strong>?
                  </p>
                </div>
                <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                  {POSITIONS.length} Available Roles
                </Badge>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {POSITIONS.map((p) => {
                  const active = positionId === p.id;
                  const salary = salaryFor(p, market);
                  const allowance = allowanceFor(p, market);

                  return (
                    <div
                      key={p.id}
                      onClick={() => setPositionId(p.id)}
                      className={`cursor-pointer rounded-2xl border-2 p-4 transition-all ${
                        active
                          ? "border-emerald-600 bg-emerald-500/5 shadow-md"
                          : "border-border bg-card hover:border-emerald-500/40 hover:bg-secondary/40"
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

                      <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-2 text-xs">
                        <span className="font-medium text-emerald-700 dark:text-emerald-400">
                          {p.allowanceLabel}: {allowance}
                        </span>
                        <Button
                          size="sm"
                          variant={active ? "default" : "outline"}
                          className={active ? "bg-emerald-600 text-white hover:bg-emerald-500" : ""}
                        >
                          {active ? "Selected" : "Apply Now"}
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

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button type="submit" size="lg" className="bg-emerald-600 font-bold text-white hover:bg-emerald-500">
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

            <div className="flex justify-between items-center pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button
                type="submit"
                size="lg"
                disabled={busy}
                className="bg-emerald-600 font-bold text-white shadow-lg hover:bg-emerald-500"
              >
                {busy ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" /> Saving Application to Supabase…
                  </>
                ) : (
                  <>
                    Save Application & Proceed to Letter Fee <ArrowRight className="ml-2 size-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        )}

        {/* STEP 4: M-PESA STK Simulation (KSh 650) */}
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

              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Button
                  size="lg"
                  asChild
                  className="bg-emerald-600 font-bold text-white shadow-lg hover:bg-emerald-500"
                >
                  <Link to="/letter" search={{ ref: application.reference_number }}>
                    <Eye className="mr-2 size-4" /> View Full Acceptance Letter
                  </Link>
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => {
                    navigate({ to: "/letter", search: { ref: application.reference_number } });
                  }}
                  className="border-emerald-600/40 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-300"
                >
                  <Printer className="mr-2 size-4" /> Print / Save PDF
                </Button>

                <Button size="lg" variant="ghost" asChild>
                  <Link to="/admin">Go to Admin HR Dashboard →</Link>
                </Button>
              </div>
            </div>

            {/* Letter Preview Snapshot */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-md sm:p-8">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <h3 className="font-display text-lg font-bold">Orientation Summary</h3>
                  <p className="text-xs text-muted-foreground">Official Letter Reference: {application.reference_number}</p>
                </div>
                <Badge className="bg-emerald-600 text-white">Payment Confirmed: {paidReceipt}</Badge>
              </div>

              <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <span className="text-xs text-muted-foreground">Position:</span>
                  <p className="font-bold text-foreground">{application.position}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Monthly Salary:</span>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400">
                    {formatKsh(application.monthly_salary)} + {application.allowance_label} ({application.allowance_amount})
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Orientation Venue:</span>
                  <p className="font-bold text-foreground">
                    {marketDetails.name}, {application.orientation_branch} Branch
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Orientation Date & Time:</span>
                  <p className="font-bold text-foreground">{application.orientation_date} at 9:00 AM</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
