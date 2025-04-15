import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { eq, desc } from "drizzle-orm";
import { db, pool } from "./db";
import { storage } from "./storage";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { 
  insertUserSchema, 
  insertDroneSchema, 
  insertFlightLogSchema, 
  insertBatterySchema, 
  insertWeatherDataSchema, 
  insertFlightPlanSchema,
  weatherData 
} from "@shared/schema";
import { z } from "zod";
import { setupDJIRoutes } from "./djiRoutes";
import { setupDJICloudRoutes } from "./djiCloudRoutes";
import { setupDJIOpenApiRoutes } from "./djiOpenApiRoutes";
import { setupAuthRoutes } from "./authRoutes";
import { setupAdminRoutes } from "./adminRoutes";
import { setupGeminiRoutes } from "./geminiRoutes";

// Session store setup
const PgSession = connectPgSimple(session);

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session middleware
  app.use(session({
    store: new PgSession({
      pool,
      tableName: 'session', // Name of the session table
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || 'drone-companion-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      httpOnly: true,
      sameSite: 'lax'
    }
  }));
  
  // Session types are defined in server/types/express-session.d.ts
  
  // API Health endpoint for diagnostics and monitoring
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0'
    });
  });
  // Create HTTP server
  const httpServer = createServer(app);
  
  // User routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(userData.username);
      
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
      }
      
      const user = await storage.createUser(userData);
      res.status(201).json({ id: user.id, username: user.username });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid user data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create user' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      // In a real app, you would use JWT or sessions
      // For simplicity, we're just returning the user id
      res.status(200).json({ id: user.id, username: user.username });
    } catch (error) {
      res.status(500).json({ message: 'Login failed' });
    }
  });

  // Drone routes
  app.get('/api/drones', async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string);
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      
      const drones = await storage.getDronesByUserId(userId);
      res.status(200).json(drones);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch drones' });
    }
  });

  app.get('/api/drones/:id', async (req, res) => {
    try {
      const droneId = parseInt(req.params.id);
      const drone = await storage.getDrone(droneId);
      
      if (!drone) {
        return res.status(404).json({ message: 'Drone not found' });
      }
      
      res.status(200).json(drone);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch drone' });
    }
  });

  app.post('/api/drones', async (req, res) => {
    try {
      const droneData = insertDroneSchema.parse(req.body);
      const drone = await storage.createDrone(droneData);
      res.status(201).json(drone);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid drone data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create drone' });
    }
  });

  app.put('/api/drones/:id', async (req, res) => {
    try {
      const droneId = parseInt(req.params.id);
      const drone = await storage.getDrone(droneId);
      
      if (!drone) {
        return res.status(404).json({ message: 'Drone not found' });
      }
      
      const updatedDrone = await storage.updateDrone(droneId, req.body);
      res.status(200).json(updatedDrone);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update drone' });
    }
  });

  app.delete('/api/drones/:id', async (req, res) => {
    try {
      const droneId = parseInt(req.params.id);
      const drone = await storage.getDrone(droneId);
      
      if (!drone) {
        return res.status(404).json({ message: 'Drone not found' });
      }
      
      await storage.deleteDrone(droneId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete drone' });
    }
  });

  // Flight Log routes
  app.get('/api/flight-logs', async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string);
      const droneId = req.query.droneId ? parseInt(req.query.droneId as string) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      
      let logs;
      if (droneId) {
        logs = await storage.getFlightLogsByDroneId(droneId);
      } else if (limit) {
        logs = await storage.getRecentFlightLogs(userId, limit);
      } else {
        logs = await storage.getFlightLogsByUserId(userId);
      }
      
      res.status(200).json(logs);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch flight logs' });
    }
  });

  app.get('/api/flight-logs/:id', async (req, res) => {
    try {
      const logId = parseInt(req.params.id);
      const log = await storage.getFlightLog(logId);
      
      if (!log) {
        return res.status(404).json({ message: 'Flight log not found' });
      }
      
      res.status(200).json(log);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch flight log' });
    }
  });

  app.post('/api/flight-logs', async (req, res) => {
    try {
      const logData = insertFlightLogSchema.parse(req.body);
      const log = await storage.createFlightLog(logData);
      res.status(201).json(log);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid flight log data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create flight log' });
    }
  });

  app.put('/api/flight-logs/:id', async (req, res) => {
    try {
      const logId = parseInt(req.params.id);
      const log = await storage.getFlightLog(logId);
      
      if (!log) {
        return res.status(404).json({ message: 'Flight log not found' });
      }
      
      const updatedLog = await storage.updateFlightLog(logId, req.body);
      res.status(200).json(updatedLog);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update flight log' });
    }
  });

  app.delete('/api/flight-logs/:id', async (req, res) => {
    try {
      const logId = parseInt(req.params.id);
      const log = await storage.getFlightLog(logId);
      
      if (!log) {
        return res.status(404).json({ message: 'Flight log not found' });
      }
      
      await storage.deleteFlightLog(logId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete flight log' });
    }
  });

  // Battery routes
  app.get('/api/batteries', async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string);
      const droneId = req.query.droneId ? parseInt(req.query.droneId as string) : undefined;
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      
      let batteries;
      if (droneId) {
        batteries = await storage.getBatteriesByDroneId(droneId);
      } else {
        batteries = await storage.getBatteriesByUserId(userId);
      }
      
      res.status(200).json(batteries);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch batteries' });
    }
  });

  app.get('/api/batteries/:id', async (req, res) => {
    try {
      const batteryId = parseInt(req.params.id);
      const battery = await storage.getBattery(batteryId);
      
      if (!battery) {
        return res.status(404).json({ message: 'Battery not found' });
      }
      
      res.status(200).json(battery);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch battery' });
    }
  });

  app.post('/api/batteries', async (req, res) => {
    try {
      const batteryData = insertBatterySchema.parse(req.body);
      const battery = await storage.createBattery(batteryData);
      res.status(201).json(battery);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid battery data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create battery' });
    }
  });

  app.put('/api/batteries/:id', async (req, res) => {
    try {
      const batteryId = parseInt(req.params.id);
      const battery = await storage.getBattery(batteryId);
      
      if (!battery) {
        return res.status(404).json({ message: 'Battery not found' });
      }
      
      const updatedBattery = await storage.updateBattery(batteryId, req.body);
      res.status(200).json(updatedBattery);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update battery' });
    }
  });

  app.delete('/api/batteries/:id', async (req, res) => {
    try {
      const batteryId = parseInt(req.params.id);
      const battery = await storage.getBattery(batteryId);
      
      if (!battery) {
        return res.status(404).json({ message: 'Battery not found' });
      }
      
      await storage.deleteBattery(batteryId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete battery' });
    }
  });

  // Weather routes
  app.get('/api/weather', async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string);
      // Default to Ashtead, Surrey (UK) if no location is provided
      let location = (req.query.location as string) || "Ashtead, Surrey";
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      
      // Check for any existing weather data for this user
      const allWeatherData = await db.select().from(weatherData)
        .where(eq(weatherData.userId, userId))
        .orderBy(desc(weatherData.timestamp))
        .limit(1);
      
      // Return existing weather data if available
      if (allWeatherData.length > 0) {
        return res.status(200).json(allWeatherData[0]);
      }
      
      // Try to get existing weather data for the requested location
      let weatherDataResult = await storage.getLatestWeatherData(userId, location);
      
      // If no weather data is found, generate data for Ashtead, Surrey
      if (!weatherDataResult) {
        console.log(`Creating demo weather data for ${location}`);
        
        // UK-appropriate weather conditions
        const ukConditions = ['Cloudy', 'Light Rain', 'Overcast', 'Partly Cloudy', 'Drizzle'];
        const condition = ukConditions[Math.floor(Math.random() * ukConditions.length)];
        
        // Lower temperature range for UK
        const temperature = Math.floor(Math.random() * 10) + 8; // 8-18°C
        
        const mockWeatherData = {
          userId: userId,
          location: location,
          temperature: temperature,
          conditions: condition,
          windSpeed: Math.floor(Math.random() * 15) + 5, // 5-20 km/h
          windDirection: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(Math.random() * 8)],
          humidity: Math.floor(Math.random() * 30) + 60, // 60-90% - UK is humid
          visibility: Math.floor(Math.random() * 5) + 3, // 3-8 km
          pressure: Math.floor(Math.random() * 20) + 1000, // 1000-1020 hPa
          uvIndex: Math.floor(Math.random() * 4) + 1, // 1-5 - lower UV in UK
          dewPoint: Math.floor(Math.random() * 5) + 5, // 5-10°C
          sunrise: '6:15 AM',
          sunset: '8:30 PM',
          recommendation: condition.includes('Rain') 
            ? 'Flying conditions are less than ideal due to rain. Consider postponing your flight.'
            : 'Fair flying conditions. Watch out for wind gusts and reduced visibility.'
        };
        
        try {
          // Create the weather data
          weatherDataResult = await storage.createWeatherData(mockWeatherData);
        } catch (error) {
          console.error("Error creating mock weather data:", error);
          throw error;
        }
      }
      
      res.status(200).json(weatherDataResult);
    } catch (error) {
      console.error('Error fetching weather data:', error);
      res.status(500).json({ message: 'Failed to fetch weather data' });
    }
  });

  app.post('/api/weather', async (req, res) => {
    try {
      const weatherData = insertWeatherDataSchema.parse(req.body);
      const data = await storage.createWeatherData(weatherData);
      res.status(201).json(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid weather data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to save weather data' });
    }
  });

  // Flight Plan routes
  app.get('/api/flight-plans', async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string);
      const aiSuggestions = req.query.aiSuggestions === 'true';
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      
      let plans;
      if (aiSuggestions && limit) {
        plans = await storage.getAiSuggestions(userId, limit);
      } else {
        plans = await storage.getFlightPlansByUserId(userId);
      }
      
      res.status(200).json(plans);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch flight plans' });
    }
  });

  app.get('/api/flight-plans/:id', async (req, res) => {
    try {
      const planId = parseInt(req.params.id);
      const plan = await storage.getFlightPlan(planId);
      
      if (!plan) {
        return res.status(404).json({ message: 'Flight plan not found' });
      }
      
      res.status(200).json(plan);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch flight plan' });
    }
  });

  app.post('/api/flight-plans', async (req, res) => {
    try {
      const planData = insertFlightPlanSchema.parse(req.body);
      const plan = await storage.createFlightPlan(planData);
      res.status(201).json(plan);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid flight plan data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create flight plan' });
    }
  });

  app.put('/api/flight-plans/:id', async (req, res) => {
    try {
      const planId = parseInt(req.params.id);
      const plan = await storage.getFlightPlan(planId);
      
      if (!plan) {
        return res.status(404).json({ message: 'Flight plan not found' });
      }
      
      const updatedPlan = await storage.updateFlightPlan(planId, req.body);
      res.status(200).json(updatedPlan);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update flight plan' });
    }
  });

  app.delete('/api/flight-plans/:id', async (req, res) => {
    try {
      const planId = parseInt(req.params.id);
      const plan = await storage.getFlightPlan(planId);
      
      if (!plan) {
        return res.status(404).json({ message: 'Flight plan not found' });
      }
      
      await storage.deleteFlightPlan(planId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete flight plan' });
    }
  });

  // Stats routes
  app.get('/api/stats', async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      
      const stats = await storage.getUserStats(userId);
      res.status(200).json(stats);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch user stats' });
    }
  });
  
  // Setup DJI Open API routes (primary implementation using App ID and App Key)
  // Add authentication routes using our passkey implementation
  setupAuthRoutes(app, storage);
  setupAdminRoutes(app, storage);
  
  // Setup Gemini AI routes for admin dashboard
  setupGeminiRoutes(app, storage);
  
  setupDJIOpenApiRoutes(app, storage);
  
  // Setup legacy DJI routes as fallback
  setupDJIRoutes(app, storage);
  
  // Setup DJI Cloud API routes as fallback 
  setupDJICloudRoutes(app, storage);

  return httpServer;
}
