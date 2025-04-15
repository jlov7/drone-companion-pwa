// Mock data for DJI API integration
// This provides sample data when real DJI API is unavailable

// Mock DJI devices
// Enhanced mock device data with additional details
export const mockDevices = [
  {
    deviceId: "mock-device-001",
    deviceName: "My Mavic Air 2",
    deviceSN: "MA2CSE12345678",
    productType: "mavic-air-2",
    productTypeDescription: "Mavic Air 2",
    productVersion: "01.00.0100",
    firmwareVersion: "v01.00.0100",
    activated: true,
    activationTime: Date.now() - 90 * 24 * 60 * 60 * 1000, // 90 days ago
    lastFlightTime: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3 days ago
    // Additional fields for enhanced debugging
    batteryLevel: 87,
    cameraType: "1/2 CMOS Sensor",
    maxFlightTime: 34, // in minutes
    maxFlightDistance: 18.5, // in km
    weight: 570, // in grams
    dimensions: "180 × 97 × 84 mm (folded)",
    maxSpeed: 19, // in m/s
    maxWindResistance: 10.5, // in m/s
    operatingTemperature: "0° to 40° C",
    storage: {
      totalSpace: 8192, // 8GB in MB
      usedSpace: 3584, // 3.5GB in MB
      freeSpace: 4608, // 4.5GB in MB
    },
    camera: {
      resolution: "48MP",
      videoResolution: "4K/60fps",
      fieldOfView: "84°",
      aperture: "f/2.8"
    },
    accessories: [
      {
        name: "ND Filters",
        model: "ND4/8/16/32",
        status: "Available"
      },
      {
        name: "Extra Propellers",
        model: "Low-Noise Quick-Release",
        status: "Available"
      }
    ]
  },
  {
    deviceId: "mock-device-002",
    deviceName: "Mini 3 Pro",
    deviceSN: "M3P345678901",
    productType: "mini-3-pro",
    productTypeDescription: "Mini 3 Pro",
    productVersion: "01.02.0500",
    firmwareVersion: "v01.02.0500",
    activated: true,
    activationTime: Date.now() - 45 * 24 * 60 * 60 * 1000, // 45 days ago
    lastFlightTime: Date.now() - 1 * 24 * 60 * 60 * 1000, // 1 day ago
    // Additional fields for enhanced debugging
    batteryLevel: 92,
    cameraType: "1/1.3-inch CMOS",
    maxFlightTime: 34, // in minutes
    maxFlightDistance: 18, // in km
    weight: 249, // in grams
    dimensions: "171 × 245 × 62 mm",
    maxSpeed: 16, // in m/s
    maxWindResistance: 10.7, // in m/s
    operatingTemperature: "0° to 40° C",
    storage: {
      totalSpace: 16384, // 16GB in MB
      usedSpace: 5120, // 5GB in MB
      freeSpace: 11264, // 11GB in MB
    },
    camera: {
      resolution: "48MP",
      videoResolution: "4K/60fps",
      fieldOfView: "82.1°",
      aperture: "f/1.7"
    },
    accessories: [
      {
        name: "DJI RC",
        model: "Smart Controller",
        status: "Connected"
      },
      {
        name: "Fly More Kit",
        model: "Mini 3 Pro Fly More Kit",
        status: "Available"
      }
    ]
  },
  {
    deviceId: "mock-device-003",
    deviceName: "DJI FPV",
    deviceSN: "FPVDJI78901234",
    productType: "dji-fpv",
    productTypeDescription: "DJI FPV",
    productVersion: "01.01.0200",
    firmwareVersion: "v01.01.0200",
    activated: true,
    activationTime: Date.now() - 120 * 24 * 60 * 60 * 1000, // 120 days ago
    lastFlightTime: Date.now() - 10 * 24 * 60 * 60 * 1000, // 10 days ago
    // Additional fields for enhanced debugging
    batteryLevel: 75,
    cameraType: "1/2.3-inch CMOS",
    maxFlightTime: 20, // in minutes
    maxFlightDistance: 10, // in km
    weight: 795, // in grams
    dimensions: "255 × 312 × 127 mm",
    maxSpeed: 39, // in m/s
    maxWindResistance: 13.8, // in m/s
    operatingTemperature: "0° to 40° C",
    storage: {
      totalSpace: 20480, // 20GB in MB
      usedSpace: 8192, // 8GB in MB
      freeSpace: 12288, // 12GB in MB
    },
    camera: {
      resolution: "12MP",
      videoResolution: "4K/60fps",
      fieldOfView: "150°",
      aperture: "f/2.8"
    },
    accessories: [
      {
        name: "FPV Goggles V2",
        model: "DJI FPV Goggles V2",
        status: "Connected"
      },
      {
        name: "FPV Remote Controller 2",
        model: "DJI FPV Remote Controller 2",
        status: "Connected"
      },
      {
        name: "Motion Controller",
        model: "DJI Motion Controller",
        status: "Available"
      }
    ]
  },
  {
    deviceId: "mock-device-004",
    deviceName: "Mavic 3",
    deviceSN: "MC3123456789",
    productType: "mavic-3",
    productTypeDescription: "DJI Mavic 3",
    productVersion: "01.00.0600",
    firmwareVersion: "v01.00.0600",
    activated: true,
    activationTime: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
    lastFlightTime: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5 days ago
    // Additional fields for enhanced debugging
    batteryLevel: 89,
    cameraType: "4/3 CMOS Hasselblad",
    maxFlightTime: 46, // in minutes
    maxFlightDistance: 30, // in km
    weight: 895, // in grams
    dimensions: "221 × 96.3 × 90.3 mm (folded)",
    maxSpeed: 21, // in m/s
    maxWindResistance: 12, // in m/s
    operatingTemperature: "-10° to 40° C",
    storage: {
      totalSpace: 32768, // 32GB in MB
      usedSpace: 12288, // 12GB in MB
      freeSpace: 20480, // 20GB in MB
    },
    camera: {
      resolution: "20MP",
      videoResolution: "5.1K/50fps",
      fieldOfView: "84°",
      aperture: "f/2.8-f/11"
    },
    accessories: [
      {
        name: "DJI RC Pro",
        model: "Smart Controller",
        status: "Connected"
      },
      {
        name: "Fly More Combo",
        model: "Mavic 3 Fly More Combo",
        status: "Available"
      },
      {
        name: "Wide-Angle Lens",
        model: "Mavic 3 Wide-Angle Lens",
        status: "Available"
      }
    ]
  }
];

