import { useState, useEffect } from 'react';
import { getAchievementSuggestion } from '@/lib/geminiApi';
import { statsApi } from '@/lib/api';
import { Trophy, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function AchievementSuggestion() {
  const [suggestion, setSuggestion] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Hard-coded user ID for demo purposes
  const userId = 1;

  useEffect(() => {
    async function fetchAchievementSuggestion() {
      setLoading(true);
      setError(null);
      
      try {
        // First get user stats
        const userStats = await statsApi.getUserStats(userId);
        
        // Then get AI suggestions based on stats
        const result = await getAchievementSuggestion({
          totalFlights: userStats.totalFlights || 0,
          flightHours: userStats.flightHours || 0,
          maxDistance: userStats.maxDistance || 0,
          activeDrones: userStats.activeDrones || 0
        }, []);  // Pass empty array for unlockedAchievements
        
        setSuggestion(result);
      } catch (err) {
        console.error('Error fetching achievement suggestion:', err);
        setError(err instanceof Error ? err.message : 'Failed to load achievement suggestions');
      } finally {
        setLoading(false);
      }
    }
    
    fetchAchievementSuggestion();
  }, [userId]);
  
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
          <p className="text-muted-foreground">Generating suggestions...</p>
        </CardContent>
      </Card>
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
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-xl">
          <Trophy className="h-5 w-5 text-amber-500 mr-2" />
          Your Next Achievement Goal
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm max-w-none">
          {suggestion ? (
            <div dangerouslySetInnerHTML={{ __html: suggestion.replace(/\n/g, '<br />') }} />
          ) : (
            <p className="text-muted-foreground">No suggestions available.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}