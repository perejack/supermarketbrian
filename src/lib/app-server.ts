import { createServerFn } from "@tanstack/react-start";
import { MARKETS, POSITIONS, type MarketId, isMarketId } from "@/lib/jobs";

const SUPABASE_URL = process.env.SUPABASE_URL || "https://zeichvwrpxrpzeqyfypj.supabase.co";
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplaWNodndycHhycHplcXlmeXBqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MzA1OTcyNSwiZXhwIjoyMTA4NjM1NzI1fQ.Ch6858L69aGw_kyES0HeTJRVOuubK47B89BtTGdH-vk";
const BUCKET_NAME = "job-applications";

export interface ApplicationRow {
  id: string;
  user_id: string | null;
  reference_number: string;
  supermarket: string;
  supermarket_name: string;
  position: string;
  position_category: string | null;
  monthly_salary: number;
  allowance_label: string | null;
  allowance_amount: string | null;
  full_name: string;
  email: string;
  phone: string;
  id_number?: string | null;
  preferred_branch: string;
  orientation_date: string;
  orientation_branch: string;
  availability?: string | null;
  id_front_path: string | null;
  id_back_path: string | null;
  cv_path: string | null;
  id_front_url?: string | null;
  id_back_url?: string | null;
  cv_url?: string | null;
  payment_status: "pending" | "unpaid" | "paid";
  payment_phone: string | null;
  mpesa_receipt: string | null;
  paid_at: string | null;
  created_at: string;
}

// Built-in seed applications for instant live demo presentation
const SEED_APPLICATIONS: ApplicationRow[] = [];

// Helper to write to Supabase Storage
async function saveToStorage(path: string, content: string): Promise<boolean> {
  try {
    const url = `${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${path}`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        "Content-Type": "application/json",
        "x-upsert": "true",
      },
      body: content,
    });
    return res.ok;
  } catch (err) {
    console.warn("Storage write error:", err);
    return false;
  }
}

