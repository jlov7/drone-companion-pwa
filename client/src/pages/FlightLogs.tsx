import { useFlightLogs, formatFlightDuration, formatRelativeTime } from "@/lib/useFlights";
import { useDrones } from "@/lib/useDrones";
import { useToast } from "@/hooks/use-toast";
import { FlightLog } from "@shared/schema";
import { useState } from "react";
import { useLocation } from "wouter";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  MapPinIcon, 
  ClockIcon, 
  CalendarIcon, 
  SearchIcon, 
  FilterIcon, 
  PlusIcon, 
  ChevronRightIcon,
  ArrowUpDownIcon,
  ChevronLeftIcon
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function FlightLogs() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const userId = 1; // Hard-coded for demo purposes
  
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFlightId, setSelectedFlightId] = useState<number | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [sortField, setSortField] = useState<keyof FlightLog>("startTime");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Fetch data
  const { 
    data: flightLogs, 
    isLoading: isLoadingLogs, 
    error: logsError 
  } = useFlightLogs(userId);
  
  const { 
    data: drones, 
    isLoading: isLoadingDrones, 
    error: dronesError 
  } = useDrones(userId);
  
  // Handle errors
  if (logsError || dronesError) {
    toast({
      title: "Error loading flight logs",
      description: "Please check your connection and try again.",
      variant: "destructive",
    });
  }
  
  // Get selected flight details
  const selectedFlight = flightLogs?.find(log => log.id === selectedFlightId) || null;
  
  // Get drone name for a flight
  const getDroneName = (droneId: number) => {
    if (!drones) return `Drone #${droneId}`;
    const drone = drones.find(d => d.id === droneId);
    return drone ? drone.name : `Drone #${droneId}`;
  };
  
  // Filter and sort logs
  const filteredLogs = flightLogs 
    ? flightLogs.filter(log => {
        const searchLower = searchQuery.toLowerCase();
        return (
          (log.location && log.location.toLowerCase().includes(searchLower)) ||
          getDroneName(log.droneId).toLowerCase().includes(searchLower) ||
          (log.notes && log.notes.toLowerCase().includes(searchLower))
        );
      })
    : [];
  
  const sortedLogs = [...filteredLogs].sort((a, b) => {
    if (sortField === "startTime") {
      const aDate = new Date(a.startTime).getTime();
      const bDate = new Date(b.startTime).getTime();
      return sortDirection === "asc" ? aDate - bDate : bDate - aDate;
    }
    if (sortField === "duration") {
      const aDuration = a.duration || 0;
      const bDuration = b.duration || 0;
      return sortDirection === "asc" ? aDuration - bDuration : bDuration - aDuration;
    }
    if (sortField === "distance") {
      const aDistance = a.distance || 0;
      const bDistance = b.distance || 0;
      return sortDirection === "asc" ? aDistance - bDistance : bDistance - aDistance;
    }
    return 0;
  });
  
  // Pagination
  const totalPages = Math.ceil(sortedLogs.length / itemsPerPage);
  const paginatedLogs = sortedLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  // Handle sort
  const handleSort = (field: keyof FlightLog) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };
  
  // Handle flight details view
  const handleViewFlightDetails = (flightId: number) => {
    setSelectedFlightId(flightId);
    setShowDetailsDialog(true);
  };
  
  // Handle creating a new flight log
  const handleCreateFlight = () => {
    setLocation('/flights/new');
  };
  
  return (
    <div className="py-6 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-secondary-900">Flight Logs</h1>
          <p className="mt-1 text-sm text-gray-500">View and manage your drone flight history</p>
        </div>
        <Button
          className="bg-primary text-white hover:bg-primary-600"
          onClick={handleCreateFlight}
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          New Flight Log
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between space-y-2 sm:space-y-0 sm:items-center">
            <div className="relative">
              <SearchIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search flight logs..."
                className="pl-9 w-full sm:w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <FilterIcon className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Tabs defaultValue="table" className="w-[200px]">
                <TabsList>
                  <TabsTrigger value="table">Table</TabsTrigger>
                  <TabsTrigger value="cards">Cards</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardHeader>
        
        <Tabs defaultValue="table">
          <TabsContent value="table" className="min-h-[60vh]">
            {isLoadingLogs ? (
              // Loading skeleton for table
              <div className="p-4">
                <div className="grid grid-cols-5 gap-4 mb-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-6" />
                  ))}
                </div>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="grid grid-cols-5 gap-4 mb-4">
                    {[1, 2, 3, 4, 5].map((j) => (
                      <Skeleton key={j} className="h-10" />
                    ))}
                  </div>
                ))}
              </div>
            ) : paginatedLogs.length > 0 ? (
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="flex items-center font-semibold"
                          onClick={() => handleSort("startTime")}
                        >
                          Date
                          <ArrowUpDownIcon className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Drone</TableHead>
                      <TableHead>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="flex items-center font-semibold"
                          onClick={() => handleSort("duration")}
                        >
                          Duration
                          <ArrowUpDownIcon className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="flex items-center font-semibold"
                          onClick={() => handleSort("distance")}
                        >
                          Distance
                          <ArrowUpDownIcon className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="font-medium">{formatRelativeTime(log.startTime)}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(log.startTime).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>{log.location || 'Unknown location'}</TableCell>
                        <TableCell>{getDroneName(log.droneId)}</TableCell>
                        <TableCell>
                          {log.duration ? formatFlightDuration(log.duration) : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {log.distance ? `${log.distance.toFixed(1)} km` : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleViewFlightDetails(log.id)}
                          >
                            <ChevronRightIcon className="h-5 w-5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 min-h-[40vh] text-center">
                <MapPinIcon className="h-12 w-12 text-gray-300 mb-4" />
                <h3 className="font-medium text-secondary-800 mb-1">No flight logs found</h3>
                <p className="text-gray-500 mb-4">
                  {searchQuery 
                    ? `No results matching "${searchQuery}"`
                    : "Record your drone flights to view them here"}
                </p>
                <Button onClick={handleCreateFlight}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Log a Flight
                </Button>
              </div>
            )}
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredLogs.length)} of {filteredLogs.length} entries
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  >
                    <ChevronRightIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="cards" className="min-h-[60vh]">
            {isLoadingLogs ? (
              // Loading skeleton for cards
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-5 w-16" />
                      </div>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-3/4 mb-4" />
                      <div className="flex items-center">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="ml-3 space-y-1">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : paginatedLogs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
                {paginatedLogs.map((log) => (
                  <Card 
                    key={log.id}
                    className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleViewFlightDetails(log.id)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between">
                        <CardTitle className="text-base">{log.location || 'Unknown location'}</CardTitle>
                        <span className="text-xs bg-gray-100 text-gray-800 py-1 px-2 rounded-full">
                          {formatRelativeTime(log.startTime)}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="flex items-center text-sm text-gray-500 mb-3">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        <span>{log.duration ? formatFlightDuration(log.duration) : 'N/A'}</span>
                        <span className="mx-2">•</span>
                        <MapPinIcon className="h-4 w-4 mr-1" />
                        <span>{log.distance ? `${log.distance.toFixed(1)} km` : 'N/A'}</span>
                      </div>
                      <div className="flex items-center">
                        <Avatar className="h-10 w-10 rounded-md">
                          <AvatarFallback className="bg-primary-100 text-primary-800">
                            {getDroneName(log.droneId).charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-secondary-700">
                            {getDroneName(log.droneId)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Max Alt: {log.maxAltitude ? `${log.maxAltitude.toFixed(0)}m` : 'N/A'}
                            {log.maxSpeed ? ` • Max Speed: ${log.maxSpeed.toFixed(0)}km/h` : ''}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 min-h-[40vh] text-center">
                <MapPinIcon className="h-12 w-12 text-gray-300 mb-4" />
                <h3 className="font-medium text-secondary-800 mb-1">No flight logs found</h3>
                <p className="text-gray-500 mb-4">
                  {searchQuery 
                    ? `No results matching "${searchQuery}"`
                    : "Record your drone flights to view them here"}
                </p>
                <Button onClick={handleCreateFlight}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Log a Flight
                </Button>
              </div>
            )}
            
            {/* Pagination (same as table view) */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredLogs.length)} of {filteredLogs.length} entries
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  >
                    <ChevronRightIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </Card>
      
      {/* Flight Details Dialog */}
      {selectedFlight && (
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Flight Details</DialogTitle>
              <DialogDescription>
                Flight on {new Date(selectedFlight.startTime).toLocaleString()}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Flight Information</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Location:</span>
                    <span className="font-medium">{selectedFlight.location || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Drone:</span>
                    <span className="font-medium">{getDroneName(selectedFlight.droneId)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Duration:</span>
                    <span className="font-medium">
                      {selectedFlight.duration ? formatFlightDuration(selectedFlight.duration) : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Distance:</span>
                    <span className="font-medium">
                      {selectedFlight.distance ? `${selectedFlight.distance.toFixed(1)} km` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Max Altitude:</span>
                    <span className="font-medium">
                      {selectedFlight.maxAltitude ? `${selectedFlight.maxAltitude.toFixed(0)} m` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Max Speed:</span>
                    <span className="font-medium">
                      {selectedFlight.maxSpeed ? `${selectedFlight.maxSpeed.toFixed(0)} km/h` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Battery Usage:</span>
                    <span className="font-medium">
                      {selectedFlight.batteryStart && selectedFlight.batteryEnd
                        ? `${selectedFlight.batteryStart}% → ${selectedFlight.batteryEnd}% (${selectedFlight.batteryStart - selectedFlight.batteryEnd}% used)`
                        : 'N/A'}
                    </span>
                  </div>
                </div>
                
                {selectedFlight.notes && (
                  <div className="mt-4">
                    <h4 className="text-md font-medium mb-1">Notes</h4>
                    <p className="text-gray-700 whitespace-pre-line">{selectedFlight.notes}</p>
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Flight Path</h3>
                <div className="bg-gray-100 rounded-lg p-4 h-64 flex items-center justify-center">
                  {selectedFlight.flightPath ? (
                    <div id="detail-map" className="w-full h-full">
                      {/* Flight path map would be rendered here using a library like Leaflet */}
                      <p className="text-center text-gray-500">Flight path visualization</p>
                    </div>
                  ) : (
                    <p className="text-center text-gray-500">No flight path data available</p>
                  )}
                </div>
                
                {selectedFlight.weatherConditions && (
                  <div className="mt-4">
                    <h4 className="text-md font-medium mb-1">Weather Conditions</h4>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(selectedFlight.weatherConditions).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-gray-500">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                            <span className="font-medium">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDetailsDialog(false)}
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  setShowDetailsDialog(false);
                  setLocation(`/flights/edit/${selectedFlight.id}`);
                }}
              >
                Edit Flight
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
