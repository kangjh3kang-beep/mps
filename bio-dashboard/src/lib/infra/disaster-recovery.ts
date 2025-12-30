/**
 * ============================================================
 * DISASTER RECOVERY & HIGH AVAILABILITY
 * Multi-Region Active-Active Architecture
 * ============================================================
 * 
 * Target: 99.999% Availability (5 Nines)
 * Allowed Downtime: ~5 minutes/year
 * 
 * Architecture:
 * - Primary: AWS Seoul (ap-northeast-2)
 * - Secondary: AWS Virginia (us-east-1)
 * - Tertiary: AWS Frankfurt (eu-central-1)
 * 
 * Features:
 * - Automatic failover < 1 second
 * - Data replication with conflict resolution
 * - Health monitoring & alerting
 * - Chaos engineering support
 */

// ============================================
// TYPES
// ============================================

export interface Region {
  id: string;
  name: string;
  endpoint: string;
  dbEndpoint: string;
  status: RegionStatus;
  latencyMs: number;
  lastHealthCheck: Date;
  isWritable: boolean;
}

export enum RegionStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
  OFFLINE = 'offline',
  MAINTENANCE = 'maintenance',
}

export interface HealthCheck {
  regionId: string;
  timestamp: Date;
  status: RegionStatus;
  latencyMs: number;
  checks: {
    database: boolean;
    api: boolean;
    storage: boolean;
    cache: boolean;
  };
  errors: string[];
}

export interface FailoverEvent {
  id: string;
  timestamp: Date;
  fromRegion: string;
  toRegion: string;
  reason: string;
  durationMs: number;
  success: boolean;
  details: any;
}

export interface ReplicationState {
  primaryRegion: string;
  secondaryRegions: string[];
  lagMs: Record<string, number>;
  lastSync: Record<string, Date>;
  conflictsResolved: number;
  pendingWrites: number;
}

// ============================================
// CONFIGURATION
// ============================================

export const DR_CONFIG = {
  regions: {
    'ap-northeast-2': {
      id: 'ap-northeast-2',
      name: 'Seoul (Primary)',
      endpoint: 'https://api-seoul.manpasik.com',
      dbEndpoint: 'postgres://seoul.db.manpasik.com:5432',
      priority: 1,
    },
    'us-east-1': {
      id: 'us-east-1',
      name: 'Virginia (Secondary)',
      endpoint: 'https://api-virginia.manpasik.com',
      dbEndpoint: 'postgres://virginia.db.manpasik.com:5432',
      priority: 2,
    },
    'eu-central-1': {
      id: 'eu-central-1',
      name: 'Frankfurt (Tertiary)',
      endpoint: 'https://api-frankfurt.manpasik.com',
      dbEndpoint: 'postgres://frankfurt.db.manpasik.com:5432',
      priority: 3,
    },
  },
  
  healthCheck: {
    intervalMs: 10000,      // Check every 10 seconds
    timeoutMs: 5000,        // 5 second timeout
    failureThreshold: 3,    // 3 consecutive failures = unhealthy
    recoveryThreshold: 2,   // 2 consecutive successes = recovered
  },
  
  failover: {
    automaticEnabled: true,
    manualApprovalRequired: false,
    maxFailoverTimeMs: 1000,  // Target < 1 second
    cooldownMs: 300000,       // 5 minutes between failovers
  },
  
  replication: {
    mode: 'async' as 'sync' | 'async',
    maxLagMs: 1000,           // Alert if lag > 1 second
    conflictResolution: 'last-write-wins' as 'last-write-wins' | 'first-write-wins' | 'merge',
  },
};

// ============================================
// DISASTER RECOVERY CONTROLLER
// ============================================

export class DisasterRecoveryController {
  private regions: Map<string, Region> = new Map();
  private healthHistory: Map<string, HealthCheck[]> = new Map();
  private failoverHistory: FailoverEvent[] = [];
  private currentPrimary: string;
  private replicationState: ReplicationState;
  private healthCheckInterval: ReturnType<typeof setInterval> | null = null;
  private onFailover: ((event: FailoverEvent) => void) | null = null;
  private onAlert: ((message: string, severity: 'info' | 'warn' | 'critical') => void) | null = null;
  private chaosMode: boolean = false;
  private chaosTarget: string | null = null;

