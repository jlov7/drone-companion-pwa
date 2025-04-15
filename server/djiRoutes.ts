import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { parseStringPromise } from 'xml2js';
import { IStorage } from './storage';
import { 
  InsertDrone, InsertFlightLog, InsertBattery,
  insertFlightLogSchema 
} from '@shared/schema';

// Define multer types
interface MulterFile extends Express.Multer.File {}

// Configure storage for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    
    // Create the upload directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Create the upload middleware
const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Accept only XML files for flight logs
    if (file.mimetype === 'application/xml' || 
        file.mimetype === 'text/xml' || 
        path.extname(file.originalname).toLowerCase() === '.xml') {
      cb(null, true);
    } else {
      cb(new Error('Only XML files are allowed for DJI flight logs'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max file size
  }
});

// Setup routes
export function setupDJIRoutes(app: Router, storage: IStorage) {
  
  // Route for processing DJI flight log uploads
  app.post('/api/dji/upload-flight-log', upload.single('flightLog'), async (req, res) => {
    try {
      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({ message: 'No flight log file uploaded' });
      }
      
      // Get userId from the request
      const userId = parseInt(req.body.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      
      // Read the uploaded file
      const filePath = req.file.path;
      const xmlData = fs.readFileSync(filePath, 'utf8');
      
      // Parse the XML data
      const result = await parseStringPromise(xmlData, { explicitArray: false });
      
      if (!result.DJIFLIGHTLOG) {
        return res.status(400).json({ message: 'Invalid DJI flight log format' });
      }
      
      // Process drone information
      let drone;
      const serialNumber = result.DJIFLIGHTLOG.SERIAL_NUMBER || '';
      
      if (serialNumber) {
        // Check if the drone already exists
        const existingDrones = await storage.getDronesByUserId(userId);
        drone = existingDrones.find(d => d.serialNumber === serialNumber);
        
        if (!drone) {
          // Create a new drone if it doesn't exist
          const newDrone: InsertDrone = {
            userId,
            name: result.DJIFLIGHTLOG.PRODUCT_TYPE || 'DJI Drone',
            serialNumber,
            model: result.DJIFLIGHTLOG.PRODUCT_TYPE || 'Unknown DJI Model',
            firmware: result.DJIFLIGHTLOG.APP_VERSION || '',
            status: 'ready',
            batteryPercent: parseInt(result.DJIFLIGHTLOG.BATTERIES?.END_PERCENTAGE || '0'),
            storageUsed: 0,
            storageTotal: 0,
          };
          
          drone = await storage.createDrone(newDrone);
        } else {
          // Update existing drone
          await storage.updateDrone(drone.id, {
            firmware: result.DJIFLIGHTLOG.APP_VERSION || drone.firmware,
            batteryPercent: parseInt(result.DJIFLIGHTLOG.BATTERIES?.END_PERCENTAGE || '0'),
            lastSync: new Date(),
          });
        }
      } else {
        return res.status(400).json({ message: 'No drone serial number found in flight log' });
      }
      
      // Process flight log information
      const duration = parseFloat(result.DJIFLIGHTLOG.DURATION || '0') / 1000; // Convert to seconds
      const distance = parseFloat(result.DJIFLIGHTLOG.DISTANCE || '0') / 1000; // Convert to kilometers
      const maxAltitude = parseFloat(result.DJIFLIGHTLOG.MAX_HEIGHT || '0');
      const maxSpeed = parseFloat(result.DJIFLIGHTLOG.MAX_SPEED || '0');
      const location = result.DJIFLIGHTLOG.GPS_POSITION?.ADDRESS || 'Unknown Location';
      const timestamp = new Date(parseInt(result.DJIFLIGHTLOG.START_TIME || Date.now()));
      
      // Create flight log
      const flightLog: InsertFlightLog = {
        userId,
        droneId: drone.id,
        notes: `Imported DJI flight log from ${timestamp.toLocaleDateString()} at ${location}`,
        location,
        distance,
        duration,
        maxAltitude,
        maxSpeed,
        weatherConditions: result.DJIFLIGHTLOG.WEATHER || 'Unknown',
        startTime: timestamp,
        endTime: new Date(timestamp.getTime() + (duration * 1000)),
        batteryStart: parseInt(result.DJIFLIGHTLOG.BATTERIES?.START_PERCENTAGE || '100'),
        batteryEnd: parseInt(result.DJIFLIGHTLOG.BATTERIES?.END_PERCENTAGE || '0'),
        isCompleted: true
      };
      
      const createdLog = await storage.createFlightLog(flightLog);
      
      // Update drone's last flight ID and total flight time
      await storage.updateDrone(drone.id, {
        lastFlightId: createdLog.id,
        flightTime: (drone.flightTime || 0) + (duration / 3600), // Convert seconds to hours
      });
      
      // Process battery information if available
      if (result.DJIFLIGHTLOG.BATTERIES) {
        const existingBatteries = await storage.getBatteriesByDroneId(drone.id);
        const batterySerialNumber = `${serialNumber}-BAT1`;
        const existingBattery = existingBatteries.find(b => b.serialNumber === batterySerialNumber);
        
        // DJI battery cycle count
        const cycleCount = parseInt(result.DJIFLIGHTLOG.BATTERIES.CYCLE_COUNT || '0');
        // Calculate battery health (simplified)
        const batteryHealth = Math.max(0, 100 - Math.min(cycleCount / 3, 40));
        
        if (existingBattery) {
          // Update existing battery
          await storage.updateBattery(existingBattery.id, {
            chargeCycles: cycleCount,
            health: batteryHealth,
            status: batteryHealth < 70 ? 'maintenance' : 'healthy',
          });
        } else {
          // Create new battery
          const newBattery: InsertBattery = {
            userId,
            droneId: drone.id,
            name: 'Primary Battery',
            serialNumber: batterySerialNumber,
            chargeCycles: cycleCount,
            maxChargeCycles: 300, // Typical for DJI batteries
            health: batteryHealth,
            status: batteryHealth < 70 ? 'maintenance' : 'healthy',
            estimatedFlightTime: Math.round((batteryHealth / 100) * 25), // Estimate flight minutes
          };
          
          await storage.createBattery(newBattery);
        }
      }
      
      // Clean up the uploaded file
      fs.unlinkSync(filePath);
      
      // Send success response
      res.status(200).json({
        message: 'DJI flight log processed successfully',
        drone,
        flightLog: createdLog,
      });
      
    } catch (error) {
      console.error('Error processing DJI flight log:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({ message: 'Failed to process DJI flight log', error: errorMessage });
    }
  });
  
  // Route for validating DJI serial numbers
  app.post('/api/dji/validate-serial', async (req, res) => {
    try {
      const { serialNumber } = req.body;
      
      if (!serialNumber) {
        return res.status(400).json({ message: 'Serial number is required' });
      }
      
      // Validate DJI serial number format
      const isValid = validateDJISerialNumber(serialNumber);
      
      if (isValid) {
        // Get the drone model from the serial number
        const modelInfo = identifyDJIModel(serialNumber);
        
        res.status(200).json({
          valid: true,
          model: modelInfo.model,
          fullName: modelInfo.fullName,
        });
      } else {
        res.status(200).json({
          valid: false,
          message: 'Invalid DJI serial number format',
        });
      }
      
    } catch (error) {
      console.error('Error validating DJI serial number:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({ message: 'Failed to validate DJI serial number', error: errorMessage });
    }
  });
  
  return app;
}

// Helper functions for DJI serial number validation
function validateDJISerialNumber(serialNumber: string): boolean {
  // Basic format validation for DJI serial numbers
  // Note: This is a simplified validation and may not catch all valid/invalid cases
  
  // Common DJI serial number prefixes
  const validPrefixes = [
    // Mavic series
    '16U', '1WD', // Mavic Mini
    '17W', '1AD', // Mini 2
    '2AY', // Mini 3
    '2A9', // Mini 3 Pro
    '17D', // Mavic Air
    '1CH', // Mavic Air 2
    '1SD', // Air 2S
    '1P', // Mavic 3
    // Phantom series
    '0G', // Phantom 4 Pro
    // Other series
    '1L', // FPV
    '2A', // Avata
  ];
  
  if (!serialNumber || serialNumber.length < 7) {
    return false;
  }
  
  // Check if the serial number starts with one of the valid prefixes
  const prefix = serialNumber.substring(0, 2) || serialNumber.substring(0, 3);
  return validPrefixes.some(p => serialNumber.toUpperCase().startsWith(p));
}

// Function to identify DJI model from serial number
function identifyDJIModel(serialNumber: string): { model: string, fullName: string } {
  const sn = serialNumber.toUpperCase();
  
  if (sn.startsWith('16U') || sn.startsWith('1WD')) {
    return { model: 'MAVIC_MINI', fullName: 'DJI Mavic Mini' };
  } else if (sn.startsWith('17W') || sn.startsWith('1AD')) {
    return { model: 'MINI_2', fullName: 'DJI Mini 2' };
  } else if (sn.startsWith('2AY')) {
    return { model: 'MINI_3', fullName: 'DJI Mini 3' };
  } else if (sn.startsWith('2A9')) {
    return { model: 'MINI_3_PRO', fullName: 'DJI Mini 3 Pro' };
  } else if (sn.startsWith('1CH')) {
    return { model: 'MAVIC_AIR_2', fullName: 'DJI Mavic Air 2' };
  } else if (sn.startsWith('1SD')) {
    return { model: 'AIR_2S', fullName: 'DJI Air 2S' };
  } else if (sn.startsWith('1P')) {
    return { model: 'MAVIC_3', fullName: 'DJI Mavic 3' };
  } else if (sn.startsWith('0G')) {
    return { model: 'PHANTOM_4_PRO', fullName: 'DJI Phantom 4 Pro' };
  } else {
    return { model: 'UNKNOWN', fullName: 'Unknown DJI Model' };
  }
}