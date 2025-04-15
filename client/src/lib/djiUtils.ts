import { parseStringPromise } from 'xml2js';

// DJI models with their common identifiers
export const DJI_MODELS = {
  'MAVIC_MINI': {
    name: 'Mavic Mini',
    weight: '249g',
    flightTimeMax: 30, // minutes
    maxDistance: 4, // km
    maxHeight: 3, // km
    maxSpeed: 47, // km/h
    imageUrl: '/dji/mavic-mini.png'
  },
  'MINI_2': {
    name: 'Mini 2',
    weight: '249g',
    flightTimeMax: 31, // minutes
    maxDistance: 6, // km
    maxHeight: 4, // km
    maxSpeed: 57, // km/h
    imageUrl: '/dji/mini-2.png'
  },
  'MINI_3': {
    name: 'Mini 3',
    weight: '249g',
    flightTimeMax: 38, // minutes
    maxDistance: 10, // km
    maxHeight: 4, // km
    maxSpeed: 57, // km/h
    imageUrl: '/dji/mini-3.png'
  },
  'MINI_3_PRO': {
    name: 'Mini 3 Pro',
    weight: '249g',
    flightTimeMax: 34, // minutes
    maxDistance: 12, // km
    maxHeight: 4, // km
    maxSpeed: 57, // km/h
    imageUrl: '/dji/mini-3-pro.png'
  },
  'MAVIC_AIR_2': {
    name: 'Mavic Air 2',
    weight: '570g',
    flightTimeMax: 34, // minutes
    maxDistance: 10, // km
    maxHeight: 5, // km
    maxSpeed: 68, // km/h
    imageUrl: '/dji/mavic-air-2.png'
  },
  'AIR_2S': {
    name: 'Air 2S',
    weight: '595g',
    flightTimeMax: 31, // minutes
    maxDistance: 12, // km
    maxHeight: 5, // km
    maxSpeed: 68, // km/h
    imageUrl: '/dji/air-2s.png'
  },
  'MAVIC_3': {
    name: 'Mavic 3',
    weight: '895g',
    flightTimeMax: 46, // minutes
    maxDistance: 15, // km
    maxHeight: 6, // km
    maxSpeed: 75, // km/h
    imageUrl: '/dji/mavic-3.png'
  },
  'PHANTOM_4_PRO': {
    name: 'Phantom 4 Pro',
    weight: '1380g',
    flightTimeMax: 30, // minutes
    maxDistance: 7, // km
    maxHeight: 6, // km
    maxSpeed: 72, // km/h
    imageUrl: '/dji/phantom-4-pro.png'
  }
};

// Detect DJI model from serial number format
export function detectDroneModel(serialNumber: string): string {
  if (!serialNumber) return 'Unknown';
  
  serialNumber = serialNumber.toUpperCase();
  
  // Serial number patterns (simplified)
  if (serialNumber.startsWith('16U') || serialNumber.startsWith('1WD')) {
    return 'MAVIC_MINI';
  } else if (serialNumber.startsWith('17W') || serialNumber.startsWith('1AD')) {
    return 'MINI_2';
  } else if (serialNumber.startsWith('2AY')) {
    return 'MINI_3';
  } else if (serialNumber.startsWith('2A9')) {
    return 'MINI_3_PRO';
  } else if (serialNumber.startsWith('1CH')) {
    return 'MAVIC_AIR_2';
  } else if (serialNumber.startsWith('1SD')) {
    return 'AIR_2S';
  } else if (serialNumber.startsWith('1P')) {
    return 'MAVIC_3';
  } else if (serialNumber.startsWith('0G')) {
    return 'PHANTOM_4_PRO';
  }
  
  return 'Unknown';
}

