/**
 * Manpasik Admin OS Engine
 * Global observability, device management, and audit systems
 */

/* ============================================
 * Types
 * ============================================ */

// Global Metrics
export interface GlobalMetrics {
  activeUsers: number;
  totalMeasurementsToday: number;
  averageHealthScore: number;
  criticalAlerts: number;
  serverStatus: ServerHealth;
  cartridgeInventory: InventoryStatus[];
  regionSignals: RegionSignal[];
}

export interface ServerHealth {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  errorRate: number; // errors per 1000 requests
  latencyP95: number; // ms
  uptime: number; // hours
  status: "healthy" | "degraded" | "critical";
}

export interface InventoryStatus {
  warehouseId: string;
  warehouseName: string;
  location: string;
  cartridgeTypes: {
    type: string;
    count: number;
    threshold: number;
    status: "ok" | "low" | "critical";
  }[];
}

export interface RegionSignal {
  regionId: string;
  regionName: string;
  lat: number;
  lng: number;
  signals: {
    fluRisk: number; // 0-100
    glucoseHigh: number; // % of users
    lactateHigh: number;
    radonAlert: number;
  };
  userCount: number;
  alertLevel: "normal" | "elevated" | "warning" | "critical";
}

// Device Management
export interface DeviceInfo {
  serialNumber: string;
  userId: string;
  userName: string;
  model: string;
  firmwareVersion: string;
  lastSeen: string;
  status: "online" | "offline" | "locked" | "lost";
  batteryLevel: number;
  sensorWear: number; // 0-100 (100 = new)
  totalMeasurements: number;
  location: {
    city: string;
    country: string;
    lat: number;
    lng: number;
  };
  calibrationStatus: "valid" | "expired" | "pending";
  lastCalibration: string;
  rafeMode: string;
  cartridgeId: string | null;
}

export interface DeviceAction {
  type: "firmware_update" | "remote_calibration" | "lock_device" | "unlock_device" | "wipe_device" | "send_notification";
  deviceId: string;
  adminId: string;
  timestamp: string;
  params?: Record<string, unknown>;
  status: "pending" | "in_progress" | "completed" | "failed";
  result?: string;
}

// Audit & Security
export interface AuditAnomaly {
  id: string;
  type: "excessive_access" | "unusual_pattern" | "failed_auth" | "data_export" | "privilege_escalation";
  severity: "low" | "medium" | "high" | "critical";
  userId: string;
  userName: string;
  description: string;
  details: Record<string, unknown>;
  timestamp: string;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
}

export interface AccessPattern {
  userId: string;
  userName: string;
  role: string;
  accessCount: number;
  timeWindow: string; // e.g., "last 1 hour"
  recordTypes: string[];
  isAnomalous: boolean;
  reason?: string;
}

/* ============================================
 * Mock Data Generators
 * ============================================ */

export function generateGlobalMetrics(): GlobalMetrics {
  const baseUsers = 12847;
  const fluctuation = Math.floor(Math.random() * 200) - 100;
  
  return {
    activeUsers: baseUsers + fluctuation,
    totalMeasurementsToday: 48293 + Math.floor(Math.random() * 500),
    averageHealthScore: 72 + Math.floor(Math.random() * 10),
    criticalAlerts: Math.floor(Math.random() * 5),
    serverStatus: generateServerHealth(),
    cartridgeInventory: generateInventory(),
    regionSignals: generateRegionSignals()
  };
}

export function generateServerHealth(): ServerHealth {
  const cpu = 35 + Math.random() * 30;
  const mem = 55 + Math.random() * 20;
  const errorRate = Math.random() * 2;
  
  let status: ServerHealth["status"] = "healthy";
  if (cpu > 80 || mem > 85 || errorRate > 5) status = "critical";
  else if (cpu > 60 || mem > 75 || errorRate > 2) status = "degraded";

  return {
    cpuUsage: Math.round(cpu),
    memoryUsage: Math.round(mem),
    diskUsage: Math.round(45 + Math.random() * 15),
    errorRate: Math.round(errorRate * 100) / 100,
    latencyP95: Math.round(45 + Math.random() * 30),
    uptime: Math.round(720 + Math.random() * 100),
    status
  };
}

export function generateInventory(): InventoryStatus[] {
  const warehouses = [
    { id: "WH-SEL", name: "Seoul Central", location: "Seoul, KR" },
    { id: "WH-ICN", name: "Incheon Port", location: "Incheon, KR" },
    { id: "WH-BSN", name: "Busan Hub", location: "Busan, KR" },
    { id: "WH-LAX", name: "LA Distribution", location: "Los Angeles, US" },
    { id: "WH-FRA", name: "Frankfurt Hub", location: "Frankfurt, DE" }
  ];

  return warehouses.map(wh => {
    const cartridges = [
      { type: "Glucose Standard", threshold: 1000 },
      { type: "Lactate Pro", threshold: 500 },
      { type: "Multi-Analyte", threshold: 300 },
      { type: "Gas Sensor (Radon)", threshold: 200 },
      { type: "Hydrogel Patch", threshold: 400 }
    ].map(c => {
      const count = Math.floor(Math.random() * c.threshold * 2);
      return {
        type: c.type,
        count,
        threshold: c.threshold,
        status: count < c.threshold * 0.2 ? "critical" : count < c.threshold * 0.5 ? "low" : "ok" as const
      };
    });

    return {
      warehouseId: wh.id,
      warehouseName: wh.name,
      location: wh.location,
      cartridgeTypes: cartridges
    };
  });
}

