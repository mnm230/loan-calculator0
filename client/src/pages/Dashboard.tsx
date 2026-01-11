import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calculator, Plus, TrendingUp, DollarSign, Calendar, Trash2, Search, Filter, ArrowUpDown, Sparkles, GitCompare } from "lucide-react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Dashboard() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  
  // Filter and sort state
  const [searchQuery, setSearchQuery] = useState("");
  const [currencyFilter, setCurrencyFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date-newest");

  const { data: calculators, isLoading } = trpc.calculator.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  
  // Filter and sort calculators
  const filteredAndSortedCalculators = useMemo(() => {
    if (!calculators) return [];
    
    let filtered = calculators;
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(calc => 
        calc.name.toLowerCase().includes(query) ||
        calc.description?.toLowerCase().includes(query)
      );
    }
    
    // Apply currency filter
    if (currencyFilter !== "all") {
      filtered = filtered.filter(calc => calc.currency === currencyFilter);
    }
    
    // Apply sorting
    const sorted = [...filtered];
    switch (sortBy) {
      case "amount-high":
        sorted.sort((a, b) => parseFloat(b.totalAmount) - parseFloat(a.totalAmount));
        break;
      case "amount-low":
        sorted.sort((a, b) => parseFloat(a.totalAmount) - parseFloat(b.totalAmount));
        break;
      case "date-newest":
        sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case "date-oldest":
        sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
    }
    
    return sorted;
  }, [calculators, searchQuery, currencyFilter, sortBy]);

  const deleteCalculator = trpc.calculator.delete.useMutation({
    onSuccess: () => {
      toast.success("Calculator deleted");
      utils.calculator.list.invalidate();
    },
    onError: (error) => {
      toast.error("Failed to delete: " + error.message);
    },
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full">
                <Calculator className="w-8 h-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl">Welcome to Calculator</CardTitle>
            <CardDescription className="text-base mt-2">
              Create personalized loan calculators and track your repayment journey
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              size="lg"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              onClick={() => (window.location.href = getLoginUrl())}
            >
              Sign In to Get Started
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(parseFloat(amount));
  };

  const handleDelete = (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteCalculator.mutate({ id });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <Calculator className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Calculator
              </h1>
              <p className="text-sm text-muted-foreground">Welcome back, {user?.name || "User"}!</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {calculators && calculators.length > 1 && (
              <Button
                variant="outline"
                onClick={() => setLocation("/compare")}
              >
                <GitCompare className="w-4 h-4 mr-2" />
                Compare
              </Button>
            )}
            <Button
              onClick={() => setLocation("/onboarding")}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Calculator
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Filters and Search */}
        {!isLoading && calculators && calculators.length > 0 && (
          <div className="mb-6 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search calculators..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {/* Currency Filter */}
              <Select value={currencyFilter} onValueChange={setCurrencyFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Currencies</SelectItem>
                  <SelectItem value="USD">USD Only</SelectItem>
                  <SelectItem value="GBP">GBP Only</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Sort Dropdown */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <ArrowUpDown className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-newest">Date: Newest First</SelectItem>
                  <SelectItem value="date-oldest">Date: Oldest First</SelectItem>
                  <SelectItem value="amount-high">Amount: High to Low</SelectItem>
                  <SelectItem value="amount-low">Amount: Low to High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Results Count */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <p>
                Showing {filteredAndSortedCalculators.length} of {calculators.length} calculator{calculators.length !== 1 ? 's' : ''}
              </p>
              {(searchQuery || currencyFilter !== "all" || sortBy !== "date-newest") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setCurrencyFilter("all");
                    setSortBy("date-newest");
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        )}
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2 mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredAndSortedCalculators.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedCalculators.map((calc) => (
              <Card
                key={calc.id}
                className="hover:shadow-lg transition-shadow cursor-pointer group relative"
                onClick={() => setLocation(`/calculator/${calc.id}`)}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(calc.id, calc.name);
                  }}
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    {calc.name}
                  </CardTitle>
                  {calc.description && (
                    <CardDescription className="line-clamp-2">{calc.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium">Total Amount</span>
                    </div>
                    <span className="font-bold text-lg">{formatCurrency(calc.totalAmount)}</span>
                  </div>
                  {calc.targetMonths && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium">Target</span>
                      </div>
                      <span className="font-semibold">{calc.targetMonths} months</span>
                    </div>
                  )}
                  <div className="pt-2">
                    <div className="text-xs text-muted-foreground">
                      Created {new Date(calc.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : calculators && calculators.length > 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="flex justify-center mb-4">
                <div className="p-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full">
                  <Search className="w-12 h-12 text-gray-400" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-2">No Calculators Found</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                No calculators match your current filters. Try adjusting your search or filters.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setCurrencyFilter("all");
                  setSortBy("date-newest");
                }}
              >
                Clear All Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <div className="flex justify-center mb-4">
                <div className="p-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full">
                  <Calculator className="w-12 h-12 text-blue-600" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-2">No Calculators Yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Get started by creating your first loan calculator. Our AI will help you set it up based on
                your financial goals!
              </p>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => setLocation("/create")}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Calculator
            </Button>
            <Button
              onClick={() => setLocation("/onboarding")}
              size="lg"
              variant="outline"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Use AI Setup
            </Button>
          </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