// Parse DJI flight log XML data
export async function parseDJIFlightLog(xmlData: string) {
  try {
    const result = await parseStringPromise(xmlData, { explicitArray: false });
    
    if (!result.DJIFLIGHTLOG) {
      throw new Error('Invalid DJI flight log format');
    }
    
    // Basic flight information
    const flightData = {
      droneInfo: {
        serialNumber: result.DJIFLIGHTLOG.SERIAL_NUMBER || '',
        model: result.DJIFLIGHTLOG.PRODUCT_TYPE || '',
        firmware: result.DJIFLIGHTLOG.APP_VERSION || '',
      },
      flightDetails: {
        duration: parseFloat(result.DJIFLIGHTLOG.DURATION || '0') / 1000, // Convert to seconds
        distance: parseFloat(result.DJIFLIGHTLOG.DISTANCE || '0') / 1000, // Convert to kilometers
        maxAltitude: parseFloat(result.DJIFLIGHTLOG.MAX_HEIGHT || '0'),
        maxSpeed: parseFloat(result.DJIFLIGHTLOG.MAX_SPEED || '0'),
        location: result.DJIFLIGHTLOG.GPS_POSITION?.ADDRESS || 'Unknown Location',
        timestamp: new Date(parseInt(result.DJIFLIGHTLOG.START_TIME || Date.now())),
      },
      batteryInfo: {
        startLevel: parseInt(result.DJIFLIGHTLOG.BATTERIES?.START_PERCENTAGE || '100'),
        endLevel: parseInt(result.DJIFLIGHTLOG.BATTERIES?.END_PERCENTAGE || '0'),
        temperature: parseFloat(result.DJIFLIGHTLOG.BATTERIES?.TEMPERATURE || '0'),
        cycles: parseInt(result.DJIFLIGHTLOG.BATTERIES?.CYCLE_COUNT || '0'),
      },
      waypoints: [],
    };
    
    // Parse waypoints if available
    if (result.DJIFLIGHTLOG.WAYPOINTS && result.DJIFLIGHTLOG.WAYPOINTS.POINT) {
      const points = Array.isArray(result.DJIFLIGHTLOG.WAYPOINTS.POINT) 
        ? result.DJIFLIGHTLOG.WAYPOINTS.POINT 
        : [result.DJIFLIGHTLOG.WAYPOINTS.POINT];
      
      flightData.waypoints = points.map((point: any) => ({
        latitude: parseFloat(point.LATITUDE || '0'),
        longitude: parseFloat(point.LONGITUDE || '0'),
        altitude: parseFloat(point.ALTITUDE || '0'),
        timestamp: new Date(parseInt(point.TIMESTAMP || '0')),
      }));
    }
    
    return flightData;
  } catch (error) {
    console.error('Error parsing DJI flight log:', error);
    throw new Error('Failed to parse DJI flight log');
  }
}

// Extract battery information from DJI log data
export function extractBatteryInfo(logData: any) {
  if (!logData || !logData.batteryInfo) {
    return null;
  }
  
  return {
    serialNumber: logData.droneInfo.serialNumber + '-BAT',
    chargeCycles: logData.batteryInfo.cycles || 0,
    health: calculateBatteryHealth(logData.batteryInfo),
    status: determineBatteryStatus(logData.batteryInfo),
    lastUsed: new Date(),
    estimatedFlightTime: estimateFlightTime(logData.batteryInfo),
  };
}

// Calculate battery health based on cycles and performance
function calculateBatteryHealth(batteryInfo: any): number {
  const { cycles = 0, startLevel = 100, endLevel = 0, temperature = 25 } = batteryInfo;
  
  // DJI batteries typically last for around 300-500 cycles
  const maxCycles = 350;
  const cycleImpact = Math.min((cycles / maxCycles) * 20, 20); // Max 20% impact
  
  // Calculate usage efficiency (how much battery was used per minute of flight)
  const usageEfficiency = startLevel - endLevel;
  const efficiencyImpact = Math.max(0, 10 - (usageEfficiency / 5)); // Max 10% impact
  
  // Temperature impact (optimal range is 20-30°C)
  let tempImpact = 0;
  if (temperature < 0 || temperature > 40) {
    tempImpact = 10;
  } else if (temperature < 10 || temperature > 35) {
    tempImpact = 5;
  }
  
  // Calculate overall health (starting from 100%)
  const health = Math.max(0, Math.min(100, 100 - cycleImpact - efficiencyImpact - tempImpact));
  
  return Math.round(health);
}

// Determine battery status based on health and cycles
function determineBatteryStatus(batteryInfo: any): string {
  const health = calculateBatteryHealth(batteryInfo);
  const { cycles = 0 } = batteryInfo;
  
  if (health < 60 || cycles > 300) {
    return 'needs_replacement';
  } else if (health < 75 || cycles > 200) {
    return 'maintenance';
  } else if (health < 85) {
    return 'good';
  } else {
    return 'healthy';
  }
}

// Estimate flight time based on battery health
function estimateFlightTime(batteryInfo: any): number {
  const health = calculateBatteryHealth(batteryInfo);
  
  // Base flight time (minutes) - typically 25-30 minutes for most consumer DJI drones
  const baseFlightTime = 28;
  
  // Adjust based on health (percentage of base time)
  const adjustedTime = Math.round((health / 100) * baseFlightTime);
  
  return adjustedTime;
}

// Get model details by model identifier
export function getModelDetails(modelId: string) {
  return DJI_MODELS[modelId as keyof typeof DJI_MODELS] || {
    name: 'Unknown DJI Model',
    weight: 'Unknown',
    flightTimeMax: 25,
    maxDistance: 5,
    maxHeight: 3,
    maxSpeed: 50,
    imageUrl: '/dji/generic-drone.png'
  };
}