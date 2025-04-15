import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, AlertTriangle } from 'lucide-react';
import { generateCustomFlightPlan } from '@/lib/geminiApi';
import { flightPlansApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';

interface CustomFlightPlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: number;
  drone?: { id: number; model: string } | null;
  weatherData?: {
    temperature?: number;
    windSpeed?: number;
    condition?: string;
    precipitation?: number;
  };
}

const customPlanFormSchema = z.object({
  location: z.string().min(3, { message: "Please enter a valid location" }),
  skillLevel: z.string().optional(),
  preferences: z.string().optional(),
  flightTime: z.number().min(5).max(60).optional(),
});

type CustomPlanFormValues = z.infer<typeof customPlanFormSchema>;

export default function CustomFlightPlanModal({ 
  open, 
  onOpenChange, 
  userId,
  drone,
  weatherData
}: CustomFlightPlanModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const form = useForm<CustomPlanFormValues>({
    resolver: zodResolver(customPlanFormSchema),
    defaultValues: {
      location: '',
      skillLevel: 'intermediate',
      preferences: 'Scenic views, photography opportunities',
      flightTime: 30,
    },
  });

  const onSubmit = async (data: CustomPlanFormValues) => {
    setIsGenerating(true);
    setGenerationError(null);
    
    try {
      // Generate flight plan with AI
      const generatedPlan = await generateCustomFlightPlan(
        {
          userId,
          location: data.location,
          droneModel: drone?.model,
          skillLevel: data.skillLevel,
          preferences: data.preferences,
          flightTime: data.flightTime,
        },
        weatherData
      );
      
      // Save the generated plan
      await flightPlansApi.createFlightPlan({
        userId,
        title: generatedPlan.title,
        description: generatedPlan.description,
        location: data.location,
        plannedAt: new Date().toISOString(),
        duration: generatedPlan.duration,
        distance: generatedPlan.distance,
        waypoints: generatedPlan.waypoints,
        requiredBatteries: generatedPlan.requiredBatteries,
        weatherSuggestion: generatedPlan.weatherSuggestion,
        isAiGenerated: true,
      });
      
      // Close the modal and show success message
      onOpenChange(false);
      toast({
        title: "Flight Plan Generated",
        description: "Your custom AI flight plan has been created and saved.",
      });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: [`/api/flight-plans?userId=${userId}`] });
      queryClient.invalidateQueries({ 
        queryKey: [`/api/flight-plans?userId=${userId}&aiSuggestions=true`] 
      });
      
    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : "Failed to generate flight plan");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Generate Custom Flight Plan</DialogTitle>
          <DialogDescription>
            Our AI will create a personalized flight plan based on your preferences
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Hyde Park, London" {...field} />
                  </FormControl>
                  <FormDescription>
                    Enter a specific location for your flight
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="skillLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pilot Experience Level</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value || 'intermediate'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your experience level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    This helps us suggest an appropriate difficulty level
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="preferences"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Flight Preferences</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="e.g. Scenic views, architectural landmarks, minimal people"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Describe what you'd like to focus on during your flight
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="flightTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Available Flight Time (minutes)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min={5}
                      max={60}
                      {...field}
                      onChange={e => field.onChange(e.target.valueAsNumber || 30)}
                    />
                  </FormControl>
                  <FormDescription>
                    Maximum time you have available for this flight
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {generationError && (
              <div className="bg-destructive/20 p-3 rounded-md flex items-start space-x-2 text-sm">
                <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div className="text-destructive">{generationError}</div>
              </div>
            )}
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isGenerating}>
                {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Plan
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}