import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChartIcon } from "lucide-react";

interface Payment {
  id: number;
  amount: string;
  usdAmount: string;
  currency: string;
  paymentDate: Date;
}

interface PaymentProgressChartProps {
  totalAmount: string;
  currency: string;
  payments: Payment[];
}

export function PaymentProgressChart({ totalAmount, currency, payments }: PaymentProgressChartProps) {
  const chartData = useMemo(() => {
    const total = parseFloat(totalAmount);
    const totalPaid = payments.reduce((sum, payment) => sum + parseFloat(payment.usdAmount), 0);
    const remaining = Math.max(0, total - totalPaid);

    return [
      { name: "Paid", value: totalPaid, percentage: ((totalPaid / total) * 100).toFixed(1) },
      { name: "Remaining", value: remaining, percentage: ((remaining / total) * 100).toFixed(1) },
    ];
  }, [totalAmount, payments]);

  const COLORS = {
    Paid: "#10b981", // green
    Remaining: "#ef4444", // red
  };

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
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-semibold mb-2">{data.name}</p>
          <p className="text-sm">{formatCurrency(data.value)}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{data.percentage}%</p>
        </div>
      );
    }
    return null;
  };

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null; // Don't show label if slice is too small

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        className="font-bold text-sm"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChartIcon className="w-5 h-5 text-purple-600" />
          Payment Progress
        </CardTitle>
        <CardDescription>
          Visual breakdown of paid vs remaining balance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={CustomLabel}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-4 grid grid-cols-2 gap-4">
          {chartData.map((item) => (
            <div key={item.name} className="text-center">
              <div
                className="w-4 h-4 rounded-full mx-auto mb-2"
                style={{ backgroundColor: COLORS[item.name as keyof typeof COLORS] }}
              />
              <p className="text-sm font-medium">{item.name}</p>
              <p className="text-lg font-bold">{formatCurrency(item.value)}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">{item.percentage}%</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
