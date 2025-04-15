import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, KeySquare, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

interface Passkey {
  id: number;
  credentialId: string;
  createdAt: string;
  lastUsed: string | null;
  deviceType: string;
}

export default function PasskeysList() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [passkeyToDelete, setPasskeyToDelete] = useState<number | null>(null);

  const { data: passkeys, isLoading, error } = useQuery<Passkey[]>({
    queryKey: ['/api/auth/passkeys'],
    queryFn: async () => {
      const response = await apiRequest('/api/auth/passkeys');
      return response.json();
    },
  });

  const deletePasskeyMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest(`/api/auth/passkeys/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/passkeys'] });
      toast({
        title: "Passkey removed",
        description: "Your passkey has been successfully removed.",
      });
      setPasskeyToDelete(null);
    },
    onError: (error) => {
      console.error("Error deleting passkey:", error);
      toast({
        title: "Error",
        description: "Could not remove the passkey. Please try again.",
        variant: "destructive",
      });
      setPasskeyToDelete(null);
    },
  });

  const handleDeletePasskey = (id: number) => {
    deletePasskeyMutation.mutate(id);
  };

  function formatDate(dateString: string | null) {
    if (!dateString) return 'Never used';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString();
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Passkeys</CardTitle>
          <CardDescription>
            Manage the passkeys associated with your account
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Passkeys</CardTitle>
          <CardDescription>
            Manage the passkeys associated with your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">
            Error loading your passkeys. Please try again later.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Passkeys</CardTitle>
        <CardDescription>
          Manage the passkeys associated with your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        {passkeys && passkeys.length > 0 ? (
          <div className="space-y-4">
            {passkeys.map((passkey) => (
              <div 
                key={passkey.id} 
                className="flex items-center justify-between p-4 border rounded-md"
              >
                <div className="flex items-center space-x-3">
                  <KeySquare className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">
                      {passkey.deviceType === 'crossPlatform' 
                        ? 'Security key' 
                        : 'Device passkey'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Added: {formatDate(passkey.createdAt)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Last used: {formatDate(passkey.lastUsed)}
                    </p>
                  </div>
                </div>
                <AlertDialog open={passkeyToDelete === passkey.id} onOpenChange={(isOpen) => {
                  if (!isOpen) setPasskeyToDelete(null);
                }}>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setPasskeyToDelete(passkey.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove passkey?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. You will no longer be able to sign in using this passkey.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        className="bg-destructive text-destructive-foreground"
                        onClick={() => handleDeletePasskey(passkey.id)}
                        disabled={deletePasskeyMutation.isPending}
                      >
                        {deletePasskeyMutation.isPending ? "Removing..." : "Remove"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center">
            <p className="text-sm text-muted-foreground">
              You don't have any passkeys registered yet.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}