import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, BarChart3, TrendingDown } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function CompareCalculators() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const { data: calculators = [] } = trpc.calculator.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: allPayments = [] } = trpc.payment.list.useQuery(
    { calculatorId: 0 }, // We'll fetch all payments
    { enabled: isAuthenticated }
  );

  const selectedCalculators = useMemo(() => {
    return calculators.filter(calc => selectedIds.includes(calc.id));
  }, [calculators, selectedIds]);

  const comparisonData = useMemo(() => {
    return selectedCalculators.map(calc => {
      const calcPayments = allPayments.filter(p => p.calculatorId === calc.id);
      const totalPaid = calcPayments.reduce((sum, p) => sum + parseFloat(p.usdAmount), 0);
      const totalAmount = parseFloat(calc.totalAmount);
      const remaining = totalAmount - totalPaid;
      const progress = (totalPaid / totalAmount) * 100;

      return {
        id: calc.id,
        name: calc.name,
        totalAmount,
        totalPaid,
        remaining,
        progress,
        paymentCount: calcPayments.length,
        averagePayment: calcPayments.length > 0 ? totalPaid / calcPayments.length : 0,
        currency: calc.currency,
      };
    });
  }, [selectedCalculators, allPayments]);

  const chartData = useMemo(() => {
    return comparisonData.map(data => ({
      name: data.name.length > 15 ? data.name.substring(0, 15) + '...' : data.name,
      'Total Amount': data.totalAmount,
      'Total Paid': data.totalPaid,
      'Remaining': data.remaining,
    }));
  }, [comparisonData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const toggleCalculator = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={() => setLocation("/dashboard")} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Compare Loan Scenarios
          </h1>
          <p className="text-muted-foreground mt-2">
            Select calculators to compare side-by-side
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calculator Selection */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Select Calculators</CardTitle>
              <CardDescription>
                Choose 2-4 calculators to compare
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {calculators.map(calc => (
                  <div
                    key={calc.id}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent cursor-pointer"
                    onClick={() => toggleCalculator(calc.id)}
                  >
                    <Checkbox
                      checked={selectedIds.includes(calc.id)}
                      onCheckedChange={() => toggleCalculator(calc.id)}
                    />
                    <div className="flex-1">
                      <p className="font-medium">{calc.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(parseFloat(calc.totalAmount))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {selectedIds.length > 0 && (
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => setSelectedIds([])}
                >
                  Clear Selection
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Comparison Display */}
          <div className="lg:col-span-2 space-y-6">
            {selectedIds.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <BarChart3 className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">
                    Select at least one calculator to start comparing
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Comparison Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingDown className="w-5 h-5 text-blue-600" />
                      Amount Comparison
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend />
                        <Bar dataKey="Total Amount" fill="#3b82f6" />
                        <Bar dataKey="Total Paid" fill="#10b981" />
                        <Bar dataKey="Remaining" fill="#ef4444" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Comparison Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>Detailed Comparison</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-3 font-semibold">Metric</th>
                            {comparisonData.map(data => (
                              <th key={data.id} className="text-right p-3 font-semibold">
                                {data.name}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b hover:bg-accent/50">
                            <td className="p-3 font-medium">Total Amount</td>
                            {comparisonData.map(data => (
                              <td key={data.id} className="text-right p-3">
                                {formatCurrency(data.totalAmount)}
                              </td>
                            ))}
                          </tr>
                          <tr className="border-b hover:bg-accent/50">
                            <td className="p-3 font-medium">Total Paid</td>
                            {comparisonData.map(data => (
                              <td key={data.id} className="text-right p-3 text-green-600 font-semibold">
                                {formatCurrency(data.totalPaid)}
                              </td>
                            ))}
                          </tr>
                          <tr className="border-b hover:bg-accent/50">
                            <td className="p-3 font-medium">Remaining</td>
                            {comparisonData.map(data => (
                              <td key={data.id} className="text-right p-3 text-red-600 font-semibold">
                                {formatCurrency(data.remaining)}
                              </td>
                            ))}
                          </tr>
                          <tr className="border-b hover:bg-accent/50">
                            <td className="p-3 font-medium">Progress</td>
                            {comparisonData.map(data => (
                              <td key={data.id} className="text-right p-3">
                                {data.progress.toFixed(1)}%
                              </td>
                            ))}
                          </tr>
                          <tr className="border-b hover:bg-accent/50">
                            <td className="p-3 font-medium">Payments Made</td>
                            {comparisonData.map(data => (
                              <td key={data.id} className="text-right p-3">
                                {data.paymentCount}
                              </td>
                            ))}
                          </tr>
                          <tr className="border-b hover:bg-accent/50">
                            <td className="p-3 font-medium">Average Payment</td>
                            {comparisonData.map(data => (
                              <td key={data.id} className="text-right p-3">
                                {data.paymentCount > 0 ? formatCurrency(data.averagePayment) : '-'}
                              </td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
