// PayHero M-Pesa Integration Service

export interface STKResponse {
  success: boolean;
  checkoutRequestId?: string;
  reference?: string;
  message?: string;
  error?: string;
  raw?: any;
}

export interface StatusResponse {
  status: "completed" | "failed" | "pending";
  receipt?: string;
  resultDesc?: string;
  raw?: any;
}

export class MpesaService {
  static formatPhone(phone: string): string {
    let cleaned = phone.replace(/\D/g, "");
    if (cleaned.startsWith("0")) cleaned = "254" + cleaned.substring(1);
    if (cleaned.startsWith("+")) cleaned = cleaned.substring(1);
    if (!cleaned.startsWith("254")) cleaned = "254" + cleaned;
    return cleaned;
  }

  static async initiateSTKPush(
    phoneNumber: string,
    amount: number,
    reference?: string
  ): Promise<STKResponse> {
    const formattedPhone = this.formatPhone(phoneNumber);
    const roundedAmount = Math.max(1, Math.round(Number(amount)));
    const ref = reference || `JOBSPORTAL-${Date.now()}`;

    try {
      const response = await fetch("/api/payhero/initiate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: formattedPhone,
          phoneNumber: formattedPhone,
          amount: roundedAmount,
          description: "Processing fee",
          reference: ref,
          referencePrefix: "JOBSPORTAL",
        }),
      });

      const data = (await response.json().catch(() => null)) as Record<string, unknown> | null;

      if (!response.ok || !data || data.success === false) {
        console.error("PayHero payment initiation failed:", data);
        return {
          success: false,
          error:
            (typeof data?.message === "string" ? data.message : null) ??
            "Failed to initiate payment",
        };
      }

      const checkoutId =
        (typeof data.checkoutId === "string" ? data.checkoutId : null) ??
        (typeof data.checkoutRequestId === "string" ? data.checkoutRequestId : null);

      if (!checkoutId) {
        return { success: false, error: "Payment initiated but missing checkoutId" };
      }

      return {
        success: true,
        checkoutRequestId: checkoutId,
        reference: ref,
        message: (typeof data.message === "string" ? data.message : null) ?? "STK Push sent to your phone",
        raw: data,
      };
    } catch (error: unknown) {
      console.error("PayHero STK Push Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to initiate payment",
      };
    }
  }

  static async getPaymentStatus(checkoutRequestId: string): Promise<StatusResponse> {
    try {
      const response = await fetch("/api/payhero/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkoutId: checkoutRequestId }),
      });

      const data = (await response.json().catch(() => null)) as Record<string, unknown> | null;

      if (!response.ok || !data) {
        // Network/server hiccup — keep polling, don't fail the payment
        return { status: "pending" };
      }

      if (data.status === "error") {
        // Soft error from our API — keep polling
        return { status: "pending" };
      }

      // Check all the possible "paid" signals from the API layer
      const status = String(data.status ?? data.state ?? "").toLowerCase();
      const rawStatus = String(data.rawStatus ?? "").toLowerCase();
      const resultDesc = String(data.resultDesc ?? "").toLowerCase();
      const receipt =
        (typeof data.receiptNumber === "string" ? data.receiptNumber : null) ??
        (typeof data.receipt === "string" ? data.receipt : null) ??
        (typeof data.mpesa_receipt === "string" ? data.mpesa_receipt : null);

      if (
        status === "paid" ||
        status === "success" ||
        status === "completed" ||
        rawStatus === "completed" ||
        rawStatus === "success" ||
        rawStatus === "paid" ||
        resultDesc.includes("success") ||
        resultDesc.includes("processed successfully")
      ) {
        return { status: "completed", receipt: receipt ?? undefined, resultDesc, raw: data };
      }

      // Conclusive failure only
      if (
        status === "failed" ||
        status === "cancelled" ||
        status === "canceled" ||
        rawStatus === "cancelled" ||
        rawStatus === "canceled" ||
        resultDesc.includes("cancelled by user") ||
        resultDesc.includes("canceled by user") ||
        resultDesc.includes("request cancelled") ||
        resultDesc.includes("insufficient") ||
        resultDesc.includes("wrong pin") ||
        resultDesc.includes("invalid pin")
      ) {
        return { status: "failed", resultDesc, raw: data };
      }

      return { status: "pending", resultDesc, raw: data };
    } catch {
      // Any exception (network down etc.) — keep polling silently
      return { status: "pending" };
    }
  }
}

// Global polling manager (30 attempts × 4s = 2 minutes)
export async function pollPaymentStatus(
  checkoutId: string,
  onSuccess: (receipt?: string) => void,
  onFailed: (msg: string) => void,
  onProgress?: (attempt: number, maxAttempts: number) => void,
  maxAttempts = 30
): Promise<() => void> {
  let attempts = 0;
  let cancelled = false;
  let timer: any = null;

  const checkStatus = async () => {
    if (cancelled) return;
    if (attempts >= maxAttempts) {
      onFailed(
        "Payment verification timed out. If your M-PESA was deducted, please wait 1-2 minutes or click Quick Verify."
      );
      return;
    }
    attempts++;
    if (onProgress) onProgress(attempts, maxAttempts);

    try {
      const res = await MpesaService.getPaymentStatus(checkoutId);
      if (res.status === "completed") {
        onSuccess(res.receipt);
        return;
      }
      if (res.status === "failed") {
        onFailed(res.resultDesc || "Payment was cancelled or failed. Please try again.");
        return;
      }
      // still pending — keep polling every 4 seconds
      if (!cancelled) {
        timer = setTimeout(checkStatus, 4000);
      }
    } catch {
      if (!cancelled) {
        timer = setTimeout(checkStatus, 4000);
      }
    }
  };

  // Initial check after 3 seconds
  timer = setTimeout(checkStatus, 3000);

  return () => {
    cancelled = true;
    if (timer) clearTimeout(timer);
  };
}

export async function initiateSTK(
  phone: string,
  amount: number,
  reference?: string
): Promise<{ success: boolean; checkoutId?: string; message: string }> {
  const res = await MpesaService.initiateSTKPush(phone, amount, reference);
  if (res.success && res.checkoutRequestId) {
    return {
      success: true,
      checkoutId: res.checkoutRequestId,
      message: res.message || "STK Push sent to your phone. Enter your PIN.",
    };
  }
  return {
    success: false,
    message: res.error || "Payment initiation failed",
  };
}
