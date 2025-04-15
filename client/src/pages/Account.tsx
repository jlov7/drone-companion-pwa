import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Helmet } from "react-helmet";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";
import RegisterPasskey from "@/components/auth/RegisterPasskey";
import PasskeysList from "@/components/auth/PasskeysList";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

// Profile form schema
const profileFormSchema = z.object({
  name: z.string().optional(),
  email: z.string().email({ message: "Please enter a valid email address" }),
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function AccountPage() {
  const { toast } = useToast();
  const [_, setLocation] = useLocation();

  // Get current user data
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: async () => {
      try {
        const response = await apiRequest('/api/auth/me');
        if (!response.ok) {
          // If not authenticated, redirect to login
          setLocation('/login');
          return null;
        }
        return response.json();
      } catch (error) {
        console.error('Error fetching user data:', error);
        setLocation('/login');
        return null;
      }
    },
  });

  // Profile form
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      username: user?.username || '',
    },
    values: {
      name: user?.name || '',
      email: user?.email || '',
      username: user?.username || '',
    },
  });

  function onSubmit(data: ProfileFormValues) {
    toast({
      title: "Profile updated",
      description: "Your profile information has been updated.",
    });
  }

  // Logout function
  async function handleLogout() {
    try {
      const response = await apiRequest('/api/auth/logout', {
        method: 'POST',
      });
      
      if (response.ok) {
        toast({
          title: "Logged out",
          description: "You have been successfully logged out.",
        });
        setLocation('/login');
      } else {
        toast({
          title: "Error",
          description: "Failed to log out. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  }

  if (userLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center items-center h-64">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Will redirect to login via the query
    return null;
  }

  return (
    <>
      <Helmet>
        <title>Account Settings | Drone Companion</title>
      </Helmet>
      
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Account Settings</h1>
            <p className="text-muted-foreground">Manage your account and security preferences</p>
          </div>
          <Button 
            variant="destructive" 
            className="mt-4 md:mt-0"
            onClick={handleLogout}
          >
            Sign Out
          </Button>
        </div>
        
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="john@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button type="submit">Save Changes</Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="security" className="space-y-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-2">Sign-in Methods</h3>
                <p className="text-muted-foreground mb-4">
                  Manage how you sign in to your Drone Companion account
                </p>
                <Separator className="my-6" />
              </div>
              
              {/* Password section */}
              <Card>
                <CardHeader>
                  <CardTitle>Password</CardTitle>
                  <CardDescription>
                    Update your password to keep your account secure
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Your password was last changed on{" "}
                    {user.passwordUpdatedAt 
                      ? new Date(user.passwordUpdatedAt).toLocaleDateString() 
                      : "never"}
                  </p>
                </CardContent>
                <CardFooter>
                  <Button variant="outline">Change Password</Button>
                </CardFooter>
              </Card>
              
              {/* Passkeys section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Passkeys</h3>
                <p className="text-sm text-muted-foreground">
                  Passkeys let you sign in securely without a password using your device's biometrics or security key.
                </p>
                
                <div className="grid gap-6 md:grid-cols-2">
                  <RegisterPasskey />
                  <PasskeysList />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}