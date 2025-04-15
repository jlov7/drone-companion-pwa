import { useState, useEffect } from 'react';
import { getFlightLogInsights } from '@/lib/geminiApi';
import { Lightbulb, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FlightLogInsightsProps {
  flightLogs: Array<{
    id: number;
    duration: number;
    distance: number;
    maxAltitude: number;
    batteryUsed: number;
    location: string;
    notes?: string;
  }>;
  limit?: number;
}

export function FlightLogInsights({ flightLogs, limit = 5 }: FlightLogInsightsProps) {
  const [insights, setInsights] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInsights() {
      if (!flightLogs || flightLogs.length === 0) {
        setInsights('No flight logs available to generate insights.');
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        // Take the most recent flight log for detailed analysis
        const mostRecentLog = flightLogs[0];
        // Create a mock weather string based on log data
        const weatherDesc = mostRecentLog.maxAltitude > 100 ? "Clear skies" : "Partly cloudy";
        
        // Use the API with proper signature
        const result = await getFlightLogInsights(
          mostRecentLog.notes || "Flight completed successfully", 
          {
            duration: mostRecentLog.duration,
            location: mostRecentLog.location,
            weather: weatherDesc,
            distance: mostRecentLog.distance
          }
        );
        
        // Combine the summary and tip
        const insightText = `${result.summary}\n\n${result.tip}`;
        setInsights(insightText);
      } catch (err) {
        console.error('Error fetching flight log insights:', err);
        setError(err instanceof Error ? err.message : 'Failed to generate insights');
      } finally {
        setLoading(false);
      }
    }
    
    fetchInsights();
  }, [flightLogs, limit]);
  
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
          <p className="text-muted-foreground">Analyzing flight logs...</p>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {error}
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-xl">
          <Lightbulb className="h-5 w-5 text-primary mr-2" />
          Flight Performance Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm max-w-none">
          {insights ? (
            <div dangerouslySetInnerHTML={{ __html: insights.replace(/\n/g, '<br />') }} />
          ) : (
            <p className="text-muted-foreground">No insights available.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}