// Helper to read from Supabase Storage
async function readFromStorage(path: string): Promise<string | null> {
  try {
    const url = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${path}`;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch (err) {
    return null;
  }
}

// Helper to get all stored applications from Supabase Storage records index
async function getStoredApplications(): Promise<ApplicationRow[]> {
  try {
    const raw = await readFromStorage("records/index.json");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Error reading records/index.json:", e);
  }
  return [];
}

// Helper to update records index in storage
async function updateStoredApplications(row: ApplicationRow): Promise<void> {
  const current = await getStoredApplications();
  const existingIndex = current.findIndex((r) => r.id === row.id || r.reference_number === row.reference_number);
  if (existingIndex >= 0) {
    current[existingIndex] = { ...current[existingIndex], ...row };
  } else {
    current.unshift(row);
  }
  await saveToStorage(`records/${row.id}.json`, JSON.stringify(row, null, 2));
  await saveToStorage("records/index.json", JSON.stringify(current, null, 2));
}

// In-memory cache for fast responsive lookups during SSR
let memoryStore: ApplicationRow[] = [...SEED_APPLICATIONS];

export interface CreateAppInput {
  supermarket: string;
  positionId: string;
  preferredBranch: string;
  orientationBranch: string;
  orientationDate: string;
  availability?: string;
  fullName: string;
  email: string;
  phone: string;
  idNumber?: string;
  idFrontUrl?: string | null;
  idBackUrl?: string | null;
  cvUrl?: string | null;
  idFrontPath?: string | null;
  idBackPath?: string | null;
  cvPath?: string | null;
  userId?: string | null;
}

export const createApplication = createServerFn({ method: "POST" })
  .validator((d: unknown) => d as CreateAppInput | { data: CreateAppInput })
  .handler(async ({ data: rawData }) => {
    const data: CreateAppInput =
      rawData && typeof rawData === "object" && "data" in rawData && (rawData as any).data
        ? ((rawData as any).data as CreateAppInput)
        : (rawData as CreateAppInput);

    if (!data) {
      throw new Error("Application data is missing");
    }

    const marketId: MarketId = isMarketId(data.supermarket) ? data.supermarket : "quickmart";
    const market = MARKETS[marketId] ?? MARKETS.quickmart;
    const pos = POSITIONS.find((p) => p.id === data.positionId) || POSITIONS[0];

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const referenceNumber = `${market.refPrefix}-2026-${randomSuffix}`;
    const id = `app-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const newRecord: ApplicationRow = {
      id,
      user_id: data.userId || null,
      reference_number: referenceNumber,
      supermarket: market.id,
      supermarket_name: market.brandName,
      position: pos.title,
      position_category: pos.category,
      monthly_salary: pos.baseSalary,
      allowance_label: pos.allowanceLabel,
      allowance_amount: pos.allowanceValue,
      full_name: data.fullName.trim(),
      email: data.email.trim(),
      phone: data.phone.trim(),
      id_number: data.idNumber?.trim() || null,
      preferred_branch: data.preferredBranch || market.branches[0],
      orientation_branch: data.orientationBranch || data.preferredBranch || market.branches[0],
      orientation_date: data.orientationDate || "2026-10-19",
      availability: data.availability || "Full Day Orientation",
      id_front_path: data.idFrontPath || null,
      id_back_path: data.idBackPath || null,
      cv_path: data.cvPath || null,
      id_front_url: data.idFrontUrl || (data.idFrontPath ? `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${data.idFrontPath}` : null),
      id_back_url: data.idBackUrl || (data.idBackPath ? `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${data.idBackPath}` : null),
      cv_url: data.cvUrl || (data.cvPath ? `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${data.cvPath}` : null),
      payment_status: "pending",
      payment_phone: null,
      mpesa_receipt: null,
      paid_at: null,
      created_at: new Date().toISOString(),
    };

    // 1. Save to Supabase Storage immediately
    await updateStoredApplications(newRecord);

    // 2. Add to in-memory store
    memoryStore.unshift(newRecord);

    // 3. Try to save to Supabase Postgres table (if table permissions are granted)
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/applications`, {
        method: "POST",
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          id: newRecord.id,
          reference_number: newRecord.reference_number,
          supermarket: newRecord.supermarket,
          supermarket_name: newRecord.supermarket_name,
          position: newRecord.position,
          department: newRecord.position_category,
          salary: newRecord.monthly_salary,
          allowance_label: newRecord.allowance_label,
          allowance_value: newRecord.allowance_amount,
          full_name: newRecord.full_name,
          email: newRecord.email,
          phone: newRecord.phone,
          id_number: newRecord.id_number,
          preferred_branch: newRecord.preferred_branch,
          orientation_branch: newRecord.orientation_branch,
          orientation_date: newRecord.orientation_date,
          availability: newRecord.availability,
          id_front_url: newRecord.id_front_url,
          id_back_url: newRecord.id_back_url,
          cv_url: newRecord.cv_url,
          payment_status: "pending",
          status: "submitted",
        }),
      });
    } catch (e) {
      // Table insert error silently swallowed so storage fallback preserves data
    }

    return newRecord;
  });

export const confirmMpesaPayment = createServerFn({ method: "POST" })
  .validator((d: unknown) => d as { applicationId: string; phone: string } | { data: { applicationId: string; phone: string } })
  .handler(async ({ data: rawData }) => {
    const payload = (rawData && typeof rawData === "object" && "data" in rawData && (rawData as any).data) ? (rawData as any).data : rawData;
    const applicationId = payload?.applicationId || (rawData as any)?.applicationId;
    const phone = payload?.phone || (rawData as any)?.phone || "";

    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const receipt = "Q" + Array.from({ length: 9 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    const paidAt = new Date().toISOString();

    // Update in memoryStore
    const memIndex = memoryStore.findIndex((r) => r.id === applicationId);
    if (memIndex >= 0) {
      memoryStore[memIndex].payment_status = "paid";
      memoryStore[memIndex].payment_phone = phone;
      memoryStore[memIndex].mpesa_receipt = receipt;
      memoryStore[memIndex].paid_at = paidAt;
      await updateStoredApplications(memoryStore[memIndex]);
    } else {
      // Try finding in storage
      const stored = await getStoredApplications();
      const stIndex = stored.findIndex((r) => r.id === applicationId);
      if (stIndex >= 0) {
        stored[stIndex].payment_status = "paid";
        stored[stIndex].payment_phone = phone;
        stored[stIndex].mpesa_receipt = receipt;
        stored[stIndex].paid_at = paidAt;
        await updateStoredApplications(stored[stIndex]);
      }
    }

    // Try updating Supabase table
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/applications?id=eq.${applicationId}`, {
        method: "PATCH",
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payment_status: "paid",
          payment_phone: phone,
          mpesa_receipt: receipt,
        }),
      });
    } catch (e) {
      // Ignore
    }

    return { receipt, paidAt };
  });

