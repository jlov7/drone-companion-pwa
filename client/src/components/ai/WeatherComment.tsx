import { useState, useEffect } from 'react';
import { getWeatherComment } from '@/lib/geminiApi';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface WeatherCommentProps {
  weatherData: {
    temperature: number;
    windSpeed: number;
    condition: string;
    precipitation: number;
  };
}

export function WeatherComment({ weatherData }: WeatherCommentProps) {
  const [comment, setComment] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWeatherComment() {
      if (!weatherData) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const result = await getWeatherComment(weatherData);
        setComment(result);
      } catch (err) {
        console.error('Error fetching weather comment:', err);
        setError(err instanceof Error ? err.message : 'Failed to load weather comment');
      } finally {
        setLoading(false);
      }
    }
    
    fetchWeatherComment();
  }, [weatherData]);
  
  if (loading) {
    return (
      <div className="flex items-center text-xs">
        <Loader2 className="h-3 w-3 animate-spin mr-2" />
        <span>Analyzing weather conditions...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <Alert variant="destructive" className="my-1 py-1 text-xs">
        <AlertDescription>
          {error}
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="text-sm">
      {comment ? comment : 'No flight recommendations available.'}
    </div>
  );
}