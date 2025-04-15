import { useState, useEffect } from 'react';
import { getDroneRuleExplanation } from '@/lib/geminiApi';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DroneRuleExplainerProps {
  topicId: string;
}

export function DroneRuleExplainer({ topicId }: DroneRuleExplainerProps) {
  const [explanation, setExplanation] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchExplanation() {
      if (!topicId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const result = await getDroneRuleExplanation(topicId);
        setExplanation(result);
      } catch (err) {
        console.error('Error fetching rule explanation:', err);
        setError(err instanceof Error ? err.message : 'Failed to load explanation');
      } finally {
        setLoading(false);
      }
    }
    
    fetchExplanation();
  }, [topicId]);
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Generating explanation...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertDescription>
          {error}
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="prose prose-blue max-w-none">
      {explanation ? (
        <div dangerouslySetInnerHTML={{ __html: explanation.replace(/\n/g, '<br />') }} />
      ) : (
        <p className="text-muted-foreground">Select a topic to see an explanation</p>
      )}
    </div>
  );
}