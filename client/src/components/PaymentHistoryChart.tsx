import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

interface Payment {
  id: number;
  amount: string;
  usdAmount: string;
  currency: string;
  paymentDate: Date;
  createdAt: Date;
}

interface PaymentHistoryChartProps {
  payments: Payment[];
  currency: string;
}

export function PaymentHistoryChart({ payments, currency }: PaymentHistoryChartProps) {
  const chartData = useMemo(() => {
    const sortedPayments = [...payments].sort(
      (a, b) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime()
    );

    return sortedPayments.map((payment, index) => {
      const paymentDate = new Date(payment.paymentDate);
      const displayDate = paymentDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

      return {
        date: displayDate,
        amount: parseFloat(payment.usdAmount),
        currency: payment.currency,
        fullDate: paymentDate.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        }),
        paymentNumber: index + 1,
      };
    });
  }, [payments]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-semibold mb-2">Payment #{data.paymentNumber}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{data.fullDate}</p>
          <p className="text-lg font-bold text-green-600 dark:text-green-400">
            {formatCurrency(data.amount)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">Currency: {data.currency}</p>
        </div>
      );
    }
    return null;
  };

  const totalPaid = useMemo(() => {
    return payments.reduce((sum, payment) => sum + parseFloat(payment.usdAmount), 0);
  }, [payments]);

  const averagePayment = useMemo(() => {
    return payments.length > 0 ? totalPaid / payments.length : 0;
  }, [totalPaid, payments.length]);

  if (payments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-green-600" />
            Payment History
          </CardTitle>
          <CardDescription>
            Your payment timeline will appear here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p>No payments recorded yet</p>
            <p className="text-sm mt-2">Make your first payment to see the chart</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-green-600" />
          Payment History
        </CardTitle>
        <CardDescription>
          Timeline of all your payments
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
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
            <Bar 
              dataKey="amount" 
              fill="#10b981" 
              name="Payment Amount"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-6 grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Paid</p>
            <p className="text-xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(totalPaid)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Average Payment</p>
            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
              {formatCurrency(averagePayment)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
