import { MARKETS, formatKsh, isMarketId, ORIENTATION_TIME, type MarketId } from "./jobs";
import type { ApplicationRow } from "./app-server";
import { toast } from "sonner";

export function formatLongDate(value: string | undefined): string {
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
    return value || "Monday, 19th October 2026";
  }
}

export function generateLetterHtml(app: Partial<ApplicationRow>): string {
  const marketId: MarketId = isMarketId(app.supermarket) ? app.supermarket : "carrefour";
  const market = MARKETS[marketId] || MARKETS.carrefour;
  const isPaid = app.payment_status === "paid";
  const ref = app.reference_number || "REF-2026-0001";
  const candidateName = app.full_name || "Candidate (Qualified)";
  const position = app.position || "Staff Member";
  const monthlySalary = app.monthly_salary ? formatKsh(app.monthly_salary) : "KSh 35,000";
  const orientationDate = formatLongDate(app.orientation_date);
  const orientationBranch = app.orientation_branch || market.branches[0] || "Main Branch";
  const preferredBranch = app.preferred_branch || orientationBranch;
  const allowanceText = app.allowance_amount ? ` + ${app.allowance_label || "Allowance"}: ${app.allowance_amount}` : "";
  const todayFormatted = new Date().toLocaleDateString("en-KE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const mpesaReceipt = app.mpesa_receipt || (isPaid ? "MPESA-CONFIRMED" : "PENDING");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${market.brandName} - Employment Acceptance Letter (${ref})</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 24px;
      background: #f4f4f5;
      color: #18181b;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
    }
    .sheet {
      max-width: 820px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #d4d4d8;
      border-radius: 18px;
      padding: 44px 48px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08);
      position: relative;
    }
    .top-bar {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 8px;
      background: ${market.primaryColor};
      border-top-left-radius: 18px;
      border-top-right-radius: 18px;
    }
    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #18181b;
      padding-bottom: 24px;
      margin-top: 10px;
      gap: 20px;
    }
    .brand-box {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .brand-logo {
      width: 64px;
      height: 64px;
      border-radius: 14px;
      object-fit: contain;
      background: #ffffff;
      border: 1px solid #e4e4e7;
      padding: 4px;
    }
    .brand-title {
      margin: 0;
      font-size: 26px;
      font-weight: 900;
      letter-spacing: -0.5px;
      color: ${market.primaryColor};
    }
    .brand-sub {
      margin: 2px 0 0 0;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #52525b;
    }
    .brand-address {
      margin: 4px 0 0 0;
      font-size: 11px;
      color: #71717a;
    }
    .meta-box {
      text-align: right;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 12px 16px;
    }
    .meta-label {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      color: #64748b;
      letter-spacing: 0.5px;
    }
    .meta-ref {
      font-family: monospace;
      font-size: 15px;
      font-weight: 900;
      color: #0f172a;
      display: block;
    }
    .meta-date {
      font-size: 11px;
      color: #64748b;
      margin-top: 3px;
    }
    .status-pill {
      display: inline-block;
      margin-top: 6px;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 10px;
      font-weight: 800;
      background: ${isPaid ? "#ecfdf5" : "#fef3c7"};
      color: ${isPaid ? "#047857" : "#b45309"};
      border: 1px solid ${isPaid ? "#a7f3d0" : "#fde68a"};
    }
    .subject-box {
      margin: 28px 0 20px 0;
      background: #f4f4f5;
      border-radius: 10px;
      padding: 14px 18px;
      border-left: 4px solid ${market.primaryColor};
    }
    .subject-title {
      margin: 0;
      font-size: 16px;
      font-weight: 900;
      color: #09090b;
      letter-spacing: -0.2px;
    }
    .body-p {
      font-size: 14px;
      color: #27272a;
      line-height: 1.6;
      margin: 12px 0;
    }
    .details-card {
      background: #fafafa;
      border: 1.5px solid #e4e4e7;
      border-radius: 14px;
      padding: 20px;
      margin: 22px 0;
    }
    .details-title {
      margin: 0 0 12px 0;
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #52525b;
    }
    .details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .details-item {
      font-size: 13.5px;
      color: #27272a;
    }
    .details-item strong {
      color: #09090b;
    }
    .req-list {
      margin: 10px 0;
      padding-left: 20px;
      font-size: 13.5px;
      color: #3f3f46;
      line-height: 1.6;
    }
    .req-list li {
      margin-bottom: 6px;
    }
    .contact-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px 20px;
      margin: 20px 0;
    }
    .contact-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-top: 10px;
      font-size: 12.5px;
    }
    .contact-item span {
      display: block;
      font-size: 10.5px;
      color: #64748b;
      text-transform: uppercase;
      font-weight: 700;
    }
    .contact-item strong {
      color: #0f172a;
      font-size: 13px;
    }
    .sig-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-top: 28px;
    }
    .sig-box {
      border: 1px dashed #cbd5e1;
      background: #f8fafc;
      border-radius: 12px;
      padding: 16px;
    }
    .sig-heading {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      color: #475569;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
    }
    .sig-line {
      font-size: 12px;
      color: #334155;
      margin: 8px 0;
    }
    .sig-draw {
      font-family: "Brush Script MT", "Caveat", "Segoe Script", cursive;
      font-size: 20px;
      color: #1e3a8a;
      padding: 4px 0;
    }
    .footer-stamp {
      margin-top: 32px;
      padding-top: 18px;
      border-top: 1px solid #e4e4e7;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      color: #71717a;
    }
    .actions-bar {
      max-width: 820px;
      margin: 0 auto 16px auto;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }
    .btn {
      padding: 10px 18px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      border: none;
    }
    .btn-primary {
      background: #059669;
      color: #ffffff;
    }
    .btn-secondary {
      background: #ffffff;
      color: #18181b;
      border: 1px solid #d4d4d8;
    }
    @media (max-width: 640px) {
      body { padding: 12px; }
      .sheet { padding: 24px 18px; border-radius: 12px; }
      .header-row { flex-direction: column; align-items: stretch; gap: 14px; }
      .meta-box { text-align: left; }
      .details-grid { grid-template-columns: 1fr; }
      .contact-grid { grid-template-columns: 1fr; }
      .sig-row { grid-template-columns: 1fr; gap: 16px; }
      .footer-stamp { flex-direction: column; gap: 8px; text-align: center; }
    }
    @media print {
      body {
        background: #ffffff;
        padding: 0;
      }
      .actions-bar {
        display: none !important;
      }
      .sheet {
        border: none !important;
        box-shadow: none !important;
        padding: 20px !important;
        max-width: 100% !important;
      }
    }
  </style>