export function generateRegionSignals(): RegionSignal[] {
  const regions = [
    { id: "seoul", name: "Seoul", lat: 37.5665, lng: 126.978 },
    { id: "busan", name: "Busan", lat: 35.1796, lng: 129.0756 },
    { id: "daegu", name: "Daegu", lat: 35.8714, lng: 128.6014 },
    { id: "incheon", name: "Incheon", lat: 37.4563, lng: 126.7052 },
    { id: "gwangju", name: "Gwangju", lat: 35.1595, lng: 126.8526 },
    { id: "daejeon", name: "Daejeon", lat: 36.3504, lng: 127.3845 },
    { id: "tokyo", name: "Tokyo", lat: 35.6762, lng: 139.6503 },
    { id: "osaka", name: "Osaka", lat: 34.6937, lng: 135.5023 },
    { id: "la", name: "Los Angeles", lat: 34.0522, lng: -118.2437 },
    { id: "nyc", name: "New York", lat: 40.7128, lng: -74.006 },
    { id: "london", name: "London", lat: 51.5074, lng: -0.1278 },
    { id: "berlin", name: "Berlin", lat: 52.52, lng: 13.405 }
  ];

  return regions.map(r => {
    const fluRisk = Math.floor(Math.random() * 100);
    const glucoseHigh = Math.floor(Math.random() * 30);
    const lactateHigh = Math.floor(Math.random() * 20);
    const radonAlert = Math.floor(Math.random() * 10);
    
    let alertLevel: RegionSignal["alertLevel"] = "normal";
    if (fluRisk > 75 || glucoseHigh > 25) alertLevel = "critical";
    else if (fluRisk > 50 || glucoseHigh > 15) alertLevel = "warning";
    else if (fluRisk > 30) alertLevel = "elevated";

    return {
      regionId: r.id,
      regionName: r.name,
      lat: r.lat,
      lng: r.lng,
      signals: { fluRisk, glucoseHigh, lactateHigh, radonAlert },
      userCount: 500 + Math.floor(Math.random() * 2000),
      alertLevel
    };
  });
}