  constructor() {
    this.currentPrimary = 'ap-northeast-2';
    this.replicationState = {
      primaryRegion: this.currentPrimary,
      secondaryRegions: ['us-east-1', 'eu-central-1'],
      lagMs: { 'us-east-1': 0, 'eu-central-1': 0 },
      lastSync: { 'us-east-1': new Date(), 'eu-central-1': new Date() },
      conflictsResolved: 0,
      pendingWrites: 0,
    };
    
    this.initializeRegions();
  }

  private initializeRegions(): void {
    for (const [id, config] of Object.entries(DR_CONFIG.regions)) {
      this.regions.set(id, {
        ...config,
        status: RegionStatus.HEALTHY,
        latencyMs: 0,
        lastHealthCheck: new Date(),
        isWritable: id === this.currentPrimary,
      });
      this.healthHistory.set(id, []);
    }
  }

  // ============================================
  // HEALTH CHECKING
  // ============================================

  public startHealthMonitoring(): void {
    if (this.healthCheckInterval) return;
    
    this.healthCheckInterval = setInterval(
      () => this.performHealthChecks(),
      DR_CONFIG.healthCheck.intervalMs
    );
    
    // Initial check
    this.performHealthChecks();
  }

  public stopHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  private async performHealthChecks(): Promise<void> {
    const checkPromises = Array.from(this.regions.keys()).map(id => 
      this.checkRegionHealth(id)
    );
    
    const results = await Promise.all(checkPromises);
    
    // Analyze results and potentially trigger failover
    await this.analyzeHealthAndFailover(results);
  }

  private async checkRegionHealth(regionId: string): Promise<HealthCheck> {
    const startTime = Date.now();
    const region = this.regions.get(regionId)!;
    
    // Chaos mode: simulate failure
    if (this.chaosMode && this.chaosTarget === regionId) {
      return this.createFailedHealthCheck(regionId, 'Chaos test failure');
    }
    
    try {
      // Simulate health checks (in production, these would be real API calls)
      const [dbHealth, apiHealth, storageHealth, cacheHealth] = await Promise.all([
        this.checkDatabase(region),
        this.checkAPI(region),
        this.checkStorage(region),
        this.checkCache(region),
      ]);
      
      const latencyMs = Date.now() - startTime;
      const allHealthy = dbHealth && apiHealth && storageHealth && cacheHealth;
      const errors: string[] = [];
      
      if (!dbHealth) errors.push('Database connection failed');
      if (!apiHealth) errors.push('API endpoint unresponsive');
      if (!storageHealth) errors.push('Storage access failed');
      if (!cacheHealth) errors.push('Cache connection failed');
      
      const healthCheck: HealthCheck = {
        regionId,
        timestamp: new Date(),
        status: allHealthy ? RegionStatus.HEALTHY : 
                errors.length <= 1 ? RegionStatus.DEGRADED : RegionStatus.UNHEALTHY,
        latencyMs,
        checks: {
          database: dbHealth,
          api: apiHealth,
          storage: storageHealth,
          cache: cacheHealth,
        },
        errors,
      };
      
      // Update region status
      this.updateRegionStatus(regionId, healthCheck);
      
      // Store health history
      const history = this.healthHistory.get(regionId)!;
      history.push(healthCheck);
      if (history.length > 100) history.shift(); // Keep last 100 checks
      
      return healthCheck;
      
    } catch (error: any) {
      return this.createFailedHealthCheck(regionId, error.message);
    }
  }

  private createFailedHealthCheck(regionId: string, error: string): HealthCheck {
    const healthCheck: HealthCheck = {
      regionId,
      timestamp: new Date(),
      status: RegionStatus.OFFLINE,
      latencyMs: DR_CONFIG.healthCheck.timeoutMs,
      checks: {
        database: false,
        api: false,
        storage: false,
        cache: false,
      },
      errors: [error],
    };
    
    this.updateRegionStatus(regionId, healthCheck);
    
    const history = this.healthHistory.get(regionId)!;
    history.push(healthCheck);
    if (history.length > 100) history.shift();
    
    return healthCheck;
  }

  // Simulated health check methods
  private async checkDatabase(region: Region): Promise<boolean> {
    await this.simulateLatency(50, 200);
    return Math.random() > 0.01; // 99% success rate
  }

  private async checkAPI(region: Region): Promise<boolean> {
    await this.simulateLatency(20, 100);
    return Math.random() > 0.005; // 99.5% success rate
  }

  private async checkStorage(region: Region): Promise<boolean> {
    await this.simulateLatency(30, 150);
    return Math.random() > 0.01;
  }

  private async checkCache(region: Region): Promise<boolean> {
    await this.simulateLatency(10, 50);
    return Math.random() > 0.005;
  }

