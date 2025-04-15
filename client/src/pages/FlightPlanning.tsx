import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { flightPlansApi } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useDrones } from "@/lib/useDrones";
import { useWeather } from "@/lib/useWeather";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertFlightPlanSchema } from "@shared/schema";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import FlightPlanningMap from "@/components/flight-planning/FlightPlanningMap";

import {
  MapIcon,
  PlusIcon,
  ArrowRightIcon,
  SaveIcon,
  CalendarIcon,
  ClockIcon,
  CheckIcon,
  RefreshCwIcon,
  Trash2Icon,
  AlertCircleIcon,
  InfoIcon,
} from "lucide-react";

// Extend the insertFlightPlanSchema with validation rules
const flightPlanSchema = insertFlightPlanSchema.extend({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  location: z.string().min(2, { message: "Location is required" }),
});

export default function FlightPlanning() {
  const [_, setLocation] = useLocation();
  const [location, params] = useLocation();
  const planId = params ? new URLSearchParams(params).get("plan") : null;
  
  const { toast } = useToast();
  const userId = 1; // Hard-coded for demo purposes
  
  // State
  const [activeTab, setActiveTab] = useState("plans");
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([37.7749, -122.4194]); // Default to San Francisco
  const [selectedLocation, setSelectedLocation] = useState<string>("San Francisco, CA");
  const [waypoints, setWaypoints] = useState<[number, number][]>([]);
  
  // Fetch data
  const { 
    data: flightPlans, 
    isLoading: isLoadingPlans,
    error: plansError
  } = useQuery({
    queryKey: [`/api/flight-plans?userId=${userId}`],
  });
  
  const { data: drones, isLoading: isLoadingDrones } = useDrones(userId);
  const { weatherData } = useWeather(userId, selectedLocation);
  
  // Find selected plan if plan ID is in URL
  useEffect(() => {
    if (planId && flightPlans) {
      const plan = flightPlans.find(p => p.id === parseInt(planId));
      if (plan) {
        setSelectedPlanId(plan.id);
        setActiveTab("editor");
        
        // If plan has waypoints, set them
        if (plan.waypoints && Array.isArray(plan.waypoints) && plan.waypoints.length > 0) {
          setWaypoints(plan.waypoints as [number, number][]);
          
          // Center map on first waypoint
          setMapCenter(plan.waypoints[0] as [number, number]);
        }
        
        // If plan has location, set it
        if (plan.location) {
          setSelectedLocation(plan.location);
        }
      }
    }
  }, [planId, flightPlans]);
  
  // Create form
  const createForm = useForm<z.infer<typeof flightPlanSchema>>({
    resolver: zodResolver(flightPlanSchema),
    defaultValues: {
      userId,
      title: "",
      description: "",
      location: selectedLocation,
      plannedAt: new Date().toISOString(),
      duration: 30, // Default 30 minutes
      distance: 0,
      waypoints: [],
      requiredBatteries: 1,
      weatherSuggestion: weatherData?.flightCondition || "Check weather before flying",
      isAiGenerated: false,
    },
  });
  
  // Update location in form when selectedLocation changes
  useEffect(() => {
    createForm.setValue("location", selectedLocation);
  }, [selectedLocation]);
  
  // Update waypoints in form when waypoints change
  useEffect(() => {
    createForm.setValue("waypoints", waypoints);
    
    // Calculate approximate distance if waypoints exist
    if (waypoints.length > 1) {
      const distance = calculateDistance(waypoints);
      createForm.setValue("distance", parseFloat(distance.toFixed(2)));
    }
  }, [waypoints]);
  
  // Mutations
  const createPlanMutation = useMutation({
    mutationFn: (data: z.infer<typeof flightPlanSchema>) => flightPlansApi.createFlightPlan(data),
    onSuccess: () => {
      setShowCreateDialog(false);
      queryClient.invalidateQueries({ queryKey: [`/api/flight-plans?userId=${userId}`] });
      toast({
        title: "Flight Plan Created",
        description: "Your flight plan has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create flight plan",
        variant: "destructive",
      });
    },
  });
  
  const deletePlanMutation = useMutation({
    mutationFn: (id: number) => flightPlansApi.deletePlan(id),
    onSuccess: () => {
      setShowDeleteDialog(false);
      queryClient.invalidateQueries({ queryKey: [`/api/flight-plans?userId=${userId}`] });
      toast({
        title: "Flight Plan Deleted",
        description: "Your flight plan has been deleted successfully.",
      });
      setSelectedPlanId(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete flight plan",
        variant: "destructive",
      });
    },
  });
  
  // Handle errors
  if (plansError) {
    toast({
      title: "Error loading flight plans",
      description: "Please check your connection and try again.",
      variant: "destructive",
    });
  }
  
  // Get selected plan
  const selectedPlan = flightPlans?.find(plan => plan.id === selectedPlanId);
  
  // Handle create form submission
  const onCreateSubmit = (data: z.infer<typeof flightPlanSchema>) => {
    createPlanMutation.mutate(data);
  };
  
  // Handle delete
  const handleDeletePlan = () => {
    if (selectedPlanId) {
      deletePlanMutation.mutate(selectedPlanId);
    }
  };
  
  // Calculate approximate distance between waypoints
  function calculateDistance(points: [number, number][]): number {
    if (points.length < 2) return 0;
    
    let totalDistance = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const [lat1, lon1] = points[i];
      const [lat2, lon2] = points[i + 1];
      
      // Haversine formula for calculating distance between two points on Earth
      const R = 6371; // Radius of Earth in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      
      totalDistance += distance;
    }
    
    return totalDistance;
  }
  
  // Format date
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return "Not scheduled";
    const date = new Date(dateString);
    return date.toLocaleDateString() + " at " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <div className="py-6 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-secondary-900">Flight Planning</h1>
          <p className="mt-1 text-sm text-gray-500">Plan, save, and manage your drone flight routes</p>
        </div>
        <Button
          className="bg-primary text-white hover:bg-primary-600"
          onClick={() => setShowCreateDialog(true)}
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          New Flight Plan
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="plans">Saved Plans</TabsTrigger>
            <TabsTrigger value="editor">Plan Editor</TabsTrigger>
          </TabsList>
          
          {activeTab === "editor" && (
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={() => setActiveTab("plans")}>
                Cancel
              </Button>
              <Button size="sm" onClick={() => setShowCreateDialog(true)}>
                <SaveIcon className="h-4 w-4 mr-2" />
                Save Plan
              </Button>
            </div>
          )}
        </div>
        
        <TabsContent value="plans" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Saved Flight Plans</CardTitle>
              <CardDescription>
                Your saved flight plans and AI-generated suggestions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingPlans ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="border rounded-lg p-4">
                      <div className="flex justify-between">
                        <div>
                          <Skeleton className="h-5 w-40 mb-2" />
                          <Skeleton className="h-4 w-60" />
                        </div>
                        <Skeleton className="h-9 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : flightPlans && flightPlans.length > 0 ? (
                <div className="space-y-4">
                  {flightPlans.map((plan) => (
                    <div key={plan.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-secondary-800 flex items-center">
                            {plan.title}
                            {plan.isAiGenerated && (
                              <span className="inline-flex items-center ml-2 px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800">
                                AI Generated
                              </span>
                            )}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">{plan.description || 'No description'}</p>
                          <div className="flex flex-wrap gap-y-1 gap-x-3 mt-2 text-xs text-gray-600">
                            <span className="flex items-center">
                              <MapIcon className="h-3.5 w-3.5 mr-1" />
                              {plan.location || 'No location'}
                            </span>
                            <span className="flex items-center">
                              <CalendarIcon className="h-3.5 w-3.5 mr-1" />
                              {formatDate(plan.plannedAt)}
                            </span>
                            <span className="flex items-center">
                              <ClockIcon className="h-3.5 w-3.5 mr-1" />
                              {plan.duration ? `${plan.duration} min` : 'Duration not set'}
                            </span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedPlanId(plan.id);
                              setShowDeleteDialog(true);
                            }}
                          >
                            <Trash2Icon className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => {
                              setSelectedPlanId(plan.id);
                              setActiveTab("editor");
                              
                              // Redirect to include plan ID in URL for sharing/bookmarking
                              setLocation(`/planning?plan=${plan.id}`);
                            }}
                          >
                            <ArrowRightIcon className="h-4 w-4 mr-2" />
                            Open
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border rounded-lg">
                  <MapIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-secondary-800 mb-1">No flight plans yet</h3>
                  <p className="text-gray-500 max-w-md mx-auto mb-4">
                    Create your first flight plan to efficiently prepare for your drone flights
                  </p>
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Create Flight Plan
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="editor" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Flight Route Editor</CardTitle>
                  <CardDescription>
                    {selectedPlan ? `Editing: ${selectedPlan.title}` : 'Create a new flight plan'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[500px] mb-4 bg-gray-50 rounded-lg overflow-hidden">
                    <FlightPlanningMap
                      center={mapCenter}
                      waypoints={waypoints}
                      onWaypointsChange={setWaypoints}
                      onLocationChange={setSelectedLocation}
                    />
                  </div>
                  
                  <div className="bg-primary-50 rounded-lg p-4 flex items-start">
                    <InfoIcon className="h-5 w-5 text-primary-600 mr-2 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-secondary-700">
                      <p className="font-medium">Instructions:</p>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>Click on the map to add waypoints for your flight path</li>
                        <li>Drag waypoints to adjust your route</li>
                        <li>Right-click a waypoint to remove it</li>
                        <li>Click and hold to create a curved path with multiple points</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Flight Details</CardTitle>
                  <CardDescription>
                    Configure your flight plan parameters
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                      <Input 
                        placeholder="Flight Plan Title"
                        value={selectedPlan?.title || ""}
                        onChange={() => {}} // In a real app, this would update the plan
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                      <Input 
                        placeholder="e.g. Golden Gate Park, SF"
                        value={selectedLocation}
                        onChange={(e) => setSelectedLocation(e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Drone</label>
                      <Select defaultValue={selectedPlan?.droneId?.toString() || ""}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a drone" />
                        </SelectTrigger>
                        <SelectContent>
                          {isLoadingDrones ? (
                            <SelectItem value="loading">Loading drones...</SelectItem>
                          ) : drones && drones.length > 0 ? (
                            drones.map((drone) => (
                              <SelectItem key={drone.id} value={drone.id.toString()}>
                                {drone.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="none">No drones available</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                        <Input 
                          type="datetime-local"
                          defaultValue={selectedPlan?.plannedAt 
                            ? new Date(selectedPlan.plannedAt).toISOString().slice(0, 16) 
                            : new Date().toISOString().slice(0, 16)}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
                        <Input 
                          type="number"
                          min="1"
                          defaultValue={selectedPlan?.duration || 30}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Distance (calculated)</label>
                      <Input 
                        type="text"
                        readOnly
                        value={`${calculateDistance(waypoints).toFixed(2)} km`}
                        className="bg-gray-50"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Batteries Required</label>
                      <Select defaultValue={selectedPlan?.requiredBatteries?.toString() || "1"}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select number of batteries" />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4].map((num) => (
                            <SelectItem key={num} value={num.toString()}>
                              {num} {num === 1 ? 'Battery' : 'Batteries'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                      <Textarea 
                        placeholder="Add any notes or instructions for this flight plan"
                        defaultValue={selectedPlan?.description || ""}
                        rows={3}
                      />
                    </div>
                    
                    {weatherData && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-sm font-medium text-gray-700 mb-2">Current Weather Conditions</div>
                        <div className="text-sm">
                          <div className="flex justify-between mb-1">
                            <span>Temperature:</span>
                            <span className="font-medium">{Math.round(weatherData.temperature)}°C</span>
                          </div>
                          <div className="flex justify-between mb-1">
                            <span>Wind Speed:</span>
                            <span className="font-medium">{weatherData.windSpeed} km/h</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Flight Condition:</span>
                            <span className={`font-medium ${weatherData.flightCondition?.includes('Good') ? 'text-success' : 'text-warning-800'}`}>
                              {weatherData.flightCondition || 'Unknown'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button 
                    onClick={() => setShowCreateDialog(true)}
                    disabled={waypoints.length < 2}
                  >
                    <SaveIcon className="h-4 w-4 mr-2" />
                    Save Flight Plan
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Create/Edit Flight Plan Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Flight Plan</DialogTitle>
            <DialogDescription>
              Save your flight plan for future use
            </DialogDescription>
          </DialogHeader>
          
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
              <FormField
                control={createForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plan Title</FormLabel>
                    <FormControl>
                      <Input placeholder="My Flight Plan" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Add details about this flight plan"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={createForm.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={createForm.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (minutes)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          min="1"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={createForm.control}
                  name="plannedAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Planned Date & Time</FormLabel>
                      <FormControl>
                        <Input 
                          type="datetime-local"
                          {...field}
                          value={field.value 
                            ? new Date(field.value).toISOString().slice(0, 16) 
                            : new Date().toISOString().slice(0, 16)}
                          onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value).toISOString() : '')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={createForm.control}
                  name="requiredBatteries"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Required Batteries</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={field.value?.toString() || "1"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select number of batteries" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[1, 2, 3, 4].map((num) => (
                            <SelectItem key={num} value={num.toString()}>
                              {num} {num === 1 ? 'Battery' : 'Batteries'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="border rounded-md p-3 bg-gray-50">
                <div className="flex items-center mb-2">
                  <InfoIcon className="h-4 w-4 mr-2 text-primary-600" />
                  <span className="text-sm font-medium">Route Information</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Waypoints:</span>
                    <span className="ml-2 font-medium">{waypoints.length}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Distance:</span>
                    <span className="ml-2 font-medium">{calculateDistance(waypoints).toFixed(2)} km</span>
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createPlanMutation.isPending || !createForm.formState.isValid || waypoints.length < 2}
                >
                  {createPlanMutation.isPending && <RefreshCwIcon className="mr-2 h-4 w-4 animate-spin" />}
                  Save Plan
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Flight Plan</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this flight plan? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-center p-4 bg-danger-50 rounded-md text-danger-800">
            <AlertCircleIcon className="h-5 w-5 mr-2 text-danger" />
            <p>This will permanently delete the flight plan and all associated data.</p>
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
              onClick={handleDeletePlan}
              disabled={deletePlanMutation.isPending}
            >
              {deletePlanMutation.isPending && <RefreshCwIcon className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
