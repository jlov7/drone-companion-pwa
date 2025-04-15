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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, RefreshCcw, Plus, Trash2, Edit, Star, StarOff } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

// Define the AI model type
interface AiModel {
  id: number;
  provider: string;
  modelId: string;
  displayName: string;
  capabilities: any;
  maxTokens: number | null;
  costPerToken: number | null;
  isDefault: boolean | null;
  enabled: boolean | null;
  createdAt: string | null;
  updatedAt: string | null;
}

// AI model form schema
const aiModelFormSchema = z.object({
  provider: z.string().min(1, "Provider is required"),
  modelId: z.string().min(1, "Model ID is required"),
  displayName: z.string().min(1, "Display name is required"),
  capabilities: z.string().optional(),
  maxTokens: z.coerce.number().nullable().optional(),
  costPerToken: z.coerce.number().nullable().optional(),
  isDefault: z.boolean().nullable().optional(),
  enabled: z.boolean().nullable().optional(),
});

type AiModelFormValues = z.infer<typeof aiModelFormSchema>;

export function AiModelsManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AiModel | null>(null);

  // Fetch AI models
  const {
    data: aiModels,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["/api/admin/ai-models"],
    queryFn: async () => {
      const response = await apiRequest<AiModel[]>("/api/admin/ai-models", {
        method: "GET",
      });
      return response;
    },
  });

  // Form for adding a new AI model
  const addForm = useForm<AiModelFormValues>({
    resolver: zodResolver(aiModelFormSchema),
    defaultValues: {
      provider: "",
      modelId: "",
      displayName: "",
      capabilities: "{}",
      maxTokens: null,
      costPerToken: null,
      isDefault: false,
      enabled: true,
    },
  });

  // Form for editing an existing AI model
  const editForm = useForm<AiModelFormValues>({
    resolver: zodResolver(aiModelFormSchema),
    defaultValues: {
      provider: selectedModel?.provider || "",
      modelId: selectedModel?.modelId || "",
      displayName: selectedModel?.displayName || "",
      capabilities: selectedModel?.capabilities ? JSON.stringify(selectedModel.capabilities) : "{}",
      maxTokens: selectedModel?.maxTokens || null,
      costPerToken: selectedModel?.costPerToken || null,
      isDefault: selectedModel?.isDefault || false,
      enabled: selectedModel?.enabled || true,
    },
  });

  // Reset edit form when selected model changes
  React.useEffect(() => {
    if (selectedModel) {
      editForm.reset({
        provider: selectedModel.provider,
        modelId: selectedModel.modelId,
        displayName: selectedModel.displayName,
        capabilities: selectedModel.capabilities ? JSON.stringify(selectedModel.capabilities) : "{}",
        maxTokens: selectedModel.maxTokens,
        costPerToken: selectedModel.costPerToken,
        isDefault: selectedModel.isDefault,
        enabled: selectedModel.enabled,
      });
    }
  }, [selectedModel, editForm]);

  // Add AI model mutation
  const addAiModelMutation = useMutation({
    mutationFn: async (values: AiModelFormValues) => {
      // Parse capabilities string to JSON
      const formattedValues = {
        ...values,
        capabilities: values.capabilities ? JSON.parse(values.capabilities) : {},
      };
      
      return await apiRequest("/api/admin/ai-models", {
        method: "POST",
        body: JSON.stringify(formattedValues),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ai-models"] });
      toast({
        title: "AI Model Added",
        description: "The AI model has been added successfully.",
      });
      setIsAddDialogOpen(false);
      addForm.reset();
    },
    onError: (error) => {
      console.error("Error adding AI model:", error);
      toast({
        title: "Error",
        description: "Failed to add AI model. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update AI model mutation
  const updateAiModelMutation = useMutation({
    mutationFn: async (values: { id: number; data: AiModelFormValues }) => {
      // Parse capabilities string to JSON
      const formattedData = {
        ...values.data,
        capabilities: values.data.capabilities ? JSON.parse(values.data.capabilities) : {},
      };
      
      return await apiRequest(`/api/admin/ai-models/${values.id}`, {
        method: "PATCH",
        body: JSON.stringify(formattedData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ai-models"] });
      toast({
        title: "AI Model Updated",
        description: "The AI model has been updated successfully.",
      });
      setIsEditDialogOpen(false);
      setSelectedModel(null);
    },
    onError: (error) => {
      console.error("Error updating AI model:", error);
      toast({
        title: "Error",
        description: "Failed to update AI model. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete AI model mutation
  const deleteAiModelMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/admin/ai-models/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ai-models"] });
      toast({
        title: "AI Model Deleted",
        description: "The AI model has been deleted successfully.",
      });
    },
    onError: (error) => {
      console.error("Error deleting AI model:", error);
      toast({
        title: "Error",
        description: "Failed to delete AI model. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Set default model mutation
  const setDefaultModelMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/admin/ai-models/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isDefault: true }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ai-models"] });
      toast({
        title: "Default Model Set",
        description: "The default AI model has been updated.",
      });
    },
    onError: (error) => {
      console.error("Error setting default model:", error);
      toast({
        title: "Error",
        description: "Failed to set default model. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle form submissions
  const onAddSubmit = (values: AiModelFormValues) => {
    try {
      // Validate JSON
      if (values.capabilities) {
        JSON.parse(values.capabilities);
      }
      addAiModelMutation.mutate(values);
    } catch (e) {
      toast({
        title: "Invalid JSON",
        description: "The capabilities field must contain valid JSON.",
        variant: "destructive",
      });
    }
  };

  const onEditSubmit = (values: AiModelFormValues) => {
    try {
      // Validate JSON
      if (values.capabilities) {
        JSON.parse(values.capabilities);
      }
      if (selectedModel) {
        updateAiModelMutation.mutate({ id: selectedModel.id, data: values });
      }
    } catch (e) {
      toast({
        title: "Invalid JSON",
        description: "The capabilities field must contain valid JSON.",
        variant: "destructive",
      });
    }
  };

  // Handle delete
  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this AI model?")) {
      deleteAiModelMutation.mutate(id);
    }
  };

  // Handle edit
  const handleEdit = (model: AiModel) => {
    setSelectedModel(model);
    setIsEditDialogOpen(true);
  };

  // Handle setting default model
  const handleSetDefault = (id: number) => {
    setDefaultModelMutation.mutate(id);
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
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
        <p>Error loading AI models. Please try again.</p>
        <Button variant="outline" onClick={() => refetch()} className="mt-2">
          <RefreshCcw className="mr-2 h-4 w-4" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">AI Models</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add AI Model
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Add AI Model</DialogTitle>
              <DialogDescription>
                Add a new AI model configuration.
              </DialogDescription>
            </DialogHeader>
            <Form {...addForm}>
              <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
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
                          The API provider name.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={addForm.control}
                    name="modelId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Model ID</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., gemini-pro" {...field} />
                        </FormControl>
                        <FormDescription>
                          The model ID used in API calls.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={addForm.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Gemini Pro" {...field} />
                      </FormControl>
                      <FormDescription>
                        The human-readable name for this model.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={addForm.control}
                    name="maxTokens"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Tokens</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            placeholder="e.g., 8192" 
                            {...field} 
                            value={field.value?.toString() || ""}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                          />
                        </FormControl>
                        <FormDescription>
                          Maximum tokens this model can handle.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={addForm.control}
                    name="costPerToken"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cost Per Token</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.0000001"
                            placeholder="e.g., 0.00001" 
                            {...field} 
                            value={field.value?.toString() || ""}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                          />
                        </FormControl>
                        <FormDescription>
                          Estimated cost per token in USD.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={addForm.control}
                  name="capabilities"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capabilities (JSON)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder='{ "text": true, "vision": false, "code": true }' 
                          className="font-mono h-24"
                          {...field} 
                          value={field.value || "{}"}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                      <FormDescription>
                        Model capabilities in JSON format.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={addForm.control}
                    name="enabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Enabled</FormLabel>
                          <FormDescription>
                            Enable or disable this model.
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
                  
                  <FormField
                    control={addForm.control}
                    name="isDefault"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Default Model</FormLabel>
                          <FormDescription>
                            Set as default for this provider.
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
                </div>
                
                <DialogFooter>
                  <Button type="submit" disabled={addAiModelMutation.isPending}>
                    {addAiModelMutation.isPending && (
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
              <TableHead>Display Name</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Model ID</TableHead>
              <TableHead>Max Tokens</TableHead>
              <TableHead>Cost/Token</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Default</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {aiModels && aiModels.length > 0 ? (
              aiModels.map((model) => (
                <TableRow key={model.id}>
                  <TableCell className="font-medium">{model.displayName}</TableCell>
                  <TableCell>{model.provider}</TableCell>
                  <TableCell><code className="text-xs bg-gray-100 p-1 rounded">{model.modelId}</code></TableCell>
                  <TableCell>{model.maxTokens || "N/A"}</TableCell>
                  <TableCell>{model.costPerToken ? `$${model.costPerToken.toFixed(7)}` : "N/A"}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        model.enabled
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {model.enabled ? "Enabled" : "Disabled"}
                    </span>
                  </TableCell>
                  <TableCell>
                    {model.isDefault ? (
                      <Star className="h-4 w-4 text-yellow-500" />
                    ) : (
                      <StarOff 
                        className="h-4 w-4 text-gray-300 cursor-pointer" 
                        onClick={() => handleSetDefault(model.id)}
                        title="Set as default model"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(model)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(model.id)}
                        disabled={deleteAiModelMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-4">
                  No AI models found. Add one to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Edit AI Model</DialogTitle>
            <DialogDescription>
              Update the AI model configuration.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                        The API provider name.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="modelId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Model ID</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., gemini-pro" {...field} />
                      </FormControl>
                      <FormDescription>
                        The model ID used in API calls.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={editForm.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Gemini Pro" {...field} />
                    </FormControl>
                    <FormDescription>
                      The human-readable name for this model.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="maxTokens"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Tokens</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          placeholder="e.g., 8192" 
                          {...field} 
                          value={field.value?.toString() || ""}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum tokens this model can handle.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="costPerToken"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cost Per Token</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.0000001"
                          placeholder="e.g., 0.00001" 
                          {...field} 
                          value={field.value?.toString() || ""}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                        />
                      </FormControl>
                      <FormDescription>
                        Estimated cost per token in USD.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={editForm.control}
                name="capabilities"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capabilities (JSON)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder='{ "text": true, "vision": false, "code": true }' 
                        className="font-mono h-24"
                        {...field} 
                        value={field.value || "{}"}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </FormControl>
                    <FormDescription>
                      Model capabilities in JSON format.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="enabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Enabled</FormLabel>
                        <FormDescription>
                          Enable or disable this model.
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
                
                <FormField
                  control={editForm.control}
                  name="isDefault"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Default Model</FormLabel>
                        <FormDescription>
                          Set as default for this provider.
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
              </div>
              
              <DialogFooter>
                <Button type="submit" disabled={updateAiModelMutation.isPending}>
                  {updateAiModelMutation.isPending && (
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