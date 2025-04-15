import { Router, Request, Response } from 'express';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { IStorage } from './storage';
import dotenv from 'dotenv';

dotenv.config();

export function setupGeminiRoutes(app: Router, storage: IStorage) {
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

  // Get available Gemini models (admin access)
  app.get('/api/admin/gemini/models', isAdmin, async (req: Request, res: Response) => {
    try {

      // Get Gemini API key from environment or database
      const apiKey = process.env.GEMINI_API_KEY;
      
      if (!apiKey) {
        return res.status(400).json({ 
          error: 'Gemini API key not found',
          message: 'Please set the GEMINI_API_KEY environment variable' 
        });
      }

      // Initialize the Gemini client
      const genAI = new GoogleGenerativeAI(apiKey);
      
      // Define list of known Gemini models for when API retrieval fails
      const knownModels = [
        {
          name: "models/gemini-pro",
          version: "001",
          displayName: "Gemini Pro",
          description: "The best model for scaling across a wide range of tasks",
          inputTokenLimit: 30720,
          outputTokenLimit: 2048,
          supportedGenerationMethods: ["generateContent"],
          temperature: 0.9,
          topP: 1,
          topK: 1
        },
        {
          name: "models/gemini-pro-vision",
          version: "001",
          displayName: "Gemini Pro Vision",
          description: "The best image understanding model to handle a broad range of applications",
          inputTokenLimit: 12288,
          outputTokenLimit: 4096,
          supportedGenerationMethods: ["generateContent"],
          temperature: 0.4,
          topP: 1,
          topK: 32
        },
        {
          name: "models/gemini-1.5-pro",
          version: "001",
          displayName: "Gemini 1.5 Pro",
          description: "The latest Gemini model for enhanced reasoning and understanding",
          inputTokenLimit: 1000000,
          outputTokenLimit: 8192,
          supportedGenerationMethods: ["generateContent"],
          temperature: 0.9,
          topP: 1,
          topK: 1
        }
      ];

      // Attempt to get models from the API
      try {
        // This endpoint isn't officially exposed in the client library, so we'll return known models
        // When Google makes this officially available, we can update this code
        
        // For now, return predefined list
        return res.json({ models: knownModels });
      } catch (error) {
        console.error('Error fetching Gemini models:', error);
        // Return known models as fallback
        return res.json({ models: knownModels });
      }
    } catch (error) {
      console.error('Error in Gemini models endpoint:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get enabled Gemini models (for regular users)
  app.get('/api/gemini/models', async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      // Get enabled models from the database
      const enabledModels = await storage.getEnabledAiModels();
      
      if (!enabledModels || enabledModels.length === 0) {
        // Fallback to default model if no models are enabled in the database
        return res.json({ 
          models: [
            {
              name: "models/gemini-pro",
              displayName: "Gemini Pro",
              description: "AI model for drone insights and recommendations"
            }
          ] 
        });
      }
      
      // Format the models for client consumption (simplified version)
      const clientModels = enabledModels.map(model => ({
        name: model.modelId,
        displayName: model.displayName,
        description: "AI model for drone insights and recommendations"
      }));
      
      return res.json({ models: clientModels });
    } catch (error) {
      console.error('Error fetching enabled Gemini models:', error);
      return res.status(500).json({ error: 'Failed to fetch AI models' });
    }
  });
  
  // Generate content with Gemini for regular users (feature-specific)
  app.post('/api/gemini/generate', async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      // Get request parameters
      const { feature, prompt, model: requestedModel } = req.body;
      
      if (!feature || !prompt) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }
      
      // Get API settings and default model
      const apiSettings = await storage.getApiSettingByProvider('gemini');
      if (!apiSettings || !apiSettings.enabled) {
        return res.status(503).json({ error: 'AI service is currently unavailable' });
      }
      
      // Get Gemini API key from environment or database
      const apiKey = process.env.GEMINI_API_KEY || apiSettings.apiKey;
      
      if (!apiKey) {
        return res.status(503).json({ error: 'AI service configuration is incomplete' });
      }
      
      // Determine model to use - either requested model or default
      let model = requestedModel;
      if (!model) {
        // Get default model from API settings or fallback to gemini-pro
        model = apiSettings.defaultModel || "models/gemini-pro";
      }
      
      // Initialize the Gemini client
      const genAI = new GoogleGenerativeAI(apiKey);
      
      // Get the model
      const modelInstance = genAI.getGenerativeModel({ model });
      
      // Generate content
      const result = await modelInstance.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });
      
      const response = result.response;
      const text = response.text();
      
      // Record API usage for tracking
      await storage.recordAIUsage({
        provider: 'gemini',
        modelId: model,
        feature: feature,
        userId: req.session.userId,
        tokenCount: Math.ceil((prompt.length + text.length) / 4), // Rough estimate
        promptTokens: Math.ceil(prompt.length / 4),
        completionTokens: Math.ceil(text.length / 4),
        estimatedCost: 0.000005 * Math.ceil((prompt.length + text.length) / 4), // Very rough estimate
        successful: true,
      });
      
      return res.json({ 
        result: text
      });
    } catch (error) {
      console.error('Error generating with Gemini:', error);
      
      // Record the failed attempt
      if (req.body.feature && req.session.userId) {
        try {
          await storage.recordAIUsage({
            provider: 'gemini',
            modelId: req.body.model || 'unknown',
            feature: req.body.feature,
            userId: req.session.userId,
            successful: false,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
          });
        } catch (logError) {
          console.error('Failed to record AI usage error:', logError);
        }
      }
      
      return res.status(500).json({ 
        error: 'Error generating content',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Generate content with Gemini
  app.post('/api/admin/gemini/generate', isAdmin, async (req: Request, res: Response) => {
    try {

      // Get request parameters
      const { model, prompt, temperature, topP, topK, maxOutputTokens } = req.body;

      if (!model || !prompt) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Get Gemini API key from environment or database
      const apiKey = process.env.GEMINI_API_KEY;
      
      if (!apiKey) {
        return res.status(400).json({ 
          error: 'Gemini API key not found',
          message: 'Please set the GEMINI_API_KEY environment variable' 
        });
      }

      // Initialize the Gemini client
      const genAI = new GoogleGenerativeAI(apiKey);
      
      // Get the model
      const modelInstance: GenerativeModel = genAI.getGenerativeModel({ model });

      // Set generation config
      const generationConfig = {
        temperature: temperature || 0.9,
        topP: topP || 1,
        topK: topK || 1,
        maxOutputTokens: maxOutputTokens || 2048,
      };

      // Generate content
      const result = await modelInstance.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig,
      });

      const response = result.response;
      const text = response.text();

      // Record API usage for tracking
      await storage.recordAIUsage({
        provider: 'gemini',
        modelId: model,
        feature: 'admin-generate',
        userId: req.session.userId,
        tokenCount: Math.ceil((prompt.length + text.length) / 4), // Rough estimate
        promptTokens: Math.ceil(prompt.length / 4),
        completionTokens: Math.ceil(text.length / 4),
        estimatedCost: 0.000005 * Math.ceil((prompt.length + text.length) / 4), // Rough estimate
        successful: true,
      });

      return res.json({ 
        result: text,
        usage: {
          model,
          prompt_tokens: prompt.length / 4, // Rough estimate
          completion_tokens: text.length / 4, // Rough estimate
          total_tokens: (prompt.length + text.length) / 4 // Rough estimate
        }
      });
    } catch (error) {
      console.error('Error generating with Gemini:', error);
      return res.status(500).json({ 
        error: 'Error generating content',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}