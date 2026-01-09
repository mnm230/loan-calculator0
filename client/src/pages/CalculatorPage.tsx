import { useState, useEffect, useMemo } from "react";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  DollarSign,
  TrendingUp,
  Calendar,
  Trash2,
  Loader2,
  Sparkles,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function CalculatorPage() {
  const [, params] = useRoute("/calculator/:id");
  const [, setLocation] = useLocation();
  const calculatorId = params?.id ? parseInt(params.id) : null;
  const utils = trpc.useUtils();

  const [paymentAmount, setPaymentAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [exchangeRate, setExchangeRate] = useState(1);
  const [lastRateUpdate, setLastRateUpdate] = useState<Date | null>(null);

  const { data: calculator, isLoading: calcLoading } = trpc.calculator.get.useQuery(
    { id: calculatorId! },
    { enabled: !!calculatorId }
  );

  const { data: payments = [], isLoading: paymentsLoading } = trpc.payment.list.useQuery(
    { calculatorId: calculatorId! },
    { enabled: !!calculatorId }
  );

  const createPayment = trpc.payment.create.useMutation({
    onSuccess: () => {
      toast.success("Payment recorded!");
      setPaymentAmount("");
      utils.payment.list.invalidate({ calculatorId: calculatorId! });
    },
    onError: (error) => {
      toast.error("Failed to record payment: " + error.message);
    },
  });

  const deletePayment = trpc.payment.delete.useMutation({
    onSuccess: () => {
      toast.success("Payment deleted");
      utils.payment.list.invalidate({ calculatorId: calculatorId! });
    },
    onError: (error) => {
      toast.error("Failed to delete: " + error.message);
    },
  });

  // Fetch exchange rate
  useEffect(() => {
    const fetchRate = async () => {
      try {
        const response = await fetch("https://open.er-api.com/v6/latest/GBP");
        const data = await response.json();
        setExchangeRate(data.rates.USD || 1);
        setLastRateUpdate(new Date());
      } catch (error) {
        console.error("Failed to fetch exchange rate:", error);
      }
    };

    fetchRate();
    const interval = setInterval(fetchRate, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const totalPaid = useMemo(() => {
    return payments.reduce((sum, p) => sum + parseFloat(p.usdAmount), 0);
  }, [payments]);

  const remaining = useMemo(() => {
    if (!calculator) return 0;
    return parseFloat(calculator.totalAmount) - totalPaid;
  }, [calculator, totalPaid]);

  const progress = useMemo(() => {
    if (!calculator) return 0;
    return (totalPaid / parseFloat(calculator.totalAmount)) * 100;
  }, [calculator, totalPaid]);

  const handleMakePayment = () => {
    if (!calculatorId || !paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast.error("Please enter a valid payment amount");
      return;
    }

    const amount = parseFloat(paymentAmount);
    const usdAmount = currency === "GBP" ? amount * exchangeRate : amount;

    createPayment.mutate({
      calculatorId,
      amount: paymentAmount,
      currency,
      usdAmount: usdAmount.toFixed(2),
      exchangeRate: currency === "GBP" ? exchangeRate.toFixed(4) : undefined,
      paymentDate: new Date(),
    });
  };

  const handleDeletePayment = (paymentId: number) => {
    if (!calculatorId) return;
    if (confirm("Are you sure you want to delete this payment?")) {
      deletePayment.mutate({ id: paymentId, calculatorId });
    }
  };

  const getCelebrationMessage = () => {
    if (progress >= 90) return { emoji: "🏁", message: "Almost There! Final Sprint!", color: "from-green-500 to-emerald-600" };
    if (progress >= 75) return { emoji: "🎉", message: "Outstanding Progress! 3/4 Complete!", color: "from-green-500 to-teal-600" };
    if (progress >= 50) return { emoji: "💪", message: "Halfway Victory! Keep Going!", color: "from-blue-500 to-cyan-600" };
    if (progress >= 25) return { emoji: "🌟", message: "Great Momentum! Quarter Done!", color: "from-purple-500 to-pink-600" };
    if (progress >= 10) return { emoji: "🚀", message: "Strong Start! You're On Track!", color: "from-yellow-500 to-orange-600" };
    return null;
  };

  const celebration = getCelebrationMessage();

  const formatCurrency = (amount: number | string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(typeof amount === "string" ? parseFloat(amount) : amount);
  };

  if (calcLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
        <div className="container mx-auto max-w-6xl">
          <Skeleton className="h-12 w-48 mb-8" />
          <div className="grid gap-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!calculator) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <Card className="text-center p-8">
          <CardTitle className="text-2xl mb-4">Calculator Not Found</CardTitle>
          <Button onClick={() => setLocation("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={() => setLocation("/dashboard")} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {calculator.name}
          </h1>
          {calculator.description && (
            <p className="text-muted-foreground mt-2">{calculator.description}</p>
          )}
        </div>

        {/* Celebration Banner */}
        {celebration && (
          <Card className={`mb-6 bg-gradient-to-r ${celebration.color} text-white border-none`}>
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{celebration.emoji}</span>
                <div>
                  <h3 className="text-xl font-bold">{celebration.message}</h3>
                  <p className="text-white/90">You've paid {formatCurrency(totalPaid)} so far!</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Progress Overview */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              Progress Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">
                  {formatCurrency(totalPaid)} of {formatCurrency(calculator.totalAmount)}
                </span>
                <span className="text-sm font-bold text-blue-600">{progress.toFixed(1)}%</span>
              </div>
              <Progress value={progress} className="h-4" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <CardContent className="pt-6">
                  <div className="text-sm text-green-700 font-medium mb-1">Total Paid</div>
                  <div className="text-2xl font-bold text-green-900">{formatCurrency(totalPaid)}</div>
                  <div className="text-xs text-green-600 mt-1">+{progress.toFixed(1)}% Complete</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                <CardContent className="pt-6">
                  <div className="text-sm text-blue-700 font-medium mb-1">Remaining</div>
                  <div className="text-2xl font-bold text-blue-900">{formatCurrency(remaining)}</div>
                  <div className="text-xs text-blue-600 mt-1">{(100 - progress).toFixed(1)}% To Go</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                <CardContent className="pt-6">
                  <div className="text-sm text-purple-700 font-medium mb-1">Payments</div>
                  <div className="text-2xl font-bold text-purple-900">{payments.length}</div>
                  <div className="text-xs text-purple-600 mt-1">
                    {payments.length === 0 ? "Get started!" : payments.length === 1 ? "First payment!" : `${payments.length} milestones`}
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Make Payment */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-green-600" />
              Make a Payment
            </CardTitle>
            <CardDescription>Record a new payment towards your loan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="text-lg"
                />
              </div>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {currency === "GBP" && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm">
                <div className="font-medium text-blue-900">
                  ≈ {formatCurrency(parseFloat(paymentAmount || "0") * exchangeRate)} USD
                </div>
                <div className="text-blue-600 text-xs mt-1">
                  Rate: 1 GBP = {exchangeRate.toFixed(4)} USD
                  {lastRateUpdate && ` • Updated ${lastRateUpdate.toLocaleTimeString()}`}
                </div>
              </div>
            )}

            <Button
              className="w-full mt-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              size="lg"
              onClick={handleMakePayment}
              disabled={createPayment.isPending || !paymentAmount}
            >
              {createPayment.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Recording...
                </>
              ) : (
                <>
                  <DollarSign className="w-4 h-4 mr-2" />
                  Record Payment
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Payment History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-6 h-6 text-purple-600" />
              Payment History
            </CardTitle>
            <CardDescription>
              {payments.length === 0
                ? "No payments yet"
                : `${payments.length} payment${payments.length > 1 ? "s" : ""} recorded`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {paymentsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No payments recorded yet. Make your first payment above!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {payments
                  .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
                  .map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors group"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="font-bold text-lg">
                            {formatCurrency(payment.usdAmount)}
                          </div>
                          {payment.currency !== "USD" && (
                            <div className="text-sm text-muted-foreground">
                              ({payment.amount} {payment.currency})
                            </div>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {new Date(payment.paymentDate).toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDeletePayment(payment.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
