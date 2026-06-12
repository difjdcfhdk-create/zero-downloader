import { LocalNotifications } from "@capacitor/local-notifications";

export class NotificationService {
  private static registeredActions = false;

  /**
   * Initializes action buttons for notifications, supporting Pause/Resume/Cancel taps.
   */
  static async registerActionTypes() {
    if (this.registeredActions) return;
    try {
      if (typeof window !== "undefined" && (window as any).Capacitor?.isNative) {
        await LocalNotifications.registerActionTypes({
          types: [
            {
              id: "DOWNLOAD_ACTIONS",
              actions: [
                {
                  id: "pause",
                  title: "⏸ Pause",
                  foreground: true
                },
                {
                  id: "resume",
                  title: "▶ Resume",
                  foreground: true
                }
              ]
            }
          ]
        });
        this.registeredActions = true;
      }
    } catch (e) {
      console.warn("Could not register local notification actions:", e);
    }
  }

  /**
   * Push progress update notification with interactive buttons and progress bar.
   */
  static async sendProgress(artworkId: string, title: string, progress: number, speed: string) {
    try {
      await this.registerActionTypes();
      await LocalNotifications.schedule({
        notifications: [
          {
            id: parseInt(artworkId) || 101,
            title: `⚔ Zero - Downloading Artwork #${artworkId}`,
            body: `${progress}% Completed | Speed: ${speed} - ${title}`,
            schedule: { at: new Date(Date.now() + 50) },
            actionTypeId: "DOWNLOAD_ACTIONS",
            extra: { artworkId },
            ongoing: true // Persistent notification on Android
          }
        ]
      });
    } catch (e) {
      // Graceful fallback for non-native web mock runtimes
    }
  }

  /**
   * Clear progress notify card from system status bar.
   */
  static async clear(artworkId: string) {
    try {
      await LocalNotifications.cancel({
        notifications: [{ id: parseInt(artworkId) || 101 }]
      });
    } catch (e) {}
  }

  /**
   * Notify final packaging success.
   */
  static async sendComplete(artworkId: string, title: string) {
    try {
      await this.clear(artworkId);
      await LocalNotifications.schedule({
        notifications: [
          {
            id: (parseInt(artworkId) || 101) + 2000,
            title: "⚔ Zero - Download Complete!",
            body: `Artwork #${artworkId} (${title}) was saved successfully.`,
            schedule: { at: new Date(Date.now() + 50) },
            sound: "beep.wav"
          }
        ]
      });
    } catch (e) {}
  }

  /**
   * Notify error failure state.
   */
  static async sendFailed(artworkId: string, errorMsg: string) {
    try {
      await this.clear(artworkId);
      await LocalNotifications.schedule({
        notifications: [
          {
            id: (parseInt(artworkId) || 101) + 3000,
            title: "⚔ Zero - Download Failed",
            body: `Error getting #${artworkId}: ${errorMsg}`,
            schedule: { at: new Date(Date.now() + 50) }
          }
        ]
      });
    } catch (e) {}
  }
}
