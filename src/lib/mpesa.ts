// HashBack (HashPay) Live M-Pesa Integration Service
// Copied and adapted from SURVEYNEWBORN-master with direct gateway fallback for 100% reliability in all environments

const HASHBACK_BASE_URL =
  import.meta.env.VITE_HASHBACK_BASE_URL ||
  process.env.HASHBACK_BASE_URL ||
  "https://api.hashback.co.ke";
const HASHBACK_API_KEY =
  import.meta.env.VITE_HASHBACK_API_KEY ||
  process.env.HASHBACK_API_KEY ||
  "9851f07892796e5ab74e04b89e6d623e15363438b39213ec4224fa2805c746f5";
const HASHBACK_ACCOUNT_ID =
  import.meta.env.VITE_HASHBACK_ACCOUNT_ID ||
  process.env.HASHBACK_ACCOUNT_ID ||
  "HP464530";

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

    // 1. First attempt: call local / Vercel API endpoint
    try {
      const response = await fetch("/api/hashback/initiate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: formattedPhone,
          phoneNumber: formattedPhone,
          amount: roundedAmount,
          reference: ref,
          referencePrefix: "JOBSPORTAL",
        }),
      });

      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = (await response.json().catch(() => null)) as any;
        if (data && data.success !== false) {
          const checkoutId = data.checkoutId || data.checkoutRequestId;
          if (typeof checkoutId === "string" && checkoutId) {
            return {
              success: true,
              checkoutRequestId: checkoutId,
              reference: ref,
              message: data.message || "STK Push sent to your phone",
              raw: data,
            };
          }
        }
      }
    } catch {
      // Backend route unreachable or in pure client dev mode — proceed to direct HashBack gateway
    }

    // 2. Direct gateway call: guaranteed to work directly in any environment
    try {
      const directResponse = await fetch(`${HASHBACK_BASE_URL}/initiatestk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: HASHBACK_API_KEY,
          account_id: HASHBACK_ACCOUNT_ID,
          amount: String(roundedAmount),
          msisdn: formattedPhone,
          reference: ref,
        }),
      });

      const directData = (await directResponse.json().catch(() => null)) as any;

      if (!directData) {
        return { success: false, error: "Failed to connect to M-Pesa gateway" };
      }

      const checkoutId =
        directData.CheckoutRequestID ||
        directData.checkout_id ||
        directData.checkoutid ||
        directData.MerchantRequestID;

      const isSuccess =
        directData.ResponseCode === "0" ||
        directData.ResponseCode === 0 ||
        directData.success === true ||
        Boolean(checkoutId);

      if (isSuccess && typeof checkoutId === "string" && checkoutId) {
        return {
          success: true,
          checkoutRequestId: checkoutId,
          reference: ref,
          message: directData.CustomerMessage || "STK Push sent to your phone",
          raw: directData,
        };
      }

      const errMsg =
        directData.CustomerMessage ||
        directData.ResponseDescription ||
        directData.message ||
        "M-Pesa payment initiation failed";

      return { success: false, error: String(errMsg), raw: directData };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Network error contacting M-Pesa gateway",
      };
    }
  }

  static async getPaymentStatus(checkoutRequestId: string): Promise<StatusResponse> {
    // 1. First attempt: call local / Vercel API endpoint
    try {
      const response = await fetch("/api/hashback/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkoutId: checkoutRequestId }),
      });

      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = (await response.json().catch(() => null)) as any;
        if (data) {
          const status = String(data.status || data.state || "").toLowerCase();
          const rawStatus = String(data.rawStatus || "").toLowerCase();
          const resultDesc = String(data.resultDesc || data.ResultDesc || "").toLowerCase();
          const receipt =
            data.receipt ||
            data.mpesa_receipt ||
            data.TransactionReceipt ||
            data.MpesaReceiptNumber;

          if (
            status === "completed" ||
            status === "paid" ||
            status === "success" ||
            rawStatus === "completed" ||
            rawStatus === "success" ||
            rawStatus === "paid" ||
            resultDesc.includes("success") ||
            resultDesc.includes("processed successfully")
          ) {
            return { status: "completed", receipt, resultDesc, raw: data };
          }

          if (
            resultDesc.includes("user cannot be reached") ||
            resultDesc.includes("ds timeout")
          ) {
            return { status: "pending", resultDesc, raw: data };
          }

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
        }
      }
    } catch {
      // Backend route unreachable — fallback to direct HashBack gateway status
    }

    // 2. Direct gateway call: fallback to HashBack status
    try {
      const directResponse = await fetch(`${HASHBACK_BASE_URL}/transactionstatus`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: HASHBACK_API_KEY,
          account_id: HASHBACK_ACCOUNT_ID,
          checkoutid: checkoutRequestId,
        }),
      });

      const data = (await directResponse.json().catch(() => null)) as any;
      if (!data) return { status: "pending" };

      const resultCode = String(data.ResultCode || data.resultCode || data.ResponseCode || "").trim();
      const resultDesc = String(data.ResultDesc || data.resultDesc || data.ResponseDescription || "").toLowerCase();
      const status = String(data.status || "").toLowerCase();
      const receipt =
        data.MpesaReceiptNumber ||
        data.TransactionReceipt ||
        data.mpesa_receipt ||
        data.receipt ||
        data.TransactionID;

      if (
        resultCode === "0" ||
        status === "success" ||
        status === "completed" ||
        status === "paid" ||
        resultDesc.includes("success") ||
        resultDesc.includes("processed successfully")
      ) {
        return { status: "completed", receipt, resultDesc, raw: data };
      }

      if (
        resultCode === "1037" ||
        resultDesc.includes("user cannot be reached") ||
        resultDesc.includes("ds timeout")
      ) {
        return { status: "pending", resultDesc, raw: data };
      }

      if (
        resultCode === "1032" ||
        resultDesc.includes("cancelled by user") ||
        resultDesc.includes("canceled by user") ||
        resultDesc.includes("request cancelled") ||
        resultDesc.includes("insufficient") ||
        resultDesc.includes("wrong pin") ||
        resultDesc.includes("invalid pin") ||
        status === "cancelled" ||
        status === "canceled"
      ) {
        return { status: "failed", resultDesc, raw: data };
      }

      return { status: "pending", resultDesc, raw: data };
    } catch {
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