</head>
<body>
  <div class="actions-bar">
    <button class="btn btn-primary" onclick="window.print()">Print / Save as PDF</button>
  </div>

  <div class="sheet">
    <div class="top-bar"></div>

    <div class="header-row">
      <div class="brand-box">
        <img class="brand-logo" src="${market.logoUrl}" alt="${market.name}" />
        <div>
          <h1 class="brand-title">${market.brandName.toUpperCase()}</h1>
          <p class="brand-sub">Human Resources & Recruitment Directorate</p>
          <p class="brand-address">Head Office: Nairobi, Kenya · Official Career Onboarding</p>
        </div>
      </div>
      <div class="meta-box">
        <span class="meta-label">Reference Number</span>
        <span class="meta-ref">${ref}</span>
        <div class="meta-date">Date Issued: ${todayFormatted}</div>
        <div class="status-pill">${isPaid ? `VERIFIED & PAID (${mpesaReceipt})` : "AUTHENTICATED / PENDING ENTRY"}</div>
      </div>
    </div>

    <div class="subject-box">
      <div class="subject-title">RE: INTERVIEW SUCCESSFUL – INVITATION FOR ORIENTATION</div>
    </div>

    <p class="body-p"><strong>Dear ${candidateName},</strong></p>
    <p class="body-p">
      Congratulations! We are pleased to inform you that you have successfully passed the interview and document verification stage for the position of <strong>${position}</strong> at <strong>${market.brandName}</strong>.
    </p>
    <p class="body-p">
      You are hereby invited to attend an official orientation session as follows:
    </p>

    <div class="details-card">
      <div class="details-title">Orientation & Remuneration Particulars</div>
      <div class="details-grid">
        <div class="details-item"><strong>Date:</strong> ${orientationDate}</div>
        <div class="details-item"><strong>Time:</strong> ${ORIENTATION_TIME} Prompt</div>
        <div class="details-item" style="grid-column: span 2;"><strong>Venue:</strong> ${market.brandName}, ${orientationBranch} Branch</div>
        <div class="details-item" style="grid-column: span 2;"><strong>Assigned Work Location:</strong> ${preferredBranch} Branch</div>
        <div class="details-item" style="grid-column: span 2;"><strong>Monthly Salary:</strong> ${monthlySalary} (gross)${allowanceText}</div>
      </div>
    </div>

    <div style="margin: 20px 0;">
      <div style="font-weight: 800; font-size: 14px; margin-bottom: 8px;">Important Requirements</div>
      <ol class="req-list">
        <li><strong>Download this letter and bring a printed hard copy</strong> on the day of orientation.</li>
        <li><strong>Share a soft copy of this letter</strong> through the same communication channel through which you received it.</li>
        <li><strong>Bring any additional documents required.</strong> The list will be communicated in due course (National ID original, Academic Certificates, KRA PIN).</li>
      </ol>
    </div>

    <div class="contact-card">
      <div style="font-weight: 800; font-size: 13.5px; color: #0f172a;">Verification and Contact Information</div>
      <p style="font-size: 11.5px; color: #64748b; margin: 4px 0 0 0;">
        For clarification or verification of this invitation, please contact our Human Resources team:
      </p>
      <div class="contact-grid">
        <div class="contact-item">
          <span>HR Representative</span>
          <strong>${market.hrName}</strong>
        </div>
        <div class="contact-item">
          <span>Official Phone Number</span>
          <strong>${market.hrPhone}</strong>
        </div>
        <div class="contact-item">
          <span>Official Email</span>
          <strong>${market.hrEmail}</strong>
        </div>
        <div class="contact-item">
          <span>Reference Number</span>
          <strong>${ref}</strong>
        </div>
      </div>
    </div>

    <div style="margin: 22px 0 10px 0;">
      <div style="font-weight: 800; font-size: 14px; color: #09090b;">Acknowledgment and Signatures</div>
      <p style="font-size: 12px; color: #52525b; margin: 4px 0 0 0;">
        By signing below, both parties acknowledge receipt and confirmation of the information contained in this letter.
      </p>

      <div class="sig-row">
        <div class="sig-box">
          <div class="sig-heading">For ${market.brandName} (HR Representative)</div>
          <div class="sig-line">Full Name: <strong>${market.hrName}</strong></div>
          <div class="sig-line">Signature: <span class="sig-draw">${market.hrName.split(" ")[0]} · Authorized</span></div>
          <div class="sig-line">Date: <strong>${todayFormatted}</strong></div>
        </div>

        <div class="sig-box">
          <div class="sig-heading">Employee / Candidate Acknowledgment</div>
          <div class="sig-line">Full Name: <strong>${candidateName}</strong></div>
          <div class="sig-line">Signature: __________________________</div>
          <div class="sig-line">Date: ______________________________</div>
        </div>
      </div>
    </div>

    <p class="body-p" style="margin-top: 20px;">
      Further onboarding details will be communicated in due course. Congratulations once again, and we look forward to welcoming you to the team.
    </p>

    <div style="margin-top: 16px; font-size: 13px;">
      <p style="margin: 0; color: #52525b;">Kind regards,</p>
      <p style="margin: 2px 0 0 0; font-weight: 800; color: #09090b;">Human Resources Department</p>
      <p style="margin: 2px 0 0 0; font-weight: 700; color: ${market.primaryColor};">${market.brandName}</p>
    </div>

    <div class="footer-stamp">
      <span>Official Portal Verification · Hash Code: ${ref}</span>
      <span>Certified by Republic of Kenya Labour Relations Acts</span>
    </div>
  </div>
