import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { invokeLLM } from "./_core/llm";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  calculator: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserCalculators(ctx.user.id);
    }),
    
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const calculator = await db.getCalculatorById(input.id);
        if (!calculator || calculator.userId !== ctx.user.id) {
          throw new Error("Calculator not found");
        }
        return calculator;
      }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        description: z.string().optional(),
        totalAmount: z.string(),
        currency: z.string().default("USD"),
        targetMonths: z.number().optional(),
        loanType: z.string().optional(),
        interestRate: z.string().default("0"),
      }))
      .mutation(async ({ input, ctx }) => {
        return db.createCalculator({
          userId: ctx.user.id,
          ...input,
        });
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        totalAmount: z.string().optional(),
        targetMonths: z.number().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, ...data } = input;
        const calculator = await db.getCalculatorById(id);
        if (!calculator || calculator.userId !== ctx.user.id) {
          throw new Error("Calculator not found");
        }
        return db.updateCalculator(id, data);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const calculator = await db.getCalculatorById(input.id);
        if (!calculator || calculator.userId !== ctx.user.id) {
          throw new Error("Calculator not found");
        }
        return db.deleteCalculator(input.id);
      }),
  }),
  
  payment: router({
    list: protectedProcedure
      .input(z.object({ calculatorId: z.number() }))
      .query(async ({ input, ctx }) => {
        const calculator = await db.getCalculatorById(input.calculatorId);
        if (!calculator || calculator.userId !== ctx.user.id) {
          throw new Error("Calculator not found");
        }
        return db.getCalculatorPayments(input.calculatorId);
      }),
    
    create: protectedProcedure
      .input(z.object({
        calculatorId: z.number(),
        amount: z.string(),
        currency: z.string(),
        usdAmount: z.string(),
        exchangeRate: z.string().optional(),
        notes: z.string().optional(),
        paymentDate: z.date(),
      }))
      .mutation(async ({ input, ctx }) => {
        const calculator = await db.getCalculatorById(input.calculatorId);
        if (!calculator || calculator.userId !== ctx.user.id) {
          throw new Error("Calculator not found");
        }
        return db.createPayment({
          ...input,
          userId: ctx.user.id,
        });
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number(), calculatorId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const calculator = await db.getCalculatorById(input.calculatorId);
        if (!calculator || calculator.userId !== ctx.user.id) {
          throw new Error("Calculator not found");
        }
        return db.deletePayment(input.id);
      }),
  }),
  
  onboarding: router({
    analyzeGoals: protectedProcedure
      .input(z.object({
        financialGoal: z.string(),
        monthlyIncome: z.string().optional(),
        riskTolerance: z.enum(["low", "medium", "high"]).optional(),
        preferredPaymentFrequency: z.string().optional(),
        hasEmergencyFund: z.boolean().optional(),
        otherDebts: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Save preferences
        await db.upsertUserPreferences({
          userId: ctx.user.id,
          ...input,
          monthlyIncome: input.monthlyIncome || null,
        });
        
        // Use AI to analyze and suggest calculator setup
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "You are a financial advisor helping users set up loan repayment calculators. Based on their goals and financial situation, suggest appropriate loan amounts, target months, and payment strategies. Be encouraging and practical."
            },
            {
              role: "user",
              content: `Financial Goal: ${input.financialGoal}\nMonthly Income: ${input.monthlyIncome || 'Not specified'}\nRisk Tolerance: ${input.riskTolerance || 'Not specified'}\nPayment Frequency: ${input.preferredPaymentFrequency || 'Not specified'}\nEmergency Fund: ${input.hasEmergencyFund ? 'Yes' : 'No'}\nOther Debts: ${input.otherDebts || 'None'}\n\nSuggest a loan calculator setup with recommended loan amount, target months, and payment strategy.`
            }
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "calculator_suggestion",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  suggestedAmount: { type: "number", description: "Suggested loan amount" },
                  suggestedMonths: { type: "number", description: "Suggested repayment period in months" },
                  strategy: { type: "string", description: "Recommended payment strategy" },
                  reasoning: { type: "string", description: "Explanation of the suggestions" },
                },
                required: ["suggestedAmount", "suggestedMonths", "strategy", "reasoning"],
                additionalProperties: false,
              },
            },
          },
        });
        
        const messageContent = response.choices[0]?.message?.content;
        const contentString = typeof messageContent === 'string' ? messageContent : '{}';
        const suggestion = JSON.parse(contentString);
        return suggestion;
      }),
    
    getPreferences: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserPreferences(ctx.user.id);
    }),
  }),
});

export type AppRouter = typeof appRouter;
