import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/lib/authContext";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Helmet } from "react-helmet";
import { useQueryClient } from "@tanstack/react-query";

// Form schemas
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  name: z.string().optional(),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isPasskeyFlow, setIsPasskeyFlow] = useState(false);
  const { login, register: registerAccount, isLoading } = useAuth();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Registration form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Handle traditional login
  const onLoginSubmit = async (data: LoginFormValues) => {
    const success = await login(data.email, data.password);
    if (success) {
      toast({
        title: "Welcome back!",
        description: "You have been successfully logged in.",
      });
      setLocation("/dashboard");
    } else {
      toast({
        title: "Login failed",
        description: "Please check your credentials and try again.",
        variant: "destructive",
      });
    }
  };

  // Handle registration
  const onRegisterSubmit = async (data: RegisterFormValues) => {
    const success = await registerAccount(
      data.username,
      data.email,
      data.password,
      data.name || undefined
    );
    if (success) {
      toast({
        title: "Registration successful",
        description: "Please log in with your new account.",
      });
      setIsRegistering(false);
      loginForm.reset({
        email: data.email,
        password: "",
      });
    } else {
      toast({
        title: "Registration failed",
        description: "Please check your information and try again.",
        variant: "destructive",
      });
    }
  };

  // Development admin login bypass (ONLY FOR DEVELOPMENT!)
  const handleDevAdminLogin = async () => {
    try {
      const response = await apiRequest('/api/auth/dev-login', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      
      if (response.ok) {
        const userData = await response.json();
        queryClient.setQueryData(['/api/auth/me'], userData.user);
        queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
        
        toast({
          title: "Development Admin Login",
          description: "You have been logged in as an admin user.",
        });
        
        setLocation("/dashboard");
      } else {
        throw new Error("Failed to login as admin");
      }
    } catch (error) {
      console.error("Development admin login error:", error);
      toast({
        title: "Development login failed",
        description: "Could not log in as admin. Please check the server logs.",
        variant: "destructive",
      });
    }
  };
  
  // Handle passkey login
  const handlePasskeyLogin = async () => {
    try {
      setIsPasskeyFlow(true);
      // Start the login process
      const startResponse = await apiRequest("/api/auth/passkey/login/start", {
        method: "POST",
        body: JSON.stringify({}),
      });

      // Get the authentication options
      const options = await startResponse.json();

      // Convert base64 challenge to ArrayBuffer
      options.challenge = Uint8Array.from(
        atob(options.challenge), c => c.charCodeAt(0)
      );

      // Convert base64 allowCredentials IDs to ArrayBuffer
      if (options.allowCredentials) {
        for (let cred of options.allowCredentials) {
          cred.id = Uint8Array.from(
            atob(cred.id), c => c.charCodeAt(0)
          );
        }
      }

      // Get the credential
      // @ts-ignore
      const credential = await navigator.credentials.get({
        publicKey: options,
      });

      if (!credential) {
        throw new Error("No credential received");
      }

      // Prepare the response
      // @ts-ignore
      const authResponse = credential.response;
      const authenticationResponse = {
        id: credential.id,
        // @ts-ignore
        rawId: arrayBufferToBase64URL(credential.rawId),
        response: {
          clientDataJSON: arrayBufferToBase64URL(
            authResponse.clientDataJSON
          ),
          authenticatorData: arrayBufferToBase64URL(
            authResponse.authenticatorData
          ),
          signature: arrayBufferToBase64URL(
            authResponse.signature
          ),
          userHandle: authResponse.userHandle
            ? arrayBufferToBase64URL(authResponse.userHandle)
            : null,
          clientExtensionResults: 
            // @ts-ignore
            credential.getClientExtensionResults(),
        },
        // @ts-ignore
        type: credential.type,
      };

      // Complete the login
      const completeResponse = await apiRequest("/api/auth/passkey/login/finish", {
        method: "POST",
        body: JSON.stringify({
          authenticationResponse,
        }),
      });

      if (completeResponse.ok) {
        toast({
          title: "Welcome back!",
          description: "You have been successfully logged in with your passkey.",
        });
        setLocation("/dashboard");
      } else {
        throw new Error("Could not complete authentication");
      }
    } catch (error) {
      console.error("Passkey login error:", error);
      toast({
        title: "Authentication failed",
        description: "Could not authenticate with passkey. Please try again or use a password.",
        variant: "destructive",
      });
    } finally {
      setIsPasskeyFlow(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>{isRegistering ? "Create Account" : "Login"} | Drone Companion</title>
      </Helmet>
      
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-sky-100 to-white p-4">
        <div className="w-full max-w-md space-y-8">
          {/* Logo and app name */}
          <div className="flex flex-col items-center text-center">
            <div className="mb-2 rounded-full bg-primary p-3">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="h-8 w-8 text-white"
              >
                <path d="M12 22v-5" />
                <path d="M9 7V2" />
                <path d="M15 7V2" />
                <path d="M12 7C9.24 7 7 9.24 7 12s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5Z" />
                <path d="M9 12H7" />
                <path d="M15 12h2" />
                <path d="M12 10v2" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Drone Companion</h1>
            <p className="mt-2 text-gray-600">
              {isRegistering 
                ? "Create an account to get started" 
                : "Sign in to access your drone dashboard"}
            </p>
          </div>
          
          {/* Login/Register form card */}
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            {isRegistering ? (
              // Registration form
              <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                <h2 className="text-xl font-semibold">Create an account</h2>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Username</label>
                  <input
                    {...registerForm.register("username")}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Choose a username"
                  />
                  {registerForm.formState.errors.username && (
                    <p className="text-xs text-red-500">{registerForm.formState.errors.username.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Full Name (optional)</label>
                  <input
                    {...registerForm.register("name")}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Your name"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email Address</label>
                  <input
                    {...registerForm.register("email")}
                    type="email"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="email@example.com"
                  />
                  {registerForm.formState.errors.email && (
                    <p className="text-xs text-red-500">{registerForm.formState.errors.email.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Password</label>
                  <input
                    {...registerForm.register("password")}
                    type="password"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="••••••••"
                  />
                  {registerForm.formState.errors.password && (
                    <p className="text-xs text-red-500">{registerForm.formState.errors.password.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Confirm Password</label>
                  <input
                    {...registerForm.register("confirmPassword")}
                    type="password"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="••••••••"
                  />
                  {registerForm.formState.errors.confirmPassword && (
                    <p className="text-xs text-red-500">
                      {registerForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>
                
                <button
                  type="submit"
                  disabled={isLoading || registerForm.formState.isSubmitting}
                  className="w-full rounded-md bg-primary py-2 text-sm font-medium text-white hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
                >
                  {isLoading || registerForm.formState.isSubmitting
                    ? "Creating account..."
                    : "Create account"}
                </button>
                
                <p className="text-center text-sm text-gray-600">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setIsRegistering(false)}
                    className="text-primary hover:underline"
                  >
                    Sign in
                  </button>
                </p>
              </form>
            ) : (
              // Login form
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                <h2 className="text-xl font-semibold">Sign in</h2>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email Address</label>
                  <input
                    {...loginForm.register("email")}
                    type="email"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="email@example.com"
                  />
                  {loginForm.formState.errors.email && (
                    <p className="text-xs text-red-500">{loginForm.formState.errors.email.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Password</label>
                    <button
                      type="button"
                      className="text-xs text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <input
                    {...loginForm.register("password")}
                    type="password"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="••••••••"
                  />
                  {loginForm.formState.errors.password && (
                    <p className="text-xs text-red-500">{loginForm.formState.errors.password.message}</p>
                  )}
                </div>
                
                <button
                  type="submit"
                  disabled={isLoading || loginForm.formState.isSubmitting}
                  className="w-full rounded-md bg-primary py-2 text-sm font-medium text-white hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
                >
                  {isLoading || loginForm.formState.isSubmitting
                    ? "Signing in..."
                    : "Sign in"}
                </button>
                
                {/* Passkey button */}
                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-gray-300"></div>
                  <span className="mx-4 flex-shrink text-xs text-gray-600">or</span>
                  <div className="flex-grow border-t border-gray-300"></div>
                </div>
                
                <button
                  type="button"
                  onClick={handlePasskeyLogin}
                  disabled={isPasskeyFlow}
                  className="flex w-full items-center justify-center rounded-md border border-gray-300 bg-white py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
                >
                  {isPasskeyFlow ? (
                    "Verifying passkey..."
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mr-2 h-4 w-4"
                      >
                        <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path>
                      </svg>
                      Sign in with passkey
                    </>
                  )}
                </button>
                
                <p className="text-center text-sm text-gray-600">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setIsRegistering(true)}
                    className="text-primary hover:underline"
                  >
                    Create account
                  </button>
                </p>
                
                {/* Development Admin Login Button - REMOVE FOR PRODUCTION */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={handleDevAdminLogin}
                      className="w-full flex items-center justify-center rounded-md border border-yellow-500 bg-yellow-50 py-2 text-sm font-medium text-yellow-800 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
                    >
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        className="mr-2 h-4 w-4"
                      >
                        <path d="M12 4V2" />
                        <path d="m6.342 7.757-1.414-1.414" />
                        <path d="M4 12H2" />
                        <path d="m6.342 16.243-1.414 1.414" />
                        <path d="M12 20v2" />
                        <path d="m17.658 16.243 1.414 1.414" />
                        <path d="M20 12h2" />
                        <path d="m17.658 7.757 1.414-1.414" />
                        <circle cx="12" cy="12" r="4" />
                      </svg>
                      DEV: Login as Admin
                    </button>
                  </div>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </>
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