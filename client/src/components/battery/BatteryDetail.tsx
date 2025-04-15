import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useUpdateBattery, formatBatteryStatus } from "@/lib/useBatteries";
import { useDrones } from "@/lib/useDrones";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Battery } from "@shared/schema";

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import {
  BatteryFullIcon,
  BatteryMediumIcon,
  BatteryLowIcon,
  BatteryWarningIcon,
  BarChart2Icon,
  CalendarIcon,
  ClockIcon,
  ActivityIcon,
  SaveIcon,
  Trash2Icon,
  AlertTriangleIcon,
  ClipboardIcon,
  InfoIcon,
  RotateCwIcon,
} from "lucide-react";

// Battery schema for form validation
const batterySchema = z.object({
  id: z.number(),
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  serialNumber: z.string().optional(),
  droneId: z.number().optional(),
  chargeCycles: z.number().min(0),
  maxChargeCycles: z.number().min(1),
  health: z.number().min(0).max(100),
  status: z.string(),
  estimatedFlightTime: z.number().min(1),
  notes: z.string().optional(),
});

interface BatteryDetailProps {
  battery: Battery | null;
  open: boolean;
  onClose: () => void;
  onUpdate: (data: any) => void;
}

export default function BatteryDetail({
  battery,
  open,
  onClose,
  onUpdate,
}: BatteryDetailProps) {
  const [activeTab, setActiveTab] = useState("details");
  const { data: drones, isLoading: isLoadingDrones } = useDrones(1); // Hard-coded userId for demo
  
  // Get form with default values
  const form = useForm<z.infer<typeof batterySchema>>({
    resolver: zodResolver(batterySchema),
    defaultValues: battery ? {
      id: battery.id,
      name: battery.name,
      serialNumber: battery.serialNumber || "",
      droneId: battery.droneId,
      chargeCycles: battery.chargeCycles,
      maxChargeCycles: battery.maxChargeCycles,
      health: battery.health,
      status: battery.status,
      estimatedFlightTime: battery.estimatedFlightTime,
      notes: battery.notes || "",
    } : {
      id: 0,
      name: "",
      serialNumber: "",
      droneId: undefined,
      chargeCycles: 0,
      maxChargeCycles: 300,
      health: 100,
      status: "healthy",
      estimatedFlightTime: 25,
      notes: "",
    }
  });
  
  // Update values when battery changes
  useEffect(() => {
    if (battery) {
      form.reset({
        id: battery.id,
        name: battery.name,
        serialNumber: battery.serialNumber || "",
        droneId: battery.droneId,
        chargeCycles: battery.chargeCycles,
        maxChargeCycles: battery.maxChargeCycles,
        health: battery.health,
        status: battery.status,
        estimatedFlightTime: battery.estimatedFlightTime,
        notes: battery.notes || "",
      });
    }
  }, [battery, form]);
  
  // Handle form submission
  const onSubmit = (data: z.infer<typeof batterySchema>) => {
    onUpdate(data);
  };
  
  // Get status colors and labels
  const getStatusColor = (status: string): string => {
    const statusInfo = formatBatteryStatus(status);
    return statusInfo.color;
  };
  
  // Get health percentage color
  const getHealthColor = (health: number): string => {
    if (health >= 80) return "bg-success text-success-foreground";
    if (health >= 60) return "bg-accent text-accent-foreground";
    if (health >= 40) return "bg-warning text-warning-foreground";
    return "bg-danger text-danger-foreground";
  };
  
  // Get battery icon based on health
  const getBatteryIcon = (health: number) => {
    if (health >= 80) return <BatteryFullIcon className="h-5 w-5 text-success" />;
    if (health >= 50) return <BatteryMediumIcon className="h-5 w-5 text-accent" />;
    if (health >= 30) return <BatteryLowIcon className="h-5 w-5 text-warning" />;
    return <BatteryWarningIcon className="h-5 w-5 text-danger" />;
  };
  
  // Get drone name
  const getDroneName = (droneId: number | undefined | null) => {
    if (!droneId) return "Not assigned";
    if (!drones) return `Drone #${droneId}`;
    
    const drone = drones.find(d => d.id === droneId);
    return drone ? drone.name : `Drone #${droneId}`;
  };
  
  // Calculate charge cycles percentage
  const getCyclePct = (): number => {
    if (!battery) return 0;
    return Math.min(100, (battery.chargeCycles / battery.maxChargeCycles) * 100);
  };
  
  // Get sample battery history data (in a real app, this would come from the API)
  const getBatteryHistory = () => [
    { date: '2023-12-15', health: 98, flightTime: 25 },
    { date: '2023-12-22', health: 96, flightTime: 24 },
    { date: '2023-12-29', health: 94, flightTime: 24 },
    { date: '2024-01-05', health: 92, flightTime: 23 },
    { date: '2024-01-12', health: 91, flightTime: 23 },
    { date: '2024-01-19', health: 90, flightTime: 22 },
    { date: '2024-01-26', health: 88, flightTime: 22 },
    { date: '2024-02-02', health: 87, flightTime: 21 },
    { date: '2024-02-09', health: 86, flightTime: 21 },
    { date: '2024-02-16', health: 85, flightTime: 20 },
  ];
  
  // Get maintenance tips based on battery status
  const getMaintenanceTips = (status: string): string[] => {
    switch (status) {
      case 'healthy':
        return [
          "Regular storage at 40-60% charge when not in use",
          "Store in a cool, dry place between 15-25°C (59-77°F)",
          "Avoid full discharges when possible",
        ];
      case 'needs_calibration':
        return [
          "Perform a full calibration cycle: fully discharge then fully charge",
          "Update firmware if available",
          "Check for physical damage or swelling",
        ];
      case 'degraded':
        return [
          "Limit use to shorter flights",
          "Consider reducing maximum charge to 80%",
          "Perform calibration more frequently",
          "Consider replacement for critical missions",
        ];
      case 'critical':
        return [
          "Use only for emergency/backup purposes",
          "Consider immediate replacement",
          "Do not store fully charged",
          "Check for physical damage or swelling regularly",
        ];
      case 'retired':
        return [
          "Discharge to 30% for long-term storage",
          "Dispose at proper battery recycling facility",
          "Never throw in regular trash",
        ];
      default:
        return ["Keep battery at 40-60% charge when not in use"];
    }
  };
  
  if (!battery) return null;
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            {getBatteryIcon(battery.health)}
            <span className="ml-2">{battery.name}</span>
            <span className={`ml-3 text-xs px-2 py-0.5 rounded-full ${getStatusColor(battery.status)}`}>
              {formatBatteryStatus(battery.status).label}
            </span>
          </DialogTitle>
          <DialogDescription>
            {battery.serialNumber 
              ? `Serial Number: ${battery.serialNumber}` 
              : "No serial number provided"}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1">
                <div className="text-sm font-medium text-gray-500">Health</div>
                <div className="flex items-center">
                  <Progress value={battery.health} className="h-2 flex-1" />
                  <span className="ml-2 text-sm font-medium">{battery.health}%</span>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="text-sm font-medium text-gray-500">Charge Cycles</div>
                <div className="flex items-center">
                  <Progress value={getCyclePct()} className="h-2 flex-1" />
                  <span className="ml-2 text-sm font-medium">
                    {battery.chargeCycles}/{battery.maxChargeCycles}
                  </span>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="text-sm font-medium text-gray-500">Est. Flight Time</div>
                <div className="flex items-center">
                  <ClockIcon className="h-4 w-4 mr-1 text-gray-400" />
                  <span className="text-sm font-medium">{battery.estimatedFlightTime} min</span>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="text-sm font-medium text-gray-500">Assigned Drone</div>
                <div className="text-sm font-medium">{getDroneName(battery.droneId)}</div>
              </div>
              
              <div className="space-y-1">
                <div className="text-sm font-medium text-gray-500">Purchase Date</div>
                <div className="flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-1 text-gray-400" />
                  <span className="text-sm font-medium">
                    {new Date(battery.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              <div className="col-span-2 mt-2">
                <div className="text-sm font-medium text-gray-500 mb-1">Notes</div>
                <div className="text-sm border rounded-md p-2 min-h-[60px] bg-gray-50">
                  {battery.notes || "No notes available for this battery."}
                </div>
              </div>
            </div>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Battery Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Battery name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="serialNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Serial Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Optional" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="droneId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assigned Drone</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                          value={field.value?.toString() || ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a drone" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">Not Assigned</SelectItem>
                            {drones?.map((drone) => (
                              <SelectItem key={drone.id} value={drone.id.toString()}>
                                {drone.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="chargeCycles"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Charge Cycles</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="maxChargeCycles"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Charge Cycles</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="health"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Health (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="estimatedFlightTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Est. Flight Time (min)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
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
                
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Optional notes about this battery"
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="submit" className="w-full">
                    <SaveIcon className="h-4 w-4 mr-2" />
                    Update Battery
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="maintenance" className="space-y-4">
            <div className="bg-primary-50 rounded-lg p-4">
              <div className="flex items-start">
                <InfoIcon className="h-5 w-5 text-primary-600 mr-2 mt-0.5" />
                <div>
                  <h3 className="font-medium text-primary-900">Maintenance Status</h3>
                  <p className="text-sm text-primary-800">
                    {(() => {
                      if (battery.status === "healthy") {
                        return "This battery is in good condition and doesn't require maintenance.";
                      } else if (battery.status === "needs_calibration") {
                        return "This battery needs calibration to maintain optimal performance.";
                      } else if (battery.status === "degraded") {
                        return "This battery is showing signs of wear and requires attention.";
                      } else if (battery.status === "critical") {
                        return "This battery is in critical condition and should be replaced soon.";
                      } else if (battery.status === "retired") {
                        return "This battery has been retired and should be properly recycled.";
                      }
                      return "Battery status unknown.";
                    })()}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="border rounded-lg">
              <div className="p-4 border-b">
                <h3 className="font-medium">Recommended Maintenance Actions</h3>
              </div>
              <div className="p-4">
                <ul className="space-y-3">
                  {getMaintenanceTips(battery.status).map((tip, i) => (
                    <li key={i} className="flex items-start">
                      <div className="flex-shrink-0 h-5 w-5 rounded-full bg-primary-100 flex items-center justify-center mr-2 mt-0.5">
                        <span className="text-xs font-medium text-primary-700">{i + 1}</span>
                      </div>
                      <span className="text-sm">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            {battery.status === "needs_calibration" && (
              <div className="border rounded-lg">
                <div className="p-4 border-b">
                  <h3 className="font-medium">Calibration Procedure</h3>
                </div>
                <div className="p-4">
                  <ol className="space-y-3 list-decimal pl-5">
                    <li className="text-sm">Fully charge the battery to 100%</li>
                    <li className="text-sm">Allow battery to rest for at least 1 hour</li>
                    <li className="text-sm">Use the battery until it's completely depleted</li>
                    <li className="text-sm">Allow battery to rest for at least 30 minutes</li>
                    <li className="text-sm">Fully charge the battery to 100% again</li>
                    <li className="text-sm">Update the status after calibration is complete</li>
                  </ol>
                  <div className="mt-4">
                    <Button variant="outline" className="w-full">
                      <RotateCwIcon className="h-4 w-4 mr-2" />
                      Mark Calibration Complete
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {battery.status === "critical" && (
              <div className="bg-danger-50 border border-danger-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertTriangleIcon className="h-5 w-5 text-danger-600 mr-2 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-danger-900">Safety Warning</h3>
                    <p className="text-sm text-danger-800 mb-2">
                      This battery is in critical condition and may pose safety risks.
                      Consider retiring it immediately.
                    </p>
                    <Button variant="destructive" size="sm">
                      <Trash2Icon className="h-4 w-4 mr-2" />
                      Retire Battery
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="history" className="space-y-4">
            <div className="border rounded-lg">
              <div className="p-4 border-b">
                <h3 className="font-medium">Performance History</h3>
              </div>
              <div className="p-4">
                <div className="text-xs text-gray-500 mb-1">Last 10 measurements</div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm font-medium text-gray-500">
                    <span>Date</span>
                    <div className="flex space-x-4">
                      <span>Health</span>
                      <span>Flight Time</span>
                    </div>
                  </div>
                  {getBatteryHistory().map((record, i) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b text-sm">
                      <span>{record.date}</span>
                      <div className="flex space-x-4">
                        <span className={record.health >= 90 ? "text-success" : record.health >= 70 ? "text-warning" : "text-danger"}>
                          {record.health}%
                        </span>
                        <span>{record.flightTime} min</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <div className="text-sm font-medium mb-1">Total Flights</div>
                <div className="text-2xl font-bold">32</div>
              </div>
              
              <div className="border rounded-lg p-4">
                <div className="text-sm font-medium mb-1">Total Flight Hours</div>
                <div className="text-2xl font-bold">12.4</div>
              </div>
            </div>
            
            <div className="border rounded-lg">
              <div className="p-4 border-b">
                <h3 className="font-medium">Recent Flights</h3>
              </div>
              <div className="p-4">
                <div className="space-y-2">
                  {[
                    { date: '2024-02-16', duration: 18, batteryUsed: 65 },
                    { date: '2024-02-09', duration: 22, batteryUsed: 78 },
                    { date: '2024-02-02', duration: 15, batteryUsed: 55 },
                  ].map((flight, i) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b text-sm">
                      <span>{flight.date}</span>
                      <div className="flex space-x-4">
                        <span>{flight.duration} min</span>
                        <span>{flight.batteryUsed}% used</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}