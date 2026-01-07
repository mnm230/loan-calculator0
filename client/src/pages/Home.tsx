import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, TrendingUp, DollarSign, Calendar, Trash2, LogOut, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const TOTAL_LOAN = 300000;
const PASSWORD = "London100";

interface Payment {
  id: string;
  amount: number;
  currency: string;
  usdAmount: number;
  date: Date;
  remainingBalance: number;
}

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [exchangeRate, setExchangeRate] = useState(1);
  const [lastUpdate, setLastUpdate] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Load data from localStorage
  useEffect(() => {
    const auth = sessionStorage.getItem("calculator_auth");
    if (auth === "true") {
      setIsAuthenticated(true);
    }

    const saved = localStorage.getItem("loan_payments");
    if (saved) {
      const parsed = JSON.parse(saved);
      setPayments(parsed.map((p: any) => ({ ...p, date: new Date(p.date) })));
    }
  }, []);

  // Fetch exchange rate
  useEffect(() => {
    fetchExchangeRate();
    const interval = setInterval(fetchExchangeRate, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const fetchExchangeRate = async () => {
    try {
      const response = await fetch("https://open.er-api.com/v6/latest/GBP");
      const data = await response.json();
      setExchangeRate(data.rates.USD);
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (error) {
      console.error("Failed to fetch exchange rate:", error);
    }
  };

  const handleLogin = () => {
    if (password === PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem("calculator_auth", "true");
      toast.success("Login successful!");
    } else {
      toast.error("Incorrect password");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem("calculator_auth");
    toast.success("Logged out");
  };

  const totalPaid = payments.reduce((sum, p) => sum + p.usdAmount, 0);
  const remaining = TOTAL_LOAN - totalPaid;
  const progress = (totalPaid / TOTAL_LOAN) * 100;

  const handleMakePayment = () => {
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (amount > remaining) {
      toast.error("Payment amount exceeds remaining balance");
      return;
    }

    const usdAmount = currency === "GBP" ? amount * exchangeRate : amount;
    const newPayment: Payment = {
      id: Date.now().toString(),
      amount,
      currency,
      usdAmount,
      date: new Date(),
      remainingBalance: remaining - usdAmount,
    };

    const updated = [newPayment, ...payments];
    setPayments(updated);
    localStorage.setItem("loan_payments", JSON.stringify(updated));
    setPaymentAmount("");
    toast.success(`Payment of ${currency} ${Math.round(amount)} recorded!`);
  };

  const handleDeletePayment = (id: string) => {
    const updated = payments.filter((p) => p.id !== id);
    setPayments(updated);
    localStorage.setItem("loan_payments", JSON.stringify(updated));
    toast.success("Payment deleted");
  };

  const handleReset = () => {
    if (confirm("Are you sure you want to reset all payments?")) {
      setPayments([]);
      localStorage.removeItem("loan_payments");
      toast.success("All payments cleared");
    }
  };

  const getCelebrationMessage = () => {
    if (progress >= 90) return { emoji: "🏁", title: "Almost There! Final Sprint!", color: "from-green-500 to-emerald-600" };
    if (progress >= 75) return { emoji: "🎉", title: "Outstanding Progress! 3/4 Complete!", color: "from-green-400 to-teal-500" };
    if (progress >= 50) return { emoji: "💪", title: "Halfway Victory! Keep Going!", color: "from-blue-400 to-cyan-500" };
    if (progress >= 25) return { emoji: "🌟", title: "Great Momentum! Quarter Done!", color: "from-purple-400 to-pink-500" };
    if (progress >= 10) return { emoji: "🚀", title: "Strong Start! You're On Track!", color: "from-yellow-400 to-orange-500" };
    return null;
  };

  const getScenarios = () => {
    const scenarios = [
      {
        name: "Debt-Free Sprint",
        months: 6,
        monthly: Math.round(remaining / 6),
        confidence: "Low",
        icon: "⚡",
        color: "text-red-600",
      },
      {
        name: "Accelerated Payoff",
        months: 12,
        monthly: Math.round(remaining / 12),
        confidence: "Medium",
        icon: "🚀",
        color: "text-orange-600",
      },
      {
        name: "Balanced Growth",
        months: 18,
        monthly: Math.round(remaining / 18),
        confidence: "High",
        icon: "🎯",
        color: "text-green-600",
        recommended: true,
      },
      {
        name: "Steady & Sustainable",
        months: 24,
        monthly: Math.round(remaining / 24),
        confidence: "High",
        icon: "🌱",
        color: "text-blue-600",
      },
      {
        name: "Conservative Safety",
        months: 36,
        monthly: Math.round(remaining / 36),
        confidence: "High",
        icon: "🛡️",
        color: "text-purple-600",
      },
    ];

    return scenarios.map((s) => ({
      ...s,
      completion: new Date(Date.now() + s.months * 30 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      gbpMonthly: Math.round(s.monthly / exchangeRate),
    }));
  };

  const celebration = getCelebrationMessage();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md p-8 shadow-xl">
          <div className="flex flex-col items-center space-y-6">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <Calculator className="w-8 h-8 text-white" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">Calculator Login</h1>
              <p className="text-gray-600 mt-2">Enter your password to access the loan repayment tracker</p>
            </div>
            <div className="w-full space-y-4">
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                />
              </div>
              <Button onClick={handleLogin} className="w-full">
                Login
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Calculator</h1>
            <p className="text-gray-600 mt-2">Professional loan repayment tracking for your $300,000 loan</p>
          </div>
          <Button onClick={handleLogout} variant="outline" size="sm">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Celebration Banner */}
        {celebration && (
          <Card className={`mb-8 p-6 bg-gradient-to-r ${celebration.color} text-white`}>
            <div className="flex items-center space-x-4">
              <span className="text-4xl">{celebration.emoji}</span>
              <div>
                <h2 className="text-2xl font-bold">{celebration.title}</h2>
                <p className="text-white/90">You've paid ${Math.round(totalPaid)} so far!</p>
              </div>
            </div>
          </Card>
        )}

        {/* Progress Overview */}
        <Card className="mb-8 p-6">
          <h2 className="text-2xl font-semibold mb-4">Loan Progress</h2>
          <p className="text-gray-600 mb-4">
            ${Math.round(totalPaid)} paid of ${TOTAL_LOAN.toLocaleString()}
          </p>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Progress</span>
              <span>{progress.toFixed(1)}%</span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <Card className="p-4 bg-green-50 border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Paid</p>
                  <p className="text-2xl font-bold text-green-600">${Math.round(totalPaid)}</p>
                  <p className="text-xs text-green-600 mt-1">+{progress.toFixed(1)}% Complete</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </Card>

            <Card className="p-4 bg-blue-50 border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Remaining</p>
                  <p className="text-2xl font-bold text-blue-600">${Math.round(remaining)}</p>
                  <p className="text-xs text-blue-600 mt-1">{(100 - progress).toFixed(1)}% To Go</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
            </Card>

            <Card className="p-4 bg-purple-50 border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Payments</p>
                  <p className="text-2xl font-bold text-purple-600">{payments.length}</p>
                  <p className="text-xs text-purple-600 mt-1">{payments.length === 1 ? "First payment!" : `${payments.length} milestones`}</p>
                </div>
                <Calendar className="w-8 h-8 text-purple-600" />
              </div>
            </Card>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Make Payment */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Make Payment</h2>
            <p className="text-gray-600 mb-4">Enter any amount to reduce your balance</p>

            <div className="space-y-4">
              <div>
                <Label>Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                    <SelectItem value="GBP">GBP - British Pound</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Amount</Label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleMakePayment()}
                />
                {currency === "GBP" && paymentAmount && (
                  <p className="text-sm text-gray-600 mt-1">
                    ≈ ${Math.round(parseFloat(paymentAmount) * exchangeRate)} USD (Rate: 1 GBP = {exchangeRate.toFixed(4)} USD)
                  </p>
                )}
              </div>

              <Button onClick={handleMakePayment} className="w-full" disabled={!paymentAmount}>
                Make Payment
              </Button>

              <div className="grid grid-cols-2 gap-2">
                {[12, 15, 18, 24].map((months) => (
                  <Button
                    key={months}
                    variant="outline"
                    size="sm"
                    onClick={() => setPaymentAmount(Math.round(remaining / months).toString())}
                  >
                    {months}mo: ${Math.round(remaining / months)}
                  </Button>
                ))}
              </div>

              <Button onClick={handleReset} variant="destructive" size="sm" className="w-full">
                Reset Loan
              </Button>
            </div>
          </Card>

          {/* Repayment Plans */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Repayment Plans</h2>
              <Button variant="ghost" size="sm" onClick={fetchExchangeRate}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-gray-600 mb-4">Monthly payment options</p>

            <div className="space-y-3">
              {getScenarios().slice(0, 4).map((scenario) => (
                <Card key={scenario.name} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">{scenario.icon}</span>
                        <h3 className="font-semibold">{scenario.name}</h3>
                        {scenario.recommended && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Recommended</span>
                        )}
                      </div>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm">
                          <span className="font-semibold text-blue-600">${scenario.monthly}/month USD</span>
                        </p>
                        <p className="text-sm">
                          <span className="font-semibold text-purple-600">£{scenario.gbpMonthly}/month GBP</span>
                        </p>
                        <p className="text-xs text-gray-600">Completion: {scenario.completion}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <p className="text-xs text-gray-500 mt-4">
              Exchange rate: 1 GBP = {exchangeRate.toFixed(4)} USD (Updated: {lastUpdate})
            </p>
          </Card>
        </div>

        {/* AI Scenarios */}
        <Card className="mt-8 p-6">
          <h2 className="text-2xl font-semibold mb-4">Smart Completion Projections</h2>
          <p className="text-gray-600 mb-6">AI-powered scenarios based on your payment patterns and financial goals</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getScenarios().map((scenario) => (
              <Card key={scenario.name} className="p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-center space-x-3 mb-3">
                  <span className="text-3xl">{scenario.icon}</span>
                  <div>
                    <h3 className="font-semibold">{scenario.name}</h3>
                    <span className={`text-xs ${scenario.color}`}>{scenario.confidence} Confidence</span>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-gray-600">Monthly Payment:</span>
                    <br />
                    <span className="font-semibold">${scenario.monthly}</span>
                  </p>
                  <p>
                    <span className="text-gray-600">Duration:</span>
                    <br />
                    <span className="font-semibold">{scenario.months} months</span>
                  </p>
                  <p>
                    <span className="text-gray-600">Completion:</span>
                    <br />
                    <span className="font-semibold">{scenario.completion}</span>
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </Card>

        {/* Payment History */}
        <Card className="mt-8 p-6">
          <h2 className="text-2xl font-semibold mb-4">Payment History</h2>
          <p className="text-gray-600 mb-4">All payments and remaining balances</p>

          {payments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No payments made yet</p>
              <p className="text-sm">Make your first payment to start tracking</p>
            </div>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => (
                <Card key={payment.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                          <DollarSign className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <p className="font-semibold">
                            {payment.currency} {Math.round(payment.amount)}
                            {payment.currency === "GBP" && (
                              <span className="text-sm text-gray-600 ml-2">(${Math.round(payment.usdAmount)} USD)</span>
                            )}
                          </p>
                          <p className="text-sm text-gray-600">{payment.date.toLocaleDateString()}</p>
                          <p className="text-xs text-gray-500">Remaining: ${Math.round(payment.remainingBalance)}</p>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleDeletePayment(payment.id)}>
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
