import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, RefreshCcw, Plus, Trash2, Edit } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

// Define the API settings type
interface ApiSetting {
  id: number;
  provider: string;
  apiKey: string | null;
  defaultModel: string | null;
  enabled: boolean | null;
  requestsCount: number | null;
  lastRequest: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

// API settings form schema
const apiSettingFormSchema = z.object({
  provider: z.string().min(1, "Provider is required"),
  apiKey: z.string().nullable().optional(),
  defaultModel: z.string().nullable().optional(),
  enabled: z.boolean().nullable().optional(),
});

type ApiSettingFormValues = z.infer<typeof apiSettingFormSchema>;

export function ApiSettingsManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedSetting, setSelectedSetting] = useState<ApiSetting | null>(null);

  // Fetch API settings
  const {
    data: apiSettings,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["/api/admin/api-settings"],
    queryFn: async () => {
      const response = await apiRequest<ApiSetting[]>("/api/admin/api-settings", {
        method: "GET",
      });
      return response;
    },
  });

  // Form for adding a new API setting
  const addForm = useForm<ApiSettingFormValues>({
    resolver: zodResolver(apiSettingFormSchema),
    defaultValues: {
      provider: "",
      apiKey: null,
      defaultModel: null,
      enabled: true,
    },
  });

  // Form for editing an existing API setting
  const editForm = useForm<ApiSettingFormValues>({
    resolver: zodResolver(apiSettingFormSchema),
    defaultValues: {
      provider: selectedSetting?.provider || "",
      apiKey: selectedSetting?.apiKey || null,
      defaultModel: selectedSetting?.defaultModel || null,
      enabled: selectedSetting?.enabled || true,
    },
  });

  // Reset edit form when selected setting changes
  React.useEffect(() => {
    if (selectedSetting) {
      editForm.reset({
        provider: selectedSetting.provider,
        apiKey: selectedSetting.apiKey,
        defaultModel: selectedSetting.defaultModel,
        enabled: selectedSetting.enabled,
      });
    }
  }, [selectedSetting, editForm]);

  // Add API setting mutation
  const addApiSettingMutation = useMutation({
    mutationFn: async (values: ApiSettingFormValues) => {
      return await apiRequest("/api/admin/api-settings", {
        method: "POST",
        body: JSON.stringify(values),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/api-settings"] });
      toast({
        title: "API Setting Added",
        description: "The API setting has been added successfully.",
      });
      setIsAddDialogOpen(false);
      addForm.reset();
    },
    onError: (error) => {
      console.error("Error adding API setting:", error);
      toast({
        title: "Error",
        description: "Failed to add API setting. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update API setting mutation
  const updateApiSettingMutation = useMutation({
    mutationFn: async (values: { id: number; data: ApiSettingFormValues }) => {
      return await apiRequest(`/api/admin/api-settings/${values.id}`, {
        method: "PATCH",
        body: JSON.stringify(values.data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/api-settings"] });
      toast({
        title: "API Setting Updated",
        description: "The API setting has been updated successfully.",
      });
      setIsEditDialogOpen(false);
      setSelectedSetting(null);
    },
    onError: (error) => {
      console.error("Error updating API setting:", error);
      toast({
        title: "Error",
        description: "Failed to update API setting. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete API setting mutation
  const deleteApiSettingMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/admin/api-settings/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/api-settings"] });
      toast({
        title: "API Setting Deleted",
        description: "The API setting has been deleted successfully.",
      });
    },
    onError: (error) => {
      console.error("Error deleting API setting:", error);
      toast({
        title: "Error",
        description: "Failed to delete API setting. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle form submissions
  const onAddSubmit = (values: ApiSettingFormValues) => {
    addApiSettingMutation.mutate(values);
  };

  const onEditSubmit = (values: ApiSettingFormValues) => {
    if (selectedSetting) {
      updateApiSettingMutation.mutate({ id: selectedSetting.id, data: values });
    }
  };

  // Handle delete
  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this API setting?")) {
      deleteApiSettingMutation.mutate(id);
    }
  };

  // Handle edit
  const handleEdit = (setting: ApiSetting) => {
    setSelectedSetting(setting);
    setIsEditDialogOpen(true);
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 text-destructive rounded-md">
        <p>Error loading API settings. Please try again.</p>
        <Button variant="outline" onClick={() => refetch()} className="mt-2">
          <RefreshCcw className="mr-2 h-4 w-4" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">API Settings</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add API Setting
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add API Setting</DialogTitle>
              <DialogDescription>
                Add a new API provider configuration.
              </DialogDescription>
            </DialogHeader>
            <Form {...addForm}>
              <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4">
                <FormField
                  control={addForm.control}
                  name="provider"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Provider</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., gemini, openai" {...field} />
                      </FormControl>
                      <FormDescription>
                        The name of the API provider (e.g., gemini, openai).
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addForm.control}
                  name="apiKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>API Key</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="API key" 
                          {...field} 
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value || null)}
                        />
                      </FormControl>
                      <FormDescription>
                        The API key for this provider. This will be stored securely.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addForm.control}
                  name="defaultModel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Model</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., gemini-pro" 
                          {...field} 
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value || null)}
                        />
                      </FormControl>
                      <FormDescription>
                        The default model to use for this provider.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addForm.control}
                  name="enabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Enabled</FormLabel>
                        <FormDescription>
                          Enable or disable this API provider.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value || false}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="submit" disabled={addApiSettingMutation.isPending}>
                    {addApiSettingMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Provider</TableHead>
              <TableHead>API Key</TableHead>
              <TableHead>Default Model</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Requests</TableHead>
              <TableHead>Last Used</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {apiSettings && apiSettings.length > 0 ? (
              apiSettings.map((setting) => (
                <TableRow key={setting.id}>
                  <TableCell className="font-medium">{setting.provider}</TableCell>
                  <TableCell>{setting.apiKey ? "••••••••" : "Not set"}</TableCell>
                  <TableCell>{setting.defaultModel || "Not set"}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        setting.enabled
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {setting.enabled ? "Enabled" : "Disabled"}
                    </span>
                  </TableCell>
                  <TableCell>{setting.requestsCount || 0}</TableCell>
                  <TableCell>{formatDate(setting.lastRequest)}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(setting)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(setting.id)}
                        disabled={deleteApiSettingMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  No API settings found. Add one to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit API Setting</DialogTitle>
            <DialogDescription>
              Update the API provider configuration.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="provider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provider</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., gemini, openai" {...field} />
                    </FormControl>
                    <FormDescription>
                      The name of the API provider (e.g., gemini, openai).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="apiKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API Key</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Enter new API key or leave blank to keep current" 
                        {...field} 
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value || null)}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter a new API key or leave blank to keep the current one.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="defaultModel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Model</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., gemini-pro" 
                        {...field} 
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value || null)}
                      />
                    </FormControl>
                    <FormDescription>
                      The default model to use for this provider.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Enabled</FormLabel>
                      <FormDescription>
                        Enable or disable this API provider.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value || false}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit" disabled={updateApiSettingMutation.isPending}>
                  {updateApiSettingMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Update
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}