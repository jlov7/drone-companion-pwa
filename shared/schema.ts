import { pgTable, text, serial, integer, boolean, timestamp, json, real, foreignKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// User Schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password"), // Can be null for passkey-only users
  name: text("name"),
  email: text("email").notNull().unique(),
  role: text("role").default("user"), // "user", "admin"
  isEmailVerified: boolean("is_email_verified").default(false),
  lastLogin: timestamp("last_login"),
  currentChallenge: text("current_challenge"), // For WebAuthn
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
  role: true,
});

export const loginUserSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type LoginUser = z.infer<typeof loginUserSchema>;

// Passkey/WebAuthn Schema
export const authenticators = pgTable("authenticators", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  credentialId: text("credential_id").notNull().unique(),
  credentialPublicKey: text("credential_public_key").notNull(),
  counter: integer("counter").notNull(),
  credentialDeviceType: text("credential_device_type").notNull(),
  credentialBackedUp: boolean("credential_backed_up").notNull(),
  transports: text("transports"),
  createdAt: timestamp("created_at").defaultNow(),
  lastUsed: timestamp("last_used"),
});

export const insertAuthenticatorSchema = createInsertSchema(authenticators).pick({
  userId: true,
  credentialId: true,
  credentialPublicKey: true,
  counter: true, 
  credentialDeviceType: true,
  credentialBackedUp: true,
  transports: true,
});

export type InsertAuthenticator = z.infer<typeof insertAuthenticatorSchema>;
export type Authenticator = typeof authenticators.$inferSelect;

export const usersRelations = relations(users, ({ many }) => ({
  drones: many(drones),
  flightLogs: many(flightLogs),
  batteries: many(batteries),
  weatherDataRecords: many(weatherData),
  flightPlans: many(flightPlans)
}));