export function generateDevices(count: number = 20): DeviceInfo[] {
  const models = ["MPS-Reader-V1", "MPS-Reader-V2", "MPS-Pro", "MPS-Lite"];
  const cities = ["Seoul", "Busan", "Tokyo", "LA", "NYC", "London", "Berlin"];
  const rafeModes = ["MODE_LIQUID_EC", "MODE_GAS_HIGH_Z", "MODE_BIO_IMPEDANCE", "IDLE"];
  const statuses: DeviceInfo["status"][] = ["online", "online", "online", "offline", "locked"];

  return Array.from({ length: count }, (_, i) => {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const city = cities[Math.floor(Math.random() * cities.length)];
    
    return {
      serialNumber: `MPS-${String(100000 + i).slice(1)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      userId: `user_${1000 + i}`,
      userName: `User ${1000 + i}`,
      model: models[Math.floor(Math.random() * models.length)],
      firmwareVersion: `v${Math.floor(Math.random() * 3) + 2}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 20)}`,
      lastSeen: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
      status,
      batteryLevel: Math.floor(Math.random() * 100),
      sensorWear: Math.floor(Math.random() * 100),
      totalMeasurements: Math.floor(Math.random() * 500),
      location: {
        city,
        country: city === "Seoul" || city === "Busan" ? "KR" : city === "Tokyo" ? "JP" : city === "LA" || city === "NYC" ? "US" : city === "London" ? "UK" : "DE",
        lat: 35 + Math.random() * 20,
        lng: 120 + Math.random() * 40
      },
      calibrationStatus: Math.random() > 0.2 ? "valid" : Math.random() > 0.5 ? "expired" : "pending",
      lastCalibration: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString(),
      rafeMode: rafeModes[Math.floor(Math.random() * rafeModes.length)],
      cartridgeId: Math.random() > 0.3 ? `CTG-${Math.random().toString(36).slice(2, 8).toUpperCase()}` : null
    };
  });
}

export function generateAnomalies(): AuditAnomaly[] {
  const anomalies: AuditAnomaly[] = [
    {
      id: "ANO-001",
      type: "excessive_access",
      severity: "critical",
      userId: "doc_123",
      userName: "Dr. Kim",
      description: "Accessed 847 patient records in 15 minutes",
      details: { recordsAccessed: 847, timeWindowMinutes: 15, threshold: 50 },
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      resolved: false
    },
    {
      id: "ANO-002",
      type: "unusual_pattern",
      severity: "high",
      userId: "admin_045",
      userName: "Admin Lee",
      description: "Bulk data export at 3:00 AM outside business hours",
      details: { exportSize: "2.4GB", exportTime: "03:14:22", normalHours: "09:00-18:00" },
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      resolved: false
    },
    {
      id: "ANO-003",
      type: "failed_auth",
      severity: "medium",
      userId: "user_789",
      userName: "User Park",
      description: "12 failed login attempts from different IPs",
      details: { attempts: 12, uniqueIPs: 5, timeWindowMinutes: 30 },
      timestamp: new Date(Date.now() - 14400000).toISOString(),
      resolved: true,
      resolvedBy: "admin_001",
      resolvedAt: new Date(Date.now() - 10800000).toISOString()
    },
    {
      id: "ANO-004",
      type: "privilege_escalation",
      severity: "critical",
      userId: "user_456",
      userName: "User Choi",
      description: "Attempted to access admin endpoints without authorization",
      details: { endpoint: "/api/admin/users", attempts: 3, sourceIP: "192.168.1.100" },
      timestamp: new Date(Date.now() - 21600000).toISOString(),
      resolved: false
    },
    {
      id: "ANO-005",
      type: "data_export",
      severity: "medium",
      userId: "research_012",
      userName: "Researcher Jung",
      description: "Large dataset export exceeding daily limit",
      details: { exportedRecords: 15000, dailyLimit: 10000, purpose: "Clinical Study" },
      timestamp: new Date(Date.now() - 28800000).toISOString(),
      resolved: true,
      resolvedBy: "admin_002",
      resolvedAt: new Date(Date.now() - 25200000).toISOString()
    }
  ];

  return anomalies;
}

export function generateAccessPatterns(): AccessPattern[] {
  return [
    { userId: "doc_123", userName: "Dr. Kim", role: "Physician", accessCount: 847, timeWindow: "last 1 hour", recordTypes: ["Patient Records", "Lab Results"], isAnomalous: true, reason: "Exceeds 50 records/hour threshold" },
    { userId: "nurse_056", userName: "Nurse Lee", role: "Nurse", accessCount: 45, timeWindow: "last 1 hour", recordTypes: ["Patient Vitals"], isAnomalous: false },
    { userId: "admin_045", userName: "Admin Park", role: "Admin", accessCount: 23, timeWindow: "last 1 hour", recordTypes: ["User Management", "Audit Logs"], isAnomalous: false },
    { userId: "research_012", userName: "Researcher Jung", role: "Researcher", accessCount: 156, timeWindow: "last 1 hour", recordTypes: ["Anonymized Data"], isAnomalous: true, reason: "Unusual after-hours access" },
    { userId: "doc_089", userName: "Dr. Yoon", role: "Physician", accessCount: 38, timeWindow: "last 1 hour", recordTypes: ["Patient Records"], isAnomalous: false }
  ];
}

/* ============================================
 * Time Series Data for Charts
 * ============================================ */

export interface TimeSeriesPoint {
  time: string;
  value: number;
  label?: string;
}

export function generateUserActivityTimeSeries(hours: number = 24): TimeSeriesPoint[] {
  const points: TimeSeriesPoint[] = [];
  const now = new Date();
  
  for (let i = hours; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 3600000);
    const hour = time.getHours();
    
    // Simulate daily pattern: low at night, peak during work hours
    let baseValue = 8000;
    if (hour >= 9 && hour <= 18) baseValue = 15000;
    else if (hour >= 6 && hour <= 8) baseValue = 10000;
    else if (hour >= 19 && hour <= 22) baseValue = 12000;
    else baseValue = 5000;
    
    const value = baseValue + Math.floor(Math.random() * 2000) - 1000;
    
    points.push({
      time: time.toISOString(),
      value: Math.max(0, value),
      label: `${hour}:00`
    });
  }
  
  return points;
}

export function generateMeasurementTimeSeries(hours: number = 24): TimeSeriesPoint[] {
  const points: TimeSeriesPoint[] = [];
  const now = new Date();
  
  for (let i = hours; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 3600000);
    const hour = time.getHours();
    
    let baseValue = 1500;
    if (hour >= 7 && hour <= 9) baseValue = 3500; // Morning peak
    else if (hour >= 12 && hour <= 14) baseValue = 2800; // Lunch peak
    else if (hour >= 18 && hour <= 20) baseValue = 3200; // Evening peak
    else if (hour >= 0 && hour <= 5) baseValue = 500;
    
    points.push({
      time: time.toISOString(),
      value: Math.max(0, baseValue + Math.floor(Math.random() * 500) - 250),
      label: `${hour}:00`
    });
  }
  
  return points;
}

export function generateErrorRateTimeSeries(hours: number = 24): TimeSeriesPoint[] {
  const points: TimeSeriesPoint[] = [];
  const now = new Date();
  
  for (let i = hours; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 3600000);
    
    // Occasional spikes
    const hasSpike = Math.random() < 0.1;
    const value = hasSpike ? 2 + Math.random() * 3 : Math.random() * 0.5;
    
    points.push({
      time: time.toISOString(),
      value: Math.round(value * 100) / 100
    });
  }
  
  return points;
}