// Enhanced mock DJI flight records with additional details
export const mockFlightRecords = {
  "MA2CSE12345678": [
    {
      recordId: "mock-record-001",
      deviceId: "mock-device-001",
      deviceSN: "MA2CSE12345678",
      productType: "mavic-air-2",
      startTime: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
      endTime: Date.now() - 7 * 24 * 60 * 60 * 1000 + 15 * 60 * 1000, // 15 minutes flight
      duration: 15 * 60, // 15 minutes in seconds
      distance: 2500, // 2.5 km in meters
      maxHeight: 120, // meters
      maxHorizontalSpeed: 12, // m/s
      maxVerticalSpeed: 5, // m/s
      photoCount: 25,
      videoCount: 2,
      hasSnapshot: true,
      hasCrashInfo: false,
      hasWaypoints: true,
      // Enhanced data for debugging
      flightMode: "Normal",
      batteryCycleCount: 12,
      batterySerialNumber: "MA2B98765432",
      batteryStartPercent: 98,
      batteryEndPercent: 67,
      temperatureMin: 22, // celsius
      temperatureMax: 28, // celsius
      windSpeed: 3.2, // m/s
      windDirection: "NE",
      homeLocation: {
        latitude: 51.507211,
        longitude: -0.1275,
        altitude: 10,
      },
      flightPath: [
        {latitude: 51.507211, longitude: -0.1275, altitude: 0, timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000},
        {latitude: 51.507222, longitude: -0.1276, altitude: 50, timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000 + 1 * 60 * 1000},
        {latitude: 51.507242, longitude: -0.1277, altitude: 90, timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 1000},
        {latitude: 51.507262, longitude: -0.1278, altitude: 100, timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000 + 4 * 60 * 1000},
        {latitude: 51.507282, longitude: -0.1279, altitude: 110, timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000 + 6 * 60 * 1000},
        {latitude: 51.507302, longitude: -0.1280, altitude: 120, timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000 + 8 * 60 * 1000},
        {latitude: 51.507322, longitude: -0.1279, altitude: 110, timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000 + 10 * 60 * 1000},
        {latitude: 51.507302, longitude: -0.1278, altitude: 90, timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000 + 12 * 60 * 1000},
        {latitude: 51.507282, longitude: -0.1277, altitude: 50, timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000 + 14 * 60 * 1000},
        {latitude: 51.507262, longitude: -0.1275, altitude: 0, timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000 + 15 * 60 * 1000}
      ],
      media: [
        {
          type: "photo",
          url: "https://example.com/mock-photo-1.jpg",
          timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 1000,
          metadata: {
            resolution: "48MP",
            location: {latitude: 51.507242, longitude: -0.1277, altitude: 90}
          }
        },
        {
          type: "video",
          url: "https://example.com/mock-video-1.mp4",
          duration: 120, // seconds
          timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000 + 6 * 60 * 1000,
          metadata: {
            resolution: "4K/30fps",
            location: {latitude: 51.507282, longitude: -0.1279, altitude: 110}
          }
        }
      ],
      waypoints: [
        {
          latitude: 51.507222,
          longitude: -0.1275,
          altitude: 100,
          heading: 90,
          timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 1000
        },
        {
          latitude: 51.508,
          longitude: -0.128,
          altitude: 110,
          heading: 180,
          timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000 + 8 * 60 * 1000
        }
      ]
    },
    {
      recordId: "mock-record-002",
      deviceId: "mock-device-001",
      deviceSN: "MA2CSE12345678",
      productType: "mavic-air-2",
      startTime: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3 days ago
      endTime: Date.now() - 3 * 24 * 60 * 60 * 1000 + 22 * 60 * 1000, // 22 minutes flight
      duration: 22 * 60, // 22 minutes in seconds
      distance: 3200, // 3.2 km in meters
      maxHeight: 150, // meters
      maxHorizontalSpeed: 14, // m/s
      maxVerticalSpeed: 6, // m/s
      photoCount: 35,
      videoCount: 1,
      hasSnapshot: true,
      hasCrashInfo: false,
      hasWaypoints: false,
      // Enhanced data for debugging
      flightMode: "Sport",
      batteryCycleCount: 13,
      batterySerialNumber: "MA2B98765432",
      batteryStartPercent: 100,
      batteryEndPercent: 61,
      temperatureMin: 24, // celsius
      temperatureMax: 30, // celsius
      windSpeed: 5.1, // m/s
      windDirection: "SW",
      homeLocation: {
        latitude: 51.497211,
        longitude: -0.1375,
        altitude: 12,
      },
      flightPath: [
        {latitude: 51.497211, longitude: -0.1375, altitude: 0, timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000},
        {latitude: 51.497222, longitude: -0.1376, altitude: 50, timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 1000},
        {latitude: 51.497242, longitude: -0.1380, altitude: 100, timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000},
        {latitude: 51.497262, longitude: -0.1385, altitude: 150, timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000 + 8 * 60 * 1000},
        {latitude: 51.497282, longitude: -0.1390, altitude: 140, timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000 + 12 * 60 * 1000},
        {latitude: 51.497302, longitude: -0.1385, altitude: 130, timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000 + 16 * 60 * 1000},
        {latitude: 51.497282, longitude: -0.1380, altitude: 80, timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000 + 19 * 60 * 1000},
        {latitude: 51.497262, longitude: -0.1375, altitude: 10, timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000 + 22 * 60 * 1000},
      ],
      media: [
        {
          type: "photo",
          url: "https://example.com/mock-photo-2.jpg",
          timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000,
          metadata: {
            resolution: "48MP",
            location: {latitude: 51.497242, longitude: -0.1380, altitude: 100}
          }
        },
        {
          type: "video",
          url: "https://example.com/mock-video-2.mp4",
          duration: 240, // seconds
          timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000 + 8 * 60 * 1000,
          metadata: {
            resolution: "4K/60fps",
            location: {latitude: 51.497262, longitude: -0.1385, altitude: 150}
          }
        }
      ]
    }
  ],
  "M3P345678901": [
    {
      recordId: "mock-record-003",
      deviceId: "mock-device-002",
      deviceSN: "M3P345678901",
      productType: "mini-3-pro",
      startTime: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5 days ago
      endTime: Date.now() - 5 * 24 * 60 * 60 * 1000 + 18 * 60 * 1000, // 18 minutes flight
      duration: 18 * 60, // 18 minutes in seconds
      distance: 1800, // 1.8 km in meters
      maxHeight: 110, // meters
      maxHorizontalSpeed: 11, // m/s
      maxVerticalSpeed: 4, // m/s
      photoCount: 42,
      videoCount: 1,
      hasSnapshot: true,
      hasCrashInfo: false,
      hasWaypoints: true,
      // Enhanced data for debugging
      flightMode: "Cine",
      batteryCycleCount: 5,
      batterySerialNumber: "M3PB12345678",
      batteryStartPercent: 96,
      batteryEndPercent: 54,
      temperatureMin: 20, // celsius
      temperatureMax: 26, // celsius
      windSpeed: 2.8, // m/s
      windDirection: "SE",
      homeLocation: {
        latitude: 40.7128,
        longitude: -74.006,
        altitude: 5,
      },
      flightPath: [
        {latitude: 40.7128, longitude: -74.006, altitude: 0, timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000},
        {latitude: 40.7129, longitude: -74.0061, altitude: 30, timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000 + 2 * 60 * 1000},
        {latitude: 40.7130, longitude: -74.0062, altitude: 60, timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000 + 4 * 60 * 1000},
        {latitude: 40.7131, longitude: -74.0064, altitude: 90, timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000 + 7 * 60 * 1000},
        {latitude: 40.7132, longitude: -74.0066, altitude: 100, timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000 + 10 * 60 * 1000},
        {latitude: 40.7133, longitude: -74.0068, altitude: 110, timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000 + 13 * 60 * 1000},
        {latitude: 40.7132, longitude: -74.0066, altitude: 80, timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000 + 16 * 60 * 1000},
        {latitude: 40.7131, longitude: -74.0063, altitude: 30, timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000 + 17 * 60 * 1000},
        {latitude: 40.7130, longitude: -74.006, altitude: 0, timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000 + 18 * 60 * 1000},
      ],
      media: [
        {
          type: "photo",
          url: "https://example.com/mock-photo-3.jpg",
          timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000 + 7 * 60 * 1000,
          metadata: {
            resolution: "48MP",
            location: {latitude: 40.7131, longitude: -74.0064, altitude: 90}
          }
        },
        {
          type: "video",
          url: "https://example.com/mock-video-3.mp4",
          duration: 180, // seconds
          timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000 + 10 * 60 * 1000,
          metadata: {
            resolution: "4K/30fps",
            location: {latitude: 40.7132, longitude: -74.0066, altitude: 100}
          }
        }
      ],
      waypoints: [
        {
          latitude: 40.7128,
          longitude: -74.006,
          altitude: 90,
          heading: 270,
          timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000
        },
        {
          latitude: 40.7129,
          longitude: -74.007,
          altitude: 100,
          heading: 180,
          timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000 + 10 * 60 * 1000
        }
      ]
    },
    {
      recordId: "mock-record-004",
      deviceId: "mock-device-002",
      deviceSN: "M3P345678901",
      productType: "mini-3-pro",
      startTime: Date.now() - 1 * 24 * 60 * 60 * 1000, // 1 day ago
      endTime: Date.now() - 1 * 24 * 60 * 60 * 1000 + 25 * 60 * 1000, // 25 minutes flight
      duration: 25 * 60, // 25 minutes in seconds
      distance: 2200, // 2.2 km in meters
      maxHeight: 120, // meters
      maxHorizontalSpeed: 10, // m/s
      maxVerticalSpeed: 3.5, // m/s
      photoCount: 30,
      videoCount: 2,
      hasSnapshot: true,
      hasCrashInfo: false,
      hasWaypoints: false,
      // Enhanced data for debugging
      flightMode: "Normal",
      batteryCycleCount: 6,
      batterySerialNumber: "M3PB12345678",
      batteryStartPercent: 100,
      batteryEndPercent: 42,
      temperatureMin: 22, // celsius
      temperatureMax: 27, // celsius
      windSpeed: 4.2, // m/s
      windDirection: "W",
      homeLocation: {
        latitude: 40.7140,
        longitude: -74.008,
        altitude: 8,
      },
      flightPath: [
        {latitude: 40.7140, longitude: -74.008, altitude: 0, timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000},
        {latitude: 40.7141, longitude: -74.0081, altitude: 40, timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000 + 3 * 60 * 1000},
        {latitude: 40.7142, longitude: -74.0083, altitude: 80, timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000 + 6 * 60 * 1000},
        {latitude: 40.7143, longitude: -74.0085, altitude: 120, timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000 + 9 * 60 * 1000},
        {latitude: 40.7145, longitude: -74.0087, altitude: 110, timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000 + 12 * 60 * 1000},
        {latitude: 40.7147, longitude: -74.0089, altitude: 100, timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000 + 15 * 60 * 1000},
        {latitude: 40.7148, longitude: -74.0088, altitude: 90, timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000 + 18 * 60 * 1000},
        {latitude: 40.7147, longitude: -74.0086, altitude: 60, timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000 + 21 * 60 * 1000},
        {latitude: 40.7145, longitude: -74.0083, altitude: 30, timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000 + 23 * 60 * 1000},
        {latitude: 40.7142, longitude: -74.0080, altitude: 0, timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000 + 25 * 60 * 1000},
      ],
      media: [
        {
          type: "photo",
          url: "https://example.com/mock-photo-4.jpg",
          timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000 + 9 * 60 * 1000,
          metadata: {
            resolution: "48MP",
            location: {latitude: 40.7143, longitude: -74.0085, altitude: 120}
          }
        },
        {
          type: "video",
          url: "https://example.com/mock-video-4.mp4",
          duration: 300, // seconds
          timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000 + 12 * 60 * 1000,
          metadata: {
            resolution: "4K/60fps",
            location: {latitude: 40.7145, longitude: -74.0087, altitude: 110}
          }
        }
      ]
    }
  ],
  "FPVDJI78901234": [
    {
      recordId: "mock-record-005",
      deviceId: "mock-device-003",
      deviceSN: "FPVDJI78901234",
      productType: "dji-fpv",
      startTime: Date.now() - 12 * 24 * 60 * 60 * 1000, // 12 days ago
      endTime: Date.now() - 12 * 24 * 60 * 60 * 1000 + 10 * 60 * 1000, // 10 minutes flight
      duration: 10 * 60, // 10 minutes in seconds
      distance: 1500, // 1.5 km in meters
      maxHeight: 100, // meters
      maxHorizontalSpeed: 18, // m/s
      maxVerticalSpeed: 8, // m/s
      photoCount: 0,
      videoCount: 1,
      hasSnapshot: true,
      hasCrashInfo: false,
      hasWaypoints: false,
      // Enhanced data for debugging
      flightMode: "Manual",
      batteryCycleCount: 8,
      batterySerialNumber: "FPVB98765432",
      batteryStartPercent: 95,
      batteryEndPercent: 68,
      temperatureMin: 24, // celsius
      temperatureMax: 31, // celsius
      windSpeed: 3.5, // m/s
      windDirection: "N",
      homeLocation: {
        latitude: 34.0522,
        longitude: -118.2437,
        altitude: 10,
      },
      flightPath: [
        {latitude: 34.0522, longitude: -118.2437, altitude: 0, timestamp: Date.now() - 12 * 24 * 60 * 60 * 1000},
        {latitude: 34.0523, longitude: -118.2438, altitude: 30, timestamp: Date.now() - 12 * 24 * 60 * 60 * 1000 + 1 * 60 * 1000},
        {latitude: 34.0524, longitude: -118.2439, altitude: 60, timestamp: Date.now() - 12 * 24 * 60 * 60 * 1000 + 2 * 60 * 1000},
        {latitude: 34.0525, longitude: -118.2441, altitude: 90, timestamp: Date.now() - 12 * 24 * 60 * 60 * 1000 + 4 * 60 * 1000},
        {latitude: 34.0526, longitude: -118.2443, altitude: 100, timestamp: Date.now() - 12 * 24 * 60 * 60 * 1000 + 6 * 60 * 1000},
        {latitude: 34.0525, longitude: -118.2441, altitude: 80, timestamp: Date.now() - 12 * 24 * 60 * 60 * 1000 + 8 * 60 * 1000},
        {latitude: 34.0523, longitude: -118.2438, altitude: 20, timestamp: Date.now() - 12 * 24 * 60 * 60 * 1000 + 9 * 60 * 1000},
        {latitude: 34.0522, longitude: -118.2437, altitude: 0, timestamp: Date.now() - 12 * 24 * 60 * 60 * 1000 + 10 * 60 * 1000},
      ],
      media: [
        {
          type: "video",
          url: "https://example.com/mock-video-5.mp4",
          duration: 600, // seconds
          timestamp: Date.now() - 12 * 24 * 60 * 60 * 1000 + 1 * 60 * 1000,
          metadata: {
            resolution: "4K/60fps",
            location: {latitude: 34.0523, longitude: -118.2438, altitude: 30}
          }
        }
      ]
    },
    {
      recordId: "mock-record-006",
      deviceId: "mock-device-003",
      deviceSN: "FPVDJI78901234",
      productType: "dji-fpv",
      startTime: Date.now() - 10 * 24 * 60 * 60 * 1000, // 10 days ago
      endTime: Date.now() - 10 * 24 * 60 * 60 * 1000 + 12 * 60 * 1000, // 12 minutes flight
      duration: 12 * 60, // 12 minutes in seconds
      distance: 1800, // 1.8 km in meters
      maxHeight: 110, // meters
      maxHorizontalSpeed: 20, // m/s
      maxVerticalSpeed: 9, // m/s
      photoCount: 0,
      videoCount: 1,
      hasSnapshot: true,
      hasCrashInfo: false,
      hasWaypoints: false,
      // Enhanced data for debugging
      flightMode: "Sport",
      batteryCycleCount: 9,
      batterySerialNumber: "FPVB98765432",
      batteryStartPercent: 100,
      batteryEndPercent: 72,
      temperatureMin: 26, // celsius
      temperatureMax: 33, // celsius
      windSpeed: 4.8, // m/s
      windDirection: "NW",
      homeLocation: {
        latitude: 34.0530,
        longitude: -118.2450,
        altitude: 12,
      },
      flightPath: [
        {latitude: 34.0530, longitude: -118.2450, altitude: 0, timestamp: Date.now() - 10 * 24 * 60 * 60 * 1000},
        {latitude: 34.0531, longitude: -118.2451, altitude: 40, timestamp: Date.now() - 10 * 24 * 60 * 60 * 1000 + 1 * 60 * 1000},
        {latitude: 34.0532, longitude: -118.2452, altitude: 80, timestamp: Date.now() - 10 * 24 * 60 * 60 * 1000 + 3 * 60 * 1000},
        {latitude: 34.0534, longitude: -118.2453, altitude: 110, timestamp: Date.now() - 10 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000},
        {latitude: 34.0536, longitude: -118.2454, altitude: 100, timestamp: Date.now() - 10 * 24 * 60 * 60 * 1000 + 7 * 60 * 1000},
        {latitude: 34.0538, longitude: -118.2455, altitude: 90, timestamp: Date.now() - 10 * 24 * 60 * 60 * 1000 + 9 * 60 * 1000},
        {latitude: 34.0536, longitude: -118.2453, altitude: 50, timestamp: Date.now() - 10 * 24 * 60 * 60 * 1000 + 10 * 60 * 1000},
        {latitude: 34.0533, longitude: -118.2451, altitude: 20, timestamp: Date.now() - 10 * 24 * 60 * 60 * 1000 + 11 * 60 * 1000},
        {latitude: 34.0530, longitude: -118.2450, altitude: 0, timestamp: Date.now() - 10 * 24 * 60 * 60 * 1000 + 12 * 60 * 1000},
      ],
      media: [
        {
          type: "video",
          url: "https://example.com/mock-video-6.mp4",
          duration: 720, // seconds
          timestamp: Date.now() - 10 * 24 * 60 * 60 * 1000 + 3 * 60 * 1000,
          metadata: {
            resolution: "4K/60fps",
            location: {latitude: 34.0532, longitude: -118.2452, altitude: 80}
          }
        }
      ]
    }
  ],
  "MC3123456789": [
    {
      recordId: "mock-record-007",
      deviceId: "mock-device-004",
      deviceSN: "MC3123456789",
      productType: "mavic-3",
      startTime: Date.now() - 6 * 24 * 60 * 60 * 1000, // 6 days ago
      endTime: Date.now() - 6 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000, // 30 minutes flight
      duration: 30 * 60, // 30 minutes in seconds
      distance: 4500, // 4.5 km in meters
      maxHeight: 200, // meters
      maxHorizontalSpeed: 15, // m/s
      maxVerticalSpeed: 7, // m/s
      photoCount: 45,
      videoCount: 3,
      hasSnapshot: true,
      hasCrashInfo: false,
      hasWaypoints: true,
      // Enhanced data for debugging
      flightMode: "Normal",
      batteryCycleCount: 4,
      batterySerialNumber: "MAVIC3B123456",
      batteryStartPercent: 100,
      batteryEndPercent: 38,
      temperatureMin: 18, // celsius
      temperatureMax: 26, // celsius
      windSpeed: 5.2, // m/s
      windDirection: "E",
      homeLocation: {
        latitude: 48.8566,
        longitude: 2.3522,
        altitude: 15,
      },
      flightPath: [
        {latitude: 48.8566, longitude: 2.3522, altitude: 0, timestamp: Date.now() - 6 * 24 * 60 * 60 * 1000},
        {latitude: 48.8567, longitude: 2.3523, altitude: 50, timestamp: Date.now() - 6 * 24 * 60 * 60 * 1000 + 3 * 60 * 1000},
        {latitude: 48.8568, longitude: 2.3525, altitude: 100, timestamp: Date.now() - 6 * 24 * 60 * 60 * 1000 + 6 * 60 * 1000},
        {latitude: 48.8570, longitude: 2.3527, altitude: 150, timestamp: Date.now() - 6 * 24 * 60 * 60 * 1000 + 9 * 60 * 1000},
        {latitude: 48.8572, longitude: 2.3530, altitude: 200, timestamp: Date.now() - 6 * 24 * 60 * 60 * 1000 + 12 * 60 * 1000},
        {latitude: 48.8574, longitude: 2.3533, altitude: 190, timestamp: Date.now() - 6 * 24 * 60 * 60 * 1000 + 15 * 60 * 1000},
        {latitude: 48.8576, longitude: 2.3535, altitude: 180, timestamp: Date.now() - 6 * 24 * 60 * 60 * 1000 + 18 * 60 * 1000},
        {latitude: 48.8574, longitude: 2.3533, altitude: 150, timestamp: Date.now() - 6 * 24 * 60 * 60 * 1000 + 21 * 60 * 1000},
        {latitude: 48.8572, longitude: 2.3530, altitude: 100, timestamp: Date.now() - 6 * 24 * 60 * 60 * 1000 + 24 * 60 * 1000},
        {latitude: 48.8570, longitude: 2.3527, altitude: 50, timestamp: Date.now() - 6 * 24 * 60 * 60 * 1000 + 27 * 60 * 1000},
        {latitude: 48.8566, longitude: 2.3522, altitude: 0, timestamp: Date.now() - 6 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000},
      ],
      media: [
        {
          type: "photo",
          url: "https://example.com/mock-photo-7.jpg",
          timestamp: Date.now() - 6 * 24 * 60 * 60 * 1000 + 9 * 60 * 1000,
          metadata: {
            resolution: "20MP",
            location: {latitude: 48.8570, longitude: 2.3527, altitude: 150}
          }
        },
        {
          type: "video",
          url: "https://example.com/mock-video-7.mp4",
          duration: 360, // seconds
          timestamp: Date.now() - 6 * 24 * 60 * 60 * 1000 + 12 * 60 * 1000,
          metadata: {
            resolution: "5.1K/50fps",
            location: {latitude: 48.8572, longitude: 2.3530, altitude: 200}
          }
        }
      ],
      waypoints: [
        {
          latitude: 48.8570,
          longitude: 2.3527,
          altitude: 150,
          heading: 90,
          timestamp: Date.now() - 6 * 24 * 60 * 60 * 1000 + 9 * 60 * 1000
        },
        {
          latitude: 48.8572,
          longitude: 2.3530,
          altitude: 200,
          heading: 45,
          timestamp: Date.now() - 6 * 24 * 60 * 60 * 1000 + 12 * 60 * 1000
        },
        {
          latitude: 48.8574,
          longitude: 2.3533,
          altitude: 190,
          heading: 0,
          timestamp: Date.now() - 6 * 24 * 60 * 60 * 1000 + 15 * 60 * 1000
        }
      ]
    }
  ]
};