// Drone Schema
export const drones = pgTable("drones", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  serialNumber: text("serial_number").notNull(),
  model: text("model"),
  firmware: text("firmware"),
  status: text("status").default("ready"),
  batteryPercent: integer("battery_percent").default(100),
  lastFlightId: integer("last_flight_id"),
  lastSync: timestamp("last_sync").defaultNow(),
  storageUsed: integer("storage_used"),
  storageTotal: integer("storage_total"),
  flightTime: real("flight_time").default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDroneSchema = createInsertSchema(drones).pick({
  userId: true,
  name: true,
  serialNumber: true,
  model: true,
  firmware: true,
  status: true,
  batteryPercent: true,
  storageUsed: true,
  storageTotal: true,
  notes: true,
});

export type InsertDrone = z.infer<typeof insertDroneSchema>;
export type Drone = typeof drones.$inferSelect;

export const dronesRelations = relations(drones, ({ one, many }) => ({
  user: one(users, {
    fields: [drones.userId],
    references: [users.id]
  }),
  flightLogs: many(flightLogs),
  batteries: many(batteries)
}));

// Flight Log Schema
export const flightLogs = pgTable("flight_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  droneId: integer("drone_id").notNull().references(() => drones.id, { onDelete: "cascade" }),
  location: text("location"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  duration: integer("duration"), // in seconds
  distance: real("distance"), // in kilometers
  maxAltitude: real("max_altitude"), // in meters
  maxSpeed: real("max_speed"), // in km/h
  flightPath: json("flight_path"), // array of gps coordinates
  batteryStart: integer("battery_start"),
  batteryEnd: integer("battery_end"),
  weatherConditions: json("weather_conditions"),
  notes: text("notes"),
  isCompleted: boolean("is_completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFlightLogSchema = createInsertSchema(flightLogs).pick({
  userId: true,
  droneId: true,
  location: true,
  startTime: true,
  endTime: true,
  duration: true,
  distance: true,
  maxAltitude: true,
  maxSpeed: true,
  flightPath: true,
  batteryStart: true,
  batteryEnd: true,
  weatherConditions: true,
  notes: true,
  isCompleted: true,
});

export type InsertFlightLog = z.infer<typeof insertFlightLogSchema>;
export type FlightLog = typeof flightLogs.$inferSelect;

export const flightLogsRelations = relations(flightLogs, ({ one }) => ({
  user: one(users, {
    fields: [flightLogs.userId],
    references: [users.id]
  }),
  drone: one(drones, {
    fields: [flightLogs.droneId],
    references: [drones.id]
  })
}));

// Battery Schema
export const batteries = pgTable("batteries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  droneId: integer("drone_id").references(() => drones.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  serialNumber: text("serial_number"),
  chargeCycles: integer("charge_cycles").default(0),
  maxChargeCycles: integer("max_charge_cycles").default(300),
  health: integer("health").default(100), // percentage
  status: text("status").default("healthy"),
  lastUsed: timestamp("last_used"),
  estimatedFlightTime: integer("estimated_flight_time"), // in minutes
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBatterySchema = createInsertSchema(batteries).pick({
  userId: true,
  droneId: true,
  name: true,
  serialNumber: true,
  chargeCycles: true,
  maxChargeCycles: true,
  health: true,
  status: true,
  estimatedFlightTime: true,
});

export type InsertBattery = z.infer<typeof insertBatterySchema>;
export type Battery = typeof batteries.$inferSelect;

export const batteriesRelations = relations(batteries, ({ one }) => ({
  user: one(users, {
    fields: [batteries.userId],
    references: [users.id]
  }),
  drone: one(drones, {
    fields: [batteries.droneId],
    references: [drones.id]
  })
}));

// Weather Data Schema
export const weatherData = pgTable("weather_data", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  location: text("location").notNull(),
  temperature: real("temperature"),
  condition: text("condition"),
  windSpeed: real("wind_speed"),
  visibility: real("visibility"),
  precipitation: real("precipitation"),
  uvIndex: real("uv_index"),
  flightCondition: text("flight_condition"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertWeatherDataSchema = createInsertSchema(weatherData).pick({
  userId: true,
  location: true,
  temperature: true,
  condition: true,
  windSpeed: true,
  visibility: true,
  precipitation: true,
  uvIndex: true,
  flightCondition: true,
});

export type InsertWeatherData = z.infer<typeof insertWeatherDataSchema>;
export type WeatherData = typeof weatherData.$inferSelect;

export const weatherDataRelations = relations(weatherData, ({ one }) => ({
  user: one(users, {
    fields: [weatherData.userId],
    references: [users.id]
  })
}));

// Flight Planning Schema
export const flightPlans = pgTable("flight_plans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  location: text("location"),
  plannedAt: timestamp("planned_at"),
  duration: integer("duration"), // in minutes
  distance: real("distance"), // in kilometers
  waypoints: json("waypoints"),
  requiredBatteries: integer("required_batteries").default(1),
  weatherSuggestion: text("weather_suggestion"),
  isAiGenerated: boolean("is_ai_generated").default(false),
  isCompleted: boolean("is_completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFlightPlanSchema = createInsertSchema(flightPlans).pick({
  userId: true,
  title: true,
  description: true,
  location: true,
  plannedAt: true,
  duration: true,
  distance: true,
  waypoints: true,
  requiredBatteries: true,
  weatherSuggestion: true,
  isAiGenerated: true,
});

export type InsertFlightPlan = z.infer<typeof insertFlightPlanSchema>;
export type FlightPlan = typeof flightPlans.$inferSelect;

export const flightPlansRelations = relations(flightPlans, ({ one }) => ({
  user: one(users, {
    fields: [flightPlans.userId],
    references: [users.id]
  })
}));

// API Settings Schema
export const apiSettings = pgTable("api_settings", {
  id: serial("id").primaryKey(),
  provider: text("provider").notNull(), // e.g., "gemini", "openai"
  apiKey: text("api_key"), // Stored encrypted
  defaultModel: text("default_model"),
  enabled: boolean("enabled").default(true),
  requestsCount: integer("requests_count").default(0),
  lastRequest: timestamp("last_request"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertApiSettingsSchema = createInsertSchema(apiSettings).pick({
  provider: true,
  apiKey: true,
  defaultModel: true,
  enabled: true,
});

export type InsertApiSettings = z.infer<typeof insertApiSettingsSchema>;
export type ApiSettings = typeof apiSettings.$inferSelect;

// AI Model Configuration Schema
export const aiModels = pgTable("ai_models", {
  id: serial("id").primaryKey(),
  provider: text("provider").notNull(), // e.g., "gemini", "openai"
  modelId: text("model_id").notNull(), // e.g., "gemini-1.5-pro"
  displayName: text("display_name").notNull(),
  capabilities: json("capabilities"), // Array of capabilities like "text", "vision", etc.
  maxTokens: integer("max_tokens"),
  costPerToken: real("cost_per_token"),
  enabled: boolean("enabled").default(true),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAiModelsSchema = createInsertSchema(aiModels).pick({
  provider: true,
  modelId: true,
  displayName: true,
  capabilities: true,
  maxTokens: true,
  costPerToken: true,
  enabled: true,
  isDefault: true,
});

export type InsertAiModel = z.infer<typeof insertAiModelsSchema>;
export type AiModel = typeof aiModels.$inferSelect;

// AI Usage Statistics Schema
export const aiUsageStats = pgTable("ai_usage_stats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  modelId: text("model_id").notNull(),
  provider: text("provider").notNull(),
  feature: text("feature").notNull(), // e.g., "drone_rule_explainer", "flight_suggestions"
  tokenCount: integer("token_count").default(0),
  promptTokens: integer("prompt_tokens").default(0),
  completionTokens: integer("completion_tokens").default(0),
  estimatedCost: real("estimated_cost").default(0),
  successful: boolean("successful").default(true),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAiUsageStatsSchema = createInsertSchema(aiUsageStats).pick({
  userId: true,
  modelId: true,
  provider: true,
  feature: true,
  tokenCount: true,
  promptTokens: true,
  completionTokens: true,
  estimatedCost: true,
  successful: true,
  errorMessage: true,
});

export type InsertAiUsageStat = z.infer<typeof insertAiUsageStatsSchema>;
export type AiUsageStat = typeof aiUsageStats.$inferSelect;