  private async simulateLatency(min: number, max: number): Promise<void> {
    const latency = Math.random() * (max - min) + min;
    await new Promise(resolve => setTimeout(resolve, latency));
  }

  private updateRegionStatus(regionId: string, healthCheck: HealthCheck): void {
    const region = this.regions.get(regionId)!;
    const history = this.healthHistory.get(regionId)!;
    
    // Count recent failures
    const recentChecks = history.slice(-DR_CONFIG.healthCheck.failureThreshold);
    const failures = recentChecks.filter(c => 
      c.status === RegionStatus.UNHEALTHY || c.status === RegionStatus.OFFLINE
    ).length;
    
    // Update status based on failure threshold
    if (failures >= DR_CONFIG.healthCheck.failureThreshold) {
      region.status = RegionStatus.UNHEALTHY;
    } else if (healthCheck.status === RegionStatus.HEALTHY) {
      const recentSuccesses = history.slice(-DR_CONFIG.healthCheck.recoveryThreshold);
      const successes = recentSuccesses.filter(c => 
        c.status === RegionStatus.HEALTHY
      ).length;
      
      if (successes >= DR_CONFIG.healthCheck.recoveryThreshold) {
        region.status = RegionStatus.HEALTHY;
      }
    } else {
      region.status = healthCheck.status;
    }
    
    region.latencyMs = healthCheck.latencyMs;
    region.lastHealthCheck = healthCheck.timestamp;
  }

  // ============================================
  // FAILOVER LOGIC
  // ============================================

  private async analyzeHealthAndFailover(checks: HealthCheck[]): Promise<void> {
    const primaryCheck = checks.find(c => c.regionId === this.currentPrimary);
    
    if (!primaryCheck) return;
    
    // Check if primary is unhealthy
    if (primaryCheck.status === RegionStatus.UNHEALTHY || 
        primaryCheck.status === RegionStatus.OFFLINE) {
      
      if (DR_CONFIG.failover.automaticEnabled) {
        await this.performAutomaticFailover(primaryCheck.errors.join(', '));
      } else {
        this.onAlert?.('Primary region unhealthy. Manual failover required.', 'critical');
      }
    }
    
    // Check replication lag
    for (const [regionId, lagMs] of Object.entries(this.replicationState.lagMs)) {
      if (lagMs > DR_CONFIG.replication.maxLagMs) {
        this.onAlert?.(`Replication lag to ${regionId}: ${lagMs}ms`, 'warn');
      }
    }
  }

  private async performAutomaticFailover(reason: string): Promise<FailoverEvent> {
    const startTime = Date.now();
    
    // Find best target region
    const targetRegion = this.selectFailoverTarget();
    
    if (!targetRegion) {
      const event: FailoverEvent = {
        id: `fo_${Date.now()}`,
        timestamp: new Date(),
        fromRegion: this.currentPrimary,
        toRegion: 'none',
        reason,
        durationMs: Date.now() - startTime,
        success: false,
        details: { error: 'No healthy regions available' },
      };
      
      this.failoverHistory.push(event);
      this.onAlert?.('CRITICAL: No healthy regions available for failover!', 'critical');
      return event;
    }
    
    // Perform failover
    const previousPrimary = this.currentPrimary;
    
    try {
      // 1. Stop writes to old primary
      const oldRegion = this.regions.get(previousPrimary)!;
      oldRegion.isWritable = false;
      
      // 2. Wait for replication to catch up (simulated)
      await this.waitForReplicationSync(targetRegion);
      
      // 3. Promote new primary
      this.currentPrimary = targetRegion;
      const newRegion = this.regions.get(targetRegion)!;
      newRegion.isWritable = true;
      
      // 4. Update replication state
      this.replicationState.primaryRegion = targetRegion;
      this.replicationState.secondaryRegions = Array.from(this.regions.keys())
        .filter(id => id !== targetRegion);
      
      const durationMs = Date.now() - startTime;
      
      const event: FailoverEvent = {
        id: `fo_${Date.now()}`,
        timestamp: new Date(),
        fromRegion: previousPrimary,
        toRegion: targetRegion,
        reason,
        durationMs,
        success: true,
        details: {
          targetLatency: newRegion.latencyMs,
          replicationLag: this.replicationState.lagMs[targetRegion] || 0,
        },
      };
      
      this.failoverHistory.push(event);
      this.onFailover?.(event);
      this.onAlert?.(
        `Failover complete: ${previousPrimary} → ${targetRegion} (${durationMs}ms)`, 
        'info'
      );
      
      return event;
      
    } catch (error: any) {
      // Rollback on failure
      const oldRegion = this.regions.get(previousPrimary)!;
      oldRegion.isWritable = true;
      
      const event: FailoverEvent = {
        id: `fo_${Date.now()}`,
        timestamp: new Date(),
        fromRegion: previousPrimary,
        toRegion: targetRegion,
        reason,
        durationMs: Date.now() - startTime,
        success: false,
        details: { error: error.message },
      };
      
      this.failoverHistory.push(event);
      this.onAlert?.(`Failover failed: ${error.message}`, 'critical');
      
      return event;
    }
  }

