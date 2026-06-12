import { Capacitor } from "@capacitor/core";

export class BackgroundService {
  private static activeCount = 0;

  /**
   * Increment active download count and enable native Android foreground service on first task.
   */
  static async startService() {
    if (Capacitor.getPlatform() !== "android") return;
    try {
      this.activeCount++;
      if (this.activeCount === 1) {
        const nativePlugin = (window as any).Capacitor?.Plugins?.BackgroundService;
        if (nativePlugin) {
          await nativePlugin.startService();
          console.log("⚡ Zero - Foreground Service Activated");
        }
      }
    } catch (err) {
      console.warn("Capacitor background service fail:", err);
    }
  }

  /**
   * Decrement active download count and stop native Android foreground service if zero active tasks left.
   */
  static async stopService() {
    if (Capacitor.getPlatform() !== "android") return;
    try {
      this.activeCount = Math.max(0, this.activeCount - 1);
      if (this.activeCount === 0) {
        const nativePlugin = (window as any).Capacitor?.Plugins?.BackgroundService;
        if (nativePlugin) {
          await nativePlugin.stopService();
          console.log("⚡ Zero - Foreground Service Deactivated");
        }
      }
    } catch (err) {
      console.warn("Capacitor background service fail:", err);
    }
  }

  /**
   * Force stop the foreground service.
   */
  static async forceStopService() {
    if (Capacitor.getPlatform() !== "android") return;
    try {
      this.activeCount = 0;
      const nativePlugin = (window as any).Capacitor?.Plugins?.BackgroundService;
      if (nativePlugin) {
        await nativePlugin.stopService();
        console.log("⚡ Zero - Foreground Service Force-Stopped");
      }
    } catch (err) {
      console.warn("Capacitor background service fail:", err);
    }
  }
}
