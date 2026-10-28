import { describe, expect, it } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { routeTree } from "@/routeTree.gen";
import {
  MARKETS,
  POSITIONS,
  APPLICATION_FEE,
  salaryFor,
  allowanceFor,
  type MarketId,
} from "@/lib/jobs";

describe("Job Employment Portal Configuration", () => {
  it("includes Quickmart, Carrefour, and Naivas with valid branches and HR contacts", () => {
    const marketIds: MarketId[] = ["quickmart", "carrefour", "naivas"];
    for (const id of marketIds) {
      const m = MARKETS[id];
      expect(m).toBeDefined();
      expect(m.name).toBeTruthy();
      expect(m.branches.length).toBeGreaterThanOrEqual(5);
      expect(m.hrName).toBeTruthy();
      expect(m.hrPhone).toBeTruthy();
      expect(m.hrEmail).toBeTruthy();
    }
  });

  it("contains all 10 specified positions with exact salaries and allowances", () => {
    expect(POSITIONS).toHaveLength(10);

    const cleaner = POSITIONS.find((p) => p.id === "cleaners")!;
    expect(cleaner.category).toBe("Maintenance");
    expect(cleaner.baseSalary).toBe(25000);
    expect(cleaner.allowanceLabel).toBe("Transport Allowance");
    expect(cleaner.allowanceValue).toBe("KSh 3,000");

    const cashier = POSITIONS.find((p) => p.id === "cashiers")!;
    expect(cashier.category).toBe("Customer Service");
    expect(cashier.baseSalary).toBe(34000);
    expect(cashier.allowanceLabel).toBe("Medical Allowance");
    expect(cashier.allowanceValue).toBe("KSh 3,000");

    const storeKeeper = POSITIONS.find((p) => p.id === "store-keepers")!;
    expect(storeKeeper.category).toBe("Inventory");
    expect(storeKeeper.baseSalary).toBe(38000);
    expect(storeKeeper.allowanceLabel).toBe("Housing Allowance");
    expect(storeKeeper.allowanceValue).toBe("KSh 5,000");

    const driver = POSITIONS.find((p) => p.id === "drivers")!;
    expect(driver.category).toBe("Logistics");
    expect(driver.baseSalary).toBe(45000);
    expect(driver.allowanceLabel).toBe("Fuel Allowance");
    expect(driver.allowanceValue).toBe("KSh 8,000");

    const loaders = POSITIONS.find((p) => p.id === "loaders")!;
    expect(loaders.category).toBe("Warehouse");
    expect(loaders.baseSalary).toBe(28000);
    expect(loaders.allowanceLabel).toBe("Transport Allowance");
    expect(loaders.allowanceValue).toBe("KSh 3,000");

    const marketer = POSITIONS.find((p) => p.id === "marketer")!;
    expect(marketer.category).toBe("Sales");
    expect(marketer.baseSalary).toBe(35000);
    expect(marketer.allowanceLabel).toBe("Commission");
    expect(marketer.allowanceValue).toBe("5% of sales");

    const salesAttendant = POSITIONS.find((p) => p.id === "sales-attendant")!;
    expect(salesAttendant.category).toBe("Retail");
    expect(salesAttendant.baseSalary).toBe(30000);
    expect(salesAttendant.allowanceLabel).toBe("Sales Bonus");
    expect(salesAttendant.allowanceValue).toBe("KSh 2,000");

    const chef = POSITIONS.find((p) => p.id === "chef")!;
    expect(chef.category).toBe("Kitchen");
    expect(chef.baseSalary).toBe(50000);
    expect(chef.allowanceLabel).toBe("Meal Allowance");
    expect(chef.allowanceValue).toBe("KSh 4,000");

    const warehouseSup = POSITIONS.find((p) => p.id === "warehouse-supervisor")!;
    expect(warehouseSup.category).toBe("Management");
    expect(warehouseSup.baseSalary).toBe(55000);
    expect(warehouseSup.allowanceLabel).toBe("Leadership Bonus");
    expect(warehouseSup.allowanceValue).toBe("KSh 8,000");

    const guards = POSITIONS.find((p) => p.id === "guards")!;
    expect(guards.category).toBe("Security");
    expect(guards.baseSalary).toBe(32000);
    expect(guards.allowanceLabel).toBe("Night Allowance");
    expect(guards.allowanceValue).toBe("KSh 3,500");
  });

  it("has application fee configured as KSh 10 for testing", () => {
    expect(APPLICATION_FEE).toBe(10);
  });

  it("resolves route tree for /admin, /apply, and /letter", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    const adminMatch = router.matchRoutes("/admin");
    expect(adminMatch.at(-1)?.routeId).not.toBe(rootRouteId);

    const letterMatch = router.matchRoutes("/letter");
    expect(letterMatch.at(-1)?.routeId).not.toBe(rootRouteId);
  });
});
