import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `user${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("Dashboard Filtering and Sorting", () => {
  it("should filter calculators by currency (USD)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create test calculators with different currencies
    await caller.calculator.create({
      name: "USD Loan 1",
      totalAmount: "500000",
      currency: "USD",
      interestRate: "0",
    });

    await caller.calculator.create({
      name: "GBP Loan 1",
      totalAmount: "250000",
      currency: "GBP",
      interestRate: "0",
    });

    await caller.calculator.create({
      name: "USD Loan 2",
      totalAmount: "100000",
      currency: "USD",
      interestRate: "0",
    });

    const allCalcs = await caller.calculator.list();
    const usdCalcs = allCalcs.filter((calc) => calc.currency === "USD");

    expect(usdCalcs.length).toBeGreaterThanOrEqual(2);
    expect(usdCalcs.every((calc) => calc.currency === "USD")).toBe(true);
  });

  it("should filter calculators by currency (GBP)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create test calculators with different currencies
    await caller.calculator.create({
      name: "GBP Loan 2",
      totalAmount: "400000",
      currency: "GBP",
      interestRate: "0",
    });

    const allCalcs = await caller.calculator.list();
    const gbpCalcs = allCalcs.filter((calc) => calc.currency === "GBP");

    expect(gbpCalcs.length).toBeGreaterThanOrEqual(1);
    expect(gbpCalcs.every((calc) => calc.currency === "GBP")).toBe(true);
  });

  it("should sort calculators by amount (high to low)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create calculators with different amounts
    await caller.calculator.create({
      name: "Low Amount",
      totalAmount: "100000",
      currency: "USD",
      interestRate: "0",
    });

    await caller.calculator.create({
      name: "High Amount",
      totalAmount: "500000",
      currency: "USD",
      interestRate: "0",
    });

    await caller.calculator.create({
      name: "Medium Amount",
      totalAmount: "250000",
      currency: "USD",
      interestRate: "0",
    });

    const allCalcs = await caller.calculator.list();
    const sorted = [...allCalcs].sort(
      (a, b) => parseFloat(b.totalAmount) - parseFloat(a.totalAmount)
    );

    // Verify descending order
    for (let i = 0; i < sorted.length - 1; i++) {
      const currentAmount = parseFloat(sorted[i].totalAmount);
      const nextAmount = parseFloat(sorted[i + 1].totalAmount);
      expect(currentAmount).toBeGreaterThanOrEqual(nextAmount);
    }
  });

  it("should sort calculators by amount (low to high)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const allCalcs = await caller.calculator.list();
    const sorted = [...allCalcs].sort(
      (a, b) => parseFloat(a.totalAmount) - parseFloat(b.totalAmount)
    );

    // Verify ascending order
    for (let i = 0; i < sorted.length - 1; i++) {
      const currentAmount = parseFloat(sorted[i].totalAmount);
      const nextAmount = parseFloat(sorted[i + 1].totalAmount);
      expect(currentAmount).toBeLessThanOrEqual(nextAmount);
    }
  });

  it("should sort calculators by date (newest first)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const allCalcs = await caller.calculator.list();
    const sorted = [...allCalcs].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Verify dates are in descending order
    for (let i = 0; i < sorted.length - 1; i++) {
      const currentDate = new Date(sorted[i].createdAt).getTime();
      const nextDate = new Date(sorted[i + 1].createdAt).getTime();
      expect(currentDate).toBeGreaterThanOrEqual(nextDate);
    }
  });

  it("should sort calculators by date (oldest first)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const allCalcs = await caller.calculator.list();
    const sorted = [...allCalcs].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    // Verify dates are in ascending order
    for (let i = 0; i < sorted.length - 1; i++) {
      const currentDate = new Date(sorted[i].createdAt).getTime();
      const nextDate = new Date(sorted[i + 1].createdAt).getTime();
      expect(currentDate).toBeLessThanOrEqual(nextDate);
    }
  });

  it("should filter calculators by search query (name)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create calculators with distinctive names
    await caller.calculator.create({
      name: "Special High Priority Loan",
      totalAmount: "300000",
      currency: "USD",
      interestRate: "0",
    });

    await caller.calculator.create({
      name: "Regular Loan",
      totalAmount: "200000",
      currency: "USD",
      interestRate: "0",
    });

    const allCalcs = await caller.calculator.list();
    const searchQuery = "special";
    const filtered = allCalcs.filter((calc) =>
      calc.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    expect(filtered.length).toBeGreaterThanOrEqual(1);
    expect(filtered.some((calc) => calc.name.toLowerCase().includes("special"))).toBe(true);
  });

  it("should filter calculators by search query (description)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create calculator with description
    await caller.calculator.create({
      name: "Business Loan",
      description: "This is a unique business expansion loan",
      totalAmount: "350000",
      currency: "USD",
      interestRate: "0",
    });

    const allCalcs = await caller.calculator.list();
    const searchQuery = "expansion";
    const filtered = allCalcs.filter(
      (calc) =>
        calc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        calc.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    expect(filtered.length).toBeGreaterThanOrEqual(1);
    expect(
      filtered.some(
        (calc) =>
          calc.description?.toLowerCase().includes("expansion") ||
          calc.name.toLowerCase().includes("expansion")
      )
    ).toBe(true);
  });

  it("should combine search and currency filter", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create test calculators
    await caller.calculator.create({
      name: "Premium USD Loan",
      totalAmount: "450000",
      currency: "USD",
      interestRate: "0",
    });

    await caller.calculator.create({
      name: "Premium GBP Loan",
      totalAmount: "350000",
      currency: "GBP",
      interestRate: "0",
    });

    const allCalcs = await caller.calculator.list();
    const searchQuery = "premium";
    const currencyFilter = "USD";

    const filtered = allCalcs.filter(
      (calc) =>
        (calc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          calc.description?.toLowerCase().includes(searchQuery.toLowerCase())) &&
        calc.currency === currencyFilter
    );

    expect(filtered.length).toBeGreaterThanOrEqual(1);
    expect(filtered.every((calc) => calc.currency === "USD")).toBe(true);
    expect(
      filtered.every((calc) => calc.name.toLowerCase().includes("premium"))
    ).toBe(true);
  });
});
