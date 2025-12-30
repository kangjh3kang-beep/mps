"use client";

import * as React from "react";
import {
  Activity,
  AlertTriangle,
  Battery,
  BatteryLow,
  BatteryMedium,
  BatteryWarning,
  Bluetooth,
  CalendarDays,
  CheckCircle,
  ChevronRight,
  Cpu,
  Download,
  Eye,
  Filter,
  Lock,
  MapPin,
  MoreVertical,
  Package,
  Power,
  RefreshCw,
  Search,
  Send,
  Shield,
  Smartphone,
  Trash2,
  Unlock,
  Upload,
  Wifi,
  WifiOff,
  X,
  Zap
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { type DeviceInfo, type DeviceAction, generateDevices } from "@/lib/admin-engine";

export default function DevicesPage() {
  const [devices, setDevices] = React.useState<DeviceInfo[]>([]);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [selectedDevice, setSelectedDevice] = React.useState<DeviceInfo | null>(null);
  const [actionModal, setActionModal] = React.useState<{
    device: DeviceInfo;
    action: string;
  } | null>(null);
  const [actionInProgress, setActionInProgress] = React.useState(false);
  const [actionLog, setActionLog] = React.useState<DeviceAction[]>([]);

  React.useEffect(() => {
    setDevices(generateDevices(50));
  }, []);

  // Filter devices
  const filteredDevices = devices.filter(d => {
    const matchesSearch = 
      d.serialNumber.toLowerCase().includes(search.toLowerCase()) ||
      d.userName.toLowerCase().includes(search.toLowerCase()) ||
      d.userId.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Handle device action
  const executeAction = async (device: DeviceInfo, actionType: string) => {
    setActionInProgress(true);
    
    // Simulate action execution
    await new Promise(r => setTimeout(r, 2000));
    
    const action: DeviceAction = {
      type: actionType as any,
      deviceId: device.serialNumber,
      adminId: "admin_001",
      timestamp: new Date().toISOString(),
      status: "completed",
      result: `${actionType} executed successfully on ${device.serialNumber}`
    };
    
    setActionLog(prev => [action, ...prev]);
    
    // Update device status if needed
    if (actionType === "lock_device") {
      setDevices(prev => prev.map(d => 
        d.serialNumber === device.serialNumber ? { ...d, status: "locked" } : d
      ));
    } else if (actionType === "unlock_device") {
      setDevices(prev => prev.map(d => 
        d.serialNumber === device.serialNumber ? { ...d, status: "online" } : d
      ));
    }
    
    setActionInProgress(false);
    setActionModal(null);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Device Management Tower</h1>
          <p className="text-slate-400 text-sm">Monitor and control all connected devices</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-emerald-500/50 text-emerald-400">
            <Wifi className="h-3 w-3 mr-1" />
            {devices.filter(d => d.status === "online").length} Online
          </Badge>
          <Badge variant="outline" className="border-slate-500/50 text-slate-400">
            <WifiOff className="h-3 w-3 mr-1" />
            {devices.filter(d => d.status === "offline").length} Offline
          </Badge>
          <Badge variant="outline" className="border-rose-500/50 text-rose-400">
            <Lock className="h-3 w-3 mr-1" />
            {devices.filter(d => d.status === "locked").length} Locked
          </Badge>
        </div>
      </div>

      {/* Search & Filters */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by Serial Number, User ID, or Name..."
                className="pl-9 bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="flex gap-2">
              {["all", "online", "offline", "locked"].map(status => (
                <Button
                  key={status}
                  variant={statusFilter === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                  className={cn(
                    statusFilter === status
                      ? "bg-cyan-600 hover:bg-cyan-700"
                      : "border-slate-700 text-slate-400 hover:text-white"
                  )}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Device List */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left p-4 text-slate-400 font-medium">Device</th>
                  <th className="text-left p-4 text-slate-400 font-medium">User</th>
                  <th className="text-left p-4 text-slate-400 font-medium">Status</th>
                  <th className="text-left p-4 text-slate-400 font-medium">Battery</th>
                  <th className="text-left p-4 text-slate-400 font-medium">Sensor</th>
                  <th className="text-left p-4 text-slate-400 font-medium">Firmware</th>
                  <th className="text-left p-4 text-slate-400 font-medium">Last Seen</th>
                  <th className="text-right p-4 text-slate-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDevices.slice(0, 20).map((device) => (
                  <tr
                    key={device.serialNumber}
                    className="border-b border-slate-800/50 hover:bg-slate-800/30 cursor-pointer"
                    onClick={() => setSelectedDevice(device)}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-slate-800 flex items-center justify-center">
                          <Smartphone className="h-5 w-5 text-cyan-400" />
                        </div>
                        <div>
                          <div className="font-mono text-xs">{device.serialNumber}</div>
                          <div className="text-slate-400 text-xs">{device.model}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm">{device.userName}</div>
                      <div className="text-slate-400 text-xs">{device.userId}</div>
                    </td>
                    <td className="p-4">
                      <StatusBadge status={device.status} />
                    </td>
                    <td className="p-4">
                      <BatteryIndicator level={device.batteryLevel} />
                    </td>
                    <td className="p-4">
                      <SensorWearIndicator wear={device.sensorWear} />
                    </td>
                    <td className="p-4">
                      <span className="font-mono text-xs text-slate-300">
                        {device.firmwareVersion}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-xs text-slate-400">
                        {new Date(device.lastSeen).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setActionModal({ device, action: "firmware_update" });
                            }}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Force Firmware Update
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setActionModal({ device, action: "remote_calibration" });
                            }}
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Remote Calibration
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-slate-700" />
                          {device.status === "locked" ? (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                setActionModal({ device, action: "unlock_device" });
                              }}
                            >
                              <Unlock className="h-4 w-4 mr-2" />
                              Unlock Device
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                setActionModal({ device, action: "lock_device" });
                              }}
                              className="text-rose-400"
                            >
                              <Lock className="h-4 w-4 mr-2" />
                              Lock Device (Stolen)
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setActionModal({ device, action: "send_notification" });
                            }}
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Send Notification
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredDevices.length > 20 && (
            <div className="p-4 text-center text-sm text-slate-400">
              Showing 20 of {filteredDevices.length} devices
            </div>
          )}
        </CardContent>
      </Card>

      {/* Device Detail Panel */}
      {selectedDevice && (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-cyan-400" />
                Digital Twin: {selectedDevice.serialNumber}
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedDevice(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription>
              Real-time device state and diagnostics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Battery */}
              <div className="rounded-lg bg-slate-800 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Battery className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs text-slate-400">Battery</span>
                </div>
                <div className="text-2xl font-bold">{selectedDevice.batteryLevel}%</div>
                <Progress value={selectedDevice.batteryLevel} className="h-1.5 mt-2" />
              </div>

              {/* Sensor Wear */}
              <div className="rounded-lg bg-slate-800 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-4 w-4 text-amber-400" />
                  <span className="text-xs text-slate-400">Sensor Health</span>
                </div>
                <div className="text-2xl font-bold">{selectedDevice.sensorWear}%</div>
                <Progress value={selectedDevice.sensorWear} className="h-1.5 mt-2" />
              </div>

              {/* Measurements */}
              <div className="rounded-lg bg-slate-800 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-cyan-400" />
                  <span className="text-xs text-slate-400">Total Tests</span>
                </div>
                <div className="text-2xl font-bold">{selectedDevice.totalMeasurements}</div>
              </div>

              {/* RAFE Mode */}
              <div className="rounded-lg bg-slate-800 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Cpu className="h-4 w-4 text-purple-400" />
                  <span className="text-xs text-slate-400">RAFE Mode</span>
                </div>
                <div className="text-sm font-mono">{selectedDevice.rafeMode}</div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Model</span>
                  <span>{selectedDevice.model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Firmware</span>
                  <span className="font-mono">{selectedDevice.firmwareVersion}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Calibration</span>
                  <Badge
                    variant={selectedDevice.calibrationStatus === "valid" ? "default" : "destructive"}
                    className={cn(
                      selectedDevice.calibrationStatus === "valid"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-rose-500/20 text-rose-400"
                    )}
                  >
                    {selectedDevice.calibrationStatus}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Location</span>
                  <span>{selectedDevice.location.city}, {selectedDevice.location.country}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Last Calibrated</span>
                  <span>{new Date(selectedDevice.lastCalibration).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Cartridge</span>
                  <span className="font-mono text-xs">
                    {selectedDevice.cartridgeId ?? "None"}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Confirmation Modal */}
      <Dialog open={!!actionModal} onOpenChange={() => setActionModal(null)}>
        <DialogContent className="bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionModal?.action === "lock_device" && <Lock className="h-5 w-5 text-rose-400" />}
              {actionModal?.action === "firmware_update" && <Upload className="h-5 w-5 text-cyan-400" />}
              {actionModal?.action === "remote_calibration" && <RefreshCw className="h-5 w-5 text-amber-400" />}
              {actionModal?.action === "unlock_device" && <Unlock className="h-5 w-5 text-emerald-400" />}
              Confirm Action
            </DialogTitle>
            <DialogDescription>
              Execute <strong>{actionModal?.action?.replace(/_/g, " ")}</strong> on device{" "}
              <code className="text-cyan-400">{actionModal?.device.serialNumber}</code>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionModal(null)}
              className="border-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={() => actionModal && executeAction(actionModal.device, actionModal.action)}
              disabled={actionInProgress}
              className={cn(
                actionModal?.action === "lock_device"
                  ? "bg-rose-600 hover:bg-rose-700"
                  : "bg-cyan-600 hover:bg-cyan-700"
              )}
            >
              {actionInProgress ? (
                <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Executing...</>
              ) : (
                <>Execute</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recent Actions Log */}
      {actionLog.length > 0 && (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Recent Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {actionLog.slice(0, 5).map((action, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs p-2 rounded bg-slate-800/50"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-emerald-400" />
                    <span className="font-mono">{action.deviceId}</span>
                    <span className="text-slate-400">{action.type.replace(/_/g, " ")}</span>
                  </div>
                  <span className="text-slate-500">
                    {new Date(action.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ============================================
 * Sub-components
 * ============================================ */

function StatusBadge({ status }: { status: DeviceInfo["status"] }) {
  const configs: Record<string, { color: string; icon: React.ReactNode }> = {
    online: { color: "bg-emerald-500/20 text-emerald-400", icon: <Wifi className="h-3 w-3" /> },
    offline: { color: "bg-slate-500/20 text-slate-400", icon: <WifiOff className="h-3 w-3" /> },
    locked: { color: "bg-rose-500/20 text-rose-400", icon: <Lock className="h-3 w-3" /> },
    lost: { color: "bg-amber-500/20 text-amber-400", icon: <AlertTriangle className="h-3 w-3" /> }
  };
  
  const config = configs[status] ?? configs.offline;
  
  return (
    <Badge className={cn("gap-1", config.color)}>
      {config.icon}
      {status}
    </Badge>
  );
}

function BatteryIndicator({ level }: { level: number }) {
  const Icon = level < 20 ? BatteryLow : level < 50 ? BatteryWarning : level < 80 ? BatteryMedium : Battery;
  const color = level < 20 ? "text-rose-400" : level < 50 ? "text-amber-400" : "text-emerald-400";
  
  return (
    <div className="flex items-center gap-1.5">
      <Icon className={cn("h-4 w-4", color)} />
      <span className={cn("text-xs font-mono", color)}>{level}%</span>
    </div>
  );
}

function SensorWearIndicator({ wear }: { wear: number }) {
  const color = wear < 30 ? "text-rose-400" : wear < 60 ? "text-amber-400" : "text-emerald-400";
  
  return (
    <div className="flex items-center gap-2">
      <div className="w-12 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full", 
            wear < 30 ? "bg-rose-500" : wear < 60 ? "bg-amber-500" : "bg-emerald-500"
          )}
          style={{ width: `${wear}%` }}
        />
      </div>
      <span className={cn("text-xs font-mono", color)}>{wear}%</span>
    </div>
  );
}






