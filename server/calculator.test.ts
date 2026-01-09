import { describe, expect, it } from "vitest";
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

describe("calculator operations", () => {
  it("creates a calculator successfully", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.calculator.create({
      name: "Test Loan",
      description: "A test loan calculator",
      totalAmount: "300000",
      currency: "USD",
      targetMonths: 24,
      interestRate: "0",
    });

    expect(result).toBeDefined();
    // Result from drizzle insert contains insertId
    expect(result[0]).toHaveProperty("insertId");
  });

  it("lists user calculators", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a calculator first
    await caller.calculator.create({
      name: "Test Loan 2",
      totalAmount: "250000",
      currency: "USD",
      interestRate: "0",
    });

    const calculators = await caller.calculator.list();
    expect(Array.isArray(calculators)).toBe(true);
    expect(calculators.length).toBeGreaterThan(0);
  });

  it("prevents unauthorized access to other user's calculator", async () => {
    const { ctx: ctx1 } = createAuthContext(1);
    const { ctx: ctx2 } = createAuthContext(2);
    
    const caller1 = appRouter.createCaller(ctx1);
    const caller2 = appRouter.createCaller(ctx2);

    // User 1 creates a calculator
    const result = await caller1.calculator.create({
      name: "Private Loan",
      totalAmount: "100000",
      currency: "USD",
      interestRate: "0",
    });

    const calculatorId = result[0]?.insertId;
    expect(calculatorId).toBeDefined();

    // User 2 tries to access it
    await expect(
      caller2.calculator.get({ id: calculatorId! })
    ).rejects.toThrow("Calculator not found");
  });
});

describe("payment operations", () => {
  it("creates a payment successfully", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create calculator first
    const calcResult = await caller.calculator.create({
      name: "Payment Test Loan",
      totalAmount: "300000",
      currency: "USD",
      interestRate: "0",
    });

    const calculatorId = calcResult[0]?.insertId;
    expect(calculatorId).toBeDefined();

    // Create payment
    const paymentResult = await caller.payment.create({
      calculatorId: calculatorId!,
      amount: "10000",
      currency: "USD",
      usdAmount: "10000",
      paymentDate: new Date(),
    });

    expect(paymentResult).toBeDefined();
  });

  it("lists payments for a calculator", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create calculator
    const calcResult = await caller.calculator.create({
      name: "Payment List Test",
      totalAmount: "300000",
      currency: "USD",
      interestRate: "0",
    });

    const calculatorId = calcResult[0]?.insertId!;

    // Create multiple payments
    await caller.payment.create({
      calculatorId,
      amount: "5000",
      currency: "USD",
      usdAmount: "5000",
      paymentDate: new Date(),
    });

    await caller.payment.create({
      calculatorId,
      amount: "7500",
      currency: "USD",
      usdAmount: "7500",
      paymentDate: new Date(),
    });

    // List payments
    const payments = await caller.payment.list({ calculatorId });
    expect(Array.isArray(payments)).toBe(true);
    expect(payments.length).toBe(2);
  });

  it("handles GBP to USD conversion", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create calculator
    const calcResult = await caller.calculator.create({
      name: "Currency Test",
      totalAmount: "300000",
      currency: "USD",
      interestRate: "0",
    });

    const calculatorId = calcResult[0]?.insertId!;

    // Create payment in GBP
    const exchangeRate = 1.33;
    const gbpAmount = 1000;
    const usdAmount = gbpAmount * exchangeRate;

    await caller.payment.create({
      calculatorId,
      amount: gbpAmount.toString(),
      currency: "GBP",
      usdAmount: usdAmount.toFixed(2),
      exchangeRate: exchangeRate.toFixed(4),
      paymentDate: new Date(),
    });

    const payments = await caller.payment.list({ calculatorId });
    expect(payments[0]?.currency).toBe("GBP");
    expect(payments[0]?.exchangeRate).toBeDefined();
    expect(parseFloat(payments[0]?.usdAmount)).toBeCloseTo(usdAmount, 2);
  });

  it("deletes a payment successfully", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create calculator and payment
    const calcResult = await caller.calculator.create({
      name: "Delete Test",
      totalAmount: "300000",
      currency: "USD",
      interestRate: "0",
    });

    const calculatorId = calcResult[0]?.insertId!;

    const paymentResult = await caller.payment.create({
      calculatorId,
      amount: "10000",
      currency: "USD",
      usdAmount: "10000",
      paymentDate: new Date(),
    });

    // Get payment ID
    const payments = await caller.payment.list({ calculatorId });
    const paymentId = payments[0]?.id;
    expect(paymentId).toBeDefined();

    // Delete payment
    await caller.payment.delete({ id: paymentId!, calculatorId });

    // Verify deletion
    const paymentsAfter = await caller.payment.list({ calculatorId });
    expect(paymentsAfter.length).toBe(0);
  });
});
