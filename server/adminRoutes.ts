import { Router } from "express";
import { IStorage } from "./storage";
import { z } from "zod";
import { insertApiSettingsSchema, insertAiModelsSchema, insertAiUsageStatsSchema } from "@shared/schema";

export const setupAdminRoutes = (router: Router, storage: IStorage) => {
  // Middleware to check if user is admin
  const isAdmin = async (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Not authorized" });
    }
    
    next();
  };

  // ===== User Management Routes =====
  // Get all users
  router.get("/admin/users", isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Get users by role
  router.get("/admin/users/role/:role", isAdmin, async (req, res) => {
    try {
      const { role } = req.params;
      const users = await storage.getUsersByRole(role);
      res.json(users);
    } catch (error) {
      console.error("Error fetching users by role:", error);
      res.status(500).json({ error: "Failed to fetch users by role" });
    }
  });

  // Update user role
  router.patch("/admin/users/:id/role", isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;
      
      if (!role) {
        return res.status(400).json({ error: "Role is required" });
      }
      
      const updatedUser = await storage.updateUser(parseInt(id), { role });
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ error: "Failed to update user role" });
    }
  });

  // ===== API Settings Routes =====
  // Get all API settings
  router.get("/admin/api-settings", isAdmin, async (req, res) => {
    try {
      const apiSettings = await storage.getAllApiSettings();
      res.json(apiSettings);
    } catch (error) {
      console.error("Error fetching API settings:", error);
      res.status(500).json({ error: "Failed to fetch API settings" });
    }
  });

  // Get API setting by ID
  router.get("/admin/api-settings/:id", isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const apiSetting = await storage.getApiSetting(parseInt(id));
      
      if (!apiSetting) {
        return res.status(404).json({ error: "API setting not found" });
      }
      
      res.json(apiSetting);
    } catch (error) {
      console.error("Error fetching API setting:", error);
      res.status(500).json({ error: "Failed to fetch API setting" });
    }
  });

  // Get API setting by provider
  router.get("/admin/api-settings/provider/:provider", isAdmin, async (req, res) => {
    try {
      const { provider } = req.params;
      const apiSetting = await storage.getApiSettingByProvider(provider);
      
      if (!apiSetting) {
        return res.status(404).json({ error: "API setting not found" });
      }
      
      res.json(apiSetting);
    } catch (error) {
      console.error("Error fetching API setting by provider:", error);
      res.status(500).json({ error: "Failed to fetch API setting by provider" });
    }
  });

  // Create API setting
  router.post("/admin/api-settings", isAdmin, async (req, res) => {
    try {
      const apiSettingData = insertApiSettingsSchema.parse(req.body);
      const apiSetting = await storage.createApiSetting(apiSettingData);
      res.status(201).json(apiSetting);
    } catch (error) {
      console.error("Error creating API setting:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid API setting data", details: error.format() });
      }
      res.status(500).json({ error: "Failed to create API setting" });
    }
  });

  // Update API setting
  router.patch("/admin/api-settings/:id", isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const updatedApiSetting = await storage.updateApiSetting(parseInt(id), updates);
      if (!updatedApiSetting) {
        return res.status(404).json({ error: "API setting not found" });
      }
      
      res.json(updatedApiSetting);
    } catch (error) {
      console.error("Error updating API setting:", error);
      res.status(500).json({ error: "Failed to update API setting" });
    }
  });

  // Delete API setting
  router.delete("/admin/api-settings/:id", isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteApiSetting(parseInt(id));
      
      if (!deleted) {
        return res.status(404).json({ error: "API setting not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting API setting:", error);
      res.status(500).json({ error: "Failed to delete API setting" });
    }
  });

  // ===== AI Model Routes =====
  // Get all AI models
  router.get("/admin/ai-models", isAdmin, async (req, res) => {
    try {
      const aiModels = await storage.getAllAiModels();
      res.json(aiModels);
    } catch (error) {
      console.error("Error fetching AI models:", error);
      res.status(500).json({ error: "Failed to fetch AI models" });
    }
  });

  // Get enabled AI models
  router.get("/admin/ai-models/enabled", isAdmin, async (req, res) => {
    try {
      const aiModels = await storage.getEnabledAiModels();
      res.json(aiModels);
    } catch (error) {
      console.error("Error fetching enabled AI models:", error);
      res.status(500).json({ error: "Failed to fetch enabled AI models" });
    }
  });

  // Get default AI model by provider
  router.get("/admin/ai-models/default/:provider", isAdmin, async (req, res) => {
    try {
      const { provider } = req.params;
      const aiModel = await storage.getDefaultAiModel(provider);
      
      if (!aiModel) {
        return res.status(404).json({ error: "Default AI model not found for provider" });
      }
      
      res.json(aiModel);
    } catch (error) {
      console.error("Error fetching default AI model:", error);
      res.status(500).json({ error: "Failed to fetch default AI model" });
    }
  });

  // Get AI model by ID
  router.get("/admin/ai-models/:id", isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const aiModel = await storage.getAiModel(parseInt(id));
      
      if (!aiModel) {
        return res.status(404).json({ error: "AI model not found" });
      }
      
      res.json(aiModel);
    } catch (error) {
      console.error("Error fetching AI model:", error);
      res.status(500).json({ error: "Failed to fetch AI model" });
    }
  });

  // Create AI model
  router.post("/admin/ai-models", isAdmin, async (req, res) => {
    try {
      const aiModelData = insertAiModelsSchema.parse(req.body);
      const aiModel = await storage.createAiModel(aiModelData);
      res.status(201).json(aiModel);
    } catch (error) {
      console.error("Error creating AI model:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid AI model data", details: error.format() });
      }
      res.status(500).json({ error: "Failed to create AI model" });
    }
  });

  // Update AI model
  router.patch("/admin/ai-models/:id", isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const updatedAiModel = await storage.updateAiModel(parseInt(id), updates);
      if (!updatedAiModel) {
        return res.status(404).json({ error: "AI model not found" });
      }
      
      res.json(updatedAiModel);
    } catch (error) {
      console.error("Error updating AI model:", error);
      res.status(500).json({ error: "Failed to update AI model" });
    }
  });

  // Delete AI model
  router.delete("/admin/ai-models/:id", isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteAiModel(parseInt(id));
      
      if (!deleted) {
        return res.status(404).json({ error: "AI model not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting AI model:", error);
      res.status(500).json({ error: "Failed to delete AI model" });
    }
  });

  // ===== AI Usage Stats Routes =====
  // Get AI usage stats
  router.get("/admin/ai-usage-stats", isAdmin, async (req, res) => {
    try {
      const { userId, limit } = req.query;
      const userIdNum = userId ? parseInt(userId as string) : undefined;
      const limitNum = limit ? parseInt(limit as string) : undefined;
      
      const aiUsageStats = await storage.getAiUsageStats(userIdNum, limitNum);
      res.json(aiUsageStats);
    } catch (error) {
      console.error("Error fetching AI usage stats:", error);
      res.status(500).json({ error: "Failed to fetch AI usage stats" });
    }
  });

  // Get AI usage stats by feature
  router.get("/admin/ai-usage-stats/feature/:feature", isAdmin, async (req, res) => {
    try {
      const { feature } = req.params;
      const { limit } = req.query;
      const limitNum = limit ? parseInt(limit as string) : undefined;
      
      const aiUsageStats = await storage.getAiUsageStatsByFeature(feature, limitNum);
      res.json(aiUsageStats);
    } catch (error) {
      console.error("Error fetching AI usage stats by feature:", error);
      res.status(500).json({ error: "Failed to fetch AI usage stats by feature" });
    }
  });

  // Get AI usage totals
  router.get("/admin/ai-usage-stats/totals", isAdmin, async (req, res) => {
    try {
      const aiUsageTotals = await storage.getAiUsageTotals();
      res.json(aiUsageTotals);
    } catch (error) {
      console.error("Error fetching AI usage totals:", error);
      res.status(500).json({ error: "Failed to fetch AI usage totals" });
    }
  });

  // Create AI usage stat
  router.post("/admin/ai-usage-stats", isAdmin, async (req, res) => {
    try {
      const aiUsageStatData = insertAiUsageStatsSchema.parse(req.body);
      const aiUsageStat = await storage.createAiUsageStat(aiUsageStatData);
      res.status(201).json(aiUsageStat);
    } catch (error) {
      console.error("Error creating AI usage stat:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid AI usage stat data", details: error.format() });
      }
      res.status(500).json({ error: "Failed to create AI usage stat" });
    }
  });

  return router;
};