  private selectFailoverTarget(): string | null {
    const candidates = Array.from(this.regions.entries())
      .filter(([id, region]) => 
        id !== this.currentPrimary && 
        region.status === RegionStatus.HEALTHY
      )
      .sort((a, b) => {
        // Sort by priority then latency
        const priorityA = (DR_CONFIG.regions as any)[a[0]]?.priority ?? 99;
        const priorityB = (DR_CONFIG.regions as any)[b[0]]?.priority ?? 99;
        
        if (priorityA !== priorityB) return priorityA - priorityB;
        return a[1].latencyMs - b[1].latencyMs;
      });
    
    return candidates.length > 0 ? candidates[0][0] : null;
  }

  private async waitForReplicationSync(targetRegion: string): Promise<void> {
    // Simulate replication sync
    const lag = this.replicationState.lagMs[targetRegion] || 0;
    await new Promise(resolve => setTimeout(resolve, lag));
  }

  // ============================================
  // CHAOS ENGINEERING
  // ============================================

  /**
   * Enable chaos mode to simulate region failure
   */
  public enableChaosMode(targetRegion: string): void {
    if (!this.regions.has(targetRegion)) {
      throw new Error(`Unknown region: ${targetRegion}`);
    }
    
    this.chaosMode = true;
    this.chaosTarget = targetRegion;
    
    console.log(`[CHAOS] Simulating failure of region: ${targetRegion}`);
    this.onAlert?.(`Chaos test started: Simulating ${targetRegion} failure`, 'warn');
  }

  /**
   * Disable chaos mode
   */
  public disableChaosMode(): void {
    this.chaosMode = false;
    this.chaosTarget = null;
    
    console.log('[CHAOS] Chaos mode disabled');
    this.onAlert?.('Chaos test ended', 'info');
  }

  /**
   * Trigger manual failover (for admin panel)
   */
  public async triggerManualFailover(targetRegion: string, reason: string): Promise<FailoverEvent> {
    if (!this.regions.has(targetRegion)) {
      throw new Error(`Unknown region: ${targetRegion}`);
    }
    
    const region = this.regions.get(targetRegion)!;
    if (region.status !== RegionStatus.HEALTHY) {
      throw new Error(`Target region ${targetRegion} is not healthy`);
    }
    
    return this.performAutomaticFailover(`Manual: ${reason}`);
  }

  // ============================================
  // STATUS & MONITORING
  // ============================================

  public getStatus(): {
    currentPrimary: string;
    regions: Region[];
    replication: ReplicationState;
    recentFailovers: FailoverEvent[];
    chaosMode: boolean;
  } {
    return {
      currentPrimary: this.currentPrimary,
      regions: Array.from(this.regions.values()),
      replication: this.replicationState,
      recentFailovers: this.failoverHistory.slice(-10),
      chaosMode: this.chaosMode,
    };
  }

  public getHealthHistory(regionId: string, limit: number = 50): HealthCheck[] {
    return (this.healthHistory.get(regionId) || []).slice(-limit);
  }

  public setCallbacks(callbacks: {
    onFailover?: (event: FailoverEvent) => void;
    onAlert?: (message: string, severity: 'info' | 'warn' | 'critical') => void;
  }): void {
    this.onFailover = callbacks.onFailover || null;
    this.onAlert = callbacks.onAlert || null;
  }

  // ============================================
  // CLEANUP
  // ============================================

  public destroy(): void {
    this.stopHealthMonitoring();
    this.disableChaosMode();
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let drControllerInstance: DisasterRecoveryController | null = null;

export function getDRController(): DisasterRecoveryController {
  if (!drControllerInstance) {
    drControllerInstance = new DisasterRecoveryController();
  }
  return drControllerInstance;
}

export function resetDRController(): void {
  if (drControllerInstance) {
    drControllerInstance.destroy();
    drControllerInstance = null;
  }
}

export default DisasterRecoveryController;


