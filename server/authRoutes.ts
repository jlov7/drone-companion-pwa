import { Router, Request, Response } from "express";
import { IStorage } from "./storage";
import * as bcrypt from "bcrypt";
import { 
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions, 
  verifyAuthenticationResponse
} from "@simplewebauthn/server";
import type {
  GenerateRegistrationOptionsOpts,
  GenerateAuthenticationOptionsOpts,
  VerifyRegistrationResponseOpts,
  VerifyAuthenticationResponseOpts,
  VerifiedRegistrationResponse,
  VerifiedAuthenticationResponse,
} from "@simplewebauthn/server";
import type { 
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from "@simplewebauthn/browser";
import { loginUserSchema, insertUserSchema } from "@shared/schema";

// Passkey/WebAuthn settings
const rpName = "Drone Companion";
const rpID = process.env.RP_ID || "localhost";
const origin = process.env.ORIGIN || `https://${rpID}`;

export function setupAuthRoutes(app: Router, storage: IStorage) {
  // Development direct login (ONLY FOR DEVELOPMENT, REMOVE FOR PRODUCTION)
  app.post('/api/auth/dev-login', async (req: Request, res: Response) => {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(404).json({ error: "Endpoint not available in production" });
    }
    
    try {
      // Find the admin user
      const users = await storage.getAllUsers();
      const adminUser = users.find(user => user.role === 'admin');
      
      if (!adminUser) {
        return res.status(404).json({ error: "No admin user found" });
      }
      
      // Set user in session
      if (req.session) {
        req.session.userId = adminUser.id;
      }
      
      // Return user without password
      const { password, ...userWithoutPassword } = adminUser;
      return res.status(200).json({
        message: "Development login successful",
        user: userWithoutPassword
      });
    } catch (error) {
      console.error("Development login error:", error);
      return res.status(500).json({ error: "Failed to log in as admin" });
    }
  });

  // Create admin user for testing (only in development)
  app.post('/api/auth/create-admin', async (req: Request, res: Response) => {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(404).json({ error: "Endpoint not available in production" });
    }
    
    try {
      // Check if any users exist already
      const users = await storage.getAllUsers();
      if (users.length > 0) {
        return res.status(400).json({ 
          error: "Users already exist. This endpoint is only for initial setup.",
          message: "You can log in with username: admin@example.com, password: adminPassword123" 
        });
      }
      
      // Create admin user
      const hashedPassword = await bcrypt.hash("adminPassword123", 10);
      const adminUser = await storage.createUser({
        username: "admin",
        email: "admin@example.com",
        password: hashedPassword,
        name: "Admin User",
        role: "admin"
      });
      
      // Set session for auto-login
      if (req.session) {
        req.session.userId = adminUser.id;
      }
      
      return res.status(201).json({ 
        message: "Admin user created successfully", 
        user: {
          id: adminUser.id,
          username: adminUser.username,
          email: adminUser.email,
          role: adminUser.role
        },
        credentials: {
          email: "admin@example.com",
          password: "adminPassword123"
        }
      });
    } catch (error) {
      console.error("Error creating admin user:", error);
      return res.status(500).json({ error: "Failed to create admin user" });
    }
  });
  // User registration with email and password
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if user with same email already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ error: "User with this email already exists" });
      }
      
      // Hash password
      if (validatedData.password) {
        const hashedPassword = await bcrypt.hash(validatedData.password, 10);
        validatedData.password = hashedPassword;
      }
      
      // Create new user
      const user = await storage.createUser(validatedData);
      
      // Set user in session
      if (req.session) {
        req.session.userId = user.id;
      }
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ error: "Invalid registration data" });
    }
  });

  // User login with email and password
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      console.log("=== LOGIN ATTEMPT ===");
      console.log("Body:", JSON.stringify(req.body));
      console.log("Login attempt for:", req.body.email);
      
      let user;
      
      try {
        const validatedData = loginUserSchema.parse(req.body);
        console.log("Validation passed:", JSON.stringify(validatedData));
        
        user = await storage.getUserByEmail(validatedData.email);
        console.log("User found in DB:", user ? "Yes" : "No");
        
        if (!user) {
          console.log("User not found:", validatedData.email);
          return res.status(401).json({ message: "Invalid credentials" });
        }
        
        console.log("User details:", {
          id: user.id,
          email: user.email,
          role: user.role,
          hasPassword: !!user.password,
          passwordLength: user.password ? user.password.length : 0
        });
        
        // Check password
        if (!user.password) {
          console.log("No password for user:", user.email);
          return res.status(401).json({ message: "Password login not available for this account" });
        }
        
        console.log("User provided password:", validatedData.password);
        console.log("Stored password hash:", user.password);
        console.log("Comparing passwords for user:", user.email);
        
        // SPECIAL CASE FOR DEBUGGING: If this is admin user and we're in development
        if (process.env.NODE_ENV === 'development' && 
            user.email === 'admin@example.com' && 
            validatedData.password === 'adminPassword123') {
          console.log("Admin development login bypass activated!");
          // Allow login without password check for admin
        } else {
          const passwordMatch = await bcrypt.compare(validatedData.password, user.password);
          console.log("Password comparison result:", passwordMatch);
          
          if (!passwordMatch) {
            console.log("Password mismatch for user:", user.email);
            return res.status(401).json({ message: "Invalid credentials" });
          }
        }
      } catch (validationError) {
        console.error("Validation error:", validationError);
        return res.status(400).json({ error: "Invalid login data", details: validationError });
      }
      
      // Update last login
      await storage.updateUser(user.id, { lastLogin: new Date() });
      
      // Set user in session
      if (req.session) {
        req.session.userId = user.id;
      }
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ error: "Invalid login data" });
    }
  });

  // Start passkey registration
  app.post('/api/auth/passkey/register/start', async (req: Request, res: Response) => {
    try {
      // Get user from session
      if (!req.session?.userId) {
        return res.status(401).json({ error: "User must be logged in to register a passkey" });
      }
      
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }
      
      // Get existing authenticators for this user
      const userAuthenticators = await storage.getAuthenticatorsByUserId(user.id);
      
      // Generate registration options
      const options: GenerateRegistrationOptionsOpts = {
        rpName,
        rpID,
        userID: user.id.toString(),
        userName: user.email,
        userDisplayName: user.name || user.username,
        attestationType: 'none',
        excludeCredentials: userAuthenticators.map(authenticator => ({
          id: Buffer.from(authenticator.credentialId, 'base64url'),
          type: 'public-key',
          transports: authenticator.transports ? JSON.parse(authenticator.transports) : undefined,
        })),
        authenticatorSelection: {
          // Ensure that passkeys are created
          residentKey: 'required',
          userVerification: 'preferred',
        },
      };
      
      const registrationOptions = generateRegistrationOptions(options);
      
      // Save the challenge in the user record
      await storage.updateUser(user.id, { currentChallenge: registrationOptions.challenge });
      
      res.status(200).json(registrationOptions);
    } catch (error) {
      console.error("Start passkey registration error:", error);
      res.status(500).json({ error: "Failed to start passkey registration" });
    }
  });

  // Finish passkey registration
  app.post('/api/auth/passkey/register/finish', async (req: Request, res: Response) => {
    try {
      // Get user from session
      if (!req.session?.userId) {
        return res.status(401).json({ error: "User must be logged in to register a passkey" });
      }
      
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }
      
      const registrationResponse: RegistrationResponseJSON = req.body.registrationResponse;
      
      if (!user.currentChallenge) {
        return res.status(400).json({ error: "No challenge found for this registration" });
      }
      
      // Verify the registration response
      const expectedChallenge = user.currentChallenge;
      
      const options: VerifyRegistrationResponseOpts = {
        response: registrationResponse,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
      };
      
      let verification: VerifiedRegistrationResponse;
      try {
        verification = await verifyRegistrationResponse(options);
      } catch (error) {
        console.error("Verification error:", error);
        return res.status(400).json({ error: "Passkey registration verification failed" });
      }
      
      const { verified, registrationInfo } = verification;
      
      if (!verified || !registrationInfo) {
        return res.status(400).json({ error: "Passkey registration verification failed" });
      }
      
      // Get the credential ID from the response
      const { credentialID, credentialPublicKey, counter } = registrationInfo;
      
      // Check if this credential ID already exists
      const credentialIdBase64 = Buffer.from(credentialID).toString('base64url');
      const existingAuthenticator = await storage.getAuthenticator(credentialIdBase64);
      
      if (existingAuthenticator) {
        return res.status(400).json({ error: "This passkey is already registered" });
      }
      
      // Create the authenticator in the database
      const newAuthenticator = await storage.createAuthenticator({
        userId: user.id,
        credentialId: credentialIdBase64,
        credentialPublicKey: Buffer.from(credentialPublicKey).toString('base64url'),
        counter,
        credentialDeviceType: registrationResponse.response.clientExtensionResults.credProps?.rk ? 'crossPlatform' : 'platform',
        credentialBackedUp: !!registrationResponse.response.clientExtensionResults.credProps?.rk,
        transports: registrationResponse.response.transports ? JSON.stringify(registrationResponse.response.transports) : null,
      });
      
      // Clear the challenge
      await storage.updateUser(user.id, { currentChallenge: null });
      
      res.status(201).json({ 
        message: "Passkey registered successfully", 
        credential: { 
          id: newAuthenticator.id, 
          device: newAuthenticator.credentialDeviceType 
        } 
      });
    } catch (error) {
      console.error("Finish passkey registration error:", error);
      res.status(500).json({ error: "Failed to complete passkey registration" });
    }
  });

  // Start passkey login (authentication)
  app.post('/api/auth/passkey/login/start', async (req: Request, res: Response) => {
    try {
      const email = req.body.email;
      
      // If email is provided, find the user to associate the login
      let user = null;
      if (email) {
        user = await storage.getUserByEmail(email);
        if (!user) {
          return res.status(400).json({ error: "User not found" });
        }
      }
      
      // Generate authentication options
      let userAuthenticators: any[] = [];
      if (user) {
        // If we have a user, get their authenticators
        userAuthenticators = (await storage.getAuthenticatorsByUserId(user.id))
          .map(authenticator => ({
            id: Buffer.from(authenticator.credentialId, 'base64url'),
            type: 'public-key',
            transports: authenticator.transports ? JSON.parse(authenticator.transports) : undefined,
          }));
        
        // Save the challenge in the user record
        const options: GenerateAuthenticationOptionsOpts = {
          rpID,
          userVerification: 'preferred',
          allowCredentials: userAuthenticators,
        };
        
        const authenticationOptions = generateAuthenticationOptions(options);
        await storage.updateUser(user.id, { currentChallenge: authenticationOptions.challenge });
        
        res.status(200).json(authenticationOptions);
      } else {
        // No user specified, do a "usernameless" (conditional UI) authentication
        const options: GenerateAuthenticationOptionsOpts = {
          rpID,
          userVerification: 'preferred',
        };
        
        const authenticationOptions = generateAuthenticationOptions(options);
        
        // Store the challenge in session since we don't know the user yet
        if (req.session) {
          req.session.currentChallenge = authenticationOptions.challenge;
        }
        
        res.status(200).json(authenticationOptions);
      }
    } catch (error) {
      console.error("Start passkey login error:", error);
      res.status(500).json({ error: "Failed to start passkey login" });
    }
  });

  // Finish passkey login (authentication)
  app.post('/api/auth/passkey/login/finish', async (req: Request, res: Response) => {
    try {
      const authenticationResponse: AuthenticationResponseJSON = req.body.authenticationResponse;
      
      if (!authenticationResponse) {
        return res.status(400).json({ error: "Invalid authentication response" });
      }
      
      // Get the credential ID from the response
      const credentialIdBase64 = authenticationResponse.id;
      
      // Find the authenticator for this credential ID
      const authenticator = await storage.getAuthenticator(credentialIdBase64);
      
      if (!authenticator) {
        return res.status(400).json({ error: "Authenticator not found" });
      }
      
      // Get the user that owns this authenticator
      const user = await storage.getUser(authenticator.userId);
      
      if (!user) {
        return res.status(400).json({ error: "User not found" });
      }
      
      // Get the expected challenge
      let expectedChallenge: string;
      
      if (user.currentChallenge) {
        // If user was known at the start of login, get challenge from user record
        expectedChallenge = user.currentChallenge;
      } else if (req.session?.currentChallenge) {
        // Otherwise get it from the session (for conditional UI/usernameless flows)
        expectedChallenge = req.session.currentChallenge;
      } else {
        return res.status(400).json({ error: "No challenge found for this authentication" });
      }
      
      // Verify the authentication response
      const options: VerifyAuthenticationResponseOpts = {
        response: authenticationResponse,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        authenticator: {
          credentialID: Buffer.from(authenticator.credentialId, 'base64url'),
          credentialPublicKey: Buffer.from(authenticator.credentialPublicKey, 'base64url'),
          counter: authenticator.counter,
          transports: authenticator.transports ? JSON.parse(authenticator.transports) : undefined,
        },
      };
      
      let verification: VerifiedAuthenticationResponse;
      try {
        verification = await verifyAuthenticationResponse(options);
      } catch (error) {
        console.error("Verification error:", error);
        return res.status(400).json({ error: "Passkey authentication verification failed" });
      }
      
      const { verified, authenticationInfo } = verification;
      
      if (!verified || !authenticationInfo) {
        return res.status(400).json({ error: "Passkey authentication verification failed" });
      }
      
      // Update the authenticator counter
      await storage.updateAuthenticator(authenticator.id, { 
        counter: authenticationInfo.newCounter,
        lastUsed: new Date()
      });
      
      // Update user's last login and clear challenge
      await storage.updateUser(user.id, { 
        lastLogin: new Date(),
        currentChallenge: null 
      });
      
      // Clear the session challenge if it exists
      if (req.session?.currentChallenge) {
        delete req.session.currentChallenge;
      }
      
      // Set user in session
      if (req.session) {
        req.session.userId = user.id;
      }
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Finish passkey authentication error:", error);
      res.status(500).json({ error: "Failed to complete passkey login" });
    }
  });

  // User logout
  app.post('/api/auth/logout', (req: Request, res: Response) => {
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ error: "Failed to log out" });
        }
        res.status(200).json({ message: "Logged out successfully" });
      });
    } else {
      res.status(200).json({ message: "Logged out successfully" });
    }
  });

  // Get current user
  app.get('/api/auth/me', async (req: Request, res: Response) => {
    if (!req.session?.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    
    // Return user without password
    const { password, ...userWithoutPassword } = user;
    res.status(200).json(userWithoutPassword);
  });
  
  // Get user's authenticators
  app.get('/api/auth/passkeys', async (req: Request, res: Response) => {
    if (!req.session?.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const authenticators = await storage.getAuthenticatorsByUserId(req.session.userId);
    
    // Return only necessary information about authenticators
    const sanitizedAuthenticators = authenticators.map(auth => ({
      id: auth.id,
      credentialId: auth.credentialId,
      createdAt: auth.createdAt,
      lastUsed: auth.lastUsed,
      deviceType: auth.credentialDeviceType
    }));
    
    res.status(200).json(sanitizedAuthenticators);
  });
  
  // Delete a passkey
  app.delete('/api/auth/passkeys/:id', async (req: Request, res: Response) => {
    if (!req.session?.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const authenticatorId = parseInt(req.params.id);
    if (isNaN(authenticatorId)) {
      return res.status(400).json({ error: "Invalid authenticator ID" });
    }
    
    // Get the authenticator
    const authenticator = await storage.getAuthenticator(req.params.id);
    
    if (!authenticator) {
      return res.status(404).json({ error: "Authenticator not found" });
    }
    
    // Verify the authenticator belongs to the current user
    if (authenticator.userId !== req.session.userId) {
      return res.status(403).json({ error: "Not authorized to delete this passkey" });
    }
    
    // Delete the authenticator
    const deleted = await storage.deleteAuthenticator(authenticatorId);
    
    if (!deleted) {
      return res.status(500).json({ error: "Failed to delete passkey" });
    }
    
    res.status(200).json({ message: "Passkey deleted successfully" });
  });
}