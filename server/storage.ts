import { 
  users, drones, flightLogs, batteries, weatherData, flightPlans, authenticators,
  apiSettings, aiModels, aiUsageStats,
  type User, type InsertUser, 
  type Drone, type InsertDrone,
  type FlightLog, type InsertFlightLog,
  type Battery, type InsertBattery,
  type WeatherData, type InsertWeatherData,
  type FlightPlan, type InsertFlightPlan,
  type Authenticator, type InsertAuthenticator,
  type ApiSettings, type InsertApiSettings,
  type AiModel, type InsertAiModel,
  type AiUsageStat, type InsertAiUsageStat
} from "@shared/schema";
import { eq, and, desc, asc, sql } from 'drizzle-orm';
import { db } from './db';

// Storage interface for all database operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getUsersByRole(role: string): Promise<User[]>;
  
  // Authentication operations
  getAuthenticator(credentialId: string): Promise<Authenticator | undefined>;
  getAuthenticatorsByUserId(userId: number): Promise<Authenticator[]>;
  createAuthenticator(authenticator: InsertAuthenticator): Promise<Authenticator>;
  updateAuthenticator(id: number, authenticator: Partial<Authenticator>): Promise<Authenticator | undefined>;
  deleteAuthenticator(id: number): Promise<boolean>;

  // Drone operations
  getDrone(id: number): Promise<Drone | undefined>;
  getDronesByUserId(userId: number): Promise<Drone[]>;
  createDrone(drone: InsertDrone): Promise<Drone>;
  updateDrone(id: number, drone: Partial<Drone>): Promise<Drone | undefined>;
  deleteDrone(id: number): Promise<boolean>;

  // Flight Log operations
  getFlightLog(id: number): Promise<FlightLog | undefined>;
  getRecentFlightLogs(userId: number, limit: number): Promise<FlightLog[]>;
  getFlightLogsByDroneId(droneId: number): Promise<FlightLog[]>;
  getFlightLogsByUserId(userId: number): Promise<FlightLog[]>;
  createFlightLog(flightLog: InsertFlightLog): Promise<FlightLog>;
  updateFlightLog(id: number, flightLog: Partial<FlightLog>): Promise<FlightLog | undefined>;
  deleteFlightLog(id: number): Promise<boolean>;

  // Battery operations
  getBattery(id: number): Promise<Battery | undefined>;
  getBatteriesByUserId(userId: number): Promise<Battery[]>;
  getBatteriesByDroneId(droneId: number): Promise<Battery[]>;
  createBattery(battery: InsertBattery): Promise<Battery>;
  updateBattery(id: number, battery: Partial<Battery>): Promise<Battery | undefined>;
  deleteBattery(id: number): Promise<boolean>;

  // Weather operations
  getWeatherData(id: number): Promise<WeatherData | undefined>;
  getLatestWeatherData(userId: number, location: string): Promise<WeatherData | undefined>;
  createWeatherData(weatherData: InsertWeatherData): Promise<WeatherData>;

  // Flight Plan operations
  getFlightPlan(id: number): Promise<FlightPlan | undefined>;
  getFlightPlansByUserId(userId: number): Promise<FlightPlan[]>;
  getAiSuggestions(userId: number, limit: number): Promise<FlightPlan[]>;
  createFlightPlan(flightPlan: InsertFlightPlan): Promise<FlightPlan>;
  updateFlightPlan(id: number, flightPlan: Partial<FlightPlan>): Promise<FlightPlan | undefined>;
  deleteFlightPlan(id: number): Promise<boolean>;

  // Stats operations
  getUserStats(userId: number): Promise<{
    totalFlights: number;
    flightHours: number;
    maxDistance: number;
    activeDrones: number;
  }>;
  
  // API Settings operations
  getApiSetting(id: number): Promise<ApiSettings | undefined>;
  getApiSettingByProvider(provider: string): Promise<ApiSettings | undefined>;
  getAllApiSettings(): Promise<ApiSettings[]>;
  createApiSetting(apiSetting: InsertApiSettings): Promise<ApiSettings>;
  updateApiSetting(id: number, apiSetting: Partial<ApiSettings>): Promise<ApiSettings | undefined>;
  deleteApiSetting(id: number): Promise<boolean>;
  
  // AI Model operations
  getAiModel(id: number): Promise<AiModel | undefined>;
  getAiModelByModelId(modelId: string): Promise<AiModel | undefined>;
  getAllAiModels(): Promise<AiModel[]>;
  getEnabledAiModels(): Promise<AiModel[]>;
  getDefaultAiModel(provider: string): Promise<AiModel | undefined>;
  createAiModel(aiModel: InsertAiModel): Promise<AiModel>;
  updateAiModel(id: number, aiModel: Partial<AiModel>): Promise<AiModel | undefined>;
  deleteAiModel(id: number): Promise<boolean>;
  
  // AI Usage Stats operations
  createAiUsageStat(aiUsageStat: InsertAiUsageStat): Promise<AiUsageStat>;
  recordAIUsage(usage: {
    provider: string;
    modelId: string;
    feature: string;
    userId?: number | null;
    tokenCount?: number | null;
    promptTokens?: number | null;
    completionTokens?: number | null;
    estimatedCost?: number | null;
    successful?: boolean | null;
    errorMessage?: string | null;
  }): Promise<AiUsageStat>;
  getAiUsageStats(userId?: number, limit?: number): Promise<AiUsageStat[]>;
  getAiUsageStatsByFeature(feature: string, limit?: number): Promise<AiUsageStat[]>;
  getAiUsageTotals(): Promise<{
    totalRequests: number;
    totalTokens: number;
    totalCost: number;
    successRate: number;
  }>;
  trackAIUsage(
    provider: string,
    modelId: string,
    feature?: string,
    options?: {
      userId?: number;
      tokenCount?: number;
      promptTokens?: number;
      completionTokens?: number;
      successful?: boolean;
      errorMessage?: string;
    }
  ): Promise<void>;
}

