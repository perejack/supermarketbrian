export type MarketId = "quickmart" | "carrefour" | "naivas";

export interface Market {
  id: MarketId;
  name: string;
  brandName: string;
  tagline: string;
  refPrefix: string;
  branches: string[];
  hrName: string;
  hrPhone: string;
  hrEmail: string;
  primaryColor: string;
  secondaryColor: string;
  badgeClass: string;
  logoLetter: string;
}

export const MARKET_ORDER: MarketId[] = ["quickmart", "carrefour", "naivas"];

export const MARKETS: Record<MarketId, Market> = {
  quickmart: {
    id: "quickmart",
    name: "Quickmart",
    brandName: "Quickmart Supermarket",
    tagline: "Fresh & Easy. Kenya's fastest growing retail chain.",
    refPrefix: "QRT",
    branches: [
      "Sarit Centre",
      "Garden City",
      "Yaya Centre",
      "The Hub Karen",
      "Rosslyn Riviera",
      "Ruai",
      "Kilimani",
      "Westlands",
      "Buru Buru",
      "Thika Road Mall",
    ],
    hrName: "Lydia Karanja",
    hrPhone: "+254 711 204 880",
    hrEmail: "careers@quickmart.co.ke",
    primaryColor: "#DC2626",
    secondaryColor: "#FEF2F2",
    badgeClass: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800",
    logoLetter: "Q",
  },
  carrefour: {
    id: "carrefour",
    name: "Carrefour",
    brandName: "Carrefour Supermarket",
    tagline: "Everyday quality for everyone. Majid Al Futtaim.",
    refPrefix: "CRF",
    branches: [
      "Two Rivers",
      "The Junction",
      "Village Market",
      "Sarit Centre",
      "The Hub Karen",
      "Mega (Uhuru Highway)",
      "Southfield Mall",
      "Westgate",
      "Galleria",
      "Garden City",
    ],
    hrName: "Peter Mwangi",
    hrPhone: "+254 722 315 046",
    hrEmail: "recruitment.kenya@carrefourke.com",
    primaryColor: "#1D4ED8",
    secondaryColor: "#EFF6FF",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800",
    logoLetter: "C",
  },
  naivas: {
    id: "naivas",
    name: "Naivas",
    brandName: "Naivas Supermarket",
    tagline: "Kenya's own, for everyone. Fresh and local.",
    refPrefix: "NVS",
    branches: [
      "Imaara Dhaba",
      "Kenyatta Avenue",
      "Buru Buru",
      "Kasarani",
      "Thika Road Mall",
      "Ngong Road",
      "Westlands",
      "Mountain Mall",
      "Rongai",
      "Machakos",
    ],
    hrName: "Alice Chebet",
    hrPhone: "+254 733 640 119",
    hrEmail: "careers@naivas.co.ke",
    primaryColor: "#EA580C",
    secondaryColor: "#FFF7ED",
    badgeClass: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800",
    logoLetter: "N",
  },
};

export interface Position {
  id: string;
  title: string;
  category: string;
  baseSalary: number;
  allowanceLabel: string;
  allowanceValue: string;
  description: string;
}

export const POSITIONS: Position[] = [
  {
    id: "cleaners",
    title: "Cleaners",
    category: "Maintenance",
    baseSalary: 25000,
    allowanceLabel: "Transport Allowance",
    allowanceValue: "KSh 3,000",
    description: "Maintaining immaculate cleanliness, hygiene, and floor sanitation across store aisles and back-of-house.",
  },
  {
    id: "cashiers",
    title: "Cashiers",
    category: "Customer Service",
    baseSalary: 34000,
    allowanceLabel: "Medical Allowance",
    allowanceValue: "KSh 3,000",
    description: "Point-of-sale customer checkout, receipt issuance, cash & card reconciliations with high customer warmth.",
  },
  {
    id: "store-keepers",
    title: "Store Keepers",
    category: "Inventory",
    baseSalary: 38000,
    allowanceLabel: "Housing Allowance",
    allowanceValue: "KSh 5,000",
    description: "Inbound inventory verification, stock keeping, fifo rotation, batch code audit, and warehouse security.",
  },
  {
    id: "drivers",
    title: "Drivers",
    category: "Logistics",
    baseSalary: 45000,
    allowanceLabel: "Fuel Allowance",
    allowanceValue: "KSh 8,000",
    description: "Multi-branch store deliveries, fleet handling, road safety compliance, and inter-depot product transit.",
  },
  {
    id: "loaders",
    title: "Loaders & Off-loaders",
    category: "Warehouse",
    baseSalary: 28000,
    allowanceLabel: "Transport Allowance",
    allowanceValue: "KSh 3,000",
    description: "Heavy cargo handling, truck un-stuffing, pallet staging, and safe material transfer onto stock carts.",
  },
  {
    id: "marketer",
    title: "Marketer",
    category: "Sales",
    baseSalary: 35000,
    allowanceLabel: "Commission",
    allowanceValue: "5% of sales",
    description: "B2B client sourcing, bulk procurement contracts, promotions management, and institutional supply orders.",
  },
  {
    id: "sales-attendant",
    title: "Sales Attendant",
    category: "Retail",
    baseSalary: 30000,
    allowanceLabel: "Sales Bonus",
    allowanceValue: "KSh 2,000",
    description: "Direct customer assistance, merchandise display dressing, shelf replenishment, and product recommendations.",
  },
  {
    id: "chef",
    title: "Chef",
    category: "Kitchen",
    baseSalary: 50000,
    allowanceLabel: "Meal Allowance",
    allowanceValue: "KSh 4,000",
    description: "Fresh bakery preparation, deli hot counter cooking, recipe consistency, and strict HACCP food safety standards.",
  },
  {
    id: "warehouse-supervisor",
    title: "Warehouse Supervisor",
    category: "Management",
    baseSalary: 55000,
    allowanceLabel: "Leadership Bonus",
    allowanceValue: "KSh 8,000",
    description: "Supervising receiving docks, dispatch schedules, team duty rosters, and minimizing inventory shrinkage.",
  },
  {
    id: "guards",
    title: "Guards",
    category: "Security",
    baseSalary: 32000,
    allowanceLabel: "Night Allowance",
    allowanceValue: "KSh 3,500",
    description: "Patrolling store premises, entrance asset screening, loss prevention, and customer security vigilance.",
  },
];

export function salaryFor(position: Position, _market: MarketId): number {
  return position.baseSalary;
}

export function allowanceFor(position: Position, _market: MarketId): string {
  return position.allowanceValue;
}

export const APPLICATION_FEE = 10;
export const ORIENTATION_TIME = "9:00 AM";

export function formatKsh(value: number): string {
  return `KSh ${value.toLocaleString("en-KE")}`;
}

export function isMarketId(value: string | undefined): value is MarketId {
  return value === "quickmart" || value === "carrefour" || value === "naivas";
}
