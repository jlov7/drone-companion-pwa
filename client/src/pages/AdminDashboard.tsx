import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/authContext";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ApiSettingsManager } from "@/components/admin/ApiSettingsManager";
import { AiModelsManager } from "@/components/admin/AiModelsManager";
import { AiUsageStats } from "@/components/admin/AiUsageStats";
import { Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function AdminDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");

  // Check if user is admin
  const {
    data: isAdmin,
    isLoading: adminCheckLoading,
    error,
  } = useQuery({
    queryKey: ["/api/admin/check"],
    queryFn: async () => {
      try {
        // Just try to access an admin endpoint - if it succeeds, user is admin
        await apiRequest("/api/admin/users", {
          method: "GET",
        });
        return true;
      } catch (error) {
        return false;
      }
    },
    // Only run this query if user is authenticated
    enabled: !!user,
  });

  const isLoading = authLoading || adminCheckLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If not logged in, redirect to login
  if (!user && !authLoading) {
    setLocation("/login");
    return null;
  }

  // If not an admin, show access denied
  if (!isAdmin && !adminCheckLoading) {
    return (
      <div className="container max-w-7xl mx-auto py-12">
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-500 mb-8">
            You do not have permission to access the admin dashboard.
          </p>
          <Button onClick={() => setLocation("/")}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto py-6 space-y-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-500">
          Manage system settings, API integrations, and AI models.
        </p>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="border-b">
          <TabsList className="mb-[-1px]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="api-settings">API Settings</TabsTrigger>
            <TabsTrigger value="ai-models">AI Models</TabsTrigger>
            <TabsTrigger value="usage-stats">Usage Statistics</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">API Settings</h2>
              <p className="text-gray-600 mb-4">
                Configure API providers and keys for external services such as Gemini AI.
              </p>
              <Button 
                variant="outline" 
                onClick={() => setActiveTab("api-settings")}
              >
                Manage API Settings
              </Button>
            </div>
            <div className="border rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">AI Models</h2>
              <p className="text-gray-600 mb-4">
                Configure and manage AI models, including settings and capabilities.
              </p>
              <Button 
                variant="outline" 
                onClick={() => setActiveTab("ai-models")}
              >
                Manage AI Models
              </Button>
            </div>
            <div className="border rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Usage Statistics</h2>
              <p className="text-gray-600 mb-4">
                Monitor AI API usage, costs, and success rates across all features.
              </p>
              <Button 
                variant="outline" 
                onClick={() => setActiveTab("usage-stats")}
              >
                View Usage Statistics
              </Button>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="api-settings">
          <ApiSettingsManager />
        </TabsContent>
        
        <TabsContent value="ai-models">
          <AiModelsManager />
        </TabsContent>
        
        <TabsContent value="usage-stats">
          <AiUsageStats />
        </TabsContent>
      </Tabs>
    </div>
  );
}