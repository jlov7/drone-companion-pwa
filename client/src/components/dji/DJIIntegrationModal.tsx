import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DJIOpenApiIntegration } from './DJIOpenApiIntegration';
import { DJIApiDiagnostics } from './DJIApiDiagnostics';
import DJINetworkDiagnostics from './DJINetworkDiagnostics';
import { Plane, BarChart, Wrench, Network } from 'lucide-react';

interface DJIIntegrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: number;
  onSuccess?: (data: any) => void;
}

export function DJIIntegrationModal({
  open,
  onOpenChange,
  userId,
  onSuccess
}: DJIIntegrationModalProps) {
  const [activeTab, setActiveTab] = useState<string>('integration');
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Plane className="mr-2 h-5 w-5" />
            DJI Integration
          </DialogTitle>
          <DialogDescription>
            Connect your DJI account to import drones and flight logs
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="integration" className="flex items-center">
              <Wrench className="mr-2 h-4 w-4" />
              Integration
            </TabsTrigger>
            <TabsTrigger value="diagnostics" className="flex items-center">
              <BarChart className="mr-2 h-4 w-4" />
              Basic Diagnostics
            </TabsTrigger>
            <TabsTrigger value="network" className="flex items-center">
              <Network className="mr-2 h-4 w-4" />
              Network Diagnostics
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="integration" className="mt-0">
            <DJIOpenApiIntegration
              userId={userId}
              onSuccess={(data) => {
                if (onSuccess) {
                  onSuccess(data);
                }
              }}
            />
          </TabsContent>
          
          <TabsContent value="diagnostics" className="mt-0">
            <DJIApiDiagnostics />
          </TabsContent>
          
          <TabsContent value="network" className="mt-0">
            <DJINetworkDiagnostics />
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}