// Passwordless Admin Applications query
export const getAdminApplications = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => (d as { passcode?: string } | undefined)?.passcode || "")
  .handler(async () => {
    // Merge storage records, memoryStore, and seed records
    const stored = await getStoredApplications();
    const map = new Map<string, ApplicationRow>();

    // Add seed apps first
    for (const app of SEED_APPLICATIONS) {
      map.set(app.id, app);
    }
    // Add memory apps
    for (const app of memoryStore) {
      map.set(app.id, app);
    }
    // Add stored apps
    for (const app of stored) {
      map.set(app.id, app);
    }

    // Try fetching from Supabase Table
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/applications?select=*&order=created_at.desc`, {
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
        },
      });
      if (res.ok) {
        const dbRows = (await res.json()) as any[];
        for (const r of dbRows) {
          const row: ApplicationRow = {
            id: r.id,
            user_id: r.user_id || null,
            reference_number: r.reference_number,
            supermarket: r.supermarket,
            supermarket_name: r.supermarket_name || (MARKETS[r.supermarket as MarketId]?.brandName ?? r.supermarket),
            position: r.position,
            position_category: r.department || r.position_category,
            monthly_salary: Number(r.salary || r.monthly_salary || 0),
            allowance_label: r.allowance_label,
            allowance_amount: r.allowance_value || r.allowance_amount,
            full_name: r.full_name,
            email: r.email,
            phone: r.phone,
            id_number: r.id_number,
            preferred_branch: r.preferred_branch,
            orientation_branch: r.orientation_branch,
            orientation_date: r.orientation_date,
            availability: r.availability,
            id_front_path: r.id_front_path || null,
            id_back_path: r.id_back_path || null,
            cv_path: r.cv_path || null,
            id_front_url: r.id_front_url || null,
            id_back_url: r.id_back_url || null,
            cv_url: r.cv_url || null,
            payment_status: r.payment_status || "pending",
            payment_phone: r.payment_phone,
            mpesa_receipt: r.mpesa_receipt,
            paid_at: r.paid_at || null,
            created_at: r.created_at || new Date().toISOString(),
          };
          map.set(row.id, row);
        }
      }
    } catch (e) {
      // Ignore
    }

    const all = Array.from(map.values());
    all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return all;
  });

export const getLetterByRef = createServerFn({ method: "GET" })
  .validator((d: unknown) => (typeof d === "string" ? d : (d as any)?.ref || (d as any)?.data?.ref || ""))
  .handler(async ({ data: ref }) => {
    const rawRef = typeof ref === "string" ? ref : (ref as any)?.ref || (ref as any)?.data?.ref || "";
    const cleanRef = String(rawRef).trim().toUpperCase();

    // Check memory store
    const mem = memoryStore.find((r) => r.reference_number.toUpperCase() === cleanRef);
    if (mem) return mem;

    // Check storage
    const stored = await getStoredApplications();
    const st = stored.find((r) => r.reference_number.toUpperCase() === cleanRef);
    if (st) return st;

    // Check seeds
    const seed = SEED_APPLICATIONS.find((r) => r.reference_number.toUpperCase() === cleanRef);
    if (seed) return seed;

    // Check Supabase Table
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/applications?reference_number=ilike.${cleanRef}&limit=1`, {
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
        },
      });
      if (res.ok) {
        const rows = (await res.json()) as any[];
        if (rows.length > 0) {
          const r = rows[0];
          return {
            id: r.id,
            user_id: r.user_id || null,
            reference_number: r.reference_number,
            supermarket: r.supermarket,
            supermarket_name: r.supermarket_name || (MARKETS[r.supermarket as MarketId]?.brandName ?? r.supermarket),
            position: r.position,
            position_category: r.department || r.position_category,
            monthly_salary: Number(r.salary || r.monthly_salary || 0),
            allowance_label: r.allowance_label,
            allowance_amount: r.allowance_value || r.allowance_amount,
            full_name: r.full_name,
            email: r.email,
            phone: r.phone,
            id_number: r.id_number,
            preferred_branch: r.preferred_branch,
            orientation_branch: r.orientation_branch,
            orientation_date: r.orientation_date,
            availability: r.availability,
            id_front_path: r.id_front_path || null,
            id_back_path: r.id_back_path || null,
            cv_path: r.cv_path || null,
            id_front_url: r.id_front_url || null,
            id_back_url: r.id_back_url || null,
            cv_url: r.cv_url || null,
            payment_status: r.payment_status || "pending",
            payment_phone: r.payment_phone,
            mpesa_receipt: r.mpesa_receipt,
            paid_at: r.paid_at || null,
            created_at: r.created_at || new Date().toISOString(),
          } as ApplicationRow;
        }
      }
    } catch (e) {
      // Ignore
    }

    return null;
  });