</body>
</html>`;
}

function loadHtml2Pdf(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject("SSR");
  if ((window as any).html2pdf) {
    return Promise.resolve((window as any).html2pdf);
  }
  return new Promise((resolve, reject) => {
    const existing = document.getElementById("html2pdf-cdn");
    if (existing) {
      existing.addEventListener("load", () => resolve((window as any).html2pdf));
      existing.addEventListener("error", reject);
      return;
    }
    const s = document.createElement("script");
    s.id = "html2pdf-cdn";
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
    s.onload = () => resolve((window as any).html2pdf);
    s.onerror = (e) => reject(e);
    document.head.appendChild(s);
  });
}

export async function downloadLetterPdf(app: Partial<ApplicationRow>): Promise<void> {
  const marketId: MarketId = isMarketId(app.supermarket) ? app.supermarket : "carrefour";
  const market = MARKETS[marketId] || MARKETS.carrefour;
  const ref = app.reference_number || "LETTER";
  const filename = `${market.name}_Acceptance_Letter_${ref}.pdf`;

  const toastId = toast.loading("Generating your official PDF letter...");

  try {
    const html2pdf = await loadHtml2Pdf();

    let targetEl = document.getElementById("employment-letter") || document.getElementById("official-letter-doc");
    let tempContainer: HTMLElement | null = null;

    if (!targetEl) {
      tempContainer = document.createElement("div");
      tempContainer.style.position = "fixed";
      tempContainer.style.left = "-9999px";
      tempContainer.style.top = "0";
      tempContainer.style.width = "800px";
      tempContainer.style.background = "#ffffff";
      tempContainer.innerHTML = generateLetterHtml(app);
      document.body.appendChild(tempContainer);
      targetEl = (tempContainer.querySelector(".sheet") as HTMLElement) || tempContainer;
    }

    const opt = {
      margin: [8, 8, 8, 8],
      filename: filename,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };

    await html2pdf().set(opt).from(targetEl).save();

    if (tempContainer) {
      document.body.removeChild(tempContainer);
    }

    toast.success("Acceptance Letter downloaded as PDF!", { id: toastId });
  } catch (err) {
    console.warn("Direct PDF generation fallback:", err);
    toast.dismiss(toastId);
    printOrSavePdf(app);
  }
}

export function downloadLetterHtml(app: Partial<ApplicationRow>): void {
  try {
    const marketId: MarketId = isMarketId(app.supermarket) ? app.supermarket : "carrefour";
    const market = MARKETS[marketId] || MARKETS.carrefour;
    const ref = app.reference_number || "LETTER";
    const content = generateLetterHtml(app);
    const blob = new Blob([content], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${market.name}_Acceptance_Letter_${ref}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Acceptance Letter downloaded successfully!");
  } catch (err) {
    console.error("Failed to download letter HTML:", err);
    toast.error("Could not trigger download. Please try print/save PDF.");
  }
}

export function printOrSavePdf(app: Partial<ApplicationRow>): void {
  try {
    const content = generateLetterHtml(app);
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      // Fallback to downloading HTML if popup is blocked
      downloadLetterHtml(app);
      return;
    }
    printWindow.document.open();
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      try {
        printWindow.print();
      } catch (e) {
        console.warn("Print trigger error:", e);
      }
    }, 400);
  } catch (err) {
    console.error("Failed to print letter:", err);
    downloadLetterHtml(app);
  }
}
