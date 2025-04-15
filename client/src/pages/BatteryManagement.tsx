import { useState } from "react";
import { useBatteries, useCreateBattery, useUpdateBattery, formatBatteryStatus, getBatteryTips } from "@/lib/useBatteries";
import { useDrones } from "@/lib/useDrones";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertBatterySchema, Battery } from "@shared/schema";
import { 
  Battery as BatteryIcon, 
  Thermometer, 
  Calendar, 
  RotateCcw, 
  Zap, 
  Clock, 
  Plus 
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import BatteryDetail from "@/components/battery/BatteryDetail";
import { Skeleton } from "@/components/ui/skeleton";

import {
  BatteryFullIcon,
  PlusIcon,
  RefreshCwIcon,
  BatteryLowIcon,
  BatteryMediumIcon,
  BatteryWarningIcon,
  TrashIcon,
  PencilIcon,
  InfoIcon,
  FilterIcon,
  SearchIcon,
  BarChartIcon,
} from "lucide-react";

// Extend the insertBatterySchema with validation rules
const batterySchema = insertBatterySchema.extend({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  serialNumber: z.string().optional(),
  chargeCycles: z.number().min(0),
  maxChargeCycles: z.number().min(1),
  health: z.number().min(0).max(100),
  status: z.string(),
  estimatedFlightTime: z.number().min(1),
});

export default function BatteryManagement() {
  const { toast } = useToast();
  const userId = 1; // Hard-coded for demo purposes
  
  // State
  const [selectedBattery, setSelectedBattery] = useState<Battery | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDrone, setFilterDrone] = useState("all");
  
  // Fetch batteries and drones
  const { 
    data: batteries, 
    isLoading: isLoadingBatteries, 
    error: batteriesError 
  } = useBatteries(userId);
  
  const { 
    data: drones, 
    isLoading: isLoadingDrones, 
    error: dronesError 
  } = useDrones(userId);
  
  // Create battery mutation
  const createBatteryMutation = useCreateBattery(() => {
    setShowAddDialog(false);
    toast({
      title: "Battery Added",
      description: "The battery has been added to your inventory.",
    });
  });
  
  // Update battery mutation
  const updateBatteryMutation = useUpdateBattery(() => {
    setShowDetailDialog(false);
    toast({
      title: "Battery Updated",
      description: "The battery has been updated successfully.",
    });
  });
  
  // Handle errors
  if (batteriesError || dronesError) {
    toast({
      title: "Error",
      description: "Failed to load battery data. Please try again.",
      variant: "destructive",
    });
  }
  
  // Add battery form
  const addForm = useForm<z.infer<typeof batterySchema>>({
    resolver: zodResolver(batterySchema),
    defaultValues: {
      userId,
      name: "",
      serialNumber: "",
      droneId: undefined,
      chargeCycles: 0,
      maxChargeCycles: 300,
      health: 100,
      status: "healthy",
      estimatedFlightTime: 25,
    },
  });
  
  // On form submit
  const onSubmit = (data: z.infer<typeof batterySchema>) => {
    createBatteryMutation.mutate(data);
  };
  
  // Filter batteries
  const filteredBatteries = batteries?.filter(battery => {
    // Apply search filter
    const matchesSearch = 
      battery.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (battery.serialNumber && battery.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Apply status filter
    const matchesStatus = filterStatus === "all" || battery.status === filterStatus;
    
    // Apply drone filter
    const matchesDrone = filterDrone === "all" || 
      (filterDrone === "none" && !battery.droneId) ||
      (battery.droneId === parseInt(filterDrone));
    
    return matchesSearch && matchesStatus && matchesDrone;
  });
  
  // Get drone name by ID
  const getDroneName = (droneId: number | undefined | null) => {
    if (!droneId) return "Not assigned";
    if (!drones) return `Drone #${droneId}`;
    
    const drone = drones.find(d => d.id === droneId);
    return drone ? drone.name : `Drone #${droneId}`;
  };
  
  // Get battery health status class
  const getBatteryHealthClass = (health: number) => {
    if (health >= 80) return "text-success";
    if (health >= 60) return "text-accent";
    if (health >= 40) return "text-warning";
    return "text-danger";
  };
  
  // Get battery icon based on health
  const getBatteryIcon = (health: number) => {
    if (health >= 80) return <BatteryFullIcon className="h-5 w-5 text-success" />;
    if (health >= 50) return <BatteryMediumIcon className="h-5 w-5 text-accent" />;
    if (health >= 30) return <BatteryLowIcon className="h-5 w-5 text-warning" />;
    return <BatteryWarningIcon className="h-5 w-5 text-danger" />;
  };
  
  // Group batteries by status for stats
  const batteryStats = batteries ? {
    total: batteries.length,
    healthy: batteries.filter(b => b.status === "healthy").length,
    needsCalibration: batteries.filter(b => b.status === "needs_calibration").length,
    degraded: batteries.filter(b => b.status === "degraded").length,
    critical: batteries.filter(b => b.status === "critical").length,
    retired: batteries.filter(b => b.status === "retired").length,
  } : null;
  
  return (
    <div className="py-6 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-secondary-900">Battery Management</h1>
          <p className="mt-1 text-sm text-gray-500">Track, monitor, and maintain your drone batteries</p>
        </div>
        <Button
          className="bg-primary text-white hover:bg-primary-600"
          onClick={() => setShowAddDialog(true)}
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Battery
        </Button>
      </div>
      
      {/* Battery Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <Card className="bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-gray-500 text-sm">Total Batteries</div>
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                <BatteryFullIcon className="h-4 w-4 text-primary-600" />
              </div>
            </div>
            <div className="text-2xl font-bold mt-2">
              {isLoadingBatteries ? <Skeleton className="h-8 w-16" /> : batteryStats?.total || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-gray-500 text-sm">Healthy</div>
              <div className="w-8 h-8 rounded-full bg-success-100 flex items-center justify-center">
                <BatteryFullIcon className="h-4 w-4 text-success" />
              </div>
            </div>
            <div className="text-2xl font-bold mt-2">
              {isLoadingBatteries ? <Skeleton className="h-8 w-16" /> : batteryStats?.healthy || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-gray-500 text-sm">Needs Calibration</div>
              <div className="w-8 h-8 rounded-full bg-accent-100 flex items-center justify-center">
                <BatteryMediumIcon className="h-4 w-4 text-accent" />
              </div>
            </div>
            <div className="text-2xl font-bold mt-2">
              {isLoadingBatteries ? <Skeleton className="h-8 w-16" /> : batteryStats?.needsCalibration || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-gray-500 text-sm">Degraded</div>
              <div className="w-8 h-8 rounded-full bg-warning-100 flex items-center justify-center">
                <BatteryLowIcon className="h-4 w-4 text-warning" />
              </div>
            </div>
            <div className="text-2xl font-bold mt-2">
              {isLoadingBatteries ? <Skeleton className="h-8 w-16" /> : batteryStats?.degraded || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-gray-500 text-sm">Critical</div>
              <div className="w-8 h-8 rounded-full bg-danger-100 flex items-center justify-center">
                <BatteryWarningIcon className="h-4 w-4 text-danger" />
              </div>
            </div>
            <div className="text-2xl font-bold mt-2">
              {isLoadingBatteries ? <Skeleton className="h-8 w-16" /> : batteryStats?.critical || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-gray-500 text-sm">Retired</div>
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <TrashIcon className="h-4 w-4 text-gray-500" />
              </div>
            </div>
            <div className="text-2xl font-bold mt-2">
              {isLoadingBatteries ? <Skeleton className="h-8 w-16" /> : batteryStats?.retired || 0}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="grid">
        <div className="flex flex-col sm:flex-row justify-between space-y-2 sm:space-y-0 sm:items-center mb-4">
          <TabsList>
            <TabsTrigger value="grid">Grid View</TabsTrigger>
            <TabsTrigger value="table">Table View</TabsTrigger>
            <TabsTrigger value="tips">Battery Tips</TabsTrigger>
          </TabsList>
          
          <div className="flex space-x-2">
            <div className="relative">
              <SearchIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search batteries..."
                className="pl-9 w-full sm:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px]">
                <FilterIcon className="h-4 w-4 mr-2" />
                <span>Status</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="healthy">Healthy</SelectItem>
                <SelectItem value="needs_calibration">Needs Calibration</SelectItem>
                <SelectItem value="degraded">Degraded</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="retired">Retired</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterDrone} onValueChange={setFilterDrone}>
              <SelectTrigger className="w-[140px]">
                <FilterIcon className="h-4 w-4 mr-2" />
                <span>Drone</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Drones</SelectItem>
                <SelectItem value="none">Not Assigned</SelectItem>
                {drones && drones.map(drone => (
                  <SelectItem key={drone.id} value={drone.id.toString()}>
                    {drone.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <TabsContent value="grid" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoadingBatteries ? (
              // Loading skeletons
              Array.from({ length: 6 }).map((_, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <Skeleton className="h-6 w-40" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-3/4" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                      <Skeleton className="h-2 w-full" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                      <Skeleton className="h-2 w-full" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : filteredBatteries && filteredBatteries.length > 0 ? (
              filteredBatteries.map((battery) => (
                <Card 
                  key={battery.id} 
                  className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => {
                    setSelectedBattery(battery);
                    setShowDetailDialog(true);
                  }}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{battery.name}</CardTitle>
                      <div className="flex space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${formatBatteryStatus(battery.status || 'unknown').color}`}>
                          {formatBatteryStatus(battery.status || 'unknown').label}
                        </span>
                      </div>
                    </div>
                    <CardDescription>
                      {battery.serialNumber ? `S/N: ${battery.serialNumber}` : 'No serial number'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Assigned to:</span>
                      <span className="font-medium">{getDroneName(battery.droneId)}</span>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-500">Charge Cycles</span>
                        <span className="font-medium">
                          {battery.chargeCycles} / {battery.maxChargeCycles}
                        </span>
                      </div>
                      <Progress 
                        value={((battery.chargeCycles || 0) / (battery.maxChargeCycles || 300)) * 100} 
                        className="h-2"
                      />
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-500">Battery Health</span>
                        <span className={`font-medium ${getBatteryHealthClass(battery.health || 0)}`}>
                          {battery.health}%
                        </span>
                      </div>
                      <Progress 
                        value={battery.health || 0} 
                        className="h-2"
                        indicatorColor={
                          battery.health >= 80 ? 'bg-success' :
                          battery.health >= 60 ? 'bg-accent' :
                          battery.health >= 40 ? 'bg-warning' : 'bg-danger'
                        }
                      />
                    </div>
                    
                    <div className="flex text-sm text-gray-500">
                      <div className="flex-1">
                        <div>Last used:</div>
                        <div className="font-medium text-secondary-700">
                          {battery.lastUsed ? new Date(battery.lastUsed).toLocaleDateString() : 'Never'}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div>Flight time:</div>
                        <div className="font-medium text-secondary-700">
                          {battery.estimatedFlightTime || 0} min
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center p-8 min-h-[40vh] text-center">
                <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <BatteryFullIcon className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="font-medium text-secondary-800 mb-1">No batteries found</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || filterStatus !== "all" || filterDrone !== "all"
                    ? "No batteries match your filters"
                    : "Add batteries to your inventory to manage them here"}
                </p>
                <Button onClick={() => setShowAddDialog(true)}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Battery
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="table" className="mt-0">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Battery</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Drone</TableHead>
                    <TableHead>Health</TableHead>
                    <TableHead>Charge Cycles</TableHead>
                    <TableHead>Flight Time</TableHead>
                    <TableHead>Last Used</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingBatteries ? (
                    // Loading skeletons
                    Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : filteredBatteries && filteredBatteries.length > 0 ? (
                    filteredBatteries.map((battery) => (
                      <TableRow key={battery.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            {getBatteryIcon(battery.health || 0)}
                            <span className="ml-2">{battery.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${formatBatteryStatus(battery.status || 'unknown').color}`}>
                            {formatBatteryStatus(battery.status || 'unknown').label}
                          </span>
                        </TableCell>
                        <TableCell>{getDroneName(battery.droneId)}</TableCell>
                        <TableCell className={getBatteryHealthClass(battery.health || 0)}>
                          {battery.health}%
                        </TableCell>
                        <TableCell>
                          {battery.chargeCycles} / {battery.maxChargeCycles}
                        </TableCell>
                        <TableCell>
                          {battery.estimatedFlightTime || 0} min
                        </TableCell>
                        <TableCell>
                          {battery.lastUsed ? new Date(battery.lastUsed).toLocaleDateString() : 'Never'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBattery(battery);
                              setShowDetailDialog(true);
                            }}
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="flex flex-col items-center">
                          <BatteryFullIcon className="h-8 w-8 text-gray-300 mb-2" />
                          <p className="text-gray-500 mb-2">No batteries found</p>
                          <Button size="sm" onClick={() => setShowAddDialog(true)}>
                            <PlusIcon className="h-4 w-4 mr-2" />
                            Add Battery
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="tips" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Battery Management Tips</CardTitle>
              <CardDescription>
                Best practices for maximizing drone battery life and performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoadingBatteries ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex">
                      <Skeleton className="h-8 w-8 rounded-full mr-4" />
                      <div className="flex-1">
                        <Skeleton className="h-6 w-48 mb-2" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3 mt-1" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : batteries ? (
                <>
                  {/* Battery-specific tips */}
                  <div className="bg-primary-50 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-primary-800 mb-2">Battery-Specific Recommendations</h3>
                    <div className="space-y-3">
                      {getBatteryTips(batteries).map((tip, index) => (
                        <div key={index} className="flex">
                          <InfoIcon className="h-5 w-5 text-primary-600 mr-3 flex-shrink-0 mt-0.5" />
                          <p className="text-primary-700">{tip}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* General battery tips */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">General Battery Tips</h3>
                    
                    <div className="space-y-6">
                      <div className="flex">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center mr-4">
                          <BatteryFullIcon className="h-5 w-5 text-primary-600" />
                        </div>
                        <div>
                          <h4 className="text-base font-medium text-gray-900">Optimal Storage</h4>
                          <p className="mt-1 text-gray-600">
                            Store batteries at 40-60% charge, not fully charged or depleted. Keep them in a cool, dry place between 15-25°C (59-77°F).
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center mr-4">
                          <RefreshCwIcon className="h-5 w-5 text-primary-600" />
                        </div>
                        <div>
                          <h4 className="text-base font-medium text-gray-900">Regular Calibration</h4>
                          <p className="mt-1 text-gray-600">
                            Calibrate batteries every 20 charge cycles. A full calibration includes a complete discharge followed by a full charge.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center mr-4">
                          <Thermometer className="h-5 w-5 text-primary-600" />
                        </div>
                        <div>
                          <h4 className="text-base font-medium text-gray-900">Temperature Management</h4>
                          <p className="mt-1 text-gray-600">
                            Avoid charging or using batteries in extreme temperatures. Let hot batteries cool down before charging, and warm up cold batteries before use.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center mr-4">
                          <BarChartIcon className="h-5 w-5 text-primary-600" />
                        </div>
                        <div>
                          <h4 className="text-base font-medium text-gray-900">Battery Rotation</h4>
                          <p className="mt-1 text-gray-600">
                            Use batteries in rotation to ensure even wear. Label batteries and track their usage to maintain balanced utilization.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* When to replace batteries */}
                  <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-3">When to Replace Your Batteries</h3>
                    <p className="text-gray-600 mb-4">
                      Consider replacing a battery when any of these conditions are met:
                    </p>
                    <ul className="space-y-2 text-gray-600 list-disc list-inside">
                      <li>Health falls below 70% of original capacity</li>
                      <li>Charge cycles exceed 80% of rated maximum cycles</li>
                      <li>Battery cannot hold charge for the expected duration</li>
                      <li>Physical damage such as swelling, leaking, or cracks</li>
                      <li>Battery overheats during normal use or charging</li>
                    </ul>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <InfoIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-secondary-800 mb-1">No battery data available</h3>
                  <p className="text-gray-500 max-w-md mx-auto mb-4">
                    Add batteries to your inventory to get personalized maintenance tips
                  </p>
                  <Button onClick={() => setShowAddDialog(true)}>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Battery
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Add Battery Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Battery</DialogTitle>
            <DialogDescription>
              Add a new battery to your inventory for tracking
            </DialogDescription>
          </DialogHeader>
          
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={addForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Battery Name</FormLabel>
                    <FormControl>
                      <Input placeholder="TB48 Battery #1" {...field} />
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
                      <Input placeholder="DJI48379283" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={addForm.control}
                name="droneId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign to Drone</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a drone (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {isLoadingDrones ? (
                          <SelectItem value="loading" disabled>Loading drones...</SelectItem>
                        ) : drones && drones.length > 0 ? (
                          drones.map((drone) => (
                            <SelectItem key={drone.id} value={drone.id.toString()}>
                              {drone.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>No drones available</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addForm.control}
                  name="chargeCycles"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Charge Cycles</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
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
                  name="maxChargeCycles"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Charge Cycles</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 300)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addForm.control}
                  name="health"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Battery Health (%)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          max="100" 
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
                          <SelectItem value="healthy">Healthy</SelectItem>
                          <SelectItem value="needs_calibration">Needs Calibration</SelectItem>
                          <SelectItem value="degraded">Degraded</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                          <SelectItem value="retired">Retired</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={addForm.control}
                name="estimatedFlightTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated Flight Time (minutes)</FormLabel>
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
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowAddDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createBatteryMutation.isPending || !addForm.formState.isValid}
                >
                  {createBatteryMutation.isPending && <RefreshCwIcon className="mr-2 h-4 w-4 animate-spin" />}
                  Add Battery
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Battery Detail Dialog */}
      {selectedBattery && (
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Battery Details</DialogTitle>
              <DialogDescription>
                View and update battery information
              </DialogDescription>
            </DialogHeader>
            
            <BatteryDetail 
              battery={selectedBattery} 
              drones={drones || []}
              onUpdate={(data) => {
                updateBatteryMutation.mutate({ id: selectedBattery.id, data });
              }}
              isUpdating={updateBatteryMutation.isPending}
              onClose={() => setShowDetailDialog(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
