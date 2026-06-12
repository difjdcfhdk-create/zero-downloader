import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.zero.downloader",
  appName: "Zero Downloader",
  webDir: "dist",
  server: {
    // Allows navigating to the remote development backend or secure APIs
    allowNavigation: ["*"]
  },
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#6366F1",
      sound: "beep.wav"
    }
  }
};

export default config;
