export type AppViewTarget =
  | "dashboard"
  | "chat"
  | "sensor"
  | "enose"
  | "telemedicine"
  | "prescriptions"
  | "hardware";

export type AppCommand =
  | { id: string; type: "maps_to"; page: "store" | "result" | "settings" | "measure"; analyte?: string }
  | { id: string; type: "start_measurement"; mode?: string }
  | { id: string; type: "change_setting"; key: string; value: unknown }
  | { id: string; type: "noop" };

export const LS_APP_COMMAND = "manpasik:appcmd:last";

export function emitAppCommand(cmd: AppCommand) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LS_APP_COMMAND, JSON.stringify({ ...cmd, emittedAt: Date.now() }));
  } catch {
    // ignore
  }
}