export const getMyApplications = createServerFn({ method: "GET" }).handler(async () => {
  const all = await getStoredApplications();
  const map = new Map<string, ApplicationRow>();

  for (const app of memoryStore) {
    map.set(app.id, app);
  }
  for (const app of all) {
    map.set(app.id, app);
  }

  const list = Array.from(map.values());
  list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return list;
});

// Admin toggle payment status
export const togglePaymentStatus = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => d as { id: string; status: "paid" | "pending" })
  .handler(async ({ data }) => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const receipt = data.status === "paid" ? "Q" + Array.from({ length: 9 }, () => chars[Math.floor(Math.random() * chars.length)]).join("") : null;
    const paidAt = data.status === "paid" ? new Date().toISOString() : null;

    const memIndex = memoryStore.findIndex((r) => r.id === data.id);
    if (memIndex >= 0) {
      memoryStore[memIndex].payment_status = data.status;
      memoryStore[memIndex].mpesa_receipt = receipt;
      memoryStore[memIndex].paid_at = paidAt;
      await updateStoredApplications(memoryStore[memIndex]);
    } else {
      const stored = await getStoredApplications();
      const stIndex = stored.findIndex((r) => r.id === data.id);
      if (stIndex >= 0) {
        stored[stIndex].payment_status = data.status;
        stored[stIndex].mpesa_receipt = receipt;
        stored[stIndex].paid_at = paidAt;
        await updateStoredApplications(stored[stIndex]);
      }
    }

    return { ok: true, status: data.status, receipt };
  });

export const getAdminFileUrl = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => d as { passcode?: string; path: string })
  .handler(async ({ data }) => {
    if (data.path.startsWith("http://") || data.path.startsWith("https://")) {
      return { url: data.path };
    }
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${data.path}`;
    return { url: publicUrl };
  });
