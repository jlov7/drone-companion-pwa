import { useDrones, useUpdateDrone, useCreateDrone, useDeleteDrone, formatDroneStatus } from "@/lib/useDrones";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useLocation } from "wouter";
import { Drone } from "@shared/schema";
import { DJIOpenApiIntegration } from '@/components/dji/DJIOpenApiIntegration';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import BatteryGauge from "@/components/ui/BatteryGauge";
import DroneStatusIndicator from "@/components/ui/DroneStatusIndicator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  PlusIcon, 
  Filter, 
  RefreshCw, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2, 
  AlertTriangle,
  Upload,
  FileUp
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertDroneSchema } from "@shared/schema";

// Extend the insertDroneSchema with validation rules
const droneSchema = insertDroneSchema.extend({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  serialNumber: z.string().min(3, { message: "Serial number is required" }),
});

export default function MyDrones() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const userId = 1; // Hard-coded for demo purposes
  
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDrone, setSelectedDrone] = useState<Drone | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDJIDialog, setShowDJIDialog] = useState(false);
  
  // Fetch drones
  const { data: drones, isLoading, error } = useDrones(userId);
  
  // Mutations
  const createDroneMutation = useCreateDrone(() => {
    setShowAddDialog(false);
    toast({
      title: "Drone Added",
      description: "Your drone has been added successfully",
    });
  });
  
  const updateDroneMutation = useUpdateDrone(() => {
    setShowEditDialog(false);
    toast({
      title: "Drone Updated",
      description: "Your drone has been updated successfully",
    });
  });
  
  const deleteDroneMutation = useDeleteDrone(() => {
    setShowDeleteDialog(false);
    toast({
      title: "Drone Deleted",
      description: "Your drone has been deleted successfully",
    });
  });
  
  // Forms
  const addForm = useForm<z.infer<typeof droneSchema>>({
    resolver: zodResolver(droneSchema),
    defaultValues: {
      userId,
      name: "",
      serialNumber: "",
      model: "",
      firmware: "",
      status: "ready",
      batteryPercent: 100,
      storageUsed: 0,
      storageTotal: 0,
    },
  });
  
  const editForm = useForm<Partial<Drone>>({
    defaultValues: selectedDrone || {},
  });
  
  // Update edit form when selected drone changes
  if (selectedDrone && editForm.getValues().id !== selectedDrone.id) {
    editForm.reset(selectedDrone);
  }
  
  // Handle errors
  if (error) {
    toast({
      title: "Error loading drones",
      description: error instanceof Error ? error.message : "Unknown error",
      variant: "destructive",
    });
  }
  
  // Filter drones based on search
  const filteredDrones = drones 
    ? drones.filter(drone => {
        const searchLower = searchQuery.toLowerCase();
        return (
          drone.name.toLowerCase().includes(searchLower) ||
          drone.serialNumber.toLowerCase().includes(searchLower) ||
          (drone.model && drone.model.toLowerCase().includes(searchLower))
        );
      })
    : [];
  
  // Submit handlers
  const onAddSubmit = (data: z.infer<typeof droneSchema>) => {
    createDroneMutation.mutate(data);
  };
  
  const onEditSubmit = (data: Partial<Drone>) => {
    if (selectedDrone) {
      updateDroneMutation.mutate({ id: selectedDrone.id, data });
    }
  };
  
  const handleDeleteDrone = () => {
    if (selectedDrone) {
      deleteDroneMutation.mutate(selectedDrone.id);
    }
  };
  
  return (
    <div className="py-6 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-secondary-900">My Drones</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your drone fleet and monitor their status</p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={showDJIDialog} onOpenChange={setShowDJIDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <FileUp className="h-4 w-4" />
                Import DJI Data
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>DJI API Integration</DialogTitle>
                <DialogDescription>
                  Sync your DJI drones and flight logs directly from DJI API
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <DJIOpenApiIntegration 
                  userId={userId} 
                  onSuccess={(data) => {
                    toast({
                      title: "DJI Integration Successful",
                      description: `Successfully imported ${data?.drones || 0} drones and ${data?.flights || 0} flight logs`,
                    });
                    setShowDJIDialog(false);
                  }}
                />
              </div>
            </DialogContent>
          </Dialog>
          <Button
            className="bg-primary text-white hover:bg-primary-600"
            onClick={() => setShowAddDialog(true)}
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Drone
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between space-y-2 sm:space-y-0 sm:items-center">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search drones..."
                className="pl-9 w-full sm:w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Tabs defaultValue="grid" className="w-[200px]">
                <TabsList>
                  <TabsTrigger value="grid">Grid</TabsTrigger>
                  <TabsTrigger value="list">List</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardHeader>
        
        <Tabs defaultValue="grid">
          <TabsContent value="grid" className="p-4">
            {isLoading ? (
              // Loading skeleton for grid view
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <Skeleton className="h-6 w-32" />
                      <Skeleton className="h-4 w-48" />
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <Skeleton className="h-6 w-full" />
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Skeleton className="h-4 w-20 mb-1" />
                            <Skeleton className="h-5 w-24" />
                          </div>
                          <div>
                            <Skeleton className="h-4 w-20 mb-1" />
                            <Skeleton className="h-5 w-24" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredDrones.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDrones.map((drone) => (
                  <DroneCard 
                    key={drone.id} 
                    drone={drone} 
                    onEdit={() => {
                      setSelectedDrone(drone);
                      setShowEditDialog(true);
                    }}
                    onDelete={() => {
                      setSelectedDrone(drone);
                      setShowDeleteDialog(true);
                    }}
                    onViewFlights={() => setLocation(`/flights?droneId=${drone.id}`)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 min-h-[40vh] text-center">
                <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <PlusIcon className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="font-medium text-secondary-800 mb-1">No drones found</h3>
                <p className="text-gray-500 mb-4">
                  {searchQuery 
                    ? `No results matching "${searchQuery}"`
                    : "Add your first drone or import from DJI to get started"}
                </p>
                <div className="flex space-x-2">
                  <Button onClick={() => setShowAddDialog(true)}>
                    Add Your First Drone
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setShowDJIDialog(true)}
                  >
                    <FileUp className="h-4 w-4 mr-2" />
                    Import DJI Data
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="list">
            {isLoading ? (
              // Loading skeleton for list view
              <div className="divide-y divide-gray-200">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="py-4 px-6">
                    <div className="flex justify-between items-center">
                      <div className="space-y-2">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-4 w-48" />
                      </div>
                      <Skeleton className="h-8 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredDrones.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {filteredDrones.map((drone) => (
                  <div key={drone.id} className="py-4 px-6 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-medium text-secondary-800">{drone.name}</h3>
                        <div className="flex items-center mt-1">
                          <DroneStatusIndicator status={drone.status || 'unknown'} className="mr-3" />
                          <span className="text-sm text-gray-500">S/N: {drone.serialNumber}</span>
                          {drone.model && (
                            <span className="text-sm text-gray-500 ml-3">Model: {drone.model}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setLocation(`/flights?droneId=${drone.id}`)}
                        >
                          View Flights
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setSelectedDrone(drone);
                            setShowEditDialog(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setSelectedDrone(drone);
                            setShowDeleteDialog(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-danger" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 min-h-[40vh] text-center">
                <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <PlusIcon className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="font-medium text-secondary-800 mb-1">No drones found</h3>
                <p className="text-gray-500 mb-4">
                  {searchQuery 
                    ? `No results matching "${searchQuery}"`
                    : "Add your first drone or import from DJI to get started"}
                </p>
                <div className="flex space-x-2">
                  <Button onClick={() => setShowAddDialog(true)}>
                    Add Your First Drone
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setShowDJIDialog(true)}
                  >
                    <FileUp className="h-4 w-4 mr-2" />
                    Import DJI Data
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </Card>
      
      {/* Add Drone Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Drone</DialogTitle>
            <DialogDescription>
              Add a new drone to your fleet. Fill in the details below.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4">
              <FormField
                control={addForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Drone Name</FormLabel>
                    <FormControl>
                      <Input placeholder="My Drone" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={addForm.control}
                name="serialNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Serial Number</FormLabel>
                    <FormControl>
                      <Input placeholder="DJI123456789" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addForm.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Model</FormLabel>
                      <FormControl>
                        <Input placeholder="Mavic Air 2" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addForm.control}
                  name="firmware"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Firmware Version</FormLabel>
                      <FormControl>
                        <Input placeholder="v1.2.3" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addForm.control}
                  name="batteryPercent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Battery (%)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          max="100" 
                          placeholder="100" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ready">Ready to Fly</SelectItem>
                          <SelectItem value="flying">Currently Flying</SelectItem>
                          <SelectItem value="charging">Charging</SelectItem>
                          <SelectItem value="needs_calibration">Needs Calibration</SelectItem>
                          <SelectItem value="maintenance">Needs Maintenance</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addForm.control}
                  name="storageUsed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Storage Used (MB)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          placeholder="0" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addForm.control}
                  name="storageTotal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Storage Total (MB)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          placeholder="64000" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowAddDialog(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createDroneMutation.isPending}>
                  {createDroneMutation.isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add Drone'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Drone Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Drone</DialogTitle>
            <DialogDescription>
              Update the details for your drone.
            </DialogDescription>
          </DialogHeader>
          
          {selectedDrone && (
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Drone Name</FormLabel>
                      <FormControl>
                        <Input placeholder="My Drone" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="serialNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Serial Number</FormLabel>
                      <FormControl>
                        <Input placeholder="DJI123456789" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="model"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Model</FormLabel>
                        <FormControl>
                          <Input placeholder="Mavic Air 2" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="firmware"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Firmware Version</FormLabel>
                        <FormControl>
                          <Input placeholder="v1.2.3" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="batteryPercent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Battery (%)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            max="100" 
                            placeholder="100" 
                            {...field}
                            value={field.value || 0}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value || 'ready'}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ready">Ready to Fly</SelectItem>
                            <SelectItem value="flying">Currently Flying</SelectItem>
                            <SelectItem value="charging">Charging</SelectItem>
                            <SelectItem value="needs_calibration">Needs Calibration</SelectItem>
                            <SelectItem value="maintenance">Needs Maintenance</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="storageUsed"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Storage Used (MB)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            placeholder="0" 
                            {...field}
                            value={field.value || 0}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="storageTotal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Storage Total (MB)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            placeholder="64000" 
                            {...field}
                            value={field.value || 0}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={editForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Add notes about this drone" 
                          {...field} 
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowEditDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateDroneMutation.isPending}>
                    {updateDroneMutation.isPending ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update Drone'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedDrone?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-between items-center p-4 bg-destructive/10 rounded-md border border-destructive/20">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div>
                <h4 className="font-medium">Warning: This is permanent</h4>
                <p className="text-sm text-muted-foreground">
                  This will also delete all flight logs associated with this drone.
                </p>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteDrone}
              disabled={deleteDroneMutation.isPending}
            >
              {deleteDroneMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Drone'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Drone Card Component
interface DroneCardProps {
  drone: Drone;
  onEdit: () => void;
  onDelete: () => void;
  onViewFlights: () => void;
}

function DroneCard({ drone, onEdit, onDelete, onViewFlights }: DroneCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow duration-300">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{drone.name}</CardTitle>
            <CardDescription className="text-sm">{drone.model || 'Unknown Model'}</CardDescription>
          </div>
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="icon" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DroneStatusIndicator status={drone.status || 'unknown'} />
              <span className="text-sm font-medium">{formatDroneStatus(drone.status || 'unknown').label}</span>
            </div>
            <span className="text-xs text-muted-foreground">S/N: {drone.serialNumber}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Battery</p>
              <div className="flex items-center">
                <BatteryGauge
                  percentage={drone.batteryPercent || 0}
                  size="small"
                  className="mr-2"
                />
                <span className="text-sm font-medium">{drone.batteryPercent || 0}%</span>
              </div>
            </div>
            
            {(drone.storageTotal || 0) > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Storage</p>
                <Progress 
                  value={(((drone.storageUsed || 0) / (drone.storageTotal || 1)) * 100)} 
                  className="h-2 mt-1 mb-1" 
                />
                <span className="text-xs">
                  {((drone.storageUsed || 0) / 1000).toFixed(1)} / {((drone.storageTotal || 0) / 1000).toFixed(1)} GB
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Button 
          className="w-full" 
          variant="outline" 
          onClick={onViewFlights}
        >
          View Flight Logs
        </Button>
      </CardFooter>
    </Card>
  );
}