import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles, Calculator } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function CreateCalculator() {
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(useSearch());
  
  const suggestedAmount = searchParams.get("amount");
  const suggestedMonths = searchParams.get("months");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [totalAmount, setTotalAmount] = useState(suggestedAmount || "");
  const [targetMonths, setTargetMonths] = useState(suggestedMonths || "");
  const [currency, setCurrency] = useState("USD");

  const createCalculator = trpc.calculator.create.useMutation({
    onSuccess: (result) => {
      toast.success("Calculator created!");
      // @ts-ignore - result contains insertId
      setLocation(`/calculator/${result[0]?.insertId || 1}`);
    },
    onError: (error) => {
      toast.error("Failed to create calculator: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !totalAmount) {
      toast.error("Please fill in required fields");
      return;
    }

    createCalculator.mutate({
      name,
      description: description || undefined,
      totalAmount,
      targetMonths: targetMonths ? parseInt(targetMonths) : undefined,
      currency,
    });
  };

  const hasAISuggestions = suggestedAmount && suggestedMonths;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full">
              {hasAISuggestions ? (
                <Sparkles className="w-8 h-8 text-white" />
              ) : (
                <Calculator className="w-8 h-8 text-white" />
              )}
            </div>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Create Your Calculator
          </CardTitle>
          <CardDescription className="text-lg mt-2">
            {hasAISuggestions
              ? "We've pre-filled some values based on your responses"
              : "Set up a new loan calculator"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Calculator Name *</Label>
              <Input
                id="name"
                placeholder="E.g., Business Loan, Personal Loan, Mortgage..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Add notes about this loan..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency *</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Total Loan Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder={currency === "USD" ? "300000" : "230000"}
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  required
                />
                {hasAISuggestions && suggestedAmount && (
                  <p className="text-xs text-blue-600 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    AI suggested: {currency === "USD" ? "$" : "£"}{parseInt(suggestedAmount).toLocaleString()}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="months">Target Months (Optional)</Label>
                <Input
                  id="months"
                  type="number"
                  placeholder="24"
                  value={targetMonths}
                  onChange={(e) => setTargetMonths(e.target.value)}
                />
                {hasAISuggestions && suggestedMonths && (
                  <p className="text-xs text-blue-600 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    AI suggested: {suggestedMonths} months
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation("/dashboard")}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createCalculator.isPending}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {createCalculator.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Calculator className="w-4 h-4 mr-2" />
                    Create Calculator
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
