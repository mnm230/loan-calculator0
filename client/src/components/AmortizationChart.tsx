import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown } from "lucide-react";

interface Payment {
  id: number;
  amount: string;
  usdAmount: string;
  currency: string;
  paymentDate: Date;
  createdAt: Date;
}

interface AmortizationChartProps {
  totalAmount: string;
  currency: string;
  payments: Payment[];
  targetMonths?: number;
}

export function AmortizationChart({ totalAmount, currency, payments, targetMonths }: AmortizationChartProps) {
  const chartData = useMemo(() => {
    const total = parseFloat(totalAmount);
    const sortedPayments = [...payments].sort(
      (a, b) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime()
    );

    const data = [
      {
        date: "Start",
        balance: total,
        paid: 0,
        displayDate: "Start",
      },
    ];

    let runningBalance = total;
    let runningPaid = 0;

    sortedPayments.forEach((payment, index) => {
      const paymentAmount = parseFloat(payment.usdAmount);
      runningPaid += paymentAmount;
      runningBalance = Math.max(0, total - runningPaid);

      const paymentDate = new Date(payment.paymentDate);
      const displayDate = paymentDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

      data.push({
        date: paymentDate.toISOString(),
        balance: runningBalance,
        paid: runningPaid,
        displayDate: displayDate,
      });
    });

    // Add projection if target months is set and loan not paid off
    if (targetMonths && runningBalance > 0) {
      const monthlyTarget = total / targetMonths;
      const monthsElapsed = sortedPayments.length > 0 
        ? Math.ceil((new Date().getTime() - new Date(sortedPayments[0].paymentDate).getTime()) / (1000 * 60 * 60 * 24 * 30))
        : 0;
      
      const projectedMonthsRemaining = Math.ceil(runningBalance / monthlyTarget);
      const projectedEndDate = new Date();
      projectedEndDate.setMonth(projectedEndDate.getMonth() + projectedMonthsRemaining);

      data.push({
        date: projectedEndDate.toISOString(),
        balance: 0,
        paid: total,
        displayDate: projectedEndDate.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        }),
      });
    }

    return data;
  }, [totalAmount, payments, targetMonths]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-semibold mb-2">{payload[0].payload.displayDate}</p>
          <p className="text-sm text-green-600 dark:text-green-400">
            Paid: {formatCurrency(payload[0].payload.paid)}
          </p>
          <p className="text-sm text-red-600 dark:text-red-400">
            Remaining: {formatCurrency(payload[0].payload.balance)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-blue-600" />
          Balance Over Time
        </CardTitle>
        <CardDescription>
          Track your loan balance as you make payments
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorPaid" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="displayDate" 
              stroke="#6b7280"
              style={{ fontSize: "12px" }}
            />
            <YAxis 
              stroke="#6b7280"
              style={{ fontSize: "12px" }}
              tickFormatter={formatCurrency}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area
              type="monotone"
              dataKey="balance"
              stroke="#ef4444"
              fillOpacity={1}
              fill="url(#colorBalance)"
              name="Remaining Balance"
            />
            <Area
              type="monotone"
              dataKey="paid"
              stroke="#10b981"
              fillOpacity={1}
              fill="url(#colorPaid)"
              name="Amount Paid"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
