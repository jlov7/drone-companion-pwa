import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { detectDroneModel, getModelDetails } from '@/lib/djiUtils';
import { AlertCircle, FileUp, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface DJIIntegrationProps {
  userId: number;
  onSuccess?: (data: any) => void;
}

export function DJIIntegration({ userId, onSuccess }: DJIIntegrationProps) {
  const [file, setFile] = useState<File | null>(null);
  const [serialNumber, setSerialNumber] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [droneModel, setDroneModel] = useState('');
  const [modelDetails, setModelDetails] = useState<any>(null);
  
  const { toast } = useToast();
  
  // Handle serial number validation
  const handleSerialNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSerialNumber(value);
    
    if (value.length > 5) {
      const model = detectDroneModel(value);
      setDroneModel(model);
      
      if (model !== 'Unknown') {
        setModelDetails(getModelDetails(model));
      } else {
        setModelDetails(null);
      }
    } else {
      setDroneModel('');
      setModelDetails(null);
    }
  };
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      
      // Check if it's an XML file
      if (selectedFile.type === 'application/xml' || 
          selectedFile.type === 'text/xml' || 
          selectedFile.name.toLowerCase().endsWith('.xml')) {
        setFile(selectedFile);
        setUploadError('');
      } else {
        setFile(null);
        setUploadError('Please select a valid DJI flight log (XML file)');
      }
    }
  };
  
  // Handle flight log upload
  const handleUpload = async () => {
    if (!file) {
      setUploadError('Please select a flight log file');
      return;
    }
    
    try {
      setIsUploading(true);
      setUploadProgress(0);
      setUploadError('');
      
      // Create form data
      const formData = new FormData();
      formData.append('flightLog', file);
      formData.append('userId', userId.toString());
      
      if (serialNumber) {
        formData.append('serialNumber', serialNumber);
      }
      
      // Upload progress simulation
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);
      
      // API call to upload the flight log
      const response = await fetch('/api/dji/upload-flight-log', {
        method: 'POST',
        body: formData
      });
      
      clearInterval(progressInterval);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload flight log');
      }
      
      setUploadProgress(100);
      setUploadSuccess(true);
      
      const data = await response.json();
      
      toast({
        title: 'Flight log uploaded successfully',
        description: `Processed log for ${data.drone.name}`,
      });
      
      if (onSuccess) {
        onSuccess(data);
      }
      
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Failed to upload flight log');
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };
  
  // Reset the form
  const handleReset = () => {
    setFile(null);
    setSerialNumber('');
    setUploadProgress(0);
    setUploadSuccess(false);
    setUploadError('');
    setDroneModel('');
    setModelDetails(null);
  };
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>DJI Integration</CardTitle>
        <CardDescription>
          Import flight logs from your DJI drone to automatically track flights and battery usage
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {uploadSuccess ? (
          <div className="text-center py-6">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-500 mb-2" />
            <h3 className="text-lg font-medium">Flight Log Imported</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Your DJI flight log has been successfully processed
            </p>
            <Button 
              className="mt-4"
              onClick={handleReset}
            >
              Import Another Log
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="serialNumber">Drone Serial Number (Optional)</Label>
              <Input
                id="serialNumber"
                placeholder="Enter DJI serial number"
                value={serialNumber}
                onChange={handleSerialNumberChange}
                disabled={isUploading}
              />
              
              {modelDetails && (
                <div className="text-sm mt-1">
                  <span className="font-medium">Detected:</span> {modelDetails.name}
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="flightLog">Upload Flight Log</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="flightLog"
                  type="file"
                  accept=".xml,application/xml,text/xml"
                  onChange={handleFileChange}
                  disabled={isUploading}
                  className="flex-1"
                />
              </div>
              {file && (
                <p className="text-xs text-muted-foreground">
                  Selected file: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>
            
            {uploadError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{uploadError}</AlertDescription>
              </Alert>
            )}
            
            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}
            
            <div className="text-sm space-y-2">
              <h4 className="font-medium">How to find your flight logs:</h4>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Open the DJI Fly app on your mobile device</li>
                <li>Go to your Profile &gt; Flight Records</li>
                <li>Select a flight record and tap the Share icon</li>
                <li>Choose "Export Flight Log File"</li>
                <li>Save the XML file and upload it here</li>
              </ol>
            </div>
          </>
        )}
      </CardContent>
      
      <CardFooter className={uploadSuccess ? 'hidden' : 'flex justify-end gap-2'}>
        <Button
          variant="outline"
          onClick={handleReset}
          disabled={isUploading}
        >
          Reset
        </Button>
        <Button 
          onClick={handleUpload}
          disabled={!file || isUploading}
        >
          <FileUp className="mr-2 h-4 w-4" />
          Upload Log
        </Button>
      </CardFooter>
    </Card>
  );
}