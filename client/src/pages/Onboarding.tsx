import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, Sparkles, TrendingUp, Target, DollarSign } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    financialGoal: "",
    monthlyIncome: "",
    riskTolerance: "medium" as "low" | "medium" | "high",
    preferredPaymentFrequency: "monthly",
    hasEmergencyFund: false,
    otherDebts: "",
  });

  const analyzeGoals = trpc.onboarding.analyzeGoals.useMutation({
    onSuccess: (suggestion) => {
      toast.success("AI analysis complete!");
      // Navigate to create calculator with suggestions
      setLocation(`/create?amount=${suggestion.suggestedAmount}&months=${suggestion.suggestedMonths}`);
    },
    onError: (error) => {
      toast.error("Failed to analyze goals: " + error.message);
    },
  });

  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1);
    } else {
      // Submit to AI
      analyzeGoals.mutate(formData);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.financialGoal.length > 10;
      case 2:
        return formData.monthlyIncome.length > 0;
      case 3:
        return true;
      case 4:
        return true;
      case 5:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Let's Personalize Your Experience
          </CardTitle>
          <CardDescription className="text-lg mt-2">
            Answer a few questions so we can create the perfect loan calculator for you
          </CardDescription>
          <div className="flex justify-center gap-2 mt-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all ${
                  i <= step ? "w-12 bg-gradient-to-r from-blue-500 to-purple-600" : "w-8 bg-gray-200"
                }`}
              />
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3 mb-4">
                <Target className="w-6 h-6 text-blue-600" />
                <h3 className="text-xl font-semibold">What's your financial goal?</h3>
              </div>
              <Textarea
                placeholder="E.g., I want to pay off my $300,000 business loan in 2 years while maintaining cash flow for operations..."
                value={formData.financialGoal}
                onChange={(e) => setFormData({ ...formData, financialGoal: e.target.value })}
                className="min-h-[150px] text-base"
              />
              <p className="text-sm text-muted-foreground">
                Tell us about your loan, your goals, and any constraints you have. The more detail, the better!
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3 mb-4">
                <DollarSign className="w-6 h-6 text-green-600" />
                <h3 className="text-xl font-semibold">What's your monthly income?</h3>
              </div>
              <div className="space-y-2">
                <Label htmlFor="income">Monthly Income (USD)</Label>
                <Input
                  id="income"
                  type="number"
                  placeholder="50000"
                  value={formData.monthlyIncome}
                  onChange={(e) => setFormData({ ...formData, monthlyIncome: e.target.value })}
                  className="text-lg"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                This helps us recommend realistic payment amounts that won't strain your budget.
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-6 h-6 text-purple-600" />
                <h3 className="text-xl font-semibold">What's your risk tolerance?</h3>
              </div>
              <RadioGroup
                value={formData.riskTolerance}
                onValueChange={(value: "low" | "medium" | "high") =>
                  setFormData({ ...formData, riskTolerance: value })
                }
              >
                <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="low" id="low" />
                  <Label htmlFor="low" className="flex-1 cursor-pointer">
                    <div className="font-semibold">Conservative</div>
                    <div className="text-sm text-muted-foreground">
                      I prefer lower payments with more flexibility
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="medium" id="medium" />
                  <Label htmlFor="medium" className="flex-1 cursor-pointer">
                    <div className="font-semibold">Balanced</div>
                    <div className="text-sm text-muted-foreground">
                      I want a good balance between speed and comfort
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="high" id="high" />
                  <Label htmlFor="high" className="flex-1 cursor-pointer">
                    <div className="font-semibold">Aggressive</div>
                    <div className="text-sm text-muted-foreground">
                      I want to pay off debt as quickly as possible
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-xl font-semibold mb-4">Financial Safety Net</h3>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="emergency-fund" className="text-base font-medium">
                    Do you have an emergency fund?
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    3-6 months of expenses saved
                  </p>
                </div>
                <Switch
                  id="emergency-fund"
                  checked={formData.hasEmergencyFund}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, hasEmergencyFund: checked })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="other-debts">Other debts or financial obligations?</Label>
                <Textarea
                  id="other-debts"
                  placeholder="E.g., Car loan $500/month, credit card $200/month..."
                  value={formData.otherDebts}
                  onChange={(e) => setFormData({ ...formData, otherDebts: e.target.value })}
                  className="min-h-[100px]"
                />
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-xl font-semibold mb-4">Payment Preferences</h3>
              <div className="space-y-2">
                <Label htmlFor="frequency">Preferred payment frequency</Label>
                <RadioGroup
                  value={formData.preferredPaymentFrequency}
                  onValueChange={(value) =>
                    setFormData({ ...formData, preferredPaymentFrequency: value })
                  }
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="weekly" id="weekly" />
                    <Label htmlFor="weekly">Weekly</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="biweekly" id="biweekly" />
                    <Label htmlFor="biweekly">Bi-weekly</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="monthly" id="monthly" />
                    <Label htmlFor="monthly">Monthly</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="flexible" id="flexible" />
                    <Label htmlFor="flexible">Flexible (I'll pay when I can)</Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-900">
                  🎉 Great! We'll use AI to analyze your responses and create a personalized calculator
                  just for you.
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            {step > 1 && (
              <Button variant="outline" onClick={handleBack} className="flex-1">
                Back
              </Button>
            )}
            <Button
              onClick={handleNext}
              disabled={!canProceed() || analyzeGoals.isPending}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {analyzeGoals.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : step === 5 ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Create My Calculator
                </>
              ) : (
                "Next"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