// Memory Storage Implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private drones: Map<number, Drone>;
  private flightLogs: Map<number, FlightLog>;
  private batteries: Map<number, Battery>;
  private weatherDataRecords: Map<number, WeatherData>;
  private flightPlans: Map<number, FlightPlan>;
  private authenticators: Map<number, Authenticator>;
  private apiSettings: Map<number, ApiSettings>;
  private aiModels: Map<number, AiModel>;
  private aiUsageStats: Map<number, AiUsageStat>;
  
  private userIdCounter: number;
  private droneIdCounter: number;
  private flightLogIdCounter: number;
  private batteryIdCounter: number;
  private weatherDataIdCounter: number;
  private flightPlanIdCounter: number;
  private authenticatorIdCounter: number;
  private apiSettingIdCounter: number;
  private aiModelIdCounter: number;
  private aiUsageStatIdCounter: number;

  constructor() {
    this.users = new Map();
    this.drones = new Map();
    this.flightLogs = new Map();
    this.batteries = new Map();
    this.weatherDataRecords = new Map();
    this.flightPlans = new Map();
    this.authenticators = new Map();
    this.apiSettings = new Map();
    this.aiModels = new Map();
    this.aiUsageStats = new Map();
    
    this.userIdCounter = 1;
    this.droneIdCounter = 1;
    this.flightLogIdCounter = 1;
    this.batteryIdCounter = 1;
    this.weatherDataIdCounter = 1;
    this.flightPlanIdCounter = 1;
    this.authenticatorIdCounter = 1;
    this.apiSettingIdCounter = 1;
    this.aiModelIdCounter = 1;
    this.aiUsageStatIdCounter = 1;
    
    // Add demo user
    this.createUser({
      username: "demo",
      password: "password",
      name: "John Doe",
      email: "john@example.com"
    });
    
    // Create admin user
    this.createUser({
      username: "admin",
      password: "admin123",
      name: "Admin User",
      email: "admin@dronewizard.io",
      role: "admin"
    });
    
    // Add default Gemini API setting
    this.createApiSetting({
      provider: "gemini",
      apiKey: process.env.GEMINI_API_KEY || "",
      defaultModel: "gemini-1.5-pro",
      enabled: true
    });
    
    // Add default AI models
    this.createAiModel({
      provider: "gemini",
      modelId: "gemini-1.5-pro",
      displayName: "Gemini 1.5 Pro",
      capabilities: ["text", "vision", "code"],
      maxTokens: 32768,
      costPerToken: 0.000025,
      enabled: true,
      isDefault: true
    });
    
    this.createAiModel({
      provider: "gemini",
      modelId: "gemini-1.5-flash",
      displayName: "Gemini 1.5 Flash",
      capabilities: ["text", "vision"],
      maxTokens: 32768,
      costPerToken: 0.000010,
      enabled: true,
      isDefault: false
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { 
      ...insertUser, 
      id, 
      isEmailVerified: false,
      lastLogin: null,
      currentChallenge: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async getUsersByRole(role: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      (user) => user.role === role
    );
  }
  
  // Authentication operations
  async getAuthenticator(credentialId: string): Promise<Authenticator | undefined> {
    return Array.from(this.authenticators.values()).find(
      (auth) => auth.credentialId === credentialId
    );
  }
  
  async getAuthenticatorsByUserId(userId: number): Promise<Authenticator[]> {
    return Array.from(this.authenticators.values()).filter(
      (auth) => auth.userId === userId
    );
  }
  
  async createAuthenticator(insertAuthenticator: InsertAuthenticator): Promise<Authenticator> {
    const id = this.authenticatorIdCounter++;
    const authenticator: Authenticator = { 
      ...insertAuthenticator, 
      id, 
      createdAt: new Date(),
      lastUsed: new Date()
    };
    this.authenticators.set(id, authenticator);
    return authenticator;
  }
  
  async updateAuthenticator(id: number, updates: Partial<Authenticator>): Promise<Authenticator | undefined> {
    const authenticator = this.authenticators.get(id);
    if (!authenticator) return undefined;
    
    const updatedAuthenticator = { ...authenticator, ...updates };
    this.authenticators.set(id, updatedAuthenticator);
    return updatedAuthenticator;
  }
  
  async deleteAuthenticator(id: number): Promise<boolean> {
    return this.authenticators.delete(id);
  }

  // Drone operations
  async getDrone(id: number): Promise<Drone | undefined> {
    return this.drones.get(id);
  }

  async getDronesByUserId(userId: number): Promise<Drone[]> {
    return Array.from(this.drones.values()).filter(
      (drone) => drone.userId === userId
    );
  }

  async createDrone(insertDrone: InsertDrone): Promise<Drone> {
    const id = this.droneIdCounter++;
    const drone: Drone = { 
      ...insertDrone, 
      id, 
      lastSync: new Date(),
      flightTime: 0,
      createdAt: new Date() 
    };
    this.drones.set(id, drone);
    return drone;
  }

  async updateDrone(id: number, updates: Partial<Drone>): Promise<Drone | undefined> {
    const drone = this.drones.get(id);
    if (!drone) return undefined;
    
    const updatedDrone = { ...drone, ...updates };
    this.drones.set(id, updatedDrone);
    return updatedDrone;
  }

  async deleteDrone(id: number): Promise<boolean> {
    return this.drones.delete(id);
  }

  // Flight Log operations
  async getFlightLog(id: number): Promise<FlightLog | undefined> {
    return this.flightLogs.get(id);
  }

  async getRecentFlightLogs(userId: number, limit: number): Promise<FlightLog[]> {
    return Array.from(this.flightLogs.values())
      .filter(log => log.userId === userId)
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      .slice(0, limit);
  }

  async getFlightLogsByDroneId(droneId: number): Promise<FlightLog[]> {
    return Array.from(this.flightLogs.values())
      .filter(log => log.droneId === droneId)
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  }

  async getFlightLogsByUserId(userId: number): Promise<FlightLog[]> {
    return Array.from(this.flightLogs.values())
      .filter(log => log.userId === userId)
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  }

  async createFlightLog(insertFlightLog: InsertFlightLog): Promise<FlightLog> {
    const id = this.flightLogIdCounter++;
    const flightLog: FlightLog = { ...insertFlightLog, id, createdAt: new Date() };
    this.flightLogs.set(id, flightLog);

    // Update drone's last flight and total flight time
    if (flightLog.duration) {
      const drone = this.drones.get(flightLog.droneId);
      if (drone) {
        const flightTimeHours = flightLog.duration / 3600; // Convert seconds to hours
        this.updateDrone(drone.id, {
          lastFlightId: id,
          flightTime: (drone.flightTime || 0) + flightTimeHours
        });
      }
    }

    return flightLog;
  }

  async updateFlightLog(id: number, updates: Partial<FlightLog>): Promise<FlightLog | undefined> {
    const flightLog = this.flightLogs.get(id);
    if (!flightLog) return undefined;
    
    const updatedFlightLog = { ...flightLog, ...updates };
    this.flightLogs.set(id, updatedFlightLog);
    return updatedFlightLog;
  }

  async deleteFlightLog(id: number): Promise<boolean> {
    return this.flightLogs.delete(id);
  }

  // Battery operations
  async getBattery(id: number): Promise<Battery | undefined> {
    return this.batteries.get(id);
  }

  async getBatteriesByUserId(userId: number): Promise<Battery[]> {
    return Array.from(this.batteries.values())
      .filter(battery => battery.userId === userId);
  }

  async getBatteriesByDroneId(droneId: number): Promise<Battery[]> {
    return Array.from(this.batteries.values())
      .filter(battery => battery.droneId === droneId);
  }

  async createBattery(insertBattery: InsertBattery): Promise<Battery> {
    const id = this.batteryIdCounter++;
    const battery: Battery = { ...insertBattery, id, createdAt: new Date() };
    this.batteries.set(id, battery);
    return battery;
  }

  async updateBattery(id: number, updates: Partial<Battery>): Promise<Battery | undefined> {
    const battery = this.batteries.get(id);
    if (!battery) return undefined;
    
    const updatedBattery = { ...battery, ...updates };
    this.batteries.set(id, updatedBattery);
    return updatedBattery;
  }

  async deleteBattery(id: number): Promise<boolean> {
    return this.batteries.delete(id);
  }

  // Weather operations
  async getWeatherData(id: number): Promise<WeatherData | undefined> {
    return this.weatherDataRecords.get(id);
  }

  async getLatestWeatherData(userId: number, location: string): Promise<WeatherData | undefined> {
    return Array.from(this.weatherDataRecords.values())
      .filter(data => data.userId === userId && data.location === location)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
  }

  async createWeatherData(insertWeatherData: InsertWeatherData): Promise<WeatherData> {
    const id = this.weatherDataIdCounter++;
    const weatherData: WeatherData = { ...insertWeatherData, id, timestamp: new Date() };
    this.weatherDataRecords.set(id, weatherData);
    return weatherData;
  }

  // Flight Plan operations
  async getFlightPlan(id: number): Promise<FlightPlan | undefined> {
    return this.flightPlans.get(id);
  }

  async getFlightPlansByUserId(userId: number): Promise<FlightPlan[]> {
    return Array.from(this.flightPlans.values())
      .filter(plan => plan.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getAiSuggestions(userId: number, limit: number): Promise<FlightPlan[]> {
    return Array.from(this.flightPlans.values())
      .filter(plan => plan.userId === userId && plan.isAiGenerated)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async createFlightPlan(insertFlightPlan: InsertFlightPlan): Promise<FlightPlan> {
    const id = this.flightPlanIdCounter++;
    const flightPlan: FlightPlan = { 
      ...insertFlightPlan, 
      id, 
      isCompleted: false,
      createdAt: new Date() 
    };
    this.flightPlans.set(id, flightPlan);
    return flightPlan;
  }

  async updateFlightPlan(id: number, updates: Partial<FlightPlan>): Promise<FlightPlan | undefined> {
    const flightPlan = this.flightPlans.get(id);
    if (!flightPlan) return undefined;
    
    const updatedFlightPlan = { ...flightPlan, ...updates };
    this.flightPlans.set(id, updatedFlightPlan);
    return updatedFlightPlan;
  }

  async deleteFlightPlan(id: number): Promise<boolean> {
    return this.flightPlans.delete(id);
  }

  // Stats operations
  async getUserStats(userId: number): Promise<{ 
    totalFlights: number; 
    flightHours: number; 
    maxDistance: number; 
    activeDrones: number; 
  }> {
    const userFlights = await this.getFlightLogsByUserId(userId);
    const userDrones = await this.getDronesByUserId(userId);
    
    const totalFlights = userFlights.length;
    
    const flightHours = userFlights.reduce((total, flight) => {
      return total + ((flight.duration || 0) / 3600); // Convert seconds to hours
    }, 0);
    
    const maxDistance = userFlights.reduce((max, flight) => {
      return Math.max(max, flight.distance || 0);
    }, 0);
    
    const activeDrones = userDrones.filter(drone => 
      drone.status === 'ready' || drone.status === 'flying' || drone.status === 'needs_calibration'
    ).length;
    
    return {
      totalFlights,
      flightHours: parseFloat(flightHours.toFixed(1)),
      maxDistance: parseFloat(maxDistance.toFixed(1)),
      activeDrones
    };
  }
  
  // API Settings operations
  async getApiSetting(id: number): Promise<ApiSettings | undefined> {
    return this.apiSettings.get(id);
  }
  
  async getApiSettingByProvider(provider: string): Promise<ApiSettings | undefined> {
    return Array.from(this.apiSettings.values()).find(
      (setting) => setting.provider === provider
    );
  }
  
  async getAllApiSettings(): Promise<ApiSettings[]> {
    return Array.from(this.apiSettings.values());
  }
  
  async createApiSetting(insertApiSetting: InsertApiSettings): Promise<ApiSettings> {
    const id = this.apiSettingIdCounter++;
    const apiSetting: ApiSettings = {
      ...insertApiSetting,
      id,
      requestsCount: 0,
      lastRequest: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.apiSettings.set(id, apiSetting);
    return apiSetting;
  }
  
  async updateApiSetting(id: number, updates: Partial<ApiSettings>): Promise<ApiSettings | undefined> {
    const apiSetting = this.apiSettings.get(id);
    if (!apiSetting) return undefined;
    
    const updatedApiSetting = { 
      ...apiSetting, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.apiSettings.set(id, updatedApiSetting);
    return updatedApiSetting;
  }
  
  async deleteApiSetting(id: number): Promise<boolean> {
    return this.apiSettings.delete(id);
  }
  
  // AI Model operations
  async getAiModel(id: number): Promise<AiModel | undefined> {
    return this.aiModels.get(id);
  }
  
  async getAiModelByModelId(modelId: string): Promise<AiModel | undefined> {
    return Array.from(this.aiModels.values()).find(
      (model) => model.modelId === modelId
    );
  }
  
  async getAllAiModels(): Promise<AiModel[]> {
    return Array.from(this.aiModels.values());
  }
  
  async getEnabledAiModels(): Promise<AiModel[]> {
    return Array.from(this.aiModels.values()).filter(
      (model) => model.enabled
    );
  }
  
  async getDefaultAiModel(provider: string): Promise<AiModel | undefined> {
    return Array.from(this.aiModels.values()).find(
      (model) => model.provider === provider && model.isDefault
    );
  }
  
  async createAiModel(insertAiModel: InsertAiModel): Promise<AiModel> {
    const id = this.aiModelIdCounter++;
    const aiModel: AiModel = {
      ...insertAiModel,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.aiModels.set(id, aiModel);
    
    // If this is marked as default, make sure no other model for this provider is default
    if (aiModel.isDefault) {
      for (const [modelId, model] of this.aiModels.entries()) {
        if (modelId !== id && model.provider === aiModel.provider && model.isDefault) {
          this.updateAiModel(modelId, { isDefault: false });
        }
      }
    }
    
    return aiModel;
  }
  
  async updateAiModel(id: number, updates: Partial<AiModel>): Promise<AiModel | undefined> {
    const aiModel = this.aiModels.get(id);
    if (!aiModel) return undefined;
    
    const updatedAiModel = { 
      ...aiModel, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.aiModels.set(id, updatedAiModel);
    
    // If this is now marked as default, make sure no other model for this provider is default
    if (updates.isDefault) {
      for (const [modelId, model] of this.aiModels.entries()) {
        if (modelId !== id && model.provider === aiModel.provider && model.isDefault) {
          this.updateAiModel(modelId, { isDefault: false });
        }
      }
    }
    
    return updatedAiModel;
  }
  
  async deleteAiModel(id: number): Promise<boolean> {
    return this.aiModels.delete(id);
  }
  
  // AI Usage Stats operations
  async createAiUsageStat(insertAiUsageStat: InsertAiUsageStat): Promise<AiUsageStat> {
    const id = this.aiUsageStatIdCounter++;
    const aiUsageStat: AiUsageStat = {
      ...insertAiUsageStat,
      id,
      createdAt: new Date()
    };
    this.aiUsageStats.set(id, aiUsageStat);
    
    // Update the API setting request count
    const apiSetting = await this.getApiSettingByProvider(aiUsageStat.provider);
    if (apiSetting) {
      await this.updateApiSetting(apiSetting.id, {
        requestsCount: apiSetting.requestsCount + 1,
        lastRequest: new Date()
      });
    }
    
    return aiUsageStat;
  }
  
  // Record AI usage with a structured interface
  async recordAIUsage(usage: {
    provider: string;
    modelId: string;
    feature: string;
    userId?: number | null;
    tokenCount?: number | null;
    promptTokens?: number | null;
    completionTokens?: number | null;
    estimatedCost?: number | null;
    successful?: boolean | null;
    errorMessage?: string | null;
  }): Promise<AiUsageStat> {
    // Apply default values
    const record = {
      provider: usage.provider,
      modelId: usage.modelId,
      feature: usage.feature,
      userId: usage.userId || 1, // Default to first user if not specified
      tokenCount: usage.tokenCount || 0,
      promptTokens: usage.promptTokens || 0,
      completionTokens: usage.completionTokens || 0,
      successful: usage.successful !== undefined ? usage.successful : true,
      errorMessage: usage.errorMessage || null
    };
    
    // Calculate estimated cost if not provided
    if (!usage.estimatedCost) {
      const aiModel = await this.getAiModelByModelId(usage.modelId);
      const costPerToken = aiModel?.costPerToken || 0.000005; // Default fallback cost
      record.estimatedCost = (record.tokenCount || 0) * costPerToken;
    } else {
      record.estimatedCost = usage.estimatedCost;
    }
    
    // Create and return the usage record
    return this.createAiUsageStat(record);
  }
  
  // Legacy method for backward compatibility
  async trackAIUsage(
    provider: string,
    modelId: string,
    feature: string = 'general',
    options: {
      userId?: number;
      tokenCount?: number;
      promptTokens?: number;
      completionTokens?: number;
      successful?: boolean;
      errorMessage?: string;
    } = {}
  ): Promise<void> {
    // Default values for options
    const userId = options.userId || 1; // Default to first user if not specified
    const tokenCount = options.tokenCount || 0;
    const promptTokens = options.promptTokens || 0;
    const completionTokens = options.completionTokens || 0;
    const successful = options.successful !== undefined ? options.successful : true;
    const errorMessage = options.errorMessage || null;
    
    // Calculate estimated cost based on the AI model's cost per token
    const aiModel = await this.getAiModelByModelId(modelId);
    const costPerToken = aiModel?.costPerToken || 0;
    const estimatedCost = tokenCount * costPerToken;
    
    // Create a usage stat record using the new method
    await this.recordAIUsage({
      provider,
      modelId,
      feature,
      userId,
      tokenCount,
      promptTokens,
      completionTokens,
      estimatedCost,
      successful,
      errorMessage
    });
  }

  async getAiUsageStats(userId?: number, limit?: number): Promise<AiUsageStat[]> {
    let stats = Array.from(this.aiUsageStats.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    if (userId !== undefined) {
      stats = stats.filter(stat => stat.userId === userId);
    }
    
    if (limit !== undefined) {
      stats = stats.slice(0, limit);
    }
    
    return stats;
  }
  
  async getAiUsageStatsByFeature(feature: string, limit?: number): Promise<AiUsageStat[]> {
    let stats = Array.from(this.aiUsageStats.values())
      .filter(stat => stat.feature === feature)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    if (limit !== undefined) {
      stats = stats.slice(0, limit);
    }
    
    return stats;
  }
  
  async getAiUsageTotals(): Promise<{
    totalRequests: number;
    totalTokens: number;
    totalCost: number;
    successRate: number;
  }> {
    const stats = Array.from(this.aiUsageStats.values());
    
    const totalRequests = stats.length;
    const totalTokens = stats.reduce((sum, stat) => sum + (stat.tokenCount || 0), 0);
    const totalCost = stats.reduce((sum, stat) => sum + (stat.estimatedCost || 0), 0);
    
    const successfulRequests = stats.filter(stat => stat.successful).length;
    const successRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 100;
    
    return {
      totalRequests,
      totalTokens,
      totalCost,
      successRate
    };
  }
}

// DatabaseStorage Implementation
export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({...updates, updatedAt: new Date()})
      .where(eq(users.id, id))
      .returning();
    return updatedUser || undefined;
  }
  
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }
  
  async getUsersByRole(role: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role));
  }
  
  // Authentication operations
  async getAuthenticator(credentialId: string): Promise<Authenticator | undefined> {
    const [authenticator] = await db.select().from(authenticators).where(eq(authenticators.credentialId, credentialId));
    return authenticator || undefined;
  }
  
  async getAuthenticatorsByUserId(userId: number): Promise<Authenticator[]> {
    return await db.select().from(authenticators).where(eq(authenticators.userId, userId));
  }
  
  async createAuthenticator(insertAuthenticator: InsertAuthenticator): Promise<Authenticator> {
    const [authenticator] = await db
      .insert(authenticators)
      .values(insertAuthenticator)
      .returning();
    return authenticator;
  }
  
  async updateAuthenticator(id: number, updates: Partial<Authenticator>): Promise<Authenticator | undefined> {
    const [updatedAuthenticator] = await db
      .update(authenticators)
      .set(updates)
      .where(eq(authenticators.id, id))
      .returning();
    return updatedAuthenticator || undefined;
  }
  
  async deleteAuthenticator(id: number): Promise<boolean> {
    const [deleted] = await db
      .delete(authenticators)
      .where(eq(authenticators.id, id))
      .returning();
    return !!deleted;
  }

  // Drone operations
  async getDrone(id: number): Promise<Drone | undefined> {
    const [drone] = await db.select().from(drones).where(eq(drones.id, id));
    return drone || undefined;
  }

  async getDronesByUserId(userId: number): Promise<Drone[]> {
    return await db.select().from(drones).where(eq(drones.userId, userId));
  }

  async createDrone(insertDrone: InsertDrone): Promise<Drone> {
    const [drone] = await db.insert(drones).values(insertDrone).returning();
    return drone;
  }

  async updateDrone(id: number, updates: Partial<Drone>): Promise<Drone | undefined> {
    const [updatedDrone] = await db
      .update(drones)
      .set(updates)
      .where(eq(drones.id, id))
      .returning();
    return updatedDrone || undefined;
  }

  async deleteDrone(id: number): Promise<boolean> {
    const [deleted] = await db
      .delete(drones)
      .where(eq(drones.id, id))
      .returning();
    return !!deleted;
  }

  // Flight Log operations
  async getFlightLog(id: number): Promise<FlightLog | undefined> {
    const [log] = await db.select().from(flightLogs).where(eq(flightLogs.id, id));
    return log || undefined;
  }

  async getRecentFlightLogs(userId: number, limit: number): Promise<FlightLog[]> {
    return await db
      .select()
      .from(flightLogs)
      .where(eq(flightLogs.userId, userId))
      .orderBy(desc(flightLogs.startTime))
      .limit(limit);
  }

  async getFlightLogsByDroneId(droneId: number): Promise<FlightLog[]> {
    return await db
      .select()
      .from(flightLogs)
      .where(eq(flightLogs.droneId, droneId))
      .orderBy(desc(flightLogs.startTime));
  }

  async getFlightLogsByUserId(userId: number): Promise<FlightLog[]> {
    return await db
      .select()
      .from(flightLogs)
      .where(eq(flightLogs.userId, userId))
      .orderBy(desc(flightLogs.startTime));
  }

  async createFlightLog(insertFlightLog: InsertFlightLog): Promise<FlightLog> {
    const [flightLog] = await db
      .insert(flightLogs)
      .values(insertFlightLog)
      .returning();

    // Update drone's last flight and total flight time
    if (flightLog.duration) {
      const drone = await this.getDrone(flightLog.droneId);
      if (drone) {
        const flightTimeHours = flightLog.duration / 3600; // Convert seconds to hours
        await this.updateDrone(drone.id, {
          lastFlightId: flightLog.id,
          flightTime: (drone.flightTime || 0) + flightTimeHours
        });
      }
    }

    return flightLog;
  }

  async updateFlightLog(id: number, updates: Partial<FlightLog>): Promise<FlightLog | undefined> {
    const [updatedLog] = await db
      .update(flightLogs)
      .set(updates)
      .where(eq(flightLogs.id, id))
      .returning();
    return updatedLog || undefined;
  }

  async deleteFlightLog(id: number): Promise<boolean> {
    const [deleted] = await db
      .delete(flightLogs)
      .where(eq(flightLogs.id, id))
      .returning();
    return !!deleted;
  }

  // Battery operations
  async getBattery(id: number): Promise<Battery | undefined> {
    const [battery] = await db.select().from(batteries).where(eq(batteries.id, id));
    return battery || undefined;
  }

  async getBatteriesByUserId(userId: number): Promise<Battery[]> {
    return await db
      .select()
      .from(batteries)
      .where(eq(batteries.userId, userId));
  }

  async getBatteriesByDroneId(droneId: number): Promise<Battery[]> {
    return await db
      .select()
      .from(batteries)
      .where(eq(batteries.droneId, droneId));
  }

  async createBattery(insertBattery: InsertBattery): Promise<Battery> {
    const [battery] = await db
      .insert(batteries)
      .values(insertBattery)
      .returning();
    return battery;
  }

  async updateBattery(id: number, updates: Partial<Battery>): Promise<Battery | undefined> {
    const [updatedBattery] = await db
      .update(batteries)
      .set(updates)
      .where(eq(batteries.id, id))
      .returning();
    return updatedBattery || undefined;
  }

  async deleteBattery(id: number): Promise<boolean> {
    const [deleted] = await db
      .delete(batteries)
      .where(eq(batteries.id, id))
      .returning();
    return !!deleted;
  }

  // Weather operations
  async getWeatherData(id: number): Promise<WeatherData | undefined> {
    const [data] = await db.select().from(weatherData).where(eq(weatherData.id, id));
    return data || undefined;
  }

  async getLatestWeatherData(userId: number, location: string): Promise<WeatherData | undefined> {
    const [data] = await db
      .select()
      .from(weatherData)
      .where(and(
        eq(weatherData.userId, userId),
        eq(weatherData.location, location)
      ))
      .orderBy(desc(weatherData.timestamp))
      .limit(1);
    return data || undefined;
  }

  async createWeatherData(insertWeatherData: InsertWeatherData): Promise<WeatherData> {
    const [data] = await db
      .insert(weatherData)
      .values(insertWeatherData)
      .returning();
    return data;
  }

  // Flight Plan operations
  async getFlightPlan(id: number): Promise<FlightPlan | undefined> {
    const [plan] = await db.select().from(flightPlans).where(eq(flightPlans.id, id));
    return plan || undefined;
  }

  async getFlightPlansByUserId(userId: number): Promise<FlightPlan[]> {
    return await db
      .select()
      .from(flightPlans)
      .where(eq(flightPlans.userId, userId))
      .orderBy(desc(flightPlans.createdAt));
  }

  async getAiSuggestions(userId: number, limit: number): Promise<FlightPlan[]> {
    return await db
      .select()
      .from(flightPlans)
      .where(and(
        eq(flightPlans.userId, userId),
        eq(flightPlans.isAiGenerated, true)
      ))
      .orderBy(desc(flightPlans.createdAt))
      .limit(limit);
  }

  async createFlightPlan(insertFlightPlan: InsertFlightPlan): Promise<FlightPlan> {
    const [plan] = await db
      .insert(flightPlans)
      .values(insertFlightPlan)
      .returning();
    return plan;
  }

  async updateFlightPlan(id: number, updates: Partial<FlightPlan>): Promise<FlightPlan | undefined> {
    const [updatedPlan] = await db
      .update(flightPlans)
      .set(updates)
      .where(eq(flightPlans.id, id))
      .returning();
    return updatedPlan || undefined;
  }

  async deleteFlightPlan(id: number): Promise<boolean> {
    const [deleted] = await db
      .delete(flightPlans)
      .where(eq(flightPlans.id, id))
      .returning();
    return !!deleted;
  }

  // Stats operations
  async getUserStats(userId: number): Promise<{
    totalFlights: number;
    flightHours: number;
    maxDistance: number;
    activeDrones: number;
  }> {
    // Get total flights
    const [totalFlightsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(flightLogs)
      .where(eq(flightLogs.userId, userId));
    
    const totalFlights = totalFlightsResult?.count || 0;
    
    // Get flight hours (sum of duration in seconds converted to hours)
    const [flightHoursResult] = await db
      .select({ 
        hours: sql<number>`sum(${flightLogs.duration})::float / 3600` 
      })
      .from(flightLogs)
      .where(eq(flightLogs.userId, userId));
    
    const flightHours = flightHoursResult?.hours || 0;
    
    // Get max distance
    const [maxDistanceResult] = await db
      .select({ 
        max: sql<number>`max(${flightLogs.distance})` 
      })
      .from(flightLogs)
      .where(eq(flightLogs.userId, userId));
    
    const maxDistance = maxDistanceResult?.max || 0;
    
    // Get active drones
    const [activeDronesResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(drones)
      .where(and(
        eq(drones.userId, userId),
        sql`${drones.status} IN ('ready', 'flying', 'needs_calibration')`
      ));
    
    const activeDrones = activeDronesResult?.count || 0;
    
    return {
      totalFlights,
      flightHours: parseFloat(flightHours.toFixed(1)),
      maxDistance: parseFloat(maxDistance.toFixed(1)),
      activeDrones
    };
  }
  
  // API Settings operations
  async getApiSetting(id: number): Promise<ApiSettings | undefined> {
    const [apiSetting] = await db.select().from(apiSettings).where(eq(apiSettings.id, id));
    return apiSetting || undefined;
  }
  
  async getApiSettingByProvider(provider: string): Promise<ApiSettings | undefined> {
    const [apiSetting] = await db.select().from(apiSettings).where(eq(apiSettings.provider, provider));
    return apiSetting || undefined;
  }
  
  async getAllApiSettings(): Promise<ApiSettings[]> {
    return await db.select().from(apiSettings);
  }
  
  async createApiSetting(insertApiSetting: InsertApiSettings): Promise<ApiSettings> {
    const [apiSetting] = await db
      .insert(apiSettings)
      .values(insertApiSetting)
      .returning();
    return apiSetting;
  }
  
  async updateApiSetting(id: number, updates: Partial<ApiSettings>): Promise<ApiSettings | undefined> {
    const [updatedApiSetting] = await db
      .update(apiSettings)
      .set({...updates, updatedAt: new Date()})
      .where(eq(apiSettings.id, id))
      .returning();
    return updatedApiSetting || undefined;
  }
  
  async deleteApiSetting(id: number): Promise<boolean> {
    const [deleted] = await db
      .delete(apiSettings)
      .where(eq(apiSettings.id, id))
      .returning();
    return !!deleted;
  }
  
  // AI Model operations
  async getAiModel(id: number): Promise<AiModel | undefined> {
    const [aiModel] = await db.select().from(aiModels).where(eq(aiModels.id, id));
    return aiModel || undefined;
  }
  
  async getAiModelByModelId(modelId: string): Promise<AiModel | undefined> {
    const [aiModel] = await db.select().from(aiModels).where(eq(aiModels.modelId, modelId));
    return aiModel || undefined;
  }
  
  async getAllAiModels(): Promise<AiModel[]> {
    return await db.select().from(aiModels);
  }
  
  async getEnabledAiModels(): Promise<AiModel[]> {
    return await db.select().from(aiModels).where(eq(aiModels.enabled, true));
  }
  
  async getDefaultAiModel(provider: string): Promise<AiModel | undefined> {
    const [aiModel] = await db
      .select()
      .from(aiModels)
      .where(and(
        eq(aiModels.provider, provider),
        eq(aiModels.isDefault, true)
      ));
    return aiModel || undefined;
  }
  
  async createAiModel(insertAiModel: InsertAiModel): Promise<AiModel> {
    // Begin transaction if this is a default model for a provider
    const { isDefault, provider } = insertAiModel;
    
    // If this is a default model, we need to unset all other defaults for this provider
    if (isDefault) {
      await db
        .update(aiModels)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(and(
          eq(aiModels.provider, provider),
          eq(aiModels.isDefault, true)
        ));
    }
    
    const [aiModel] = await db
      .insert(aiModels)
      .values(insertAiModel)
      .returning();
    
    return aiModel;
  }
  
  async updateAiModel(id: number, updates: Partial<AiModel>): Promise<AiModel | undefined> {
    const [aiModel] = await db.select().from(aiModels).where(eq(aiModels.id, id));
    if (!aiModel) return undefined;
    
    // If this model is being set as default, unset any other defaults for this provider
    if (updates.isDefault) {
      await db
        .update(aiModels)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(and(
          eq(aiModels.provider, aiModel.provider),
          eq(aiModels.isDefault, true),
          sql`${aiModels.id} != ${id}`
        ));
    }
    
    const [updatedAiModel] = await db
      .update(aiModels)
      .set({...updates, updatedAt: new Date()})
      .where(eq(aiModels.id, id))
      .returning();
    
    return updatedAiModel || undefined;
  }
  
  async deleteAiModel(id: number): Promise<boolean> {
    const [deleted] = await db
      .delete(aiModels)
      .where(eq(aiModels.id, id))
      .returning();
    return !!deleted;
  }
  
  // AI Usage Stats operations
  async createAiUsageStat(insertAiUsageStat: InsertAiUsageStat): Promise<AiUsageStat> {
    const [aiUsageStat] = await db
      .insert(aiUsageStats)
      .values(insertAiUsageStat)
      .returning();
    
    // Update the API setting request count
    const [apiSetting] = await db
      .select()
      .from(apiSettings)
      .where(eq(apiSettings.provider, aiUsageStat.provider));
    
    if (apiSetting) {
      await db
        .update(apiSettings)
        .set({
          requestsCount: (apiSetting.requestsCount || 0) + 1,
          lastRequest: new Date(),
          updatedAt: new Date()
        })
        .where(eq(apiSettings.id, apiSetting.id));
    }
    
    return aiUsageStat;
  }
  
  // Record AI usage with a structured interface
  async recordAIUsage(usage: {
    provider: string;
    modelId: string;
    feature: string;
    userId?: number | null;
    tokenCount?: number | null;
    promptTokens?: number | null;
    completionTokens?: number | null;
    estimatedCost?: number | null;
    successful?: boolean | null;
    errorMessage?: string | null;
  }): Promise<AiUsageStat> {
    // Apply default values
    const record = {
      provider: usage.provider,
      modelId: usage.modelId,
      feature: usage.feature,
      userId: usage.userId || 1, // Default to first user if not specified
      tokenCount: usage.tokenCount || 0,
      promptTokens: usage.promptTokens || 0,
      completionTokens: usage.completionTokens || 0,
      successful: usage.successful !== undefined ? usage.successful : true,
      errorMessage: usage.errorMessage || null
    };
    
    // Calculate estimated cost if not provided
    let estimatedCost = 0;
    if (!usage.estimatedCost) {
      const aiModel = await this.getAiModelByModelId(usage.modelId);
      const costPerToken = aiModel?.costPerToken || 0.000005; // Default fallback cost
      estimatedCost = (record.tokenCount || 0) * costPerToken;
    } else {
      estimatedCost = usage.estimatedCost;
    }
    
    // Create and return the usage record
    return this.createAiUsageStat({
      ...record,
      estimatedCost
    });
  }
  
  async trackAIUsage(
    provider: string,
    modelId: string,
    feature: string = 'general',
    options: {
      userId?: number;
      tokenCount?: number;
      promptTokens?: number;
      completionTokens?: number;
      successful?: boolean;
      errorMessage?: string;
    } = {}
  ): Promise<void> {
    // Default values for options
    const userId = options.userId || 1; // Default to first user if not specified
    const tokenCount = options.tokenCount || 0;
    const promptTokens = options.promptTokens || 0;
    const completionTokens = options.completionTokens || 0;
    const successful = options.successful !== undefined ? options.successful : true;
    const errorMessage = options.errorMessage || null;
    
    // Calculate estimated cost based on the AI model's cost per token
    const aiModel = await this.getAiModelByModelId(modelId);
    const costPerToken = aiModel?.costPerToken || 0;
    const estimatedCost = tokenCount * costPerToken;
    
    // Create a usage stat record
    await this.createAiUsageStat({
      userId,
      modelId,
      provider,
      feature,
      tokenCount,
      promptTokens,
      completionTokens,
      estimatedCost,
      successful,
      errorMessage
    });
    
    // Update the API setting's request count
    const apiSetting = await this.getApiSettingByProvider(provider);
    if (apiSetting) {
      await this.updateApiSetting(apiSetting.id, {
        requestsCount: (apiSetting.requestsCount || 0) + 1,
        lastRequest: new Date()
      });
    }
  }

  async getAiUsageStats(userId?: number, limit?: number): Promise<AiUsageStat[]> {
    let query = db.select().from(aiUsageStats);
    
    if (userId !== undefined) {
      query = query.where(eq(aiUsageStats.userId, userId));
    }
    
    query = query.orderBy(desc(aiUsageStats.createdAt));
    
    if (limit !== undefined) {
      query = query.limit(limit);
    }
    
    return await query;
  }
  
  async getAiUsageStatsByFeature(feature: string, limit?: number): Promise<AiUsageStat[]> {
    let query = db
      .select()
      .from(aiUsageStats)
      .where(eq(aiUsageStats.feature, feature))
      .orderBy(desc(aiUsageStats.createdAt));
    
    if (limit !== undefined) {
      query = query.limit(limit);
    }
    
    return await query;
  }
  
  async trackAIUsage(
    provider: string,
    modelId: string,
    feature: string = 'general',
    options: {
      userId?: number;
      tokenCount?: number;
      promptTokens?: number;
      completionTokens?: number;
      successful?: boolean;
      errorMessage?: string;
    } = {}
  ): Promise<void> {
    // Default values for options
    const userId = options.userId || 1; // Default to first user if not specified
    const tokenCount = options.tokenCount || 0;
    const promptTokens = options.promptTokens || 0;
    const completionTokens = options.completionTokens || 0;
    const successful = options.successful !== undefined ? options.successful : true;
    const errorMessage = options.errorMessage || null;
    
    // Calculate estimated cost based on the AI model's cost per token
    const aiModel = await this.getAiModelByModelId(modelId);
    const costPerToken = aiModel?.costPerToken || 0;
    const estimatedCost = tokenCount * costPerToken;
    
    // Create a usage stat record
    await this.createAiUsageStat({
      userId,
      modelId,
      provider,
      feature,
      tokenCount,
      promptTokens,
      completionTokens,
      estimatedCost,
      successful,
      errorMessage
    });
    
    // Update the API setting's request count
    const apiSetting = await this.getApiSettingByProvider(provider);
    if (apiSetting) {
      await this.updateApiSetting(apiSetting.id, {
        requestsCount: (apiSetting.requestsCount || 0) + 1,
        lastRequest: new Date()
      });
    }
  }

  async getAiUsageTotals(): Promise<{
    totalRequests: number;
    totalTokens: number;
    totalCost: number;
    successRate: number;
  }> {
    // Get total requests
    const [totalRequestsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(aiUsageStats);
    
    const totalRequests = totalRequestsResult?.count || 0;
    
    // Get total tokens
    const [totalTokensResult] = await db
      .select({ 
        sum: sql<number>`sum(${aiUsageStats.tokenCount})` 
      })
      .from(aiUsageStats);
    
    const totalTokens = totalTokensResult?.sum || 0;
    
    // Get total cost
    const [totalCostResult] = await db
      .select({ 
        sum: sql<number>`sum(${aiUsageStats.estimatedCost})` 
      })
      .from(aiUsageStats);
    
    const totalCost = totalCostResult?.sum || 0;
    
    // Get success rate
    const [successfulRequestsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(aiUsageStats)
      .where(eq(aiUsageStats.successful, true));
    
    const successfulRequests = successfulRequestsResult?.count || 0;
    const successRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 100;
    
    return {
      totalRequests,
      totalTokens,
      totalCost,
      successRate
    };
  }
}

export const storage = new DatabaseStorage();
