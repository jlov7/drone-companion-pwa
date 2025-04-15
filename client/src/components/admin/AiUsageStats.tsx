import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCcw, Check, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

// Define the AI usage stat type
interface AiUsageStat {
  id: number;
  provider: string;
  modelId: string;
  feature: string;
  userId: number | null;
  tokenCount: number | null;
  promptTokens: number | null;
  completionTokens: number | null;
  estimatedCost: number | null;
  successful: boolean | null;
  errorMessage: string | null;
  createdAt: string | null;
}

// Define the AI usage totals type
interface AiUsageTotals {
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  successRate: number;
}

export function AiUsageStats() {
  // Fetch AI usage stats
  const {
    data: aiUsageStats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ["/api/admin/ai-usage-stats"],
    queryFn: async () => {
      const response = await apiRequest<AiUsageStat[]>("/api/admin/ai-usage-stats?limit=50", {
        method: "GET",
      });
      return response;
    },
  });

  // Fetch AI usage totals
  const {
    data: aiUsageTotals,
    isLoading: totalsLoading,
    error: totalsError,
    refetch: refetchTotals,
  } = useQuery({
    queryKey: ["/api/admin/ai-usage-stats/totals"],
    queryFn: async () => {
      const response = await apiRequest<AiUsageTotals>("/api/admin/ai-usage-stats/totals", {
        method: "GET",
      });
      return response;
    },
  });

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  // Format cost
  const formatCost = (cost: number | null) => {
    if (cost === null) return "N/A";
    return `$${cost.toFixed(5)}`;
  };

  const isLoading = statsLoading || totalsLoading;
  const hasError = statsError || totalsError;

  const handleRefresh = () => {
    refetchStats();
    refetchTotals();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="p-4 bg-destructive/10 text-destructive rounded-md">
        <p>Error loading AI usage data. Please try again.</p>
        <Button variant="outline" onClick={handleRefresh} className="mt-2">
          <RefreshCcw className="mr-2 h-4 w-4" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">AI Usage Statistics</h2>

      {/* Stats Cards */}
      {aiUsageTotals && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Total Requests</CardTitle>
              <CardDescription>AI API calls made</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{aiUsageTotals.totalRequests.toLocaleString()}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Total Tokens</CardTitle>
              <CardDescription>Tokens processed</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{aiUsageTotals.totalTokens.toLocaleString()}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Estimated Cost</CardTitle>
              <CardDescription>Total API costs</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">${aiUsageTotals.totalCost.toFixed(2)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Success Rate</CardTitle>
              <CardDescription>API call success percentage</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{aiUsageTotals.successRate.toFixed(1)}%</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Usage Table */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Recent AI Usage</h3>
          <Button variant="outline" onClick={handleRefresh} size="sm">
            <RefreshCcw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </div>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Feature</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Tokens</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {aiUsageStats && aiUsageStats.length > 0 ? (
                aiUsageStats.map((stat) => (
                  <TableRow key={stat.id}>
                    <TableCell className="whitespace-nowrap">{formatDate(stat.createdAt)}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs font-medium">
                        {stat.feature}
                      </span>
                    </TableCell>
                    <TableCell>{stat.provider}</TableCell>
                    <TableCell><code className="text-xs bg-gray-100 p-1 rounded">{stat.modelId}</code></TableCell>
                    <TableCell>{stat.tokenCount || "-"}</TableCell>
                    <TableCell>{formatCost(stat.estimatedCost)}</TableCell>
                    <TableCell>
                      {stat.successful ? (
                        <div className="flex items-center">
                          <Check className="h-4 w-4 text-green-500 mr-1" />
                          <span className="text-green-600">Success</span>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <X className="h-4 w-4 text-red-500 mr-1" />
                          <span className="text-red-600 text-xs max-w-[200px] truncate" title={stat.errorMessage || ""}>
                            {stat.errorMessage || "Failed"}
                          </span>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    No AI usage data found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}