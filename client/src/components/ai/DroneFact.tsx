import { useState, useEffect } from 'react';
import { getDroneFact } from '@/lib/geminiApi';
import { Lightbulb, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function DroneFact() {
  const [fact, setFact] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDroneFact() {
      setLoading(true);
      setError(null);
      
      try {
        const result = await getDroneFact();
        setFact(result);
      } catch (err) {
        console.error('Error fetching drone fact:', err);
        setError(err instanceof Error ? err.message : 'Failed to load drone fact');
      } finally {
        setLoading(false);
      }
    }
    
    fetchDroneFact();
  }, []);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center p-4 text-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
        <p className="text-muted-foreground">Loading drone fact...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <Alert variant="destructive" className="my-2">
        <AlertDescription>
          {error}
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="flex items-start space-x-3">
      <Lightbulb className="h-5 w-5 text-yellow-500 mt-1 flex-shrink-0" />
      <div className="text-sm">
        {fact ? fact : 'No fact available at the moment.'}
      </div>
    </div>
  );
}