import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function RegisterPasskey() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isRegistering, setIsRegistering] = useState(false);

  const startRegistration = useMutation({
    mutationFn: async () => {
      // Start registration
      const startResponse = await apiRequest("/api/auth/passkey/register/start", {
        method: "POST",
        body: JSON.stringify({}),
      });

      // Get the registration options
      const options = await startResponse.json();

      try {
        // Convert base64 challenge to ArrayBuffer
        options.challenge = Uint8Array.from(
          atob(options.challenge), c => c.charCodeAt(0)
        );

        // Convert base64 user ID to ArrayBuffer
        options.user.id = Uint8Array.from(
          atob(options.user.id), c => c.charCodeAt(0)
        );

        // Convert base64 exclude credentials to ArrayBuffer
        if (options.excludeCredentials) {
          for (let cred of options.excludeCredentials) {
            cred.id = Uint8Array.from(
              atob(cred.id), c => c.charCodeAt(0)
            );
          }
        }

        // Get credential from browser API
        // @ts-ignore
        const credential = await navigator.credentials.create({
          publicKey: options,
        });

        if (!credential) {
          throw new Error("No credential received");
        }

        // Prepare credential for sending to server
        // @ts-ignore
        const attestationResponse = credential.response;
        const registrationResponse = {
          id: credential.id,
          // @ts-ignore
          rawId: arrayBufferToBase64URL(credential.rawId),
          response: {
            clientDataJSON: arrayBufferToBase64URL(
              attestationResponse.clientDataJSON
            ),
            attestationObject: arrayBufferToBase64URL(
              attestationResponse.attestationObject
            ),
            transports: attestationResponse.getTransports
              ? attestationResponse.getTransports()
              : undefined,
            clientExtensionResults: 
              // @ts-ignore
              credential.getClientExtensionResults(),
          },
          // @ts-ignore
          type: credential.type,
        };

        // Complete registration
        return apiRequest("/api/auth/passkey/register/finish", {
          method: "POST",
          body: JSON.stringify({
            registrationResponse,
          }),
        });
      } catch (err) {
        console.error("Passkey registration error:", err);
        throw err;
      }
    },
    onSuccess: () => {
      setIsRegistering(false);
      toast({
        title: "Success!",
        description: "Your passkey has been registered successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/passkeys'] });
    },
    onError: (error) => {
      console.error("Passkey registration error:", error);
      setIsRegistering(false);
      toast({
        title: "Registration failed",
        description: "Could not register your passkey. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAddPasskey = () => {
    setIsRegistering(true);
    startRegistration.mutate();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add a passkey</CardTitle>
        <CardDescription>
          Passkeys are a more secure alternative to passwords. They use biometrics or a security key.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isRegistering ? (
          <div className="py-8 text-center space-y-4">
            <p>Follow the instructions on your device to register a passkey...</p>
            <Button 
              variant="outline" 
              onClick={() => setIsRegistering(false)}
              disabled={startRegistration.isPending}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            <p>With a passkey, you can sign in quickly using:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Fingerprint, face recognition, or device PIN</li>
              <li>A hardware security key</li>
              <li>Your phone (even when signing in on your computer)</li>
            </ul>
          </div>
        )}
      </CardContent>
      {!isRegistering && (
        <CardFooter>
          <Button 
            className="w-full" 
            onClick={handleAddPasskey}
            disabled={isRegistering || startRegistration.isPending}
          >
            {startRegistration.isPending ? "Registering..." : "Register a passkey"}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

// Utility function to convert ArrayBuffer to Base64 URL
function arrayBufferToBase64URL(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let str = '';
  
  for (const charCode of bytes) {
    str += String.fromCharCode(charCode);
  }
  
  const base64String = btoa(str);
  return base64String.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}